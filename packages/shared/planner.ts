
import { getZonePace, VDOT_COEFFS, calculateDanielsPoints, calculateNextWeeklyDPlus } from './training';
import { Athlete, AdaptiveState, RunnerLevel } from './index';

export type RaceType = 'A' | 'B' | 'C' | 'D';

export interface Race {
  name: string;
  date: Date;
  type: RaceType;
  distanceKm?: number;
  dPlusM?: number;
  goalTimeSec?: number;
}

export type PhaseType = 'Base' | 'Economy' | 'Threshold' | 'Peak' | 'Recovery' | 'Taper';

export interface Phase {
  type: PhaseType;
  startWeek: number;
  endWeek: number;
  focusZone?: keyof typeof VDOT_COEFFS;
}

export interface TrainingCycle {
  aRaceDate: Date;
  phases: Phase[];
  totalWeeks: number;
}

export interface DayPlan {
  date: Date;
  type: 'Rest' | 'Easy' | 'Long' | 'Quality' | 'Race';
  zone?: keyof typeof VDOT_COEFFS;
  durationMin: number;
  distanceKm: number;
  rpe: number;
  load: number;
  danielsPoints: number;
  dPlusM?: number;
  dMinusM?: number;
  reps?: number;
  restSec?: number;
  planLimitationFlag?: string | null;
  hudsonWorkoutType?: string; // Hudson §9 workout taxonomy
  notes?: string;             // human-readable workout description
}

/**
 * Pre-placement fatigue gate. Both conditions must pass to allow quality session.
 * Combined leg risk = max(LMR, TBF × 0.7). Must be ≤ 68 AND readiness ≥ 55.
 */
export function canPlaceQualitySession(
  legMuscularRisk: number,
  totalBodyFatigue: number,
  readinessScore: number
): boolean {
  const finalLegRisk = Math.max(legMuscularRisk, totalBodyFatigue * 0.7);
  return finalLegRisk <= 68 && readinessScore >= 55;
}

/**
 * Section 10: Adaptive Points Level Logic
 */
export function evaluateAdaptiveLevel(athlete: Athlete): {
  newTarget: number;
  newState: AdaptiveState;
  reason?: string;
} {
  const history = athlete.pointsHistory || [];
  const currentTarget = athlete.weeklyPointsTarget || 50;
  let newState: AdaptiveState = athlete.adaptiveState || 'normal';
  let newTarget = currentTarget;

  const last2Weeks = history.slice(-2);
  if (last2Weeks.length === 2 && last2Weeks.every(h => h.acwr > 1.5)) {
    return {
      newTarget: Math.round(currentTarget * 0.9),
      newState: 'frozen',
      reason: 'high_acwr_overload'
    };
  }

  if (newState === 'frozen') {
    const lastWeek = history[history.length - 1];
    if (lastWeek && lastWeek.acwr < 1.3) {
      newState = 'normal';
    } else {
      return { newTarget, newState, reason: 'high_acwr_persistent' };
    }
  }

  const last3Weeks = history.slice(-3);
  let reason: string | undefined;
  if (last3Weeks.length === 3) {
    if (last3Weeks.every(h => h.actual >= h.target)) {
      newTarget = Math.round(currentTarget * 1.1);
      reason = 'consistent_overperformance';
    } else if (last3Weeks.every(h => h.actual < h.target)) {
      newTarget = Math.round(currentTarget * 0.9);
      reason = 'consistent_underperformance';
    }
  }

  return { newTarget, newState, reason };
}

/**
 * Allocate phases backwards from A race date.
 */
export function planSeason(aRaceDate: Date, startDate: Date, _races: Race[] = []): TrainingCycle {
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const totalWeeks = Math.ceil((aRaceDate.getTime() - startDate.getTime()) / msPerWeek);

  const phases: Phase[] = [];
  const taperWeeks = 2;
  const mainTrainingWeeks = totalWeeks - taperWeeks;

  if (mainTrainingWeeks >= 18) {
    const phaseLen = Math.floor(mainTrainingWeeks / 4);
    phases.push({ type: 'Base',      startWeek: 1,              endWeek: phaseLen,          focusZone: 'E' });
    phases.push({ type: 'Economy',   startWeek: phaseLen + 1,   endWeek: phaseLen * 2,       focusZone: 'R' });
    phases.push({ type: 'Threshold', startWeek: phaseLen * 2 + 1, endWeek: phaseLen * 3,    focusZone: 'T' });
    phases.push({ type: 'Peak',      startWeek: phaseLen * 3 + 1, endWeek: mainTrainingWeeks, focusZone: 'I' });
  } else if (mainTrainingWeeks >= 12) {
    const ph1 = Math.max(1, Math.floor(mainTrainingWeeks * 0.25));
    const ph2 = Math.max(2, Math.floor(mainTrainingWeeks * 0.25));
    const ph3 = Math.max(2, Math.floor(mainTrainingWeeks * 0.25));
    phases.push({ type: 'Base',      startWeek: 1,                  endWeek: ph1,              focusZone: 'E' });
    phases.push({ type: 'Economy',   startWeek: ph1 + 1,            endWeek: ph1 + ph2,         focusZone: 'R' });
    phases.push({ type: 'Threshold', startWeek: ph1 + ph2 + 1,      endWeek: ph1 + ph2 + ph3,   focusZone: 'T' });
    phases.push({ type: 'Peak',      startWeek: ph1 + ph2 + ph3 + 1, endWeek: mainTrainingWeeks, focusZone: 'I' });
  } else if (mainTrainingWeeks >= 6) {
    const ph12 = Math.floor(mainTrainingWeeks * 0.5);
    phases.push({ type: 'Base',      startWeek: 1,        endWeek: ph12,              focusZone: 'E' });
    phases.push({ type: 'Threshold', startWeek: ph12 + 1, endWeek: mainTrainingWeeks, focusZone: 'T' });
  } else {
    phases.push({ type: 'Threshold', startWeek: 1, endWeek: mainTrainingWeeks, focusZone: 'T' });
  }

  phases.push({ type: 'Taper', startWeek: mainTrainingWeeks + 1, endWeek: totalWeeks });
  return { aRaceDate, phases, totalWeeks };
}


const msPerDay = 1000 * 60 * 60 * 24;

