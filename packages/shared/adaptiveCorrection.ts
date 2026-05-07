export type TrainingState = 'green' | 'yellow' | 'red';

export type SessionType =
  | 'interval_short'
  | 'interval_long'
  | 'tempo'
  | 'long_run'
  | 'easy_run'
  | 'recovery_run'
  | 'hill_reps'
  | 'progression_run'
  | 'heavy_strength'
  | 'hypertrophy'
  | 'plyometrics'
  | 'hyrox_specific'
  | 'mobility_core'
  | 'cross_train'
  | 'rest';

export interface PlannedSession {
  sessionType: SessionType;
  plannedLoadAu: number;
  durationMin: number;
  reps?: number | null;
  repDistanceM?: number | null;
  totalKm?: number | null;
  targetPacePerKm?: number | null;
  sets?: number | null;
  intensityPct?: number | null;
  includesPlyos?: boolean;
  includesEccentrics?: boolean;
}

export interface FatigueState {
  readiness: number;
  legFreshness: number;
  acwr: number;
  soreness: number;
  wellnessZscore: number;
  tsb: number;
  weeklyDelta: number;
  daysSinceLastRest: number;
}

export interface Modification {
  category: string;
  original: string;
  corrected: string;
  reason: string;
  priority: number;
}

export interface CorrectedSession {
  state: TrainingState;
  sessionType: SessionType;
  correctedLoadAu: number;
  loadModifier: number;
  durationMin: number;
  reps?: number | null;
  repDistanceM?: number | null;
  totalKm?: number | null;
  sets?: number | null;
  intensityPct?: number | null;
  includesPlyos: boolean;
  includesEccentrics: boolean;
  modifications: Modification[];
  stateSummary: string;
  recoveryCues: string[];
}

const HIGH_MECHANICAL_SESSIONS = new Set<SessionType>([
  'hill_reps',
  'plyometrics',
  'hyrox_specific',
  'heavy_strength',
  'interval_short',
]);

const CNS_HEAVY_SESSIONS = new Set<SessionType>([
  'interval_short',
  'interval_long',
  'heavy_strength',
  'plyometrics',
  'hill_reps',
]);

const RED_REPLACEMENTS: Partial<Record<SessionType, SessionType>> = {
  interval_short: 'easy_run',
  interval_long: 'easy_run',
  tempo: 'easy_run',
  long_run: 'recovery_run',
  hill_reps: 'easy_run',
  progression_run: 'easy_run',
  heavy_strength: 'mobility_core',
  hypertrophy: 'mobility_core',
  plyometrics: 'mobility_core',
  hyrox_specific: 'cross_train',
  easy_run: 'recovery_run',
  recovery_run: 'rest',
};

const YELLOW_REPLACEMENTS: Partial<Record<SessionType, SessionType>> = {
  hill_reps: 'interval_short',
  plyometrics: 'easy_run',
  hyrox_specific: 'hypertrophy',
  heavy_strength: 'hypertrophy',
};

const STATE_SUMMARIES: Record<TrainingState, string> = {
  green: 'All systems clear. Training load is well-managed. You may progress volume or intensity as planned.',
  yellow: 'Elevated load transition detected. Recovery margin is reduced. Session modified to preserve training stimulus while limiting mechanical exposure.',
  red: 'Significant fatigue accumulation. Session type replaced to protect tissue and restore recovery capacity. Maintain aerobic base with minimal stress.',
};

const RECOVERY_CUES = {
  sleep: 'Prioritise 8-9 h sleep tonight; recovery window is open.',
  nutrition: 'Carbohydrate replenishment within 30 min post-session supports glycogen restoration.',
  protein: '20-40 g protein post-session to support muscle protein synthesis.',
  cold: 'Cold water immersion may reduce perceived soreness.',
  easyNext: 'Plan an easy/recovery session tomorrow to avoid compounding fatigue.',
  restDay: 'A rest day tomorrow is strongly recommended given cumulative fatigue.',
  hydration: 'Ensure adequate hydration; even mild dehydration elevates perceived exertion.',
  mobility: '10-15 min mobility focused on quads and calves recommended.',
};

const round = (value: number, decimals = 3) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

export function readinessModifier(readiness: number): number {
  if (readiness >= 85) return 1.05;
  if (readiness >= 70) return 1;
  if (readiness >= 55) return 0.85;
  if (readiness >= 40) return 0.7;
  return 0.5;
}

export function legModifier(legFreshness: number): number {
  if (legFreshness > 80) return 1;
  if (legFreshness > 60) return 0.9;
  if (legFreshness > 40) return 0.75;
  return 0.5;
}

