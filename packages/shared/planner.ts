
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
// §4 Volume bands, §5 Period structure, §7 Plan levels
// ─────────────────────────────────────────────────────────────────────────────

export type HudsonRaceDistance = '5K' | '10K' | 'HM' | 'marathon';
export type HudsonPeriodType   = 'Introductory' | 'Fundamental' | 'Sharpening';

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

/**
 * Canonical period lengths by race distance (§5 table).
 * Sharpening is always 4 weeks; never longer (hard rule §14).
 */
const HUDSON_CANONICAL_PERIODS: Record<HudsonRaceDistance, { intro: number; fund: number; total: number }> = {
  '5K':      { intro: 3, fund: 6,  total: 12 },
  '10K':     { intro: 4, fund: 6,  total: 14 },
  'HM':      { intro: 6, fund: 6,  total: 16 },
  'marathon':{ intro: 6, fund: 10, total: 20 },
};

/** Valid total-week range per distance (§5). */
const HUDSON_PLAN_RANGE: Record<HudsonRaceDistance, { min: number; max: number }> = {
  '5K':      { min: 12, max: 16 },
  '10K':     { min: 14, max: 18 },
  'HM':      { min: 16, max: 20 },
  'marathon':{ min: 18, max: 24 },
};

/**
 * Peak weekly km bands by runner level and race distance (§4 table, rounded).
 * Use the midpoint of each band as the planning target.
 */