export function planWeek(
  startDate: Date,
  phase: Phase,
  availableDays: number[],
  weeklyTargetKm: number,
  vdot: number,
  chronicLoad: number,
  aRaceDate?: Date,
  aRaceDistance?: number,
  weeklyPointsTarget?: number,
  legMuscularRisk: number = 0,
  totalBodyFatigue: number = 0,
  readinessScore: number = 100,
  weeklyTargetDPlus?: number
): DayPlan[] {
  let adjustedTarget = weeklyTargetKm;
  if (phase.type === 'Taper') adjustedTarget *= 0.75;
  else if (phase.type === 'Recovery') adjustedTarget *= 0.50;

  const isRecoveryWeek = phase.type === 'Recovery' || phase.type === 'Taper';
  const adjustedDPlus = weeklyTargetDPlus
    ? calculateNextWeeklyDPlus(weeklyTargetDPlus, isRecoveryWeek)
    : undefined;

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }

  const availableIndices = availableIndicesFromDays(availableDays, startDate);
  const plan: (DayPlan | null)[] = new Array(7).fill(null);

  // Daniels caps (distance-based, applied after weekly km is computed)
  const caps = {
    T: Math.round(adjustedTarget * 0.10 * 10) / 10,
    I: Math.min(Math.round(adjustedTarget * 0.08 * 10) / 10, 10),
    R: Math.round(adjustedTarget * 0.05 * 10) / 10,
  };

  const maxQuality = availableIndices.length >= 3 ? 2 : (availableIndices.length > 0 ? 1 : 0);
  const weekNum = Math.floor(startDate.getTime() / (msPerDay * 7));
  const isAltWeek = weekNum % 2 === 0;

  // Pre-placement fatigue gate — if check fails, no quality this week
  const qualityAllowed = phase.type !== 'Recovery' &&
    canPlaceQualitySession(legMuscularRisk, totalBodyFatigue, readinessScore);

  const qualitySessions: { zone: keyof typeof VDOT_COEFFS; distance: number }[] = [];

  if (qualityAllowed) {
    if (phase.type === 'Taper' && maxQuality >= 1) {
      qualitySessions.push({ zone: 'T', distance: caps.T });
    } else if (phase.type === 'Base' && maxQuality >= 1 && isAltWeek) {
      qualitySessions.push({ zone: 'T', distance: caps.T * 0.6 });
    } else if (phase.type === 'Economy') {
      qualitySessions.push({ zone: 'R', distance: caps.R });
      if (maxQuality >= 2) qualitySessions.push({ zone: 'T', distance: caps.T });
    } else if (phase.type === 'Threshold') {
      qualitySessions.push({ zone: 'T', distance: caps.T });
      if (maxQuality >= 2) qualitySessions.push({ zone: 'T', distance: caps.T });
    } else if (phase.type === 'Peak') {
      qualitySessions.push({ zone: 'I', distance: caps.I });
      if (maxQuality >= 2) qualitySessions.push({ zone: 'T', distance: caps.T });
    }
  }

  // Place Race
  let raceIdx = -1;
  if (aRaceDate) {
    raceIdx = days.findIndex(d => d.toDateString() === aRaceDate.toDateString());
    if (raceIdx !== -1) {
      plan[raceIdx] = createSession(days[raceIdx], 'Race', 'I', aRaceDistance || 10, vdot);
      plan[raceIdx]!.rpe = 10;
    }
  }

  // Place Quality
  const qualityDays = availableIndices.filter(i => i !== raceIdx);
  qualitySessions.slice(0, maxQuality).forEach(() => {
    const qs = qualitySessions.shift();
    if (!qs) return;
    const idx = findQualityDay(qualityDays, plan, raceIdx);
    if (idx !== -1) {
      plan[idx] = createSession(days[idx], 'Quality', qs.zone, qs.distance, vdot);
    }
  });

  // Place Long Run (25–30% of weekly km)
  const longRunDist = Math.round(Math.min(adjustedTarget * 0.28, adjustedTarget * 0.30) * 10) / 10;
  const longRunIdx = availableIndices.find(i =>
    plan[i] === null &&
    (i === 0 || plan[i - 1] === null) &&
    (i === 6 || plan[i + 1] === null)
  );
  if (longRunIdx !== undefined && phase.type !== 'Recovery' && !(raceIdx !== -1 && (aRaceDistance || 0) >= 10)) {
    plan[longRunIdx] = createSession(days[longRunIdx], 'Long', 'E', longRunDist, vdot);
  }

  // Fill Easy
  const usedDist = plan.reduce((acc, p) => acc + (p?.distanceKm || 0), 0);
  const remainingDist = Math.max(0, adjustedTarget - usedDist);
  const emptyIndices = availableIndices.filter(i => plan[i] === null);
  if (emptyIndices.length > 0) {
    const distPerEasy = Math.round((remainingDist / emptyIndices.length) * 10) / 10;
    emptyIndices.forEach(i => {
      plan[i] = createSession(days[i], 'Easy', 'E', distPerEasy, vdot);
    });
  }

  const finalWeek: DayPlan[] = plan.map((p, i) => p || {
    date: days[i], type: 'Rest', durationMin: 0, distanceKm: 0, rpe: 0, load: 0, danielsPoints: 0
  });

  // Distribute weekly D+ proportionally across active sessions (Type D trail plans)
  if (adjustedDPlus && adjustedDPlus > 0) {
    const totalDist = finalWeek.reduce((acc, p) => acc + p.distanceKm, 0);
    if (totalDist > 0) {
      finalWeek.forEach(p => {
        if (p.distanceKm > 0) {
          p.dPlusM = Math.round(adjustedDPlus * (p.distanceKm / totalDist));
        }
      });
    }
  }

  // Section 9.5 Plan Limitation Flag
  const totalPoints = finalWeek.reduce((acc, p) => acc + p.danielsPoints, 0);
  if (weeklyPointsTarget && totalPoints < weeklyPointsTarget * 0.9) {
    const flag = !qualityAllowed
      ? `Quality sessions skipped — fatigue/readiness gate (LMR or readiness < 55). Consider recovery.`
      : `Target of ${weeklyPointsTarget} pts unreachable with ${availableIndices.length} days. Consider adding a running day.`;
    finalWeek.forEach(p => { p.planLimitationFlag = flag; });
  }

  // Layered ACWR correction
  if (chronicLoad > 0) {
    const totalLoad = finalWeek.reduce((acc, p) => acc + p.load, 0);
    if (totalLoad / chronicLoad > 1.5) {
      applyLayeredAcwrCorrection(finalWeek, chronicLoad);
    }
  }

  return finalWeek;
}

/**
 * Layered ACWR correction — priority order:
 * 1. Trim Easy volume
 * 2. Trim Long run by 20%
 * 3. Downgrade I → T
 * 4. Downgrade T → E
 * 5. Emit planLimitationFlag if still unsafe
 */
