import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  refreshStravaToken,
  fetchStravaActivities,
  fetchDetailedStravaActivity,
  mapStravaToWorkoutType,
} from '@/lib/strava';
import { 
  calculateCardioLoad, 
  formatLoad, 
  DEFAULT_CONFIG, 
  LoadConfig 
} from '@/lib/load';
import { 
  calculateVdot, 
  suggestRpeFromHrZone, 
  calculateSessionLoad 
} from '../../../../../../../../packages/shared/training';

/**
 * PARSER: Extracts muscle-group volume from Hevy's text format
 */
function parseHevyLog(description: string) {
  if (!description || !description.includes('Logged with Hevy')) return null;

  const lines = description.split('\n');
  let legsVol = 0;
  let upperVol = 0;
  let coreVol = 0;

  const muscleMap = {
    legs: ['calf', 'toe', 'jump', 'squat', 'leg', 'lunges', 'deadlift', 'glute', 'hamstring', 'quad'],
    upper: ['press', 'row', 'curl', 'bench', 'pull', 'shoulder', 'farmer', 'tricep', 'bicep', 'chest', 'back', 'lat'],
    core: ['abs', 'plank', 'crunch', 'core', 'oblique']
  };

  let currentMuscle: 'legs' | 'upper' | 'core' | null = null;

  for (const line of lines) {
    const cleanLine = line.trim().toLowerCase();
    if (!cleanLine) continue;

    // 1. Detect Exercise Name and assign Muscle Group
    if (!cleanLine.startsWith('set') && !cleanLine.includes('logged with')) {
      currentMuscle = null;
      if (muscleMap.legs.some(k => cleanLine.includes(k))) currentMuscle = 'legs';
      else if (muscleMap.upper.some(k => cleanLine.includes(k))) currentMuscle = 'upper';
      else if (muscleMap.core.some(k => cleanLine.includes(k))) currentMuscle = 'core';
    }

    // 2. Parse Weight-based sets: "Set 1: 24 kg x 15"
    const weightMatch = cleanLine.match(/set \d+: (\d+(\.\d+)?) kg x (\d+)/);
    if (weightMatch && currentMuscle) {
      const volume = parseFloat(weightMatch[1]) * parseInt(weightMatch[3]);
      if (currentMuscle === 'legs') legsVol += volume;
      if (currentMuscle === 'upper') upperVol += volume;
      if (currentMuscle === 'core') coreVol += volume;
    }

    // 3. Parse Duration/BW-only sets: "Set 1: 32s" or "Set 1: 15 reps"
    const durationMatch = cleanLine.match(/set \d+: (\d+)(s| reps)/);
    if (durationMatch && currentMuscle) {
      const val = parseInt(durationMatch[1]);
      // Assign arbitrary volume for bodyweight/time (e.g. 1 rep = 5kg volume equivalent)
      const volume = val * 5; 
      if (currentMuscle === 'legs') legsVol += volume;
      if (currentMuscle === 'upper') upperVol += volume;
      if (currentMuscle === 'core') coreVol += volume;
    }
  }

  return { legs: legsVol, upper: upperVol, core: coreVol };
}

