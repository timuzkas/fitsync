import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStrengthLoad, calculateCardioLoad, formatLoad, DEFAULT_CONFIG, LoadConfig, RawLoad } from '@/lib/load';

export async function POST(request: Request) {
  const deviceId = String(request.headers.get('x-device-id') || '');
  const deviceSecret = String(request.headers.get('x-device-secret') || '');

  if (!deviceId || !deviceSecret) {
    return NextResponse.json({ error: 'Missing X-Device-Id or X-Device-Secret' }, { status: 401 });
  }

  try {
    const installation = await prisma.deviceInstallation.findUnique({
      where: { deviceId },
    });

    if (!installation || installation.deviceSecret !== deviceSecret) {
      return NextResponse.json({ error: 'Invalid device credentials' }, { status: 401 });
    }

    const config = (installation.config as unknown as LoadConfig) || DEFAULT_CONFIG;

    const body = await request.json();
    const title = String(body.title || '');
    const startedAt = String(body.startedAt || '');
    const durationSec = Number(body.durationSec) || 0;
    const type = body.type ? String(body.type) : 'strength';
    const distanceM = body.distanceM ? Number(body.distanceM) : null;
    const avgHr = body.avgHr ? Number(body.avgHr) : null;

    if (!title || !startedAt || !durationSec) {
      return NextResponse.json({ error: 'Missing required fields: title, startedAt, durationSec' }, { status: 400 });
    }

    const workoutType = type || 'strength';

    let load: RawLoad;
    if (workoutType === 'strength') {
      const rawExercises = exercises && exercises.length > 0 ? exercises.map((ex: any) => ({
        name: ex.name,
        muscleGroups: ex.muscleGroups || [],
        sets: ex.sets || [],
      })) : [];
      load = calculateStrengthLoad(rawExercises, config.multipliers);
    } else {
      const cardioLoad = calculateCardioLoad(
        workoutType,
        durationSec,
        avgHr,
        null, // maxHr
        distanceM,
        config.multipliers?.cardio
      );
      load = {
        cardio: cardioLoad,
        legs: workoutType === 'run' ? cardioLoad * 0.2 : cardioLoad * 0.1,
        upper: 0,
        core: 0,
        systemic: cardioLoad * 0.1,
      };
    }
    
    const formatted = formatLoad(load);

    const workout = await prisma.workout.create({
      data: {
        deviceInstallationId: installation.id,
        source: 'manual',
        externalId: `manual-${Date.now()}`,
        type: workoutType,
        title,
        startedAt: new Date(startedAt),
        durationSec,
        distanceM,
        avgHr,
        isManual: true,
        isPlanned: !!isPlanned,
        exercises: workoutType === 'strength' && exercises && exercises.length > 0 ? {
          create: exercises.map((ex: any) => ({
            name: ex.name,
            muscleGroups: ex.muscleGroups || [],
            sets: ex.sets || [],
          })),
        } : undefined,
        loadScore: {
          create: {
            cardio: formatted.cardio,
            legs: formatted.legs,
            upper: formatted.upper,
            core: formatted.core,
            systemic: formatted.systemic,
          },
        },
      },
      include: {
        exercises: true,
        loadScore: true,
      },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (error: any) {
    console.error('Manual workout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
