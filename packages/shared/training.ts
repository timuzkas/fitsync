
/**
 * DANIELS VDOT & FOSTER RPE LOAD ALGORITHMS
 * Source: Daniels' Running Formula & Foster RPE-based load model.
 */

// ─────────────────────────────────────────────────────────────────────────────
// VDOT TABLE (Jack Daniels published values)
// pace values in sec/km for each training zone
// ─────────────────────────────────────────────────────────────────────────────

const VDOT_TABLE: Array<{ vdot: number; E: number; M: number; T: number; I: number; R: number }> = [
  { vdot: 30, E: 462, M: 397, T: 374, I: 336, R: 316 },
  { vdot: 32, E: 441, M: 379, T: 357, I: 320, R: 301 },
  { vdot: 34, E: 422, M: 362, T: 341, I: 306, R: 287 },
  { vdot: 36, E: 405, M: 347, T: 327, I: 293, R: 275 },
  { vdot: 38, E: 390, M: 333, T: 314, I: 282, R: 264 },
  { vdot: 40, E: 375, M: 321, T: 302, I: 271, R: 254 },
  { vdot: 42, E: 362, M: 310, T: 291, I: 261, R: 245 },
  { vdot: 44, E: 350, M: 299, T: 282, I: 252, R: 236 },
  { vdot: 46, E: 339, M: 289, T: 272, I: 244, R: 228 },
  { vdot: 48, E: 328, M: 280, T: 263, I: 236, R: 221 },
  { vdot: 50, E: 319, M: 272, T: 255, I: 229, R: 214 },
  { vdot: 52, E: 310, M: 264, T: 248, I: 222, R: 208 },
  { vdot: 54, E: 301, M: 257, T: 241, I: 216, R: 202 },
  { vdot: 56, E: 293, M: 250, T: 235, I: 210, R: 196 },
  { vdot: 58, E: 286, M: 243, T: 229, I: 204, R: 191 },
  { vdot: 60, E: 279, M: 237, T: 223, I: 199, R: 186 },
  { vdot: 62, E: 272, M: 232, T: 218, I: 194, R: 182 },
  { vdot: 64, E: 266, M: 226, T: 213, I: 190, R: 178 },
  { vdot: 66, E: 260, M: 221, T: 208, I: 186, R: 174 },
  { vdot: 68, E: 255, M: 217, T: 204, I: 182, R: 170 },
  { vdot: 70, E: 250, M: 212, T: 200, I: 178, R: 166 },
  { vdot: 72, E: 245, M: 208, T: 196, I: 174, R: 163 },
  { vdot: 74, E: 240, M: 204, T: 192, I: 171, R: 160 },
  { vdot: 76, E: 236, M: 200, T: 188, I: 168, R: 157 },
  { vdot: 78, E: 231, M: 197, T: 185, I: 165, R: 154 },
  { vdot: 80, E: 227, M: 193, T: 182, I: 162, R: 151 },
  { vdot: 85, E: 218, M: 185, T: 174, I: 155, R: 145 },
];

export const VDOT_COEFFS = {
  E: 0.665,
  M: 0.795,
  T: 0.855,
  I: 0.975,
  R: 1.125,
};

// ─────────────────────────────────────────────────────────────────────────────
// VDOT CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate VDOT from distance (meters) and time (minutes).
 */
export function calculateVdot(distM: number, totalMin: number): number {
  if (distM <= 0 || totalMin <= 0) return 0;
  const v = distM / totalMin;
  const t = totalMin;
  const pctVO2max =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * t) +
    0.2989558 * Math.exp(-0.1932605 * t);
  const vo2 = -4.60 + 0.182258 * v + 0.000104 * v * v;
  return vo2 / pctVO2max;
}

export function vo2FromV(v: number): number {
  return -4.60 + 0.182258 * v + 0.000104 * v * v;
}