export function acwrCorrectionModifier(acwr: number): number {
  if (acwr < 0.8) return 1.05;
  if (acwr <= 1.3) return 1;
  if (acwr <= 1.5) return 0.9;
  if (acwr <= 2) return 0.75;
  return 0.5;
}

export function sorenessModifier(soreness: number): number {
  if (soreness <= 2) return 1;
  if (soreness <= 4) return 0.95;
  if (soreness <= 6) return 0.85;
  if (soreness <= 8) return 0.7;
  return 0.55;
}

export function compositeLoadModifier(
  readiness: number,
  legFreshness: number,
  acwr: number,
  soreness: number,
  sessionType: SessionType
): { modifier: number; components: Record<string, number> } {
  const rm = readinessModifier(readiness);
  const lm = legModifier(legFreshness);
  const am = acwrCorrectionModifier(acwr);
  const sm = CNS_HEAVY_SESSIONS.has(sessionType) ? sorenessModifier(soreness) : 1;
  const composite = round(rm * lm * am * sm, 3);
  return {
    modifier: composite,
    components: { readiness: rm, leg: lm, acwr: am, soreness: sm, composite },
  };
}

export function classifyState(fatigue: FatigueState): TrainingState {
  if (
    fatigue.readiness < 55
    || fatigue.legFreshness < 40
    || fatigue.acwr > 1.5
    || fatigue.soreness >= 8
    || fatigue.wellnessZscore < -1.5
    || fatigue.tsb < -25
  ) {
    return 'red';
  }

  if (
    fatigue.readiness < 75
    || fatigue.legFreshness < 60
    || fatigue.acwr > 1.3
    || fatigue.soreness >= 5
    || fatigue.wellnessZscore < -0.5
    || fatigue.tsb < -10
    || fatigue.daysSinceLastRest >= 6
    || Math.abs(fatigue.weeklyDelta) > 0.3
  ) {
    return 'yellow';
  }

  return 'green';
}

function replaceSession(plannedType: SessionType, state: TrainingState, legFreshness: number) {
  let correctedType = plannedType;
  if (state === 'red') {
    correctedType = RED_REPLACEMENTS[plannedType] ?? 'recovery_run';
  } else if (state === 'yellow' && HIGH_MECHANICAL_SESSIONS.has(plannedType) && legFreshness < 60) {
    correctedType = YELLOW_REPLACEMENTS[plannedType] ?? plannedType;
  }

  if (correctedType === plannedType) return { correctedType, modification: null as Modification | null };

  return {
    correctedType,
    modification: {
      category: 'session_type',
      original: plannedType,
      corrected: correctedType,
      reason: `Elevated leg fatigue (freshness ${legFreshness.toFixed(0)}/100) and reduced recovery margin; switching to lower-impact stimulus.`,
      priority: 1,
    },
  };
}

function adjustReps(planned: PlannedSession, modifier: number, modifications: Modification[]): number | null {
  if (planned.reps == null) return null;
  const corrected = Math.max(1, Math.round(planned.reps * modifier));
  if (corrected !== planned.reps) {
    modifications.push({
      category: 'volume_reps',
      original: `${planned.reps} reps`,
      corrected: `${corrected} reps`,
      reason: 'Volume reduced first to protect neuromuscular economy while limiting cumulative tissue damage.',
      priority: 2,
    });
  }
  return corrected;
}

function adjustKm(planned: PlannedSession, modifier: number, modifications: Modification[]): number | null {
  if (planned.totalKm == null) return null;
  const corrected = Math.max(1, round(planned.totalKm * modifier, 1));
  if (Math.abs(corrected - planned.totalKm) >= 0.5) {
    modifications.push({
      category: 'volume_km',
      original: `${planned.totalKm} km`,
      corrected: `${corrected} km`,
      reason: 'Total distance reduced to lower mechanical exposure during elevated load transition.',
      priority: 2,
    });
  }
  return corrected;
}

function adjustDuration(planned: PlannedSession, modifier: number, modifications: Modification[]): number {
  const corrected = Math.max(10, Math.round(planned.durationMin * modifier));
  if (Math.abs(corrected - planned.durationMin) >= 3) {
    modifications.push({
      category: 'duration',
      original: `${planned.durationMin.toFixed(0)} min`,
      corrected: `${corrected} min`,
      reason: 'Session duration shortened proportionally. Aerobic stimulus is preserved while volume exposure is reduced.',
      priority: 2,
    });
  }
  return corrected;
}

