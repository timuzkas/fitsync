export interface ExerciseSet {
  reps: number;
  weight: number;
  rir?: number;
  rpe?: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroups: string[];
  sets: ExerciseSet[];
}

export interface Workout {
  id: string;
  type: 'run' | 'strength' | 'walk' | 'ride' | 'other';
  startedAt: string;
  durationSec: number;
  distanceM?: number;
  calories?: number;
  avgHr?: number;
  maxHr?: number;
  title?: string;
  notes?: string;
  isManual: boolean;
  isPlanned: boolean;
  source: string;
  exercises?: WorkoutExercise[];
  loadScore?: {
    cardio: number;
    legs: number;
    upper: number;
    core: number;
    systemic: number;
    sourceDetail?: any;
  };
  hrZoneTimes?: Record<string, number>;
}

export interface ManualWorkoutInput {
  title: string;
  startedAt: string;
  durationSec: number;
  exercises: {
    name: string;
    muscleGroups: string[];
    sets: ExerciseSet[];
  }[];
}

export interface ExerciseLibrary {
  name: string;
  muscleGroups: string[];
}

export interface StravaConnectResponse {
  url: string;
}

export interface SyncResponse {
  status: string;
  imported: number;
  lastSyncAt: string;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  type: 'A' | 'B' | 'C';
  distanceKm: number;
}

export interface TrainingTarget {
  id: string;
  type: 'run' | 'ride' | 'swim';
  distanceKm: number;
  targetDate: string;
  targetTimeSec?: number;
  targetPaceSecPerKm?: number;
  targetHr?: number;
  races?: Race[];
  createdAt: string;
}

export interface SavedPlan {
  id: string;
  target: TrainingTarget;
  config: {
    freeDays: string[];
    weeklyTargetKm: number;
    longRunTargetKm: number;
    sessionsPerWeek: number;
  };
  dailyPlan: any[];
  createdAt: string;
}
