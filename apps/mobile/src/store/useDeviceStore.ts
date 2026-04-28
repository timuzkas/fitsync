import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { TrainingTarget } from '../types';

export interface AthleteProfile {
  // Basic physiology
  height?: number;
  weight?: number;
  sex?: 'M' | 'F';
  maxHR?: number;
  restHR?: number;
  dob?: string;       // ISO date — used for age → Factor 3 of Hudson profiling
  city?: string;
  country?: string;
  vdot?: number;
  easyPaceSecPerKm?: number;

  // Hudson 10-factor profile (§3)
  // Factor 1: Recent training
  recentAvgWeeklyKm?: number;
  longestRecentRunKm?: number;
  runsPerWeek?: number;
  weeksConsistent?: number;
  // Factor 2: Experience
  experienceYears?: number;
  // Factor 4: Best race performances (feeds VDOT calculator)
  bestRaces?: Array<{ distanceKm: number; timeSec: number; date: string }>;
  // Factor 6: Injury history
  injuryHistory?: Array<{ area: string; recurrent: boolean }>;
  // Factor 7: Speed vs endurance bias
  strengthBias?: 'speedBiased' | 'enduranceBiased' | 'balanced';
  // Factor 8: Recovery tendency
  recoveryProfile?: 'needsFullRest' | 'easyDayHelps' | 'fastAdapter';
  // Factor 9: Long-term goal
  longTermGoal?: { distanceKm: number; goalTimeSec: number; targetYear: number };
  // Factor 10: Motivation pattern
  motivationProfile?: 'tendsToOverdo' | 'tendsToUnderdo' | 'needsTuneUpRaces';

  // Derived from factors 1–3 — computed by deriveRunnerLevel(), stored for plan use
  runnerLevel?: 'beginner' | 'lowKey' | 'competitive' | 'highlyCompetitive' | 'elite';
}

export interface PlanConfig {
  freeDays: string[];
  weeklyTargetKm: number;
  longRunTargetKm: number;
  sessionsPerWeek: number;
  vdot?: number;
}

export interface WellnessScores {
  sleep: number;
  fatigue: number;
  soreness: number;
  stress: number;
  motivation: number;
  health: number;
  mood: number;
}

export interface WellnessCalibration {
  scores: WellnessScores;
  readinessScore: number;
  calibratedAt: string;
}

interface DeviceState {
  deviceId: string | null;
  deviceSecret: string | null;
  isRegistered: boolean;
  isLoading: boolean;
  athleteProfile: AthleteProfile | null;
  planConfig: PlanConfig | null;
  target: TrainingTarget | null;
  wellness: WellnessCalibration | null;
  wellnessCalibrationHours: { start: number; end: number };
  setCredentials: (deviceId: string, deviceSecret: string) => void;
  clearCredentials: () => void;
  setLoading: (loading: boolean) => void;
  setAthleteProfile: (profile: AthleteProfile | null) => void;
  setPlanConfig: (config: PlanConfig | null) => void;
  setTarget: (target: TrainingTarget | null) => void;
  setWellness: (wellness: WellnessCalibration | null) => void;
  setWellnessCalibrationHours: (hours: { start: number; end: number }) => void;
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
      wellness: null,
      wellnessCalibrationHours: { start: 6, end: 11 },
      _hasHydrated: false,
      setCredentials: (deviceId, deviceSecret) =>
        set({ deviceId, deviceSecret, isRegistered: true, isLoading: false }),
      clearCredentials: () =>
        set({ deviceId: null, deviceSecret: null, isRegistered: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setAthleteProfile: (athleteProfile) => set({ athleteProfile }),
      setPlanConfig: (planConfig) => set({ planConfig }),
      setTarget: (target) => set({ target }),
      setWellness: (wellness) => set({ wellness }),
      setWellnessCalibrationHours: (wellnessCalibrationHours) => set({ wellnessCalibrationHours }),
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
