import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshStravaToken, fetchStravaAthlete } from '@/lib/strava';

export async function GET(request: NextRequest) {
  const deviceId = request.headers.get('x-device-id');
  if (!deviceId) return NextResponse.json({ error: 'Missing X-Device-Id' }, { status: 400 });

  try {
    const installation = await prisma.deviceInstallation.findUnique({
      where: { deviceId },
      include: { dataSources: { where: { type: 'strava', status: 'connected' } } },
    });

    if (!installation || installation.dataSources.length === 0) {
      return NextResponse.json({ error: 'Strava not connected' }, { status: 404 });
    }

    const dataSource = installation.dataSources[0];
    const now = new Date();

    let accessToken = dataSource.accessToken;
    if (dataSource.expiresAt && dataSource.expiresAt < new Date(now.getTime() + 5 * 60 * 1000)) {
      const refreshData = await refreshStravaToken(dataSource.refreshToken!);
      await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: {
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token,
          expiresAt: new Date(refreshData.expires_at * 1000),
        },
      });
      accessToken = refreshData.access_token;
    }

    const athlete = await fetchStravaAthlete(accessToken);

    return NextResponse.json({
      id: athlete.id,
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      sex: athlete.sex,
      height: athlete.measurement_preference === 'feet' ? null : athlete.height,
      weight: athlete.weight,
      city: athlete.city,
      country: athlete.country,
      max_heartrate: athlete.max_heartrate,
    });
  } catch (error: any) {
    console.error('Fetch Athlete Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
