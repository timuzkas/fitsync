import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { TrainingTarget } from '../types';

export interface AthleteProfile {
  height?: number;
  weight?: number;
  sex?: 'M' | 'F';
  maxHR?: number;
  restHR?: number;
  dob?: string;
  city?: string;
  country?: string;
  vdot?: number;
  easyPaceSecPerKm?: number;
}

export interface PlanConfig {
  freeDays: string[];
  weeklyTargetKm: number;
  longRunTargetKm: number;
  sessionsPerWeek: number;
  vdot?: number;
}

interface DeviceState {
  deviceId: string | null;
  deviceSecret: string | null;
  isRegistered: boolean;
  isLoading: boolean;
  athleteProfile: AthleteProfile | null;
  planConfig: PlanConfig | null;
  target: TrainingTarget | null;
  setCredentials: (deviceId: string, deviceSecret: string) => void;
  clearCredentials: () => void;
  setLoading: (loading: boolean) => void;
  setAthleteProfile: (profile: AthleteProfile | null) => void;
  setPlanConfig: (config: PlanConfig | null) => void;
  setTarget: (target: TrainingTarget | null) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const secureStorage = {
  getItem: async (name: string) => {
    const value = await SecureStore.getItemAsync(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      deviceId: null,
      deviceSecret: null,
      isRegistered: false,
      isLoading: true,
      athleteProfile: null,
      planConfig: null,
      target: null,
      _hasHydrated: false,
      setCredentials: (deviceId, deviceSecret) =>
        set({ deviceId, deviceSecret, isRegistered: true, isLoading: false }),
      clearCredentials: () =>
        set({ deviceId: null, deviceSecret: null, isRegistered: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setAthleteProfile: (athleteProfile) => set({ athleteProfile }),
      setPlanConfig: (planConfig) => set({ planConfig }),
      setTarget: (target) => set({ target }),
      _hasHydrated: state => set({ _hasHydrated: state }),
      updatePlanConfig: (updates: Partial<PlanConfig>) => set(state => ({
        planConfig: state.planConfig ? { ...state.planConfig, ...updates } : updates as PlanConfig
      })),
    }),
    {
      name: 'fitsync-device-store',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.deviceId) {
          state.setLoading(false);
        }
      },
    }
  )
);
