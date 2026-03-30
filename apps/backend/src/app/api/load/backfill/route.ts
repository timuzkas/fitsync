import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calculateCardioLoad,
  calculateStrengthLoad,
  formatLoad,
  DEFAULT_CONFIG,
  LoadConfig
} from '@/lib/load';

export async function POST(request: Request) {
  const deviceId = request.headers.get('x-device-id');
  const deviceSecret = request.headers.get('x-device-secret');

  if (!deviceId || !deviceSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const installation = await prisma.deviceInstallation.findUnique({ where: { deviceId } });
    if (!installation || installation.deviceSecret !== deviceSecret) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const config = (installation.config as unknown as LoadConfig) || DEFAULT_CONFIG;

    const workouts = await prisma.workout.findMany({
      where: { deviceInstallationId: installation.id },
      include: { exercises: true },
    });

    let updated = 0;
    let skipped = 0;

    for (const workout of workouts) {
      if (workout.type === 'strength') {
        if (workout.exercises.length === 0) {
          skipped++;
          continue;
        }
        const load = calculateStrengthLoad(workout.exercises.map((e: any) => ({
          name: e.name,
          muscleGroups: e.muscleGroups,
          sets: (e.sets || []) as any[],
        })), config.multipliers);
        const formatted = formatLoad(load);
        await prisma.loadScore.upsert({
          where: { workoutId: workout.id },
          update: { cardio: formatted.cardio, legs: formatted.legs, upper: formatted.upper, core: formatted.core, systemic: formatted.systemic },
          create: { workoutId: workout.id, cardio: formatted.cardio, legs: formatted.legs, upper: formatted.upper, core: formatted.core, systemic: formatted.systemic },
        });
        updated++;
      } else {
        const load = calculateCardioLoad(workout.type, workout.durationSec, workout.avgHr, workout.maxHr, workout.distanceM, config.multipliers.cardio);
        const formatted = formatLoad({ cardio: load, legs: 0, upper: 0, core: 0, systemic: 0 });
        await prisma.loadScore.upsert({
          where: { workoutId: workout.id },
          update: { cardio: formatted.cardio, legs: formatted.legs, upper: formatted.upper, core: formatted.core, systemic: formatted.systemic },
          create: { workoutId: workout.id, cardio: formatted.cardio, legs: formatted.legs, upper: formatted.upper, core: formatted.core, systemic: formatted.systemic },
        });
        updated++;
      }
    }

    return NextResponse.json({ backfilled: updated, skipped });
  } catch (error: any) {
    console.error('Backfill error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
