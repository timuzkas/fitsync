export interface RawLoad {
  cardio: number;
  legs: number;
  upper: number;
  core: number;
  systemic: number;
}

export interface LoadConfig {
  halfLifeHours: { cardio: number; legs: number; upper: number; core: number };
  multipliers: { cardio: number; legs: number; upper: number; core: number };
  weeklyTarget: number;
  readinessFormula: 'simple' | 'exponential';
  includeHevyInLoad?: boolean;
}

export const DEFAULT_CONFIG: LoadConfig = {
  halfLifeHours: { cardio: 84, legs: 96, upper: 84, core: 60 },
  multipliers: { cardio: 1.2, legs: 1.5, upper: 1.0, core: 0.8 },
  weeklyTarget: 400,
  readinessFormula: 'simple',
  includeHevyInLoad: true,
};

export function getDecayRate(halfLifeHours: number) {
  return Math.log(2) / halfLifeHours;
}

export function calculateCardioLoad(
  type: string,
  durationSec: number,
  avgHr?: number | null,
  maxHr?: number | null,
  distanceM?: number | null,
  elevationGainM: number = 0,
  multiplier = 1.0
): number {
  if (!['run', 'ride', 'walk', 'other'].includes(type)) return 0;

  const durationMin = durationSec / 60;
  let load = 0;

  if (avgHr && maxHr) {
    const hrReserve = (avgHr - 60) / (maxHr - 60);
    const intensityFactor = Math.min(hrReserve, 1.2);
    load = durationMin * intensityFactor * 0.5;
  } else if (distanceM && durationSec > 0) {
    const speedMps = distanceM / durationSec;
    const paceMinPerKm = (1000 / speedMps) / 60;
    const intensity = Math.max(0.5, Math.min(2, 10 / paceMinPerKm));
    load = durationMin * intensity * 0.4;
  } else {
    load = durationMin * 0.5;
  }

  const gradeFactor = type === 'run' 
    ? 1 + (elevationGainM / 1000) * 0.05 
    : 1 + (elevationGainM / 1000) * 0.03;

  return Math.round(load * multiplier * gradeFactor * 10) / 10;
}

const MUSCLE_GROUP_MAP: Record<string, string[]> = {
  quads: ['quads', 'front-thighs'],
  glutes: ['glutes', 'hips'],
  hamstrings: ['hamstrings', 'back-thighs'],
  calves: ['calves', 'lower-legs'],
  chest: ['chest', 'pecs'],
  back: ['back', 'lats', 'traps'],
  shoulders: ['shoulders', 'delts'],
  biceps: ['biceps', 'arms'],
  triceps: ['triceps', 'arms'],
  forearms: ['forearms', 'arms'],
  abs: ['abs', 'core'],
  obliques: ['obliques', 'core'],
  lower_back: ['lower-back', 'back'],
};

const STRENGTH_MUSCLE_WEIGHTS: Record<string, Record<string, number>> = {
  quads: { legs: 1.0 },
  glutes: { legs: 0.9, systemic: 0.2 },
  hamstrings: { legs: 0.8, core: 0.1 },
  calves: { legs: 0.4 },
  chest: { upper: 1.0 },
  back: { upper: 0.8, core: 0.2 },
  lats: { upper: 0.8 },
  traps: { upper: 0.3, systemic: 0.1 },
  shoulders: { upper: 0.9 },
  delts: { upper: 0.9 },
  biceps: { upper: 0.5 },
  triceps: { upper: 0.5 },
  forearms: { upper: 0.2 },
  abs: { core: 1.0 },
  obliques: { core: 0.7 },
  'lower-back': { core: 0.6, legs: 0.1 },
};

