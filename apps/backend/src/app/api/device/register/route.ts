import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deviceId = String(body.deviceId || '');
    const deviceSecret = String(body.deviceSecret || '');
    const appVersion = body.appVersion ? String(body.appVersion) : undefined;

    if (!deviceId || !deviceSecret) {
      return NextResponse.json({ error: 'Missing deviceId or deviceSecret' }, { status: 400 });
    }

    const installation = await prisma.deviceInstallation.upsert({
      where: { deviceId },
      update: {
        deviceSecret,
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
  } catch (error: any) {
    console.error('Registration error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
