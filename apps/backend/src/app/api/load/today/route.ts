import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calc7dLoad, calc28dLoad, formatLoad,
  calculateReadinessV2, sumLoads, DEFAULT_CONFIG, LoadConfig
} from '@/lib/load';

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

    const now = new Date();
    const cutoff28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    const workouts = await prisma.workout.findMany({
      where: { 
        deviceInstallationId: installation.id, 
        startedAt: { gte: cutoff28 },
        isPlanned: false, // Exclude planned races from load calculations
      },
      orderBy: { startedAt: 'desc' },
      include: { loadScore: true },
    });

    const load7d = formatLoad(calc7dLoad(workouts, now, config));
    const load28d = formatLoad(calc28dLoad(workouts, now, config));
    const current = formatLoad(sumLoads([load7d]));

    const cutoff7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysSessions = workouts
      .filter((w: any) => new Date(w.startedAt) >= cutoff7)
      .map((w: any) => ({
        load: (w.rpe || 5) * (w.durationSec / 60),
        durationMin: w.durationSec / 60,
        date: new Date(w.startedAt),
      }));
    const lastWorkoutDate = workouts.length > 0 ? new Date(workouts[0].startedAt) : null;
    const readiness = calculateReadinessV2(last7DaysSessions, now, lastWorkoutDate);

    const recentWorkouts = workouts.slice(0, 10).map((w: any) => ({
      id: w.id,
      title: w.title,
      type: w.type,
      startedAt: w.startedAt,
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
      current,
      load7d,
      load28d,
      recentWorkouts,
    });
  } catch (error: any) {
    console.error('Load today error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