function adjustIntensity(planned: PlannedSession, modifier: number, state: TrainingState, modifications: Modification[]): number | null {
  if (planned.intensityPct == null) return null;
  if (state !== 'red' && modifier >= 0.75) return planned.intensityPct;
  const reduction = state === 'red' ? 0.88 : 0.93;
  const corrected = Math.max(65, planned.intensityPct * reduction);
  if (Math.abs(corrected - planned.intensityPct) >= 2) {
    modifications.push({
      category: 'intensity',
      original: `${planned.intensityPct.toFixed(0)}%`,
      corrected: `${corrected.toFixed(0)}%`,
      reason: 'Intensity reduced last, after volume and density cuts.',
      priority: 4,
    });
  }
  return round(corrected, 1);
}

function stripHighImpact(planned: PlannedSession, state: TrainingState, legFreshness: number, modifications: Modification[]) {
  const hasPlyos = !!planned.includesPlyos;
  const hasEccentrics = !!planned.includesEccentrics;
  const removePlyos = hasPlyos && (state === 'red' || legFreshness < 55);
  const removeEccentrics = hasEccentrics && (state === 'red' || legFreshness < 50);

  if (removePlyos) {
    modifications.push({
      category: 'plyometrics',
      original: 'includes plyometrics',
      corrected: 'plyometrics removed',
      reason: 'Plyometrics generate high ground-reaction forces and eccentric stress, so they are removed under elevated leg fatigue.',
      priority: 1,
    });
  }
  if (removeEccentrics) {
    modifications.push({
      category: 'eccentric_load',
      original: 'includes eccentric loading',
      corrected: 'eccentric loading removed',
      reason: 'Eccentric contractions produce disproportionate muscle damage, so they are removed during reduced recovery margin.',
      priority: 1,
    });
  }

  return { includesPlyos: hasPlyos && !removePlyos, includesEccentrics: hasEccentrics && !removeEccentrics };
}

function generateRecoveryCues(fatigue: FatigueState, state: TrainingState): string[] {
  const cues: string[] = [];
  if (state === 'red') cues.push(RECOVERY_CUES.restDay, RECOVERY_CUES.sleep, RECOVERY_CUES.nutrition);
  else if (state === 'yellow') cues.push(RECOVERY_CUES.easyNext, RECOVERY_CUES.sleep);
  if (fatigue.soreness >= 5) cues.push(RECOVERY_CUES.mobility, RECOVERY_CUES.cold);
  if (fatigue.legFreshness < 55) cues.push(RECOVERY_CUES.protein);
  cues.push(RECOVERY_CUES.hydration);
  return cues.filter((cue, index) => cues.indexOf(cue) === index);
}

export function correctSession(planned: PlannedSession, fatigue: FatigueState): CorrectedSession {
  const modifications: Modification[] = [];
  const state = classifyState(fatigue);
  const { correctedType, modification } = replaceSession(planned.sessionType, state, fatigue.legFreshness);
  if (modification) modifications.push(modification);

  const { modifier } = compositeLoadModifier(
    fatigue.readiness,
    fatigue.legFreshness,
    fatigue.acwr,
    fatigue.soreness,
    correctedType
  );

  const reps = adjustReps(planned, modifier, modifications);
  const totalKm = adjustKm(planned, modifier, modifications);
  const durationMin = adjustDuration(planned, modifier, modifications);
  const impact = stripHighImpact(planned, state, fatigue.legFreshness, modifications);
  const intensityPct = adjustIntensity(planned, modifier, state, modifications);

  modifications.sort((a, b) => a.priority - b.priority);

  return {
    state,
    sessionType: correctedType,
    correctedLoadAu: round(planned.plannedLoadAu * modifier, 1),
    loadModifier: modifier,
    durationMin,
    reps,
    repDistanceM: planned.repDistanceM ?? null,
    totalKm,
    sets: planned.sets ?? null,
    intensityPct,
    includesPlyos: impact.includesPlyos,
    includesEccentrics: impact.includesEccentrics,
    modifications,
    stateSummary: STATE_SUMMARIES[state],
    recoveryCues: generateRecoveryCues(fatigue, state),
  };
}

export function correctionToDict(planned: PlannedSession, corrected: CorrectedSession, fatigue: FatigueState) {
  return {
    state: corrected.state,
    stateSummary: corrected.stateSummary,
    fatigueInputs: fatigue,
    planned,
    corrected: {
      sessionType: corrected.sessionType,
      loadAu: corrected.correctedLoadAu,
      loadModifier: corrected.loadModifier,
      durationMin: corrected.durationMin,
      reps: corrected.reps,
      repDistanceM: corrected.repDistanceM,
      totalKm: corrected.totalKm,
      intensityPct: corrected.intensityPct,
      includesPlyos: corrected.includesPlyos,
      includesEccentrics: corrected.includesEccentrics,
    },
    modifications: corrected.modifications,
    recoveryCues: corrected.recoveryCues,
  };
}
