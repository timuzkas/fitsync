import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Our deviceId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: `Strava error: ${error}` }, { status: 400 });
  }

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Strava configuration missing');
    }

    // Exchange code for tokens
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to exchange code: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const { access_token, refresh_token, expires_at } = data;

    // Find the installation by deviceId (which was passed as state)
    const installation = await prisma.deviceInstallation.findUnique({
      where: { deviceId: state },
    });

    if (!installation) {
      return NextResponse.json({ error: 'Device installation not found' }, { status: 404 });
    }

    // Update or create DataSource
    await prisma.dataSource.upsert({
      where: {
        deviceInstallationId_type: {
          deviceInstallationId: installation.id,
          type: 'strava',
        },
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(expires_at * 1000),
        status: 'connected',
        lastSyncAt: new Date(),
      },
      create: {
        deviceInstallationId: installation.id,
        type: 'strava',
        status: 'connected',
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(expires_at * 1000),
      },
    });

    // Success - redirect to a static page or the app
    return NextResponse.json({ status: 'success', message: 'Strava connected!' });
  } catch (error: any) {
    console.error('Strava callback error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
