import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  console.log('=== Strava callback START ===');
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Our deviceId
    const error = searchParams.get('error');

    console.log('code:', code ? 'present' : 'missing');
    console.log('state:', state);
    console.log('error:', error);

    if (error) {
      return NextResponse.json({ error: `Strava error: ${error}` }, { status: 400 });
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

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
    console.log('Strava token response:', JSON.stringify(data));
    const { access_token, refresh_token, expires_at } = data;

    if (!access_token || !refresh_token) {
      throw new Error('Missing tokens in Strava response');
    }

    console.log('Device state:', state);

    // Find the installation by deviceId (which was passed as state)
    console.log('Looking for installation with deviceId:', state);
    console.log('Querying prisma at', new Date().toISOString());
    let installation;
    try {
      installation = await prisma.deviceInstallation.findUnique({
        where: { deviceId: state },
      });
      console.log('Query completed at', new Date().toISOString(), 'result:', installation);
    } catch (e) {
      console.error('Prisma query error:', e);
      throw e;
    }

    if (!installation) {
      console.error('Installation not found for deviceId:', state);
      return NextResponse.json({ error: 'Device installation not found' }, { status: 404 });
    }

    console.log('Found installation:', installation.id);

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

    // Success - redirect to the app
    const appScheme = 'fitsync://strava-callback?status=success';
    return NextResponse.redirect(appScheme, { status: 302 });
  } catch (error: any) {
    console.error('Strava callback error:', error);
    console.error('Error stack:', error.stack);
    const appScheme = `fitsync://strava-callback?status=error&message=${encodeURIComponent(error.message || 'Unknown error')}`;
    return NextResponse.redirect(appScheme, { status: 302 });
  }
}