function applyLayeredAcwrCorrection(week: DayPlan[], chronicLoad: number): void {
  const targetLoad = chronicLoad * 1.3;

  // Step 1: trim Easy sessions
  for (const s of week) {
    if (s.type !== 'Easy') continue;
    const currentLoad = week.reduce((a, p) => a + p.load, 0);
    if (currentLoad <= targetLoad) return;
    const factor = Math.max(0.5, targetLoad / currentLoad);
    s.distanceKm = Math.round(s.distanceKm * factor * 10) / 10;
    s.durationMin = Math.round(s.durationMin * factor);
    s.load = s.rpe * s.durationMin;
  }

  // Step 2: trim Long run by 20%
  const longRun = week.find(s => s.type === 'Long');
  if (longRun) {
    const currentLoad = week.reduce((a, p) => a + p.load, 0);
    if (currentLoad > targetLoad) {
      longRun.distanceKm = Math.round(longRun.distanceKm * 0.8 * 10) / 10;
      longRun.durationMin = Math.round(longRun.durationMin * 0.8);
      longRun.load = longRun.rpe * longRun.durationMin;
    }
  }

  // Step 3: downgrade I → T
  for (const s of week) {
    if (s.type !== 'Quality' || s.zone !== 'I') continue;
    const currentLoad = week.reduce((a, p) => a + p.load, 0);
    if (currentLoad <= targetLoad) return;
    s.zone = 'T';
    s.rpe = 7;
    s.load = s.rpe * s.durationMin;
    s.danielsPoints = calculateDanielsPoints(s.durationMin, 'T');
    delete s.reps;
    delete s.restSec;
  }

  // Step 4: downgrade T → E
  for (const s of week) {
    if (s.type !== 'Quality' || s.zone !== 'T') continue;
    const currentLoad = week.reduce((a, p) => a + p.load, 0);
    if (currentLoad <= targetLoad) return;
    s.type = 'Easy';
    s.zone = 'E';
    s.rpe = 4;
    s.load = s.rpe * s.durationMin;
    s.danielsPoints = calculateDanielsPoints(s.durationMin, 'E');
  }

  // Step 5: flag if still over
  const remaining = week.reduce((a, p) => a + p.load, 0);
  if (remaining / chronicLoad > 1.5) {
    week.forEach(p => {
      p.planLimitationFlag = `ACWR still elevated after all corrections. Consider a full rest day.`;
    });
  }
}

function createSession(
  date: Date,
  type: DayPlan['type'],
  zone: keyof typeof VDOT_COEFFS,
  distanceKm: number,
  vdot: number
): DayPlan {
  const paceSec = getZonePace(vdot, zone);
  let durationMin = Math.round((distanceKm * paceSec) / 60);
  const rpe = type === 'Quality' ? (zone === 'R' ? 9 : zone === 'I' ? 8 : 7) : (type === 'Long' ? 5 : 4);

  // Clamp quality session duration to Daniels spec minute ranges
  let reps: number | undefined;
  let restSec: number | undefined;

  if (type === 'Quality' && zone in QUALITY_DURATION_LIMITS) {
    const { min, max } = QUALITY_DURATION_LIMITS[zone as keyof typeof QUALITY_DURATION_LIMITS];
    durationMin = Math.max(min, Math.min(max, durationMin));
    // Recalculate distance from clamped duration
    distanceKm = Math.round((durationMin * 60 / paceSec) * 10) / 10;

    // Generate rep/rest structure for interval sessions
    if (zone === 'I') {
      const repDurMin = 4; // Daniels I reps: ~3–5 min each
      reps = Math.max(1, Math.round(durationMin / repDurMin));
      restSec = repDurMin * 60; // equal work:rest for I pace
    } else if (zone === 'R') {
      const repDurMin = 2;
      reps = Math.max(1, Math.round(durationMin / repDurMin));
      restSec = repDurMin * 90; // R pace: longer rest (90s per rep-minute)
    }
  }

  return {
    date,
    type,
    zone,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMin,
    rpe,
    load: rpe * durationMin,
    danielsPoints: calculateDanielsPoints(durationMin, zone),
    ...(reps !== undefined && { reps }),
    ...(restSec !== undefined && { restSec }),
  };
}

const QUALITY_DURATION_LIMITS: Record<string, { min: number; max: number }> = {
  T: { min: 20, max: 40 },
  I: { min: 12, max: 20 },
  R: { min: 10, max: 20 },
};

function findQualityDay(available: number[], plan: (DayPlan | null)[], raceIdx: number): number {
  return available.find(i =>
    plan[i] === null &&
    (i === 0 || plan[i - 1]?.type !== 'Quality') &&
    (i === 6 || plan[i + 1]?.type !== 'Quality') &&
    (raceIdx === -1 || Math.abs(i - raceIdx) >= 2)
  ) ?? -1;
}

function availableIndicesFromDays(availableDays: number[], startDate: Date): number[] {
  const startDay = startDate.getDay();
  return availableDays.map(day => (day - startDay + 7) % 7).sort((a, b) => a - b);
}

// ─────────────────────────────────────────────────────────────────────────────
// HUDSON ADAPTIVE RUNNING — PLANNING ENGINE
// Based on plan_design_algorithm.md (8-step methodology) and 18 plan templates.
// ─────────────────────────────────────────────────────────────────────────────

export type HudsonRaceDistance = '5K' | '10K' | 'HM' | 'marathon';
export type HudsonPeriodType   = 'Introductory' | 'Fundamental' | 'Sharpening';
export type HudsonPlanLevel    = 1 | 2 | 3;

export interface HudsonPhase {
  type: HudsonPeriodType;
  startWeek: number;
  endWeek: number;
}

export interface HudsonSeason {
  phases: HudsonPhase[];
  totalWeeks: number;
  introWeeks: number;
  fundWeeks: number;
  sharpWeeks: number;
}

/** Maps runner competitiveness level to plan level (Table 3.1 / plan files). */
export function getPlanLevel(level: RunnerLevel): HudsonPlanLevel {
  if (level === 'beginner' || level === 'lowKey') return 1;
  if (level === 'competitive') return 2;
  return 3; // highlyCompetitive | elite
}

/**
 * Canonical period lengths by race distance (Step 4 table).
 * Sharpening is always 4 weeks.
 */
const HUDSON_CANONICAL_PERIODS: Record<HudsonRaceDistance, { intro: number; fund: number; total: number }> = {
  '5K':      { intro: 3, fund: 6,  total: 12 },
  '10K':     { intro: 4, fund: 6,  total: 14 },
  'HM':      { intro: 6, fund: 6,  total: 16 },
  'marathon':{ intro: 6, fund: 10, total: 20 },
};

