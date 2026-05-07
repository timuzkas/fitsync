import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calc7dLoad, DEFAULT_CONFIG, formatLoad, LoadConfig } from '@/lib/load';

export async function GET(request: Request) {
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

    const days = 28;
    const now = new Date();
    const history: any[] = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const workouts = await prisma.workout.findMany({
        where: {
          deviceInstallationId: installation.id,
          startedAt: { gte: dayStart, lt: dayEnd },
          isPlanned: false, // Exclude planned races
        },
        include: { loadScore: true },
      });

      const loadWorkouts = config.includeHevyInLoad !== false
        ? workouts
        : workouts.filter((w: any) => w.type !== 'strength');
      const load = formatLoad(calc7dLoad(loadWorkouts, dayEnd, config));
      history.unshift({
        date: dayStart.toISOString().split('T')[0],
        cardio: load.cardio,
        legs: load.legs,
        upper: load.upper,
        core: load.core,
        systemic: load.systemic,
        workoutCount: workouts.length,
      });
    }

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Load history error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
