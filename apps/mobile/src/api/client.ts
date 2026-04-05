import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const Storage = {
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (e) {
      console.warn('Storage set error:', e);
    }
  },

  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        return await Promise.race([
          SecureStore.getItemAsync(key),
          new Promise<string | null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ]);
      }
    } catch (e) {
      return null;
    }
  },

  async delete(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {}
  },
};

import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.214:3000';

async function apiFetch(path: string, options?: RequestInit, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e: any) {
    clearTimeout(id);
    throw e;
  }
}

function headers(deviceId: string, deviceSecret: string) {
  return {
    'Content-Type': 'application/json',
    'X-Device-Id': deviceId,
    'X-Device-Secret': deviceSecret,
  };
}

export const api = {
  Storage,

  async registerDevice(deviceId: string, deviceSecret: string, appVersion?: string) {
    const res = await apiFetch('/api/device/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, deviceSecret, appVersion }),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  async getWorkouts(deviceId: string, deviceSecret: string) {
    const res = await apiFetch('/api/workouts', { headers: headers(deviceId, deviceSecret) });
    if (!res.ok) throw new Error('Failed to fetch workouts');
    return res.json();
  },

  async deleteWorkout(deviceId: string, deviceSecret: string, id: string) {
    const res = await apiFetch(`/api/workouts?id=${id}`, {
      method: 'DELETE',
      headers: headers(deviceId, deviceSecret),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Delete failed');
    }
    return res.json();
  },

  async syncStrava(deviceId: string, deviceSecret: string) {
    const res = await apiFetch('/api/integrations/strava/sync', {
      method: 'POST',
      headers: headers(deviceId, deviceSecret),
    }, 30000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Sync failed');
    }
    return res.json();
  },

  async connectStrava(deviceId: string, deviceSecret: string): Promise<string> {
    const res = await apiFetch(
      `/api/integrations/strava/connect?deviceId=${encodeURIComponent(deviceId)}&deviceSecret=${encodeURIComponent(deviceSecret)}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to connect Strava');
    }
    const data = await res.json();
    if (!data.url) throw new Error('No authorization URL returned');
    return data.url;
  },

  async getExerciseLibrary(deviceId: string, deviceSecret: string) {
    const res = await apiFetch('/api/exercises', { headers: headers(deviceId, deviceSecret) });
    if (!res.ok) throw new Error('Failed to fetch exercises');
    return res.json();
  },

  async createManualWorkout(deviceId: string, deviceSecret: string, workout: any) {
    const res = await apiFetch('/api/workouts/manual', {
      method: 'POST',
      headers: headers(deviceId, deviceSecret),
      body: JSON.stringify(workout),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create workout');
    }
    return res.json();
  },

  async getLoadToday(deviceId: string, deviceSecret: string) {
    const res = await apiFetch('/api/load/today', { headers: headers(deviceId, deviceSecret) });
    if (!res.ok) throw new Error('Failed to fetch load');
    return res.json();
  },

  async getLoadHistory(deviceId: string, deviceSecret: string) {
    const res = await apiFetch('/api/load/history', { headers: headers(deviceId, deviceSecret) });
    if (!res.ok) throw new Error('Failed to fetch load history');
    return res.json();
  },

  async backfillLoad(deviceId: string, deviceSecret: string) {
    const res = await apiFetch('/api/load/backfill', {
      method: 'POST',
      headers: headers(deviceId, deviceSecret),
    });
    if (!res.ok) throw new Error('Failed to backfill load');
    return res.json();
  },

  async getLoadConfig(deviceId: string, deviceSecret: string) {
    const res = await apiFetch('/api/load/config', { headers: headers(deviceId, deviceSecret) });
    if (!res.ok) throw new Error('Failed to fetch config');
    return res.json();
  },

  async updateLoadConfig(deviceId: string, deviceSecret: string, config: any) {
    const res = await apiFetch('/api/load/config', {
      method: 'POST',
      headers: headers(deviceId, deviceSecret),
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to update config');
    return res.json();
  },

  async getStravaAthlete(deviceId: string, deviceSecret: string) {
    const res = await apiFetch('/api/integrations/strava/athlete', { headers: headers(deviceId, deviceSecret) });
    if (!res.ok) throw new Error('Failed to fetch Strava athlete');
    return res.json();
  },
};