/** Valid total-week range per distance (Step 2). */
const HUDSON_PLAN_RANGE: Record<HudsonRaceDistance, { min: number; max: number }> = {
  '5K':      { min: 12, max: 16 },
  '10K':     { min: 14, max: 18 },
  'HM':      { min: 16, max: 20 },
  'marathon':{ min: 18, max: 24 },
};

/**
 * Peak weekly km bands by runner level and race distance (Table 3.1, miles × 1.609 → km).
 * Level 1 plans = beginner/lowKey, Level 2 = competitive, Level 3 = highlyCompetitive/elite.
 */
export const HUDSON_VOLUME_BANDS: Record<RunnerLevel, Record<HudsonRaceDistance, { min: number; max: number }>> = {
  beginner: {
    '5K':       { min: 32,  max: 48  },
    '10K':      { min: 40,  max: 56  },
    'HM':       { min: 56,  max: 64  },
    'marathon': { min: 64,  max: 80  },
  },
  lowKey: {
    '5K':       { min: 40,  max: 56  },
    '10K':      { min: 48,  max: 64  },
    'HM':       { min: 56,  max: 72  },
    'marathon': { min: 80,  max: 97  },
  },
  competitive: {
    '5K':       { min: 64,  max: 80  },
    '10K':      { min: 72,  max: 89  },
    'HM':       { min: 80,  max: 97  },
    'marathon': { min: 97,  max: 113 },
  },
  highlyCompetitive: {
    '5K':       { min: 80,  max: 97  },
    '10K':      { min: 97,  max: 113 },
    'HM':       { min: 113, max: 129 },
    'marathon': { min: 129, max: 145 },
  },
  elite: {
    '5K':       { min: 145, max: 177 },
    '10K':      { min: 153, max: 185 },
    'HM':       { min: 161, max: 193 },
    'marathon': { min: 177, max: 209 },
  },
};

/**
 * Tune-up race schedule by plan distance and total plan weeks (Step 6 table).
 * Tune-up races appear on Saturday of the specified week numbers.
 */
export const TUNE_UP_RACE_SCHEDULE: Record<HudsonRaceDistance, Array<{ week: number; distance: string }>> = {
  '5K':      [{ week: 9,  distance: '5K' }],
  '10K':     [{ week: 8,  distance: '5K' }, { week: 11, distance: '10K' }],
  'HM':      [{ week: 8,  distance: '5K' }, { week: 12, distance: '10K' }],
  'marathon':[{ week: 8,  distance: '5K' }, { week: 12, distance: '10K' }, { week: 16, distance: 'HM' }],
};

/** Returns tune-up race info for this week, or undefined if not a tune-up week. */
export function getTuneUpRace(raceDistance: HudsonRaceDistance, weekNumber: number): { distance: string } | undefined {
  return TUNE_UP_RACE_SCHEDULE[raceDistance].find(t => t.week === weekNumber);
}

/**
 * Derive running frequency from peak weekly km (Step 3 table, miles → km converted).
 * Masters athletes are capped at 5 runs/week with a hard minimum of 3.
 */
export function getRunsPerWeek(weeklyKm: number, isMasters = false): number {
  if (isMasters) {
    if (weeklyKm >= 48) return 5;
    if (weeklyKm >= 32) return 4;
    return 3;
  }
  if (weeklyKm >= 129) return 12; // Elite: doubles template — all 7 days
  if (weeklyKm >= 97)  return 10; // Highly competitive: doubles template — all 7 days
  if (weeklyKm >= 72)  return 7;
  if (weeklyKm >= 48)  return 6;
  return 5;
}

/**
 * Returns canonical running day-of-week indices (0=Sun…6=Sat) for each Step 3 template.
 *   5-run: Sun/Mon/Tue/Wed/Fri  (Thu, Sat = off/xtrain)
 *   6-run: Sun/Mon/Tue/Wed/Thu/Fri  (Sat = off/xtrain)
 *   7-run: all 7 days
 *   10/12-run: all 7 days (doubles not modeled — volume distributed across single sessions)
 * Masters-specific:
 *   3-run: Sun/Tue/Thu  (Long / Hard1 / Hard2 only)
 *   4-run: Sun/Mon/Tue/Thu  (Long / Hills / Hard1 / Hard2)
 */
export function getTemplateRunDays(runsPerWeek: number): number[] {
  if (runsPerWeek >= 7)  return [0, 1, 2, 3, 4, 5, 6];
  if (runsPerWeek === 6) return [0, 1, 2, 3, 4, 5];   // Sun–Fri
  if (runsPerWeek === 4) return [0, 1, 2, 4];          // Sun/Mon/Tue/Thu
  if (runsPerWeek === 3) return [0, 2, 4];              // Sun/Tue/Thu
  return [0, 1, 2, 3, 5]; // 5-run: Sun/Mon/Tue/Wed/Fri
}

/**
 * Peak specific-endurance workout descriptions by race distance and plan level.
 * Used in the final sharpening weeks (Table 5.1 in source).
 */
const PEAK_SE_WORKOUTS: Record<HudsonRaceDistance, Record<HudsonPlanLevel, string>> = {
  '5K': {
    1: '1.5km easy + 5×1K @ 5K pace w/ 2-min jog recoveries + 1km easy',
    2: '1.5km easy + 5×1K @ 5K pace w/ 90-sec jog recoveries + 1km easy',
    3: '1.5km easy + 5×1K @ 5K pace w/ 1-min jog recoveries + 1km easy',
  },
  '10K': {
    1: '1.5km easy + 4×2K @ 10K pace w/ 1-min jog recoveries + 1km easy',
    2: '2km easy + 4×2K @ 10K pace + 1K @ max effort w/ 1-min jog recoveries + 2km easy',
    3: '2km easy + 4×2K @ 10K pace + 1K @ max effort w/ 1-min jog recoveries + 2km easy',
  },
  'HM': {
    1: '2km easy + 6×1.6km @ HM pace w/ 2-min jog recoveries + 2km easy',
    2: '2km easy + 4×3K @ HM pace w/ 90-sec jog recoveries + 2km easy',
    3: '2km easy + 3×5K @ HM pace w/ 90-sec jog recoveries + 2km easy',
  },
  'marathon': {
    1: '20–22 miles easy (long race-endurance run)',
    2: '16km easy + 16km @ marathon pace',
    3: '45 min easy + 20K alternating: 1K @ MP / 1K @ MP+8sec/km',
  },
};

/**
 * Returns the midpoint of the appropriate volume band as the week's km target.
 * Clamped to never exceed +50% of the runner's current weekly km (hard rule §14).
 */