export const HUDSON_VOLUME_BANDS: Record<RunnerLevel, Record<HudsonRaceDistance, { min: number; max: number }>> = {
  beginner: {
    '5K': { min: 30, max: 50 }, '10K': { min: 40, max: 55 },
    'HM': { min: 55, max: 65 }, 'marathon': { min: 65, max: 80 },
  },
  lowKey: {
    '5K': { min: 40, max: 55 }, '10K': { min: 50, max: 65 },
    'HM': { min: 55, max: 70 }, 'marathon': { min: 80, max: 95 },
  },
  competitive: {
    '5K': { min: 65, max: 80 }, '10K': { min: 70, max: 90 },
    'HM': { min: 80, max: 95 }, 'marathon': { min: 95, max: 115 },
  },
  highlyCompetitive: {
    '5K': { min: 80, max: 95 }, '10K': { min: 95, max: 115 },
    'HM': { min: 110, max: 130 }, 'marathon': { min: 130, max: 145 },
  },
  elite: {
    '5K': { min: 145, max: 175 }, '10K': { min: 150, max: 185 },
    'HM': { min: 160, max: 195 }, 'marathon': { min: 175, max: 210 },
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
// HUDSON PLAN WEEK — §6 weekly templates + §5 period workout vocabulary
// ─────────────────────────────────────────────────────────────────────────────

/** Hill sprint count progresses linearly: 2 in week 1, +2/week, capped at 10. */
function hillSprintCount(weekNumber: number): number {
  return Math.min(10, 2 + (weekNumber - 1) * 2);
}

/** Fartlek hard-segment duration in seconds: 20→40 sec across intro period. */
function fartlekSegmentSec(weekInPeriod: number): number {
  return Math.min(40, 20 + (weekInPeriod - 1) * 5);
}

/** Progression run finish length: 10–20 min (intro) or 20–30 min (fundamental). */
function progressionFinishMin(weekInPeriod: number, periodLength: number, periodType: HudsonPeriodType): number {
  const p = (weekInPeriod - 1) / Math.max(1, periodLength - 1);
  return periodType === 'Introductory' ? Math.round(10 + p * 10) : Math.round(20 + p * 10);
}

function hudsonNotes(
  periodType: HudsonPeriodType,
  role: 'long' | 'hills' | 'hard1' | 'hard2' | 'moderate' | 'easy',
  km: number,
  weekInPeriod: number,
  periodLength: number,
  weekNumber: number,
  raceDistance: HudsonRaceDistance,
  isAltWeek: boolean,
): string {
  const k = km.toFixed(1);
  switch (role) {
    case 'long':
      if (periodType === 'Introductory') return `${k}km easy long run`;
      if (periodType === 'Fundamental') {
        const fin = progressionFinishMin(weekInPeriod, periodLength, 'Fundamental');
        return `${k}km, last ${fin} min @ marathon pace`;
      }
      return `${k}km race-specific long — last 20 min threshold effort`;

    case 'hills': {
      const count = hillSprintCount(weekNumber);
      return `${k}km easy + ${count}×8-sec hill sprints`;
    }

    case 'hard1':
      if (periodType === 'Introductory') {
        const sec = fartlekSegmentSec(weekInPeriod);
        return `${k}km easy w/ 8×${sec}-sec @ 3K–1500m pace (fartlek)`;
      }
      if (periodType === 'Fundamental') {
        return isAltWeek
          ? `1.5km easy + 6×300m uphill @ 3K effort + 1.5km easy (hill reps)`
          : `${k}km threshold @ 10K pace`;
      }
      // Sharpening — specific-endurance per race distance (§8)
      if (raceDistance === '5K')  return `1.5km easy + 5×1km @ 5K pace w/400m jog + 1.5km easy`;
      if (raceDistance === '10K') return `1.5km easy + 4×2km @ 10K pace w/3-min recovery + 1km easy`;
      if (raceDistance === 'HM')  return `1.5km easy + 2×15min @ HM pace w/3-min active recovery + 1.5km easy`;
      return `1.5km easy + 20min @ M pace + 20min @ M+12sec/km + 1.5km easy`;

    case 'hard2':
      if (periodType === 'Introductory') {
        const fin = progressionFinishMin(weekInPeriod, periodLength, 'Introductory');
        return `${k}km progression, last ${fin} min moderate`;
      }
      if (periodType === 'Fundamental') {
        return isAltWeek
          ? `${k}km threshold @ HM pace`
          : `${k}km progression, last 20 min hard`;
      }
      return `${k}km race-pace threshold`;

    case 'moderate':
      return `${k}km moderate progression run`;
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
 * Hudson §6 weekly template planner.
 *
 * Template slots (Sun-anchored, §6):
 *   Sun → Long run
 *   Mon → Easy + hill sprints
 *   Tue → Hard #1 (fartlek / threshold / spec-end intervals)
 *   Wed → Moderate / progression (Fundamental+ only)
 *   Fri → Hard #2 (progression / threshold)
 *   Thu, Sat → Easy fill or Rest if not in availableDays
 *
 * Hard rules enforced: §14 rules 6, 7, 9.
 */
export function hudsonPlanWeek(
  startDate: Date,
  phase: HudsonPhase,
  weekNumber: number,
  weekInPeriod: number,
  periodLength: number,
  weeklyTargetKm: number,
  vdot: number,
  availableDays: number[],    // day-of-week indices (0=Sun…6=Sat) the runner can run
  chronicLoad: number,
  aRaceDate?: Date,
  aRaceDistance?: number,
  raceDistance: HudsonRaceDistance = '10K',
  weeklyPointsTarget?: number,
  legMuscularRisk = 0,
  totalBodyFatigue = 0,
  readinessScore = 100,
): DayPlan[] {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysToRace = aRaceDate
    ? Math.ceil((aRaceDate.getTime() - startDate.getTime()) / msPerDay)
    : 999;
  const isRaceWeek = daysToRace >= 0 && daysToRace <= 7;
  const isRecovery = isHudsonRecoveryWeek(weekNumber);
  const isAltWeek = weekNumber % 2 === 0;

  let targetKm = weeklyTargetKm;
  if (isRecovery) targetKm *= 0.80;

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
  const friOff = dow(5);

  const qualityAllowed = !isRecovery &&
    canPlaceQualitySession(legMuscularRisk, totalBodyFatigue, readinessScore);

  // Volume allocations
  const longKm  = Math.round(targetKm * 0.28 * 10) / 10;
  const hardKm  = Math.round(targetKm * 0.12 * 10) / 10;
  const modKm   = Math.round(targetKm * 0.12 * 10) / 10;
  const hillsKm = Math.round(targetKm * 0.10 * 10) / 10;

  // Helper: find first available slot not already used
  const firstFree = (preferred: number, fallback?: number[]) => {
    if (availSet.has(preferred) && plan[preferred] === null) return preferred;
    const candidates = fallback ?? availIdx;
    return candidates.find(i => plan[i] === null) ?? -1;
  };

  // ── Place Race ──
  if (aRaceDate) {
    const raceOff = days.findIndex(d => d.toDateString() === aRaceDate.toDateString());
    if (raceOff !== -1) {
      plan[raceOff] = hudsonCreateSession(days[raceOff], 'Race', 'I', aRaceDistance || 10, vdot, 'race', 'Race day');
      plan[raceOff]!.rpe = 10;
    }
  }

  // ── Long run (Sunday preferred) ──
  const longSlot = firstFree(sunOff);
  if (longSlot !== -1) {
    const zone: keyof typeof VDOT_COEFFS = phase.type === 'Sharpening' && !isRaceWeek ? 'T' : 'E';
    plan[longSlot] = hudsonCreateSession(
      days[longSlot], 'Long', zone, longKm, vdot, 'long',
      hudsonNotes(phase.type, 'long', longKm, weekInPeriod, periodLength, weekNumber, raceDistance, isAltWeek),
    );
  }

  // ── Easy + Hill sprints (Monday preferred) ──
  const hillSlot = firstFree(monOff, availIdx.filter(i => i !== longSlot));
  if (hillSlot !== -1 && plan[hillSlot] === null) {
    plan[hillSlot] = hudsonCreateSession(
      days[hillSlot], 'Easy', 'E', hillsKm, vdot, 'hillSprint',
      hudsonNotes(phase.type, 'hills', hillsKm, weekInPeriod, periodLength, weekNumber, raceDistance, isAltWeek),
    );
  }

  // ── Hard #1 (Tuesday preferred) — §14 rule 7: never consecutive ──
  if (qualityAllowed) {
    const hard1Preferred = availSet.has(tueOff) && plan[tueOff] === null ? tueOff : -1;
    const hard1Slot = hard1Preferred !== -1 ? hard1Preferred
      : availIdx.find(i =>
          plan[i] === null &&
          (longSlot === -1 || Math.abs(i - longSlot) >= 1) &&
          (hillSlot === -1 || i !== hillSlot + 1)
        ) ?? -1;

    if (hard1Slot !== -1) {
      let zone: keyof typeof VDOT_COEFFS = phase.type === 'Introductory' ? 'I' : 'T';
      if (phase.type === 'Sharpening') zone = 'I';
      const hwt = phase.type === 'Introductory' ? 'fartlek'
        : phase.type === 'Fundamental' ? (isAltWeek ? 'hillReps' : 'threshold')
        : 'specEndIntervals';

      plan[hard1Slot] = hudsonCreateSession(
        days[hard1Slot], 'Quality', zone, hardKm, vdot, hwt,
        hudsonNotes(phase.type, 'hard1', hardKm, weekInPeriod, periodLength, weekNumber, raceDistance, isAltWeek),
      );

      // ── Hard #2 (Friday preferred) — must be ≥2 days from Hard #1 ──
      const hard2Preferred = availSet.has(friOff) && plan[friOff] === null ? friOff : -1;
      const hard2Slot = hard2Preferred !== -1 ? hard2Preferred
        : availIdx.find(i =>
            plan[i] === null &&
            Math.abs(i - hard1Slot) >= 2
          ) ?? -1;

      if (hard2Slot !== -1) {
        const hwt2 = phase.type === 'Introductory' ? 'progression'
          : phase.type === 'Fundamental' ? (isAltWeek ? 'threshold' : 'progression')
          : 'threshold';
        plan[hard2Slot] = hudsonCreateSession(
          days[hard2Slot], 'Quality', 'T', hardKm, vdot, hwt2,
          hudsonNotes(phase.type, 'hard2', hardKm, weekInPeriod, periodLength, weekNumber, raceDistance, isAltWeek),
        );
      }
    }
  }

  // ── Moderate / progression run (Wednesday, Fundamental+ only) ──
  if (!isRecovery && !isRaceWeek && phase.type !== 'Introductory') {
    if (availSet.has(wedOff) && plan[wedOff] === null) {
      plan[wedOff] = hudsonCreateSession(
        days[wedOff], 'Easy', 'E', modKm, vdot, 'progression',
        hudsonNotes(phase.type, 'moderate', modKm, weekInPeriod, periodLength, weekNumber, raceDistance, isAltWeek),
      );
    }
  }

  // ── Fill remaining available days with Easy runs ──
  const usedKm = plan.reduce((acc, p) => acc + (p?.distanceKm || 0), 0);
  const remainKm = Math.max(0, targetKm - usedKm);
  const emptySlots = availIdx.filter(i => plan[i] === null);
  if (emptySlots.length > 0) {
    const eachKm = Math.round((remainKm / emptySlots.length) * 10) / 10;
    for (const i of emptySlots) {
      plan[i] = hudsonCreateSession(
        days[i], 'Easy', 'E', eachKm, vdot, 'easy',
        hudsonNotes(phase.type, 'easy', eachKm, weekInPeriod, periodLength, weekNumber, raceDistance, isAltWeek),
      );
    }
  }

  // ── Rest/XTrain for unavailable days ──
  const finalWeek: DayPlan[] = plan.map((p, i) => p || {
    date: days[i],
    type: 'Rest' as const,
    durationMin: 0,
    distanceKm: 0,
    rpe: 0,
    load: 0,
    danielsPoints: 0,
    hudsonWorkoutType: 'rest',
    notes: 'Rest or cross-training (§9)',
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
