import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calc7dLoad, calc28dLoad, formatLoad,
  calculateReadinessV2, DEFAULT_CONFIG, LoadConfig
} from '@/lib/load';
import { acwrEwma, exerciseFatigueBreakdown, StrengthSession } from '../../../../../../../packages/shared/trainingLoad';

export async function GET(request: Request) {
  const deviceId = String(request.headers.get('x-device-id') || '');
  const deviceSecret = String(request.headers.get('x-device-secret') || '');

  if (!deviceId || !deviceSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const installation = await prisma.deviceInstallation.findUnique({ where: { deviceId } });
    if (!installation || installation.deviceSecret !== deviceSecret) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const config = (installation.config as unknown as LoadConfig) || DEFAULT_CONFIG;
    const runnerLevel = String(request.headers.get('x-runner-level') || (config as any).runnerLevel || 'competitive');

    const now = new Date();
    const cutoff28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    const workouts = await prisma.workout.findMany({
      where: {
        deviceInstallationId: installation.id,
        startedAt: { gte: cutoff28 },
        isPlanned: false,
      },
      orderBy: { startedAt: 'desc' },
      include: { loadScore: true, exercises: true },
    });

    const cutoff7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // When includeHevyInLoad is false, exclude strength workouts from load/readiness calculations
    const includeHevy = config.includeHevyInLoad !== false;
    const loadWorkouts = includeHevy ? workouts : workouts.filter((w: any) => w.type !== 'strength');

    const load7d = formatLoad(calc7dLoad(loadWorkouts, now, config));
    const load28d = formatLoad(calc28dLoad(loadWorkouts, now, config));
    const dailyLoads = Array.from({ length: 28 }, () => 0);
    const startDay = new Date(now);
    startDay.setHours(0, 0, 0, 0);
    startDay.setDate(startDay.getDate() - 27);
    for (const w of loadWorkouts as any[]) {
      const workoutDay = new Date(w.startedAt);
      workoutDay.setHours(0, 0, 0, 0);
      const dayIndex = Math.floor((workoutDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex < 0 || dayIndex >= dailyLoads.length) continue;
      const loadScore = w.loadScore
        ? Number(w.loadScore.cardio || 0)
          + Number(w.loadScore.legs || 0)
          + Number(w.loadScore.upper || 0)
          + Number(w.loadScore.core || 0)
          + Number(w.loadScore.systemic || 0)
        : (w.rpe || 5) * (w.durationSec / 60);
      dailyLoads[dayIndex] += loadScore;
    }
    const acwrSeries = acwrEwma(dailyLoads);
    const acwr = Math.round((acwrSeries[acwrSeries.length - 1] || 1) * 100) / 100;

    const last7DaysSessions = loadWorkouts
      .filter((w: any) => new Date(w.startedAt) >= cutoff7)
      .map((w: any) => ({
        load: (w.rpe || 5) * (w.durationSec / 60),
        durationMin: w.durationSec / 60,
        date: new Date(w.startedAt),
      }));
    const lastWorkoutDate = loadWorkouts.length > 0 ? new Date(loadWorkouts[0].startedAt) : null;
    const readiness = calculateReadinessV2(last7DaysSessions, now, lastWorkoutDate);

    // §15 Leg Muscular Risk + Total Body Fatigue from Hevy strength sessions
    let legMuscularRisk = 0;
    let totalBodyFatigue = 0;
    workouts
      .filter((w: any) => w.type === 'strength' && w.exercises?.length > 0 && new Date(w.startedAt) >= cutoff7)
      .forEach((w: any) => {
        const session: StrengthSession = {
          durationMin: w.durationSec / 60,
          sessionRpe: w.rpe || 7,
          sets: w.exercises.flatMap((ex: any) =>
            ((ex.sets as any[]) || []).map((s: any) => ({
              name: ex.name,
              reps: Number(s.reps) || 0,
              weightKg: Number(s.weight) || 0,
              rpe: Number(s.rpe) || w.rpe || 7,
            }))
          ),
        };
        const breakdown = exerciseFatigueBreakdown(session, runnerLevel);
        const daysAgo = Math.floor((now.getTime() - new Date(w.startedAt).getTime()) / (1000 * 60 * 60 * 24));
        legMuscularRisk += breakdown.legFatigue * Math.pow(0.62, daysAgo);
        totalBodyFatigue += breakdown.totalBodyFatigue * Math.pow(0.68, daysAgo);
      });
    legMuscularRisk = Math.round(Math.min(100, legMuscularRisk));
    totalBodyFatigue = Math.round(Math.min(100, totalBodyFatigue));

    const recentWorkouts = workouts.slice(0, 10).map((w: any) => ({
      id: w.id,
      title: w.title,
      type: w.type,
      startedAt: w.startedAt,
      rpe: w.rpe,
      durationSec: w.durationSec,
      loadScore: w.loadScore ? {
        cardio: w.loadScore.cardio,
        legs: w.loadScore.legs,
        upper: w.loadScore.upper,
        core: w.loadScore.core,
        systemic: w.loadScore.systemic,
      } : null,
    }));

    return NextResponse.json({
      readiness,
      acwr,
      load7d,
      load28d,
      legMuscularRisk,
      totalBodyFatigue,
      recentWorkouts,
    });
  } catch (error: any) {
    console.error('Load today error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
