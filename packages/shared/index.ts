export interface DeviceRegistration {
  deviceId: string;
  deviceSecret: string;
  appVersion?: string;
}

export type AdaptiveState = 'normal' | 'frozen' | 'stepping_up';

export interface PointsHistoryEntry {
  week: number;
  target: number;
  actual: number;
  acwr: number;
}

export interface Athlete {
  maxHR: number;
  restHR: number;
  weight: number;        // kg (used for grade-adjusted power estimation)
  vdot: number;
  weeklyPointsTarget?: number;
  adaptiveState?: AdaptiveState;
  pointsHistory?: PointsHistoryEntry[];
  lastAdaptiveAdjustment?: string;
  conflictReason?: string | null;
}

export interface Workout {
  id: string;
  type: 'run' | 'strength' | 'walk' | 'ride' | 'other';
  startedAt: string;
  durationSec: number;
  distanceM?: number;
  avgHr?: number;
  maxHr?: number;
  elevationGainM?: number;
  elevationLossM?: number;
  gapPaceSec?: number;
  danielsPoints?: number;
  legStress?: number;
  systemicStress?: number;
  title?: string;
  notes?: string;
  isManual?: boolean;
  source?: string;
}

export interface StrengthExercise {
  id: string;
  name: string;
  muscleGroups: string[];
  sets: Array<{ reps: number; weight: number; rpe?: number }>;
}

export interface LoadScore {
  cardio: number;
  legs: number;
  upper: number;
  core: number;
  systemic: number;
}

export interface LoadToday {
  readiness: number;
  current: LoadScore;
  load7d: LoadScore;
  load28d: LoadScore;
  recentWorkouts: Array<{
    id: string;
    title: string;
    type: string;
    startedAt: string;
    loadScore: LoadScore | null;
  }>;
}

export interface LoadHistoryDay {
  date: string;
  cardio: number;
  legs: number;
  upper: number;
  core: number;
  systemic: number;
  workoutCount: number;
}
