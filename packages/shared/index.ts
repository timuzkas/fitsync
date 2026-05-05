export interface DeviceRegistration {
  deviceId: string;
  deviceSecret: string;
  appVersion?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HUDSON RUNNER CLASSIFICATION
// §3 (10-factor profiling) and §4 (5-tier runner categories)
// ─────────────────────────────────────────────────────────────────────────────

export type RunnerLevel = 'beginner' | 'lowKey' | 'competitive' | 'highlyCompetitive' | 'elite';
export type StrengthBias = 'speedBiased' | 'enduranceBiased' | 'balanced';
export type RecoveryProfile = 'needsFullRest' | 'easyDayHelps' | 'fastAdapter';
export type MotivationProfile = 'tendsToOverdo' | 'tendsToUnderdo' | 'needsTuneUpRaces';

export interface BestRace {
  distanceKm: number;
  timeSec: number;
  date: string; // ISO date string — feeds VDOT calculator
}

export interface InjuryRecord {
  area: string;        // e.g. "left knee", "plantar fascia"
  recurrent: boolean;
}

/**
 * Hudson's 10-factor runner profile (§3).
 * Factors 1–3 are sufficient to derive RunnerLevel; all 10 are used to modify the plan.
 * Factor 5 (short-term goal) lives in TrainingTarget; Factor 3 (age) comes from AthleteProfile.dob.
 */
export interface RunnerProfile {
  // Factor 1: Recent training
  recentAvgWeeklyKm: number;
  longestRecentRunKm: number;
  runsPerWeek: number;
  weeksConsistent: number;
  // Factor 2: Experience
  experienceYears: number;
  // Factor 4: Past race performances
  bestRaces: BestRace[];
  // Factor 6: Injury history
  injuryHistory: InjuryRecord[];
  // Factor 7: Speed vs endurance bias
  strengthBias: StrengthBias;
  // Factor 8: Recovery tendency
  recoveryProfile: RecoveryProfile;
  // Factor 9: Long-term goal (optional)
  longTermGoal?: {
    distanceKm: number;
    goalTimeSec: number;
    targetYear: number;
  };
  // Factor 10: Motivation pattern
  motivationProfile: MotivationProfile;
}

/**
 * Classify runner level from the three highest-weight factors (§3, §4).
 * Used to select the weekly volume band and plan level (Level 1/2/3).
 */
export function deriveRunnerLevel(
  avgWeeklyKm: number,
  experienceYears: number,
  runsPerWeek: number,
): RunnerLevel {
  if (experienceYears < 1) return 'beginner';
  if (experienceYears < 2 || avgWeeklyKm < 40 || runsPerWeek < 4) return 'lowKey';
  if (avgWeeklyKm >= 110 && experienceYears >= 5 && runsPerWeek >= 7) return 'elite';
  if (avgWeeklyKm >= 80 && experienceYears >= 3 && runsPerWeek >= 6) return 'highlyCompetitive';
  return 'competitive';
}

// ─────────────────────────────────────────────────────────────────────────────
// HUDSON WORKOUT VOCABULARY (§9)
// ─────────────────────────────────────────────────────────────────────────────

export type HudsonWorkoutType =
  | 'easy'
  | 'long'
  | 'progression'
  | 'threshold'
  | 'hillSprint'
  | 'hillReps'
  | 'uphillProgression'
  | 'strides'
  | 'fartlek'
  | 'ladder'
  | 'speedIntervals'
  | 'specEndIntervals'
  | 'race'
  | 'timeTrial'
  | 'rest'
  | 'xTrain';

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
  weight: number;        // kg
  vdot: number;
  runnerLevel?: RunnerLevel;
  runnerProfile?: RunnerProfile;
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
