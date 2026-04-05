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
      where: { deviceInstallationId: installation.id },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { exercises: true, loadScore: true },
    });

    return NextResponse.json(workouts);
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