export function calculateStrengthLoad(
  exercises: Array<{ name: string; muscleGroups: string[]; sets: Array<{ reps: number; weight: number }> }>,
  multipliers: LoadConfig['multipliers'] = DEFAULT_CONFIG.multipliers
): RawLoad {
  const load: RawLoad = { cardio: 0, legs: 0, upper: 0, core: 0, systemic: 0 };

  for (const ex of exercises) {
    if (!ex.sets || ex.sets.length === 0) continue;

    const volume = ex.sets.reduce((acc, s) => acc + s.reps * s.weight, 0);
    const mgCount = ex.muscleGroups.length || 1;

    for (const mg of ex.muscleGroups) {
      const mapped = MUSCLE_GROUP_MAP[mg] || [mg];
      for (const m of mapped) {
        const weights = STRENGTH_MUSCLE_WEIGHTS[m];
        if (weights) {
          const contribution = volume * 0.05 / mgCount;
          if (weights.legs) load.legs += contribution * weights.legs * multipliers.legs;
          if (weights.upper) load.upper += contribution * weights.upper * multipliers.upper;
          if (weights.core) load.core += contribution * weights.core * multipliers.core;
          if (weights.systemic) load.systemic += contribution * weights.systemic;
        }
      }
    }

    if (!ex.muscleGroups.length) {
      load.systemic += volume * 0.05;
    }

    load.systemic += volume * 0.005;
  }

  load.legs = Math.round(load.legs * 10) / 10;
  load.upper = Math.round(load.upper * 10) / 10;
  load.core = Math.round(load.core * 10) / 10;
  load.systemic = Math.round(load.systemic * 10) / 10;

  return load;
}

export function calculateDecayedLoad(
  rawLoad: RawLoad,
  hoursSinceWorkout: number,
  config: LoadConfig = DEFAULT_CONFIG
): RawLoad {
  if (hoursSinceWorkout < 0) hoursSinceWorkout = 0;

  return {
    cardio: rawLoad.cardio * Math.exp(-getDecayRate(config.halfLifeHours.cardio) * hoursSinceWorkout),
    legs: rawLoad.legs * Math.exp(-getDecayRate(config.halfLifeHours.legs) * hoursSinceWorkout),
    upper: rawLoad.upper * Math.exp(-getDecayRate(config.halfLifeHours.upper) * hoursSinceWorkout),
    core: rawLoad.core * Math.exp(-getDecayRate(config.halfLifeHours.core) * hoursSinceWorkout),
    systemic: rawLoad.systemic * Math.exp(-getDecayRate(config.halfLifeHours.core) * hoursSinceWorkout), // Systemic uses core decay for now
  };
}

export function sumLoads(loads: RawLoad[]): RawLoad {
  return loads.reduce(
    (acc, l) => ({
      cardio: acc.cardio + l.cardio,
      legs: acc.legs + l.legs,
      upper: acc.upper + l.upper,
      core: acc.core + l.core,
      systemic: acc.systemic + l.systemic,
    }),
    { cardio: 0, legs: 0, upper: 0, core: 0, systemic: 0 }
  );
}

/**
 * Athlete Readiness Score (v2.2)
 * Readiness increases with rest and decreases with recent duration and load.
 */
export function calculateReadinessV2(
  last7DaysSessions: Array<{ load: number; durationMin: number; date: Date }>,
  today: Date,
  lastWorkoutDate: Date | null
): number {
  const RECOVERY_RATE = 12; // points per rest day
  const LOAD_IMPACT = 0.65;
  const DURATION_IMPACT = 0.45;
  let baseReadiness = 65;

  const daysSinceLastWorkout = lastWorkoutDate 
    ? Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24))
    : 7;
  
  const recoveryBonus = Math.min(35, daysSinceLastWorkout * RECOVERY_RATE);

  let loadPenalty = 0;
  let durationPenalty = 0;

  for (const session of last7DaysSessions) {
    // Session load = RPE * duration
    loadPenalty += session.load * LOAD_IMPACT;
    durationPenalty += session.durationMin * DURATION_IMPACT;
  }

  // Simplified penalty scaling for the 0-100 range
  let readiness = baseReadiness + recoveryBonus - ((loadPenalty + durationPenalty) / 10);
  return Math.max(0, Math.min(100, Math.round(readiness)));
}

/**
 * Section 15: Leg Muscular Risk (LMR) & Total Body Fatigue (TBF)
 */
