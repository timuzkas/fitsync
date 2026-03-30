import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { deviceId, deviceSecret, appVersion } = await request.json();

    if (!deviceId || !deviceSecret) {
      return NextResponse.json({ error: 'Missing deviceId or deviceSecret' }, { status: 400 });
    }

    const installation = await prisma.deviceInstallation.upsert({
      where: { deviceId },
      update: {
        deviceSecret, // In a real app, maybe don't overwrite this without verification
        appVersion,
        lastSeenAt: new Date(),
      },
      create: {
        deviceId,
        deviceSecret,
        appVersion,
      },
    });

    return NextResponse.json({ installationId: installation.id });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