export async function POST(request: NextRequest) {
  const deviceId = request.headers.get('x-device-id');
  if (!deviceId) return NextResponse.json({ error: 'Missing X-Device-Id' }, { status: 400 });

  try {
    // 1. Get Installation & Auth
    const installation = await prisma.deviceInstallation.findUnique({
      where: { deviceId },
      include: { dataSources: { where: { type: 'strava', status: 'connected' } } },
    });

    if (!installation || installation.dataSources.length === 0) {
      return NextResponse.json({ error: 'Strava not connected' }, { status: 404 });
    }

    const config = (installation.config as unknown as LoadConfig) || DEFAULT_CONFIG;
    let dataSource = installation.dataSources[0];

    // 2. Token Refresh Logic
    const now = new Date();
    if (dataSource.expiresAt && dataSource.expiresAt < new Date(now.getTime() + 5 * 60 * 1000)) {
      const refreshData = await refreshStravaToken(dataSource.refreshToken!);
      dataSource = await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: {
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token,
          expiresAt: new Date(refreshData.expires_at * 1000),
        },
      });
    }

    // 3. Fetch Recent Activities
    const stravaActivities = await fetchStravaActivities(dataSource.accessToken!);
    console.log('[SYNC] Fetched activities count:', stravaActivities.length);
    if (stravaActivities.length > 0) {
      console.log('[SYNC] First activity:', JSON.stringify(stravaActivities[0], null, 2));
    }
    const stats = { imported: 0, skipped: 0 };

    // 4. Pre-check existing activities to avoid fetching details for them
    const externalIds = stravaActivities.map((a: any) => `strava-${a.id}`);
    const existingWorkouts = await prisma.workout.findMany({
      where: { externalId: { in: externalIds } },
      select: { externalId: true, updatedAt: true }
    });
    const existingMap = new Map(existingWorkouts.map(w => [w.externalId, w]));

    // 5. Parallelize processing of activities
    let currentVdot = installation.vdot || 40;
    let vdotUpdated = false;

    const syncTasks = stravaActivities.map(async (summaryActivity: any) => {
      const externalId = `strava-${summaryActivity.id}`;
      const existing = existingMap.get(externalId);

      console.log('[SYNC] Processing:', externalId, 'existing:', !!existing);

      // If already imported, we can skip detailed fetch to save time and rate limits
      // We only re-sync if the activity is very recent (e.g., last 24h) to catch description updates
      const isRecent = new Date(summaryActivity.start_date).getTime() > Date.now() - 24 * 60 * 60 * 1000;
      console.log('[SYNC] isRecent:', isRecent, 'date:', summaryActivity.start_date);
      
      if (existing && !isRecent) {
        console.log('[SYNC] Skipping (exists, not recent):', externalId);
        return { status: 'skipped' };
      }
      
      const workoutType = mapStravaToWorkoutType(summaryActivity.type);
      
      try {
        const activity = await fetchDetailedStravaActivity(dataSource.accessToken!, summaryActivity.id);
        
        let loadCalc;
        let sourceDetail: any = null;
        let rpe = suggestRpeFromHrZone(200, activity.average_heartrate || 120); // Fallback maxHr=200

        if (workoutType === 'strength') {
          const hevyData = parseHevyLog(activity.description || "");
          rpe = 5; // Default for strength per spec

          if (hevyData && (hevyData.legs > 0 || hevyData.upper > 0 || hevyData.core > 0)) {
            loadCalc = formatLoad({
              cardio: 0,
              legs: hevyData.legs * 0.01 * (config.multipliers?.legs || 1),
              upper: hevyData.upper * 0.01 * (config.multipliers?.upper || 1),
              core: hevyData.core * 0.01 * (config.multipliers?.core || 1),
              systemic: (hevyData.legs + hevyData.upper) * 0.002
            });
            sourceDetail = { type: 'hevy_parsed', volume: hevyData };
          } else if (activity.calories > 0) {
            const calLoad = activity.calories * 0.001 * (config.multipliers?.cardio || 1);
            loadCalc = formatLoad({ cardio: calLoad, legs: 0, upper: 0, core: 0, systemic: calLoad * 0.1 });
            sourceDetail = { type: 'calories', calories: activity.calories };
          } else {
            loadCalc = formatLoad({ cardio: 0, legs: 0, upper: 0, core: 0, systemic: 0 });
            sourceDetail = { type: 'no_data' };
          }
        } else {
          // elapsed_time = total session duration including rest periods (for Foster RPE load)
          // moving_time = active time excluding rest (for pace/VDOT calculation)
          const cardioLoad = calculateCardioLoad(
            workoutType,
            activity.elapsed_time,
            activity.average_heartrate,
            activity.max_heartrate,
            activity.distance,
            config.multipliers?.cardio || 1
          );
          loadCalc = formatLoad({ 
              cardio: cardioLoad, 
              legs: cardioLoad * 0.1, 
              upper: 0, 
              core: 0, 
              systemic: cardioLoad * 0.2 
          });
          sourceDetail = { type: 'cardio' };

          // VDOT UPDATE TRIGGER (Spec 4.2) - use moving_time for pace-based VDOT
          if (workoutType === 'run' && activity.distance >= 3000 && rpe >= 7) {
            const newVdot = calculateVdot(activity.distance, activity.moving_time / 60);
            if (newVdot > currentVdot) {
              currentVdot = newVdot;
              vdotUpdated = true;
            }
          }
        }

        console.log('[SYNC] About to upsert workout:', { externalId, workoutType, title: activity.name });

        const workout = await prisma.workout.upsert({
          where: { externalId },
          update: {
            title: activity.name,
            durationSec: activity.elapsed_time,
            calories: activity.calories,
            avgHr: activity.average_heartrate,
            startedAt: new Date(activity.start_date),
            distanceM: activity.distance,
            rpe,
            vdotAtTime: currentVdot
          },
          create: {
            deviceInstallationId: installation.id,
            source: 'strava',
            externalId,
            type: workoutType,
            title: activity.name,
            durationSec: activity.elapsed_time,
            calories: activity.calories,
            avgHr: activity.average_heartrate,
            startedAt: new Date(activity.start_date),
            distanceM: activity.distance,
            rpe,
            vdotAtTime: currentVdot
          },
        });

        await prisma.loadScore.upsert({
          where: { workoutId: workout.id },
          update: { ...loadCalc, sourceDetail },
          create: { workoutId: workout.id, ...loadCalc, sourceDetail },
        });

        return { status: 'imported' };
      } catch (e) {
        console.error(`Failed to sync activity ${summaryActivity.id}:`, e);
        return { status: 'failed' };
      }
    });

    const results = await Promise.all(syncTasks);

    if (vdotUpdated) {
      await prisma.deviceInstallation.update({
        where: { id: installation.id },
        data: { vdot: currentVdot }
      });
    }
    stats.imported = results.filter(r => r.status === 'imported').length;
    stats.skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({ status: 'success', ...stats, failed });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
