
/**
 * DANIELS VDOT & FOSTER RPE LOAD ALGORITHMS
 * Source: Daniels' Running Formula & Foster RPE-based load model.
 */

// ─────────────────────────────────────────────────────────────────────────────
// VDOT CALCULATIONS (Jack Daniels)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate VDOT from distance (meters) and time (minutes).
 * VDOT = VO2 / %VO2max
 */
export function calculateVdot(distM: number, totalMin: number): number {
  if (distM <= 0 || totalMin <= 0) return 0;

  const v = distM / totalMin; // velocity in m/min
  const t = totalMin;

  // %VO2max = 0.8 + 0.1894393 * e^(-0.012778 * t) + 0.2989558 * e^(-0.1932605 * t)
  const pctVO2max =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * t) +
    0.2989558 * Math.exp(-0.1932605 * t);

  // VO2 = -4.60 + 0.182258 * v + 0.000104 * v^2
  const vo2 = -4.60 + 0.182258 * v + 0.000104 * v * v;

  return vo2 / pctVO2max;
}

/**
 * VO2 as a function of velocity (m/min).
 */
export function vo2FromV(v: number): number {
  return -4.60 + 0.182258 * v + 0.000104 * v * v;
}

/**
 * Zone coefficients (fraction of VDOT).
 */
export const VDOT_COEFFS = {
  E: 0.665, // Easy (59-74%)
  M: 0.795, // Marathon (75-84%)
  T: 0.855, // Threshold (83-88%)
  I: 0.975, // Interval (95-100%)
  R: 1.125, // Repetition (105-120%)
};

/**
 * Daniels Intensity Points (v2.0)
 * Points per 10 minutes by Zone
 */
export const DANIELS_POINTS_PER_10MIN = {
  E: 1.7,
  M: 4.7,
  T: 6.2,
  I: 9.4,
  R: 9.0, // Avg of 7.5 - 10.5 range
};

/**
 * Calculate Daniels Intensity Points.
 * Points = (duration in minutes ÷ 10) × zone multiplier
 */
export function calculateDanielsPoints(durationMin: number, zone: keyof typeof VDOT_COEFFS): number {
  const multiplier = DANIELS_POINTS_PER_10MIN[zone] || 1.7;
  return (durationMin / 10) * multiplier;
}

/**
 * Trail Running Load (v2.1) - Koop Formula
 * 100 m of vertical ascent ≈ 0.9 km equivalent
 * 100 m of vertical descent ≈ 0.4 km equivalent
 */
export function calculateEquivalentKm(distanceKm: number, dPlusM: number, dMinusM: number): number {
  return distanceKm + (dPlusM * 0.009) + (dMinusM * 0.004);
}

/**
 * VDOT Update Trigger (v1.3)
 * A run qualifies if: distance >= 3km, RPE >= 7, and new VDOT > current.
 */
export function qualifiesForVdotUpdate(distM: number, rpe: number, calculatedVdot: number, currentVdot: number): boolean {
  return distM >= 3000 && rpe >= 7 && calculatedVdot > currentVdot;
}

/**
 * ITRA Performance Index (Simplified) (v2.1)
 * Derived from equivalent flat distance and time.
 */
export function calculateItraIndex(equivalentKm: number, timeSec: number): number {
  if (timeSec <= 0) return 0;
  const speedMps = (equivalentKm * 1000) / timeSec;
  // Standard ITRA scaling: 1000 points roughly equals world record pace
  // Simplified formula for app baseline
  const baseSpeed = 6.0; // m/s for top performance
  const index = (speedMps / baseSpeed) * 1000;
  return Math.round(Math.min(1000, index));
}

/**
 * Solve for velocity (m/min) given target VO2 using binary search.
 * target_vo2 = VDOT * coeff
 */
export function solveVelocityForVo2(targetVo2: number): number {
  let low = 100;
  let high = 1500;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (vo2FromV(mid) < targetVo2) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

/**
 * Get pace (sec/km) for a given VDOT and zone.
 */
export function getZonePace(vdot: number, zone: keyof typeof VDOT_COEFFS): number {
  const targetVo2 = vdot * VDOT_COEFFS[zone];
  const v = solveVelocityForVo2(targetVo2);
  return 60000 / v; // 1000m / (v m/min) * 60 sec/min
}

// ─────────────────────────────────────────────────────────────────────────────
// FOSTER RPE LOAD (Session-RPE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Session Load = RPE (1-10) * Duration (min)
 */
export function calculateSessionLoad(rpe: number, durationMin: number): number {
  return rpe * durationMin;
}

/**
 * Acute Load (AL) = Sum of session loads this week.
 * Chronic Load (CL) = Average of AL of previous 4 weeks.
 * ACWR = AL / CL
 */
export function calculateACWR(acuteLoad: number, chronicLoads: number[]): number {
  if (chronicLoads.length === 0) return 1.0;
  const avgChronic = chronicLoads.reduce((a, b) => a + b, 0) / chronicLoads.length;
  return avgChronic > 0 ? acuteLoad / avgChronic : 1.0;
}

/**
 * Monotony = average(daily load) / SD(daily load)
 */
export function calculateMonotony(dailyLoads: number[]): number {
  const n = dailyLoads.length || 7;
  const sum = dailyLoads.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  if (mean === 0) return 0;
  
  const variance = dailyLoads.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const sd = Math.sqrt(variance);
  
  return sd > 0 ? mean / sd : 0;
}

/**
 * Strain = weekly load * monotony
 */
export function calculateStrain(weeklyLoad: number, monotony: number): number {
  return weeklyLoad * monotony;
}

// ─────────────────────────────────────────────────────────────────────────────
// STRAVA RPE SUGGESTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HR zone -> RPE mapping (suggested, user overrides).
 * Zone 1 -> RPE 3
 * Zone 2 -> RPE 4-5
 * Zone 3 -> RPE 6
 * Zone 4 -> RPE 7-8
 * Zone 5 -> RPE 9-10
 */
export function suggestRpeFromHrZone(maxHr: number, avgHr: number): number {
  const pct = avgHr / maxHr;
  if (pct < 0.60) return 3; // Zone 1
  if (pct < 0.70) return 4; // Zone 2 (lower)
  if (pct < 0.80) return 5; // Zone 2 (upper)
  if (pct < 0.85) return 6; // Zone 3
  if (pct < 0.90) return 7; // Zone 4 (lower)
  if (pct < 0.95) return 8; // Zone 4 (upper)
  if (pct < 0.98) return 9; // Zone 5 (lower)
  return 10;                 // Zone 5 (upper)
}
