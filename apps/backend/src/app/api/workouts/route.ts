import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
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

    const workouts = await prisma.workout.findMany({
      where: { deviceInstallationId: installation.id, isPlanned: false },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { exercises: true, loadScore: true },
    });

    const plannedRaces = await prisma.workout.findMany({
      where: { deviceInstallationId: installation.id, isPlanned: true },
      orderBy: { startedAt: 'asc' },
      take: 20,
      include: { exercises: true, loadScore: true },
    });

    // Fetch linked workouts for planned races
    const linkedWorkoutIds = plannedRaces.filter(p => p.linkedWorkoutId).map(p => p.linkedWorkoutId);
    const linkedWorkoutsMap = new Map();
    if (linkedWorkoutIds.length > 0) {
      const linkedWorkouts = await prisma.workout.findMany({
        where: { id: { in: linkedWorkoutIds } },
        select: { id: true, title: true, type: true, startedAt: true, distanceM: true, durationSec: true },
      });
      linkedWorkouts.forEach(w => linkedWorkoutsMap.set(w.id, w));
    }

    const plannedRacesWithLinks = plannedRaces.map(p => ({
      ...p,
      workout: p.linkedWorkoutId ? linkedWorkoutsMap.get(p.linkedWorkoutId) : null,
    }));

    // Get completed workouts that could be linked to planned races (for the last 30 days)
    const availableWorkouts = await prisma.workout.findMany({
      where: { 
        deviceInstallationId: installation.id, 
        isPlanned: false,
        startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
      select: { id: true, title: true, type: true, startedAt: true, distanceM: true, durationSec: true },
    });

    return NextResponse.json({ workouts, plannedRaces: plannedRacesWithLinks, availableWorkouts });
  } catch (error: any) {
    console.error('Fetch workouts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const deviceId = String(request.headers.get('x-device-id') || '');
  const deviceSecret = String(request.headers.get('x-device-secret') || '');
  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get('id') || '');

  if (!deviceId || !deviceSecret || !id) {
    return NextResponse.json({ error: 'Missing credentials or workout ID' }, { status: 400 });
  }

  try {
    const installation = await prisma.deviceInstallation.findUnique({
      where: { deviceId },
    });

    if (!installation || installation.deviceSecret !== deviceSecret) {
      return NextResponse.json({ error: 'Invalid device credentials' }, { status: 401 });
    }

    const workout = await prisma.workout.findUnique({
      where: { id, deviceInstallationId: installation.id },
    });

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    if (!workout.isManual) {
      return NextResponse.json({ error: 'Only manual workouts can be deleted' }, { status: 403 });
    }

    await prisma.workout.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete workout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const deviceId = String(request.headers.get('x-device-id') || '');
  const deviceSecret = String(request.headers.get('x-device-secret') || '');

  if (!deviceId || !deviceSecret) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 401 });
  }

  try {
    const installation = await prisma.deviceInstallation.findUnique({
      where: { deviceId },
    });

    if (!installation || installation.deviceSecret !== deviceSecret) {
      return NextResponse.json({ error: 'Invalid device credentials' }, { status: 401 });
    }

    const body = await request.json();
    const { plannedRaceId, linkedWorkoutId, rpe } = body;

    // Handle RPE update
    if (rpe !== undefined && linkedWorkoutId) {
      const workout = await prisma.workout.findFirst({
        where: { id: linkedWorkoutId, deviceInstallationId: installation.id },
      });
      if (!workout) {
        return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
      }
      const updated = await prisma.workout.update({
        where: { id: linkedWorkoutId },
        data: { rpe: Math.max(1, Math.min(10, rpe)) },
      });
      return NextResponse.json(updated);
    }

    // Handle planned race linking
    if (!plannedRaceId) {
      return NextResponse.json({ error: 'Missing plannedRaceId' }, { status: 400 });
    }

    // Verify planned race belongs to this device
    const plannedRace = await prisma.workout.findFirst({
      where: { id: plannedRaceId, deviceInstallationId: installation.id, isPlanned: true },
    });

    if (!plannedRace) {
      return NextResponse.json({ error: 'Planned race not found' }, { status: 404 });
    }

    // Handle unlinking (when linkedWorkoutId is null)
    if (linkedWorkoutId === null) {
      const updated = await prisma.workout.update({
        where: { id: plannedRaceId },
        data: { linkedWorkoutId: null },
        include: { exercises: true, loadScore: true },
      });
      return NextResponse.json(updated);
    }

    // Handle linking to a workout
    const linkedWorkout = await prisma.workout.findFirst({
      where: { id: linkedWorkoutId, deviceInstallationId: installation.id },
    });

    if (!linkedWorkout) {
      return NextResponse.json({ error: 'Workout to link not found' }, { status: 404 });
    }

    // Link the planned race to the completed workout
    const updated = await prisma.workout.update({
      where: { id: plannedRaceId },
      data: { linkedWorkoutId },
      include: { exercises: true, loadScore: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Link workout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

