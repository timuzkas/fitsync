import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_CONFIG, LoadConfig } from '@/lib/load';

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

    const config = installation.config || DEFAULT_CONFIG;
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    const config = await request.json();
    
    // Basic validation
    if (!config.halfLifeHours || !config.multipliers) {
      return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
    }

    await prisma.deviceInstallation.update({
      where: { id: installation.id },
      data: { config },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
