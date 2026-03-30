import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get('deviceId');

  if (!deviceId) {
    return NextResponse.json({ error: 'Missing deviceId parameter' }, { status: 400 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Strava configuration missing on server' }, { status: 500 });
  }

  // scope activity:read_all is needed for detailed information and older activities
  const scope = 'read,activity:read_all';
  const stravaUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${deviceId}`;

  return NextResponse.json({ url: stravaUrl });
}