export function getHudsonPeakWeeklyKm(
  level: RunnerLevel,
  distance: HudsonRaceDistance,
  currentWeeklyKm: number,
): number {
  const band = HUDSON_VOLUME_BANDS[level][distance];
  const target = Math.round((band.min + band.max) / 2);
  const hardCap = Math.round(currentWeeklyKm * 1.5);
  return Math.min(target, hardCap);
}

/**
 * Allocate Hudson's three training periods from start date to race date (§5).
 * Sharpening is always exactly 4 weeks.
 * Introductory period is capped at 6 weeks (hard rule §14).
 */
export function hudsonPlanSeason(
  raceDate: Date,
  startDate: Date,
  distance: HudsonRaceDistance,
): HudsonSeason {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const availableWeeks = Math.round((raceDate.getTime() - startDate.getTime()) / msPerWeek);

  const range = HUDSON_PLAN_RANGE[distance];
  const totalWeeks = Math.max(range.min, Math.min(range.max, availableWeeks));

  const sharpWeeks = 4; // always — §5 universal rule
  const buildWeeks = totalWeeks - sharpWeeks;

  const canonical = HUDSON_CANONICAL_PERIODS[distance];
  const introRatio = canonical.intro / (canonical.intro + canonical.fund);
  // Intro is capped at 6 weeks (§14 rule 3)
  const introWeeks = Math.max(1, Math.min(6, Math.round(buildWeeks * introRatio)));
  const fundWeeks  = buildWeeks - introWeeks;

  const phases: HudsonPhase[] = [
    { type: 'Introductory', startWeek: 1,                        endWeek: introWeeks },
    { type: 'Fundamental',  startWeek: introWeeks + 1,            endWeek: introWeeks + fundWeeks },
    { type: 'Sharpening',   startWeek: introWeeks + fundWeeks + 1, endWeek: totalWeeks },
  ];

  return { phases, totalWeeks, introWeeks, fundWeeks, sharpWeeks };
}

/**
 * Resolve which Hudson phase a given week number falls into.
 * Returns undefined if the week is out of bounds.
 */
export function getHudsonPhaseForWeek(season: HudsonSeason, weekNumber: number): HudsonPhase | undefined {
  return season.phases.find(p => weekNumber >= p.startWeek && weekNumber <= p.endWeek);
}

/**
 * Whether a week is a recovery week.
 * Hudson inserts a recovery week every 3–4 weeks (§5, §14 rule 8).
 * Week 1 is never a recovery week.
 */
