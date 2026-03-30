export const STRAVA_CONFIG = {
  clientId: process.env.STRAVA_CLIENT_ID!,
  clientSecret: process.env.STRAVA_CLIENT_SECRET!,
};

export async function refreshStravaToken(refreshToken: string) {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CONFIG.clientId,
      client_secret: STRAVA_CONFIG.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to refresh Strava token: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function fetchStravaActivities(accessToken: string, after?: number) {
  let url = 'https://www.strava.com/api/v3/athlete/activities?per_page=30';
  if (after) {
    url += `&after=${after}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch Strava activities: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function fetchStravaActivityStreams(
  accessToken: string,
  activityId: number
): Promise<{ calories?: number[]; heartrate?: number[] }> {
  const url = `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=heartrate,calories&key_by_type=true`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return {};
  }

  const data = await response.json();
  return {
    calories: data.calories?.data,
    heartrate: data.heartrate?.data,
  };
}

export async function fetchDetailedStravaActivity(accessToken: string, activityId: number) {
  const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch detailed activity');
  return response.json();
}

export function mapStravaToWorkoutType(stravaType: string): string {
  const mapping: Record<string, string> = {
    Run: 'run',
    Walk: 'walk',
    Hike: 'walk',
    Ride: 'ride',
    WeightTraining: 'strength',
    Workout: 'strength',
    AlpineSki: 'other',
    BackcountrySki: 'other',
    CrossCountrySkiing: 'other',
    RollerSki: 'other',
    Snowboard: 'other',
    Snowshoe: 'other',
  };
  return mapping[stravaType] || 'other';
}

export function calculateHrZoneTimes(heartrateData: number[]): Record<string, number> {
  const ZONES = [
    { name: 'z1', min: 0, max: 0.6 },
    { name: 'z2', min: 0.6, max: 0.7 },
    { name: 'z3', min: 0.7, max: 0.8 },
    { name: 'z4', min: 0.8, max: 0.9 },
    { name: 'z5', min: 0.9, max: 1.0 },
  ];
  if (!heartrateData || heartrateData.length === 0) return {};

  const maxHr = Math.max(...heartrateData);
  const minHr = Math.min(...heartrateData);
  const hrRange = maxHr - minHr || 1;
  const zones: Record<string, number> = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };

  for (const hr of heartrateData) {
    const pct = (hr - minHr) / hrRange;
    for (const zone of ZONES) {
      if (pct >= zone.min && pct < zone.max) {
        zones[zone.name]++;
        break;
      }
    }
  }

  return zones;
}

export async function fetchStravaAthlete(accessToken: string) {
  const response = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch Strava athlete');
  return response.json();
}
