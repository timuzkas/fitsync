export const LEG_MUSCLES = new Set([
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'hip flexors',
  'adductors',
  'abductors',
  'tibialis',
  'peroneals',
]);

export type TrainingFitnessLevel = 'beginner' | 'lowKey' | 'competitive' | 'highlyCompetitive' | 'elite';

export const FITNESS_FATIGUE_COEFFICIENT: Record<TrainingFitnessLevel, number> = {
  beginner: 0.75,
  lowKey: 0.9,
  competitive: 1.0,
  highlyCompetitive: 1.15,
  elite: 1.3,
};

function fitnessFatigueCoefficient(level?: string | null): number {
  if (!level) return FITNESS_FATIGUE_COEFFICIENT.competitive;
  return FITNESS_FATIGUE_COEFFICIENT[level as TrainingFitnessLevel] ?? FITNESS_FATIGUE_COEFFICIENT.competitive;
}

export const EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
  squat: ['quads', 'glutes', 'hamstrings'],
  'back squat': ['quads', 'glutes', 'hamstrings'],
  'front squat': ['quads', 'glutes'],
  lunge: ['quads', 'glutes', 'hamstrings'],
  lunges: ['quads', 'glutes', 'hamstrings'],
  'walking lunge': ['quads', 'glutes', 'hamstrings'],
  'reverse lunge': ['glutes', 'hamstrings'],
  'split squat': ['quads', 'glutes'],
  'bulgarian split squat': ['quads', 'glutes', 'hamstrings'],
  'romanian deadlift': ['hamstrings', 'glutes'],
  rdl: ['hamstrings', 'glutes'],
  deadlift: ['hamstrings', 'glutes', 'lower back'],
  'leg press': ['quads', 'glutes'],
  'leg curl': ['hamstrings'],
  'leg extension': ['quads'],
  'calf raise': ['calves'],
  'hip thrust': ['glutes', 'hamstrings'],
  'step up': ['quads', 'glutes'],
  'step-ups': ['quads', 'glutes'],
  'box jump': ['quads', 'glutes', 'calves'],
  burpees: ['quads', 'glutes', 'calves', 'core'],
  thrusters: ['quads', 'glutes', 'shoulders', 'triceps'],
  'bench press': ['chest', 'triceps', 'shoulders'],
  'overhead press': ['shoulders', 'triceps'],
  'pull up': ['back', 'biceps'],
  row: ['back', 'biceps'],
  plank: ['core'],
  'push up': ['chest', 'triceps'],
};

export interface RunSession {
  rpe: number;
  durationMin: number;
  km: number;
}

export interface ExerciseSet {
  name: string;
  reps: number;
  weightKg: number;
  rpe: number;
}

export interface StrengthSession {
  sets: ExerciseSet[];
  durationMin: number;
  sessionRpe: number;
}

export interface DayData {
  runSession?: RunSession | null;
  strengthSession?: StrengthSession | null;
  wellness?: number;
}

export interface ExerciseFatigueBreakdown {
  legFatigue: number;
  totalBodyFatigue: number;
  exercises: Array<{ name: string; inol: number; isLeg: boolean; muscles: string[] }>;
}

export interface ProcessedTrainingDay {
  dayIndex: number;
  load: number;
  runLoad: number | null;
  strengthLoad: number | null;
  legFatigue: number | null;
  totalBodyFatigue: number | null;
  wellness: number;
  wellnessZscore: number;
  acwr: number;
  acwrZone: AcwrZone;
  weeklyDelta: number;
  weeklyDeltaFlag: boolean;
  fitness: number;
  fatigue: number;
  tsb: number;
  readiness: number;
  readinessLabel: ReadinessLabel;
  loadModifier: number | null;
  calibrating: boolean;
}

export type AcwrZone = 'undertraining' | 'sweet_spot' | 'caution' | 'danger' | 'high_risk';
export type ReadinessLabel = 'green' | 'amber' | 'red';

const round = (value: number, decimals = 1) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function runningLoad(session: RunSession): number {
  const srpeAu = session.rpe * session.durationMin;
  const externalAu = session.km * 10;
  return 0.6 * srpeAu + 0.4 * externalAu;
}

export function rpeToPct1rm(rpe: number): number {
  const pct = 100 - (10 - rpe) * 5;
  return clamp(pct, 50, 99.9);
}

export function setInol(set: Pick<ExerciseSet, 'reps' | 'rpe'>): number {
  const pct = rpeToPct1rm(set.rpe);
  return set.reps / (100 - pct);
}

export function strengthLoad(session: StrengthSession): number {
  const internal = session.sessionRpe * session.durationMin;
  const external = session.sets.reduce((sum, set) => sum + setInol(set), 0) * 20;
  return 0.5 * internal + 0.5 * external;
}