export function solveVelocityForVo2(targetVo2: number): number {
  let low = 100;
  let high = 1500;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (vo2FromV(mid) < targetVo2) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/**
 * Get pace (sec/km) from the Daniels table with linear interpolation.
 * Falls back to the continuous formula for VDOT outside the table range.
 */
export function getZonePace(vdot: number, zone: keyof typeof VDOT_COEFFS): number {
  if (vdot >= VDOT_TABLE[0].vdot && vdot <= VDOT_TABLE[VDOT_TABLE.length - 1].vdot) {
    const minRow = VDOT_TABLE[0];
    const maxRow = VDOT_TABLE[VDOT_TABLE.length - 1];
    if (vdot <= minRow.vdot) return minRow[zone];
    if (vdot >= maxRow.vdot) return maxRow[zone];

    let lower = VDOT_TABLE[0];
    let upper = VDOT_TABLE[1];
    for (let i = 0; i < VDOT_TABLE.length - 1; i++) {
      if (VDOT_TABLE[i].vdot <= vdot && VDOT_TABLE[i + 1].vdot >= vdot) {
        lower = VDOT_TABLE[i];
        upper = VDOT_TABLE[i + 1];
        break;
      }
    }
    const t = (vdot - lower.vdot) / (upper.vdot - lower.vdot);
    return Math.round(lower[zone] + t * (upper[zone] - lower[zone]));
  }

  // Formula fallback for VDOT < 30 or > 85
  const targetVo2 = vdot * VDOT_COEFFS[zone];
  const v = solveVelocityForVo2(targetVo2);
  return 60000 / v;
}

export const DANIELS_POINTS_PER_10MIN = {
  E: 1.7,
  M: 4.7,
  T: 6.2,
  I: 9.4,
  R: 9.0,
};

export function calculateDanielsPoints(durationMin: number, zone: keyof typeof VDOT_COEFFS): number {
  const multiplier = DANIELS_POINTS_PER_10MIN[zone] || 1.7;
  return (durationMin / 10) * multiplier;
}

export function calculateEquivalentKm(distanceKm: number, dPlusM: number, dMinusM: number): number {
  return distanceKm + (dPlusM * 0.009) + (dMinusM * 0.004);
}

export function qualifiesForVdotUpdate(distM: number, rpe: number, calculatedVdot: number, currentVdot: number): boolean {
  return distM >= 3000 && rpe >= 7 && calculatedVdot > currentVdot;
}

export function calculateItraIndex(equivalentKm: number, timeSec: number): number {
  if (timeSec <= 0) return 0;
  const speedMps = (equivalentKm * 1000) / timeSec;
  const baseSpeed = 6.0;
  return Math.round(Math.min(1000, (speedMps / baseSpeed) * 1000));
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAIL RACE HANDLING (TYPE D)
// ─────────────────────────────────────────────────────────────────────────────

export interface TrailRaceResult {
  equivalentKm: number;
  updatedVdot: number;
  itraIndex: number;
}

/** Koop formula: EFD = distance_km + D+_m/100 + D-_m/150 */
export function calculateKoopEquivalentKm(distanceKm: number, dPlusM: number, dMinusM = 0): number {
  return distanceKm + dPlusM / 100 + dMinusM / 150;
}

export function processTrailRaceResult(
  distanceKm: number,
  dPlusM: number,
  timeSec: number,
  currentVdot: number
): TrailRaceResult {
  const equivalentKm = calculateKoopEquivalentKm(distanceKm, dPlusM);
  const rawVdot = calculateVdot(equivalentKm * 1000, timeSec / 60);
  const updatedVdot = getEffectiveVdot(currentVdot, rawVdot);
  const itraIndex = calculateItraIndex(equivalentKm, timeSec);
  return { equivalentKm, updatedVdot, itraIndex };
}

/** D+ progression: max +10%/week; recovery weeks reduce by ~25%. */
export function calculateNextWeeklyDPlus(previousWeeklyDPlus: number, isRecoveryWeek: boolean): number {
  if (previousWeeklyDPlus <= 0) return 0;
  return Math.round((isRecoveryWeek ? previousWeeklyDPlus * 0.75 : previousWeeklyDPlus * 1.10) * 10) / 10;
}

/** Scale weekly Daniels points target proportionally after a VDOT update from a trail race. */
export function recalibrateWeeklyPoints(currentTarget: number, oldVdot: number, newVdot: number): number {
  if (oldVdot <= 0 || newVdot <= oldVdot) return currentTarget;
  return Math.round(currentTarget * (newVdot / oldVdot));
}

// ─────────────────────────────────────────────────────────────────────────────
// GOAL CLASSIFICATION & VDOT RAMP LIMITER
// ─────────────────────────────────────────────────────────────────────────────

export type GoalClass = 'short_term_goal' | 'medium_term_goal' | 'long_term_goal' | 'multi_cycle_goal';

/**
 * Classify goal realism from the gap between current and goal VDOT.
 */
export function classifyGoal(currentVdot: number, goalVdot: number): GoalClass {
  const gap = goalVdot - currentVdot;
  if (gap <= 3) return 'short_term_goal';
  if (gap <= 8) return 'medium_term_goal';
  if (gap <= 15) return 'long_term_goal';
  return 'multi_cycle_goal';
}

/**
 * Cap VDOT update to +1.5 per cycle to avoid over-aggressive plan rebuilds
 * from a single fast workout.
 */
export function getEffectiveVdot(currentVdot: number, newlyCalculatedVdot: number): number {
  return Math.min(newlyCalculatedVdot, currentVdot + 1.5);
}

/**
 * Return the next intermediate VDOT milestone for multi-cycle goals.
 * Caps each step at 5 VDOT units so each sub-plan is achievable.
 */
export function getNextVdotMilestone(currentVdot: number, goalVdot: number): number {
  return Math.min(goalVdot, currentVdot + 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY KM DERIVATION (adaptive output, not static input)
// ─────────────────────────────────────────────────────────────────────────────

const PHASE_PROGRESSION: Record<number, number> = { 1: 1.10, 2: 1.08, 3: 1.05, 4: 1.00 };
const DAYS_CAPACITY: Record<number, number> = { 2: 1.00, 3: 1.05, 4: 1.10, 5: 1.15, 6: 1.15 };

/**
 * Compute next week's effective km target from the current athlete state.
 * Weekly km is a DERIVED OUTPUT — not a user config input.
 *
 * @param previousWeeklyKm   Actual km completed last week
 * @param availableMinPerWeek Total available training minutes this week
 * @param easyPaceMinPerKm   Current E-pace in min/km (sec/km ÷ 60)
 * @param phaseNumber        1=Base, 2=Economy, 3=Threshold, 4=Peak/Taper
 * @param acwr               Current ACWR
 * @param readinessScore     0–100
 * @param trainingDaysPerWeek Days the athlete can run
 */
export function calculateNextWeeklyKm(
  previousWeeklyKm: number,
  availableMinPerWeek: number,
  easyPaceMinPerKm: number,
  phaseNumber: number,
  acwr: number,
  readinessScore: number,
  trainingDaysPerWeek: number
): number {
  if (previousWeeklyKm <= 0) previousWeeklyKm = 20;

  const progressionLimit = PHASE_PROGRESSION[phaseNumber] ?? 1.00;
  const progressionKm = previousWeeklyKm * progressionLimit;

  const timeBudgetKm = easyPaceMinPerKm > 0
    ? availableMinPerWeek / easyPaceMinPerKm
    : progressionKm;

  const daysMultiplier = DAYS_CAPACITY[Math.min(trainingDaysPerWeek, 6)] ?? 1.00;
  const daysCapacityKm = previousWeeklyKm * daysMultiplier;

  const rawTarget = Math.min(progressionKm, timeBudgetKm, daysCapacityKm);

  const readinessMult =
    readinessScore >= 85 ? 1.00 :
    readinessScore >= 70 ? 0.95 :
    readinessScore >= 55 ? 0.85 :
    readinessScore >= 40 ? 0.70 :
    0.50;

  const acwrMult =
    acwr <= 1.3 ? 1.00 :
    acwr <= 1.5 ? 0.90 :
    0.75;

  return Math.round(rawTarget * readinessMult * acwrMult * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// FOSTER RPE LOAD (Session-RPE)
// ─────────────────────────────────────────────────────────────────────────────

export function calculateSessionLoad(rpe: number, durationMin: number): number {
  return rpe * durationMin;
}

/**
 * ACWR = acuteLoad / average(4-week rolling weekly loads)
 */
export function calculateACWR(acuteLoad: number, chronicLoads: number[]): number {
  if (chronicLoads.length === 0) return 1.0;
  const avgChronic = chronicLoads.reduce((a, b) => a + b, 0) / chronicLoads.length;
  return avgChronic > 0 ? acuteLoad / avgChronic : 1.0;
}

export function calculateMonotony(dailyLoads: number[]): number {
  const n = dailyLoads.length || 7;
  const sum = dailyLoads.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  if (mean === 0) return 0;
  const variance = dailyLoads.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const sd = Math.sqrt(variance);
  return sd > 0 ? mean / sd : 0;
}

export function calculateStrain(weeklyLoad: number, monotony: number): number {
  return weeklyLoad * monotony;
}

// ─────────────────────────────────────────────────────────────────────────────
// STRAVA RPE SUGGESTION
// ─────────────────────────────────────────────────────────────────────────────

export function suggestRpeFromHrZone(maxHr: number, avgHr: number): number {
  const pct = avgHr / maxHr;
  if (pct < 0.60) return 3;
  if (pct < 0.70) return 4;
  if (pct < 0.80) return 5;
  if (pct < 0.85) return 6;
  if (pct < 0.90) return 7;
  if (pct < 0.95) return 8;
  if (pct < 0.98) return 9;
  return 10;
}
