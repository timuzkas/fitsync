import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calc7dLoad, calc28dLoad, formatLoad,
  calculateReadinessV2, calculateMuscularRisks, sumLoads, DEFAULT_CONFIG, LoadConfig
} from '@/lib/load';
import { calculateSessionMSL } from '@/lib/parsers/hevy';

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
        isPlanned: false,
      },
      orderBy: { startedAt: 'desc' },
      include: { loadScore: true, exercises: true },
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

    // §15 Leg Muscular Risk + Total Body Fatigue from Hevy strength sessions
    const cutoff7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const strengthSessions = workouts
      .filter((w: any) => w.type === 'strength' && w.exercises?.length > 0 && new Date(w.startedAt) >= cutoff7)
      .map((w: any) => {
        const { legStress, systemicStress } = calculateSessionMSL(
          w.exercises.map((ex: any) => ({
            name: ex.name,
            sets: (ex.sets as any[]).map((s: any) => ({ reps: s.reps || 0, weight: s.weight || 0, rpe: s.rpe })),
          })),
          w.durationSec / 60
        );
        return { legStress, totalStress: systemicStress, date: new Date(w.startedAt) };
      });
    const { legMuscularRisk, totalBodyFatigue } = calculateMuscularRisks(strengthSessions, now);

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