export function dailyLoad(day: DayData): number {
  return (day.runSession ? runningLoad(day.runSession) : 0)
    + (day.strengthSession ? strengthLoad(day.strengthSession) : 0);
}

export function musclesForExercise(name: string): string[] {
  const key = name.trim().toLowerCase();
  const exact = EXERCISE_MUSCLE_MAP[key];
  if (exact) return exact;

  if (key.includes('squat')) return ['quads', 'glutes', 'hamstrings'];
  if (key.includes('lunge')) return ['quads', 'glutes', 'hamstrings'];
  if (key.includes('deadlift') || key.includes('rdl') || key.includes('romanian')) return ['hamstrings', 'glutes', 'lower back'];
  if (key.includes('step')) return ['quads', 'glutes'];
  if (key.includes('calf')) return ['calves'];
  if (key.includes('leg press')) return ['quads', 'glutes'];
  if (key.includes('leg curl')) return ['hamstrings'];
  if (key.includes('leg extension')) return ['quads'];
  if (key.includes('hip thrust') || key.includes('glute')) return ['glutes', 'hamstrings'];
  if (key.includes('box jump') || key.includes('jump')) return ['quads', 'glutes', 'calves'];
  if (key.includes('burpee') || key.includes('thruster')) return ['quads', 'glutes', 'calves', 'core'];

  if (key.includes('pull up') || key.includes('pull-up') || key.includes('pullup')) return ['back', 'biceps'];
  if (key.includes('row')) return ['back', 'biceps'];
  if (key.includes('press') || key.includes('push up') || key.includes('push-up') || key.includes('pushup')) return ['chest', 'triceps', 'shoulders'];
  if (key.includes('handstand')) return ['shoulders', 'triceps', 'core'];
  if (key.includes('plank') || key.includes('hold') || key.includes('hollow') || key.includes('crunch')) return ['core'];

  return ['unknown'];
}

export function legFatigueScore(session: StrengthSession, fitnessLevel?: string | null): number {
  const legInol = session.sets.reduce((sum, set) => {
    const isLeg = musclesForExercise(set.name).some(muscle => LEG_MUSCLES.has(muscle));
    return sum + (isLeg ? setInol(set) : 0);
  }, 0);
  const reference = 15 * fitnessFatigueCoefficient(fitnessLevel);
  return round(Math.min(legInol / reference, 1) * 100, 1);
}

export function totalBodyFatigueScore(session: StrengthSession, fitnessLevel?: string | null): number {
  const totalInol = session.sets.reduce((sum, set) => sum + setInol(set), 0);
  const reference = 25 * fitnessFatigueCoefficient(fitnessLevel);
  return round(Math.min(totalInol / reference, 1) * 100, 1);
}

export function exerciseFatigueBreakdown(session: StrengthSession, fitnessLevel?: string | null): ExerciseFatigueBreakdown {
  return {
    legFatigue: legFatigueScore(session, fitnessLevel),
    totalBodyFatigue: totalBodyFatigueScore(session, fitnessLevel),
    exercises: session.sets.map(set => {
      const muscles = musclesForExercise(set.name);
      return {
        name: set.name,
        inol: round(setInol(set), 3),
        isLeg: muscles.some(muscle => LEG_MUSCLES.has(muscle)),
        muscles,
      };
    }),
  };
}

export function ewma(values: number[], n: number): number[] {
  const lambda = 2 / (n + 1);
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    out[i] = values[i] * lambda + (i > 0 ? out[i - 1] : 0) * (1 - lambda);
  }
  return out;
}

export function acwrEwma(loads: number[]): number[] {
  const acute = ewma(loads, 7);
  const chronic = ewma(loads, 28);
  return loads.map((_, i) => chronic[i] > 0 ? acute[i] / chronic[i] : 1);
}

export function acwrZone(acwr: number): AcwrZone {
  if (acwr < 0.8) return 'undertraining';
  if (acwr <= 1.3) return 'sweet_spot';
  if (acwr <= 1.5) return 'caution';
  if (acwr <= 2.0) return 'danger';
  return 'high_risk';
}

export function weeklyDelta(loads: number[]): number[] {
  const delta = new Array(loads.length).fill(0);
  for (let t = 14; t < loads.length; t++) {
    const thisWeek = loads.slice(t - 6, t + 1).reduce((a, b) => a + b, 0);
    const lastWeek = loads.slice(t - 13, t - 6).reduce((a, b) => a + b, 0);
    delta[t] = lastWeek > 0 ? (thisWeek - lastWeek) / lastWeek : 0;
  }
  return delta;
}