export function isHudsonRecoveryWeek(weekNumber: number): boolean {
  return weekNumber > 1 && weekNumber % 4 === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// HUDSON PLAN WEEK — weekly templates + workout vocabulary from plan files
// Step 3 templates (5/6/7/10/12 runs/week), Step 5 peak week, Step 7 progressions
// ─────────────────────────────────────────────────────────────────────────────

/** Hill sprint count: starts at 1, adds 1/week, caps at 10. Resets to max after peak. */
function hillSprintCount(weekNumber: number): number {
  return Math.min(10, weekNumber);
}

/** Fartlek surge duration (sec) within a speed_fartlek: 20→60 sec across fundamental. */
function fartlekSurgeSec(weekInPeriod: number, periodLength: number): number {
  const p = (weekInPeriod - 1) / Math.max(1, periodLength - 1);
  return Math.round(20 + p * 40); // 20 sec → 60 sec
}

/** Progression run finish segment (min): grows through the plan. */
function progressionFinishMin(weekInPeriod: number, periodLength: number, periodType: HudsonPeriodType): number {
  const p = (weekInPeriod - 1) / Math.max(1, periodLength - 1);
  if (periodType === 'Introductory') return Math.round(10 + p * 10); // 10→20 min
  return Math.round(15 + p * 15); // 15→30 min
}

/**
 * Generates the human-readable workout description for each slot in the week.
 * Uses workout vocabulary from the 18 plan template files.
 */
function hudsonNotes(
  periodType: HudsonPeriodType,
  role: 'long' | 'hills' | 'hard1' | 'hard2' | 'moderate' | 'easy',
  km: number,
  weekInPeriod: number,
  periodLength: number,
  weekNumber: number,
  raceDistance: HudsonRaceDistance,
  planLevel: HudsonPlanLevel,
  isSharpPeak: boolean, // last 2 weeks of sharpening
  isMasters = false,
): string {
  const k = km.toFixed(1);
  const sprints = hillSprintCount(weekNumber);
  const surgeSec = fartlekSurgeSec(weekInPeriod, periodLength);
  const progMin = progressionFinishMin(weekInPeriod, periodLength, periodType);

  // Progress ratio within the period (0 = first week, 1 = last week)
  const periodProgress = (weekInPeriod - 1) / Math.max(1, periodLength - 1);
  // Which half of the fundamental period are we in?
  const isLaterFundamental = periodType === 'Fundamental' && periodProgress >= 0.5;

  switch (role) {
    case 'long': {
      if (periodType === 'Introductory') {
        return `${k}km easy long run — build aerobic base`;
      }
      if (periodType === 'Fundamental') {
        // Masters: week 1 is easy long run; subsequent weeks are progression runs with moderate uphill finish
        if (isMasters) {
          if (weekInPeriod === 1) {
            return `${k}km easy long run — build aerobic base`;
          }
          return `${k}km progression run — easy, last mile moderate uphill`;
        }
        if (raceDistance === 'marathon') {
          return `${k}km — easy ${Math.round(km * 0.6)}km + last ${Math.round(km * 0.4)}km approaching marathon pace`;
        }
        const fin = progressionFinishMin(weekInPeriod, periodLength, 'Fundamental');
        return `${k}km progression — easy finish w/ last ${fin} min ${raceDistance === 'HM' ? 'moderate' : 'hard'}`;
      }
      // Sharpening
      if (raceDistance === 'marathon') {
        return isSharpPeak
          ? `${k}km — ${Math.round(km * 0.45)}km easy + ${Math.round(km * 0.55)}km @ marathon pace`
          : `${k}km — alternating 1km @ MP / 1km @ MP+8sec/km`;
      }
      if (raceDistance === 'HM') {
        return `${k}km — easy run + last 2km @ HM pace progression`;
      }
      return `${k}km progression run — easy w/ last 20 min hard effort`;
    }

    case 'hills': {
      return `${k}km easy + ${sprints}×8-sec steep hill sprints`;
    }

    case 'hard1': {
      // Introductory period: speed fartlek
      if (periodType === 'Introductory') {
        const reps = 6 + weekInPeriod * 2; // builds from 8 to more
        return `${k}km easy w/ ${Math.min(reps, 15)}×${surgeSec}-sec @ 3K–1500m pace (speed fartlek)`;
      }

      // Fundamental period: fartlek → race-pace fartlek → hill reps (level 1), threshold (level 2/3)
      if (periodType === 'Fundamental') {
        // Masters: speed fartlek @ 10K-3K pace, reps/duration progress per book weeks 1-5+
        if (isMasters) {
          if (weekInPeriod === 1) {
            return `${k}km easy w/ 6×30-sec @ 10K–3K pace (speed fartlek)`;
          }
          if (weekInPeriod <= 3) {
            return `${k}km easy w/ 6×40-sec @ 10K–3K pace (speed fartlek)`;
          }
          return `${k}km easy w/ 8×40-sec @ 10K–3K pace (speed fartlek)`;
        }
        if (planLevel === 1) {
          if (!isLaterFundamental) {
            // Early fundamental L1: race_pace_fartlek
            const mins = Math.round(1 + weekInPeriod);
            return `${k}km easy w/ ${mins}×1 min @ 5K pace / 1 min easy (race-pace fartlek)`;
          }
          // Later fundamental L1: hill repetitions
          const reps = 4 + weekInPeriod;
          return `1.5km easy + ${Math.min(reps, 8)}×300m uphill @ 3K effort w/ jog-back + 1.5km easy`;
        }
        if (!isLaterFundamental) {
          // Early fundamental L2/L3: race_pace_fartlek with longer surges
          const mins = Math.round(1.5 + weekInPeriod * 0.5);
          const reps2 = 8 + weekInPeriod;
          return `2km easy w/ ${Math.min(reps2, 15)}×${Math.min(mins, 2)} min @ 5K pace / 1 min easy (fartlek)`;
        }
        // Later fundamental L2/L3: specific-endurance intervals begin
        if (raceDistance === '5K' || raceDistance === '10K') {
          const reps3 = planLevel === 2 ? 4 + weekInPeriod : 5 + weekInPeriod;
          return `2km easy + ${Math.min(reps3, 8)}×800m @ 5K pace w/ 400m jog recoveries + 1km easy`;
        }
        if (raceDistance === 'HM') {
          return `2km easy + 2×10 min @ HM/10K pace w/ 2-min recovery + 2km easy (threshold)`;
        }
        return `2km easy + 3×10 min @ HM pace w/ 2-min recovery + 2km easy (threshold)`;
      }

      // Sharpening: specific-endurance intervals — peak workout in final weeks
      if (isSharpPeak) {
        return PEAK_SE_WORKOUTS[raceDistance][planLevel];
      }
      // Early sharpening: build toward peak
      if (raceDistance === '5K') {
        return `1.5km easy + ${planLevel >= 2 ? 8 : 6}×400m @ 5K–3K pace w/ 200m jog + 1.5km easy`;
      }
      if (raceDistance === '10K') {
        return `2km easy + ${planLevel >= 2 ? 6 : 4}×1K @ 5K pace w/ 400m jog recoveries + 2km easy`;
      }
      if (raceDistance === 'HM') {
        return `2km easy + ${planLevel >= 2 ? 4 : 3}×2K @ 10K pace w/ 90-sec recoveries + 2km easy`;
      }
      // Marathon sharpening: marathon pace runs
      return `2km easy + 3×10 min @ HM pace w/ 2-min recovery + 2km easy`;
    }

    case 'hard2': {
      // Introductory: progression run (moderate early → hard later)
      if (periodType === 'Introductory') {
        const intensity = periodProgress > 0.6 ? 'hard' : 'moderate';
        return `${k}km progression — easy w/ last ${progMin} min ${intensity}`;
      }

      // Fundamental: threshold run (L2/L3) or progression run (L1)
      if (periodType === 'Fundamental') {
        if (planLevel === 1) {
          return `${k}km progression run — easy w/ last ${progMin} min hard`;
        }
        if (raceDistance === 'marathon' || raceDistance === 'HM') {
          const pace = raceDistance === 'marathon' ? 'marathon/HM pace' : 'HM pace';
          const dur = Math.round(15 + periodProgress * 15);
          return `2km easy + ${dur} min @ ${pace} + 2km easy (threshold)`;
        }
        const dur2 = Math.round(15 + periodProgress * 15);
        return `2km easy + 2×${Math.round(dur2 / 2)} min @ HM/10K pace w/ 1-min recovery + 2km easy`;
      }

      // Sharpening Hard#2: threshold run
      if (raceDistance === 'marathon') {
        return `2km easy + 3×10 min @ HM pace w/ 2-min recovery + 2km easy`;
      }
      if (raceDistance === 'HM') {
        return `2km easy + 4×3K @ HM pace w/ 90-sec recoveries + 2km easy (threshold)`;
      }
      return `2km easy + 20 min @ HM/10K pace + 2km easy (threshold)`;
    }

    case 'moderate':
      if (raceDistance === 'marathon' || raceDistance === 'HM') {
        return `${k}km moderate — marathon aerobic support run`;
      }
      return `${k}km moderate progression — add a small hard effort at the finish`;

    case 'easy':
      return `${k}km easy`;
  }
}

function hudsonCreateSession(
  date: Date,
  type: DayPlan['type'],
  zone: keyof typeof VDOT_COEFFS,
  distanceKm: number,
  vdot: number,
  hudsonWorkoutType: string,
  notes?: string,
): DayPlan {
  const paceSec = getZonePace(vdot, zone);
  const distRounded = Math.round(distanceKm * 10) / 10;
  const durationMin = Math.round((distRounded * paceSec) / 60);
  const rpe = type === 'Race' ? 10
    : type === 'Quality' ? (zone === 'I' ? 8 : 7)
    : type === 'Long'    ? 5
    : 4;
  return {
    date,
    type,
    zone,
    distanceKm: distRounded,
    durationMin,
    rpe,
    load: rpe * durationMin,
    danielsPoints: calculateDanielsPoints(durationMin, zone),
    hudsonWorkoutType,
    notes,
  };
}

/**
 * Compute this week's target km following Hudson ramp rules (§4, §14).
 * - Introductory: start at 65% of peak, ramp max 10%/week
 * - Fundamental: ramp max 10%/week toward peak
 * - Sharpening: peak for first half, 75% for taper
 * - Recovery week: −20%
 * ACWR clamp applied on top.
 */
export function hudsonWeeklyKm(
  level: RunnerLevel,
  raceDistance: HudsonRaceDistance,
  previousWeeklyKm: number,
  periodType: HudsonPeriodType,
  weekInPeriod: number,
  periodLength: number,
  weekNumber: number,
  currentAcwr: number,
): number {
  const peak = getHudsonPeakWeeklyKm(level, raceDistance, previousWeeklyKm);

  let target: number;
  if (isHudsonRecoveryWeek(weekNumber)) {
    target = Math.round(previousWeeklyKm * 0.80);
  } else if (periodType === 'Introductory') {
    const introTarget = Math.round(peak * 0.65);
    target = Math.min(introTarget, Math.round(previousWeeklyKm * 1.10));
  } else if (periodType === 'Fundamental') {
    target = Math.min(peak, Math.round(previousWeeklyKm * 1.10));
  } else {
    // Sharpening: peak for first half, taper second half
    const sharpProgress = weekInPeriod / periodLength;
    target = sharpProgress > 0.5 ? Math.round(peak * 0.75) : peak;
  }

  // ACWR guard (§14 rule 1 — never spike load dangerously)
  if (currentAcwr > 1.5) target = Math.round(target * 0.85);
  else if (currentAcwr > 1.3) target = Math.round(target * 0.95);

  return Math.max(target, 10); // floor at 10km/week
}

/**
 * Hudson weekly template planner.
 *
 * Implements the Step 3 weekly structure templates (5/6/7 runs/week) and
 * Step 5 peak week from plan_design_algorithm.md, with workout progressions
 * derived from the 18 plan template files.
 *
 * Slots (Sun-anchored):
 *   Sun → Long run / progression long
 *   Mon → Easy + hill sprints
 *   Tue → Hard #1 (fartlek → SE intervals → threshold per phase)
 *   Wed → Moderate run (Fundamental/Sharpening only)
 *   Fri → Hard #2 (progression → threshold per phase)
 *   Thu, Sat → Easy fill or Rest
 *
 * Hard rules: no consecutive quality days, ≥2 days gap between Hard#1 & Hard#2.
 */
export function hudsonPlanWeek(
  startDate: Date,
  phase: HudsonPhase,
  weekNumber: number,
  weekInPeriod: number,
  periodLength: number,
  weeklyTargetKm: number,
  vdot: number,
  availableDays: number[],    // day-of-week indices (0=Sun…6=Sat)
  chronicLoad: number,
  aRaceDate?: Date,
  aRaceDistance?: number,
  raceDistance: HudsonRaceDistance = '10K',
  weeklyPointsTarget?: number,
  legMuscularRisk = 0,
  totalBodyFatigue = 0,
  readinessScore = 100,
  runnerLevel: RunnerLevel = 'competitive',
  isMasters = false,
): DayPlan[] {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysToRace = aRaceDate
    ? Math.ceil((aRaceDate.getTime() - startDate.getTime()) / msPerDay)
    : 999;
  const isRaceWeek = daysToRace >= 0 && daysToRace <= 7;
  const isRecovery = isHudsonRecoveryWeek(weekNumber);
  const planLevel = getPlanLevel(runnerLevel);

  // Peak sharpening = last 2 weeks before taper; use peak SE workout descriptions
  const isSharpPeak = phase.type === 'Sharpening' && weekInPeriod >= periodLength - 1;

  let targetKm = weeklyTargetKm;
  if (isRecovery) targetKm *= 0.80;

  // Masters 3-run plans have exactly 3 run days (Sun/Tue/Thu) — no easy fillers.
  // Volume must be distributed across all three rather than the standard 5-run percentages.
  const is3RunMasters = isMasters && getRunsPerWeek(targetKm, true) === 3;

  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  const plan: (DayPlan | null)[] = new Array(7).fill(null);
  const availIdx = availableIndicesFromDays(availableDays, startDate);
  const availSet = new Set(availIdx);

  // Convert absolute day-of-week → offset from startDate.getDay()
  const dow = (d: number) => (d - startDate.getDay() + 7) % 7;
  const sunOff = dow(0);
  const monOff = dow(1);
  const tueOff = dow(2);
  const wedOff = dow(3);
  const satOff = dow(6);
  const friOff = dow(5);

  const qualityAllowed = !isRecovery &&
    canPlaceQualitySession(legMuscularRisk, totalBodyFatigue, readinessScore);

  // Volume allocations (Step 3 / Step 5)
  // Masters 3-run: Long ≈36%, Hard ≈32%, Hills = remainder — sums to 100% across 3 runs.
  // Standard 5-run: Long=28%, Hard=12%, Mod=12%, Hills=10% — remaining fills easy days.
  const longKm  = Math.round(targetKm * (is3RunMasters ? 0.36 : 0.28) * 10) / 10;
  const hardKm  = Math.round(targetKm * (is3RunMasters ? 0.32 : 0.12) * 10) / 10;
  const modKm   = Math.round(targetKm * 0.12 * 10) / 10;
  const hillsKm = is3RunMasters
    ? Math.max(0, Math.round((targetKm - longKm - hardKm) * 10) / 10)
    : Math.round(targetKm * 0.10 * 10) / 10;

  // Helper: find first available slot not already used
  const firstFree = (preferred: number, fallback?: number[]) => {
    if (availSet.has(preferred) && plan[preferred] === null) return preferred;
    const candidates = fallback ?? availIdx;
    return candidates.find(i => plan[i] === null) ?? -1;
  };

  // ── Place A-race ──
  if (aRaceDate) {
    const raceOff = days.findIndex(d => d.toDateString() === aRaceDate.toDateString());
    if (raceOff !== -1) {
      plan[raceOff] = hudsonCreateSession(days[raceOff], 'Race', 'I', aRaceDistance || 10, vdot, 'race', 'Goal Race');
      plan[raceOff]!.rpe = 10;
    }
  }

  // ── Tune-up race (Step 6) — placed on Saturday of designated weeks ──
  const tuneUp = !isRaceWeek ? getTuneUpRace(raceDistance, weekNumber) : undefined;
  if (tuneUp && availSet.has(satOff) && plan[satOff] === null) {
    const tuneKm = tuneUp.distance === '5K' ? 5 : tuneUp.distance === '10K' ? 10 : 21.1;
    plan[satOff] = hudsonCreateSession(
      days[satOff], 'Race', 'I', tuneKm, vdot, 'tuneUpRace',
      `${tuneUp.distance} tune-up race — mid-cycle fitness check, not the goal race`,
    );
    plan[satOff]!.rpe = 9;
  }

  // ── Long run (Sunday preferred) ──
  const longSlot = firstFree(sunOff);
  if (longSlot !== -1) {
    const zone: keyof typeof VDOT_COEFFS = phase.type === 'Sharpening' && !isRaceWeek ? 'T' : 'E';
    plan[longSlot] = hudsonCreateSession(
      days[longSlot], 'Long', zone, longKm, vdot, 'long',
      hudsonNotes(phase.type, 'long', longKm, weekInPeriod, periodLength, weekNumber, raceDistance, planLevel, isSharpPeak, isMasters),
    );
  }

  // ── Easy + Hill sprints (Monday preferred) — Step 8 hill sprint progression ──
  const hillSlot = firstFree(monOff, availIdx.filter(i => i !== longSlot));
  if (hillSlot !== -1 && plan[hillSlot] === null) {
    plan[hillSlot] = hudsonCreateSession(
      days[hillSlot], 'Easy', 'E', hillsKm, vdot, 'hillSprint',
      hudsonNotes(phase.type, 'hills', hillsKm, weekInPeriod, periodLength, weekNumber, raceDistance, planLevel, isSharpPeak, isMasters),
    );
  }

  // ── Hard #1 (Tuesday preferred) ──
  if (qualityAllowed) {
    const hard1Preferred = availSet.has(tueOff) && plan[tueOff] === null ? tueOff : -1;
    const hard1Slot = hard1Preferred !== -1 ? hard1Preferred
      : availIdx.find(i =>
          plan[i] === null &&
          (longSlot === -1 || Math.abs(i - longSlot) >= 1) &&
          (hillSlot === -1 || i !== hillSlot + 1)
        ) ?? -1;

    if (hard1Slot !== -1) {
      // Zone: fartlek uses 'I' (speed), SE intervals use 'I', threshold uses 'T'
      const zone: keyof typeof VDOT_COEFFS = phase.type === 'Fundamental' && planLevel >= 2 ? 'T' : 'I';
      // Workout type for display title
      const periodProgress = (weekInPeriod - 1) / Math.max(1, periodLength - 1);
      let hwt: string;
      if (phase.type === 'Introductory') {
        hwt = 'fartlek';
      } else if (phase.type === 'Fundamental') {
        hwt = periodProgress >= 0.5 && planLevel === 1 ? 'hillReps'
          : periodProgress >= 0.5 ? 'specEndIntervals'
          : 'fartlek';
      } else {
        hwt = 'specEndIntervals';
      }

      plan[hard1Slot] = hudsonCreateSession(
        days[hard1Slot], 'Quality', zone, hardKm, vdot, hwt,
        hudsonNotes(phase.type, 'hard1', hardKm, weekInPeriod, periodLength, weekNumber, raceDistance, planLevel, isSharpPeak, isMasters),
      );

      // ── Hard #2 (Friday preferred) — must be ≥2 days from Hard #1 ──
      const hard2Preferred = availSet.has(friOff) && plan[friOff] === null ? friOff : -1;
      const hard2Slot = hard2Preferred !== -1 ? hard2Preferred
        : availIdx.find(i =>
            plan[i] === null &&
            Math.abs(i - hard1Slot) >= 2
          ) ?? -1;

      if (hard2Slot !== -1) {
        const hwt2 = phase.type === 'Introductory' || (phase.type === 'Fundamental' && planLevel === 1)
          ? 'progression'
          : 'threshold';
        plan[hard2Slot] = hudsonCreateSession(
          days[hard2Slot], 'Quality', 'T', hardKm, vdot, hwt2,
          hudsonNotes(phase.type, 'hard2', hardKm, weekInPeriod, periodLength, weekNumber, raceDistance, planLevel, isSharpPeak, isMasters),
        );
      }
    }
  }

  // ── Moderate run (Wednesday, Fundamental/Sharpening only — Step 3) ──
  if (!isRecovery && !isRaceWeek && phase.type !== 'Introductory') {
    if (availSet.has(wedOff) && plan[wedOff] === null) {
      plan[wedOff] = hudsonCreateSession(
        days[wedOff], 'Easy', 'E', modKm, vdot, 'progression',
        hudsonNotes(phase.type, 'moderate', modKm, weekInPeriod, periodLength, weekNumber, raceDistance, planLevel, isSharpPeak, isMasters),
      );
    }
  }

  // ── Fill remaining available days with Easy runs ──
  // Masters plans have no easy-filler days — empty slots stay as rest/X-train.
  // This prevents the weekly km remainder from dumping into a single slot as a
  // giant easy run when a quality session is skipped due to fatigue/readiness.
  const usedKm = plan.reduce((acc, p) => acc + (p?.distanceKm || 0), 0);
  const remainKm = Math.max(0, targetKm - usedKm);
  const emptySlots = isMasters ? [] : availIdx.filter(i => plan[i] === null);
  if (emptySlots.length > 0) {
    const eachKm = Math.round((remainKm / emptySlots.length) * 10) / 10;
    for (const i of emptySlots) {
      plan[i] = hudsonCreateSession(
        days[i], 'Easy', 'E', eachKm, vdot, 'easy',
        hudsonNotes(phase.type, 'easy', eachKm, weekInPeriod, periodLength, weekNumber, raceDistance, planLevel, isSharpPeak, isMasters),
      );
    }
  }

  // ── Rest/XTrain for unavailable days ──
  // Masters: template-designated off-days become cross-training (not full rest)
  const templateRunDays = getTemplateRunDays(getRunsPerWeek(targetKm, isMasters));
  const templateOffsetSet = new Set(templateRunDays.map(d => (d - startDate.getDay() + 7) % 7));

  const finalWeek: DayPlan[] = plan.map((p, i) => {
    if (p) return p;
    const isXTrainDay = isMasters && templateOffsetSet.has(i);
    return {
      date: days[i],
      type: 'Rest' as const,
      durationMin: 0,
      distanceKm: 0,
      rpe: 0,
      load: 0,
      danielsPoints: 0,
      hudsonWorkoutType: isXTrainDay ? 'xTrain' : 'rest',
      notes: isXTrainDay ? 'Cross-training (swim / bike / strength)' : 'Rest or cross-training',
    };
  });

  // ACWR correction (same priority ladder as Daniels planner)
  if (chronicLoad > 0) {
    const totalLoad = finalWeek.reduce((a, p) => a + p.load, 0);
    if (totalLoad / chronicLoad > 1.5) {
      applyLayeredAcwrCorrection(finalWeek, chronicLoad);
    }
  }

  // Plan limitation flag
  const totalPoints = finalWeek.reduce((a, p) => a + p.danielsPoints, 0);
  if (weeklyPointsTarget && totalPoints < weeklyPointsTarget * 0.9) {
    const flag = !qualityAllowed
      ? `Quality skipped — fatigue/readiness gate. Consider recovery.`
      : `Target ${weeklyPointsTarget}pts unreachable with ${availIdx.length} days.`;
    finalWeek.forEach(p => { p.planLimitationFlag = flag; });
  }

  return finalWeek;
}
