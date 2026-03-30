export interface DeviceRegistration {
  deviceId: string;
  deviceSecret: string;
  appVersion?: string;
}

export interface Workout {
  id: string;
  type: 'run' | 'strength' | 'walk' | 'ride' | 'other';
  startedAt: string;
  durationSec: number;
  distanceM?: number;
  avgHr?: number;
  maxHr?: number;
  title?: string;
  notes?: string;
  isManual?: boolean;
  source?: string;
}

export interface StrengthExercise {
  id: string;
  name: string;
  muscleGroups: string[];
  sets: Array<{ reps: number; weight: number }>;
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