export function banisterModel(
  loads: number[],
  wellness: number[],
  tau1 = 42,
  tau2 = 7
): { fitness: number[]; fatigue: number[]; tsb: number[] } {
  const fitness = new Array(loads.length).fill(0);
  const fatigue = new Array(loads.length).fill(0);
  for (let t = 1; t < loads.length; t++) {
    const tau2Eff = tau2 * (2 - wellness[t] / 100);
    fitness[t] = fitness[t - 1] * Math.exp(-1 / tau1) + loads[t];
    fatigue[t] = fatigue[t - 1] * Math.exp(-1 / tau2Eff) + loads[t];
  }
  const tsb = loads.map((_, i) => i === 0 ? 0 : fitness[i - 1] - fatigue[i - 1]);
  return { fitness, fatigue, tsb };
}

export function readinessScores(
  wellness: number[],
  tsb: number[],
  acwr: number[],
  dweek: number[],
  weights = { wellness: 0.4, tsb: 0.3, acwr: 0.2, weeklyDelta: 0.1 }
): number[] {
  return wellness.map((w, i) => {
    const normalizedWellness = w / 100;
    const normalizedTsb = clamp((tsb[i] + 30) / 40, 0, 1);
    const normalizedAcwr = 1 - clamp(Math.abs(acwr[i] - 1) / 0.8, 0, 1);
    const normalizedDelta = 1 - clamp(Math.abs(dweek[i]) / 0.5, 0, 1);
    return 100 * (
      weights.wellness * normalizedWellness
      + weights.tsb * normalizedTsb
      + weights.acwr * normalizedAcwr
      + weights.weeklyDelta * normalizedDelta
    );
  });
}

export function readinessLabel(score: number): ReadinessLabel {
  if (score >= 70) return 'green';
  if (score >= 40) return 'amber';
  return 'red';
}

export function loadModifier(wToday: number, wMean: number, wSd: number, acwr: number, tsb: number): number {
  const z = wSd > 0 ? (wToday - wMean) / wSd : 0;
  const wellnessModifier = z >= 0.5 ? 1.05 : z >= -0.5 ? 1 : z >= -1 ? 0.85 : z >= -1.5 ? 0.7 : 0.5;
  const acwrModifier = acwr < 0.8 ? 1.1 : acwr <= 1.3 ? 1 : acwr <= 1.5 ? 0.85 : 0.7;
  const tsbModifier = tsb > -10 ? 1 : tsb > -20 ? 0.9 : 0.75;
  return wellnessModifier * acwrModifier * tsbModifier;
}

export function wellnessZscores(wellness: number[], window = 28): number[] {
  const zscores = new Array(wellness.length).fill(0);
  for (let t = window; t < wellness.length; t++) {
    const values = wellness.slice(t - window, t);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / Math.max(1, values.length - 1);
    const sd = Math.sqrt(variance);
    zscores[t] = sd > 0 ? (wellness[t] - mean) / sd : 0;
  }
  return zscores;
}

export function processTrainingDays(days: DayData[], tau1 = 42, tau2 = 7): ProcessedTrainingDay[] {
  const loads = days.map(day => dailyLoad(day));
  const wellness = days.map(day => day.wellness ?? 100);
  const acwr = acwrEwma(loads);
  const delta = weeklyDelta(loads);
  const zscores = wellnessZscores(wellness, 28);
  const { fitness, fatigue, tsb } = banisterModel(loads, wellness, tau1, tau2);
  const readiness = readinessScores(wellness, tsb, acwr, delta);

  return days.map((day, i) => {
    const strength = day.strengthSession ?? null;
    let modifier: number | null = null;
    if (i >= 14) {
      const window = wellness.slice(Math.max(0, i - 28), i);
      const mean = window.reduce((a, b) => a + b, 0) / window.length;
      const variance = window.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / Math.max(1, window.length - 1);
      modifier = loadModifier(wellness[i], mean, Math.sqrt(variance), acwr[i], tsb[i]);
    }

    return {
      dayIndex: i,
      load: round(loads[i], 2),
      runLoad: day.runSession ? round(runningLoad(day.runSession), 2) : null,
      strengthLoad: strength ? round(strengthLoad(strength), 2) : null,
      legFatigue: strength ? legFatigueScore(strength) : null,
      totalBodyFatigue: strength ? totalBodyFatigueScore(strength) : null,
      wellness: wellness[i],
      wellnessZscore: round(zscores[i], 3),
      acwr: round(acwr[i], 3),
      acwrZone: acwrZone(acwr[i]),
      weeklyDelta: round(delta[i], 3),
      weeklyDeltaFlag: Math.abs(delta[i]) > 0.3,
      fitness: round(fitness[i], 2),
      fatigue: round(fatigue[i], 2),
      tsb: round(tsb[i], 2),
      readiness: round(readiness[i], 1),
      readinessLabel: readinessLabel(readiness[i]),
      loadModifier: modifier == null ? null : round(modifier, 3),
      calibrating: i < 28,
    };
  });
}