export function calculateMuscularRisks(
  sessions: Array<{ legStress: number; totalStress: number; date: Date }>,
  today: Date
) {
  let legMuscularRisk = 0;
  let totalBodyFatigue = 0;

  for (const session of sessions) {
    const daysAgo = Math.floor((today.getTime() - session.date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo > 7) continue;

    const legDecay = Math.pow(0.62, daysAgo);
    const totalDecay = Math.pow(0.68, daysAgo);

    legMuscularRisk += session.legStress * legDecay;
    totalBodyFatigue += session.totalStress * totalDecay;
  }

  // Normalization per spec (tuned from real runner data)
  legMuscularRisk = Math.min(100, (legMuscularRisk / 380) * 100);
  totalBodyFatigue = Math.min(100, (totalBodyFatigue / 520) * 100);

  return {
    legMuscularRisk: Math.round(legMuscularRisk),
    totalBodyFatigue: Math.round(totalBodyFatigue)
  };
}

export const LEG_COEFFICIENTS: Record<string, number> = {
  'Squat': 2.85,
  'Deadlift': 2.70,
  'Romanian Deadlift': 2.70,
  'Lunges': 2.45,
  'Bulgarian Split Squat': 2.45,
  'Leg Press': 2.30,
  'Step-ups': 1.90,
  'Burpees': 2.10,
  'Thrusters': 2.10,
  'Running': 1.00,
  'Pike Pushup': 0.35,
  'Pull Up': 0.25,
};

export const SYSTEMIC_COEFFICIENTS: Record<string, number> = {
  'Squat': 1.2,
  'Deadlift': 1.5,
  'Burpees': 1.4,
  'Running': 0.8,
};

export function calcReadiness(
  cardio: number,
  legs: number,
  upper: number,
  core: number,
  systemic: number,
  config: LoadConfig = DEFAULT_CONFIG
): number {
  const targetLoad = config.weeklyTarget / 7;
  const total = (cardio + legs + upper + core + systemic);
  
  if (config.readinessFormula === 'exponential') {
    const readiness = 100 * Math.exp(-(total / (targetLoad * 1.5)));
    return Math.round(readiness * 10) / 10;
  }

  const deviation = Math.abs(total - targetLoad);
  const readiness = Math.max(0, Math.min(100, 100 - deviation * 2.0));
  return Math.round(readiness * 10) / 10;
}

export function calc7dLoad(workouts: any[], now: Date, config: LoadConfig = DEFAULT_CONFIG): RawLoad {
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return sumLoads(
    workouts
      .filter((w) => new Date(w.startedAt) >= cutoff)
      .map((w) => {
        const hours = (now.getTime() - new Date(w.startedAt).getTime()) / (1000 * 60 * 60);
        return calculateDecayedLoad(
          {
            cardio: w.loadScore?.cardio || 0,
            legs: w.loadScore?.legs || 0,
            upper: w.loadScore?.upper || 0,
            core: w.loadScore?.core || 0,
            systemic: w.loadScore?.systemic || 0,
          },
          hours,
          config
        );
      })
  );
}

export function calc28dLoad(workouts: any[], now: Date, config: LoadConfig = DEFAULT_CONFIG): RawLoad {
  const cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  return sumLoads(
    workouts
      .filter((w) => new Date(w.startedAt) >= cutoff)
      .map((w) => {
        const hours = (now.getTime() - new Date(w.startedAt).getTime()) / (1000 * 60 * 60);
        return calculateDecayedLoad(
          {
            cardio: w.loadScore?.cardio || 0,
            legs: w.loadScore?.legs || 0,
            upper: w.loadScore?.upper || 0,
            core: w.loadScore?.core || 0,
            systemic: w.loadScore?.systemic || 0,
          },
          hours,
          config
        );
      })
  );
}

export function formatLoad(l: RawLoad): RawLoad {
  return {
    cardio: Math.round(l.cardio * 10) / 10,
    legs: Math.round(l.legs * 10) / 10,
    upper: Math.round(l.upper * 10) / 10,
    core: Math.round(l.core * 10) / 10,
    systemic: Math.round(l.systemic * 10) / 10,
  };
}
