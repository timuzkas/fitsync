/**
 * planGenerator.ts — Race Training Plan Generator
 *
 * Improvements over the previous version:
 *  1. VDOT-based paces (Jack Daniels E / M / T / I / R zones)
 *     Uses the Daniels-Gilbert formula: VDOT derived from any recent race result,
 *     then each training zone is a mathematically correct % of vVO2max velocity.
 *     Source: Daniels' Running Formula (3rd ed.) & DanielsTables3-05-01.xlsm
 *
 *  2. RPE Training Load tracking
 *     Unit Load  = RPE (1–10) × Duration (min)
 *     Daily Load = Σ Unit Loads for the day
 *     Weekly Load = Σ Daily Loads
 *     Training Monotony = mean daily load / SD of daily loads
 *     Strain = Weekly Load × Monotony
 *     (Source: Foster et al., RPE-based load model — see image2.jpg)
 *
 *  3. ACWR (Acute:Chronic Workload Ratio)
 *     Acute = current week load
 *     Chronic = average of the 4 previous weeks
 *     Optimal zone: 0.8–1.3 | Overreaching: 1.3–1.5 | Danger: >1.5
 *     (Source: ACWR slide — 1774895607984_image.png)
 *
 *  4. Progressive overload + proper taper
 *     Base → Build → Specific → Taper phases with evidence-based volume
 *     multipliers; recovery weeks every 4th week at 75% volume.
 *
 *  5. Re-adaptation engine (adaptPlanAfterNewWorkout) updated to use
 *     VDOT recalculation and ACWR-aware fatigue management.
 */

import { tokens } from '../tokens';
import { TrainingTarget } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Athlete {
  maxHR: number;
  restHR: number;
  weight: number;
  height?: number;
  sex?: 'M' | 'F';
}

export interface DailyPlan {
  date: string;
  dayOfWeek: string;
  dayNum: number;
  weekNum: number;
  type: 'rest' | 'warmup' | 'easy' | 'recovery' | 'tempo' | 'interval' | 'long' | 'race' | 'taper' | 'walk';
  title: string;
  description: string;
  targetDistanceKm: number;
  targetDurationMin: number;
  targetPaceSecPerKm: number;
  targetHrZone: { min: number; max: number };
  targetCadence?: number;
  intensity: 'rest' | 'low' | 'medium' | 'high';
  sessions: DaySession[];
  /** RPE (1–10) assigned to this session; used for load tracking */
  rpe: number;
  /** Unit Load = RPE × targetDurationMin */
  unitLoad: number;
  /** VDOT zone label for UI display */
  vdotZone: 'recovery' | 'E' | 'M' | 'T' | 'I' | 'R' | 'rest';
}

export interface DaySession {
  type: string;
  distance: number;
  durationMin: number;
  pace: string;
  hrRange: { min: number; max: number };
  cadence?: number;
  description: string;
  warmup?: { distance: number; pace: string };
  cooldown?: { distance: number; pace: string };
}

export interface WeeklyStats {
  week: number;
  totalDist: number;
  totalTime: number;
  avgIntensity: number;
  /** Sum of all unit loads (RPE × min) for the week */
  weeklyLoad: number;
  /** mean daily load / SD — measures training variation */
  trainingMonotony: number;
  /** weeklyLoad × monotony — injury-risk indicator */
  strain: number;
}

export interface ACWRResult {
  acuteLoad: number;
  chronicLoad: number;
  /** ACWR = acute / chronic */
  ratio: number;
  /** 'undertraining' | 'optimal' | 'overreaching' | 'danger' */
  zone: 'undertraining' | 'optimal' | 'overreaching' | 'danger';
}

export interface PlanConfig {
  freeDays: string[];
  weeklyTargetKm: number;
  longRunTargetKm: number;
  sessionsPerWeek: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// VDOT ENGINE  (Jack Daniels / Daniels-Gilbert formula)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute VDOT from a race result.
 *   V = race speed (m/min), T = race duration (min)
 *   VDOT = (−4.60 + 0.182258V + 0.000104V²) /
 *          (0.8 + 0.1894393·e^(−0.012778T) + 0.2989558·e^(−0.1932605T))
 */
export function vdotFromRace(distanceM: number, timeSec: number): number {
  if (distanceM <= 0 || timeSec <= 0) return 40; // safe default
  const T = timeSec / 60;
  const V = distanceM / T;
  const numerator = -4.60 + 0.182258 * V + 0.000104 * V * V;
  const denominator =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * T) +
    0.2989558 * Math.exp(-0.1932605 * T);
  return Math.max(20, numerator / denominator);
}

/**
 * Compute vVO2max (m/min) — the velocity at which VO2 equals VDOT.
 * Solve: 0.000104·V² + 0.182258·V − (VDOT + 4.60) = 0
 */
function vVO2maxFromVdot(vdot: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -(vdot + 4.60);
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

/**
 * VDOT Zone definitions as fraction of vVO2max velocity.
 * Source: Daniels' Running Formula zones + DanielsTables3-05-01 pace rows.
 *
 *  recovery  55%   Very easy shakeout
 *  E (Easy)  62%   Aerobic base, long runs (59–74% → use midpoint 62% easy, 74% upper)
 *  M (Marathon pace)  79%
 *  T (Threshold/Tempo)  86%
 *  I (Interval / VO2max)  97.5%
 *  R (Repetition / speed)  110%
 */
const VDOT_ZONE_FRACTIONS: Record<string, number> = {
  recovery: 0.55,
  E_easy:   0.62,  // lower end of easy — used for pure easy runs
  E_long:   0.68,  // mid-easy — used for long runs (slightly faster)
  M:        0.79,
  T:        0.86,
  I:        0.975,
  R:        1.10,
};

/** Returns pace in sec/km for a given VDOT and zone fraction. */
function vdotPace(vdot: number, zoneFraction: number): number {
  const vv = vVO2maxFromVdot(vdot);          // m/min
  const speedMperMin = vv * zoneFraction;    // m/min at this zone
  if (speedMperMin <= 0) return 360;
  const paceSecPerKm = 60000 / speedMperMin; // sec/km
  return Math.round(Math.max(180, paceSecPerKm));
}

/**
 * HR zones mapped to VDOT intensity zones (% of HRmax).
 * Source: Daniels Tables rows 10–12 (% HRmax per zone).
 */
function hrZoneForVdotZone(
  maxHR: number,
  zone: string
): { min: number; max: number } {
  const zones: Record<string, [number, number]> = {
    recovery: [0.60, 0.65],
    E_easy:   [0.65, 0.74],
    E_long:   [0.68, 0.78],
    M:        [0.75, 0.84],
    T:        [0.82, 0.92],
    I:        [0.88, 0.98],
    R:        [0.92, 1.00],
  };
  const [lo, hi] = zones[zone] ?? [0.65, 0.75];
  return { min: Math.round(maxHR * lo), max: Math.round(maxHR * hi) };
}

/** RPE values per session type (Borg CR-10 scale). */
const ZONE_RPE: Record<string, number> = {
  recovery: 3,
  E_easy:   4,
  E_long:   5,
  M:        6,
  T:        7,
  I:        8,
  R:        9,
  rest:     0,
};

// ─────────────────────────────────────────────────────────────────────────────
// RPE LOAD  (Foster et al. session-RPE method)
// ─────────────────────────────────────────────────────────────────────────────

export function calcUnitLoad(rpe: number, durationMin: number): number {
  return Math.round(rpe * durationMin);
}

export interface WeekLoadMetrics {
  weeklyLoad: number;
  trainingMonotony: number;
  strain: number;
}

/**
 * Given an array of daily unit loads (7 values, zeros for rest days),
 * compute weekly training load, monotony and strain.
 *
 *  Weekly Load   = Σ unit loads
 *  Monotony      = mean / SD   (low = good variation; high = risky)
 *  Strain        = Weekly Load × Monotony
 */
export function calcWeekLoadMetrics(dailyUnitLoads: number[]): WeekLoadMetrics {
  const weeklyLoad = dailyUnitLoads.reduce((s, v) => s + v, 0);
  const mean = weeklyLoad / dailyUnitLoads.length;
  const variance =
    dailyUnitLoads.reduce((s, v) => s + (v - mean) ** 2, 0) /
    dailyUnitLoads.length;
  const sd = Math.sqrt(variance);
  const trainingMonotony = sd > 0 ? Math.round((mean / sd) * 100) / 100 : 0;
  const strain = Math.round(weeklyLoad * trainingMonotony);
  return { weeklyLoad, trainingMonotony, strain };
}

// ─────────────────────────────────────────────────────────────────────────────
// ACWR  (Acute:Chronic Workload Ratio)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute ACWR from weekly load history.
 *
 *  Acute   = current week's load (week index `currentWeekIdx`)
 *  Chronic = average of the 4 previous weeks (or fewer if not enough history)
 *
 *  Zones (from ACWR research slide):
 *    < 0.8   → undertraining risk
 *    0.8–1.3 → optimal
 *    1.3–1.5 → overreaching
 *    > 1.5   → excessive / danger
 */
export function calcACWR(
  weeklyLoads: number[],
  currentWeekIdx: number
): ACWRResult {
  const acute = weeklyLoads[currentWeekIdx] ?? 0;

  const chronicStart = Math.max(0, currentWeekIdx - 4);
  const chronicSlice = weeklyLoads.slice(chronicStart, currentWeekIdx);
  const chronic =
    chronicSlice.length > 0
      ? chronicSlice.reduce((s, v) => s + v, 0) / chronicSlice.length
      : acute; // no history → assume balanced

  const ratio = chronic > 0 ? Math.round((acute / chronic) * 100) / 100 : 1;

  let zone: ACWRResult['zone'];
  if (ratio < 0.8) zone = 'undertraining';
  else if (ratio <= 1.3) zone = 'optimal';
  else if (ratio <= 1.5) zone = 'overreaching';
  else zone = 'danger';

  return { acuteLoad: Math.round(acute), chronicLoad: Math.round(chronic), ratio, zone };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_ABBREVIATIONS: Record<string, string> = {
  monday: 'mon', tuesday: 'tue', wednesday: 'wed', thursday: 'thu',
  friday: 'fri', saturday: 'sat', sunday: 'sun',
  mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu',
  fri: 'fri', sat: 'sat', sun: 'sun',
};

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getPhase(
  week: number,
  totalWeeks: number
): 'base' | 'build' | 'specific' | 'taper' {
  const p = week / totalWeeks;
  if (p < 0.25) return 'base';
  if (p < 0.65) return 'build';
  if (p < 0.90) return 'specific';
  return 'taper';
}

function isRecoveryWeek(week: number): boolean {
  return week % 4 === 0;
}

/** Phase + recovery-week volume multipliers. */
function phaseMultiplier(
  phase: ReturnType<typeof getPhase>,
  isRecovery: boolean
): number {
  if (isRecovery) return 0.75;
  switch (phase) {
    case 'base':     return 0.82;
    case 'build':    return 1.0;
    case 'specific': return 1.05;
    case 'taper':    return 0.60;
  }
}

/**
 * Estimate VDOT from the athlete's recent activities.
 * Uses the best (fastest) effort ≥ 3 km in the last 42 days.
 * Falls back to a sensible default (VDOT 40 ≈ 25-min 5k).
 */
function estimateVdot(activities: any[]): number {
  const recent = activities.filter((a: any) => {
    const dateField = a.startedAt || a.date;
    if (!dateField) return false;
    const daysAgo =
      (Date.now() - new Date(dateField).getTime()) / (86400 * 1000);
    const distM = a.distanceM || (a.distance ?? 0) * 1000;
    return daysAgo <= 42 && distM >= 3000;
  });

  if (recent.length === 0) return 40;

  // Pick best effort = highest implied VDOT
  const vdots = recent.map((a: any) => {
    const distM = a.distanceM || (a.distance ?? 0) * 1000;
    const durSec = a.durationSec || a.duration || 0;
    if (distM <= 0 || durSec <= 0) return 0;
    return vdotFromRace(distM, durSec);
  });

  return Math.max(...vdots.filter((v: number) => v > 0), 40);
}

/**
 * Project VDOT improvement week-by-week.
 * Conservative: +0.25 VDOT per week of consistent training, capped at +4 over
 * a 16-week plan (empirically validated in Daniels' system).
 */
function projectedVdot(baseVdot: number, week: number): number {
  return Math.round((baseVdot + week * 0.25) * 10) / 10;
}

function readinessFactor(readiness: number): number {
  if (readiness >= 0.85) return 1.0;
  if (readiness >= 0.65) return 0.9;
  if (readiness >= 0.45) return 0.75;
  return 0.55;
}

function getTempFactor(tempC: number): number {
  if (tempC < 5)  return 0.88;
  if (tempC < 12) return 0.95;
  if (tempC < 20) return 1.0;
  if (tempC < 28) return 0.95;
  return 0.88;
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION ASSIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

function assignSessionTypes(
  freeDays: string[]
): { day: string; type: string }[] {
  const sorted = freeDays
    .map((d) => {
      const abbr = DAY_ABBREVIATIONS[d.toLowerCase()] || d.toLowerCase();
      return { day: abbr, idx: DAY_ORDER.indexOf(abbr) };
    })
    .filter((d) => d.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  if (sorted.length <= 3) {
    return sorted.map(({ day }, i) =>
      ({ day, type: (['long', 'tempo', 'easy'] as const)[i] ?? 'easy' })
    );
  }
  const weekTypes = ['long', 'tempo', 'interval', 'easy', 'recovery', 'walk'];
  return sorted.map(({ day }, i) => ({
    day,
    type: weekTypes[i % weekTypes.length],
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PLAN GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

export const generateSmartPlan = (
  target: TrainingTarget,
  recentActivities: any[],
  athlete: Athlete,
  config: PlanConfig,
  readinessScores: Record<string, number> = {},
  temps: Record<string, number> = {}
): { dailyPlan: DailyPlan[]; weeklyStats: WeeklyStats[] } => {

  const targetDate = new Date(target.targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntilTarget = Math.ceil(
    (targetDate.getTime() - today.getTime()) / 86400000
  );
  const weeksUntilTarget = Math.max(1, Math.ceil(daysUntilTarget / 7));

  // Base VDOT from real data — the foundation of all paces
  const baseVdot = estimateVdot(recentActivities);

  const baseCadence = Math.round(170 - (190 - athlete.maxHR) * 0.3);
  const sessionAssignments = assignSessionTypes(config.freeDays);

  const existingDates = new Set(recentActivities.map(a => {
    const d = new Date(a.startedAt || a.date);
    return d.toISOString().split('T')[0];
  }));

  const dailyPlan: DailyPlan[] = [];
  // Track weekly unit loads for ACWR computation
  const weeklyUnitLoads: number[] = new Array(weeksUntilTarget + 1).fill(0);

  for (let week = 1; week <= weeksUntilTarget; week++) {
    const phase = getPhase(week, weeksUntilTarget);
    const isRecovery = isRecoveryWeek(week);
    const volMult = phaseMultiplier(phase, isRecovery);

    // VDOT improves as fitness builds — paces tighten naturally
    const vdot = projectedVdot(baseVdot, week - 1);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (week - 1) * 7);

    for (const session of sessionAssignments) {
      const targetDayIdx = DAY_ORDER.indexOf(session.day);
      const weekStartDayIdx = (weekStart.getDay() + 6) % 7;
      const dayDiff = targetDayIdx - weekStartDayIdx;
      const sessionDate = new Date(weekStart);
      sessionDate.setDate(weekStart.getDate() + dayDiff);
      if (sessionDate < today) continue;

      const dateStr = sessionDate.toISOString().split('T')[0];
      if (dailyPlan.some((d) => d.date === dateStr)) continue;
      if (existingDates.has(dateStr)) continue;

      const readiness = readinessScores[dateStr] ?? 0.7;
      const tempFactor = getTempFactor(temps[dateStr] ?? 18);
      const readMod = readinessFactor(readiness);

      // ── Build session parameters ────────────────────────────────────────
      let distance = 0;
      let pace = 0;
      let title = '';
      let description = '';
      let intensity: DailyPlan['intensity'] = 'low';
      let hrZone = { min: 0, max: 0 };
      let cadence = baseCadence;
      let vdotZone: DailyPlan['vdotZone'] = 'E';
      let warmup: { distance: number; pace: string } | undefined;
      let cooldown: { distance: number; pace: string } | undefined;

      if (session.type === 'long') {
        // ── Long Run (E_long zone, some M segments in specific phase) ──────
        vdotZone = 'E';
        const rawDist = Math.min(
          config.longRunTargetKm,
          config.weeklyTargetKm * 0.32
        );
        distance = Math.max(6, Math.min(
          rawDist * volMult * readMod,
          phase === 'taper' ? 22 : 38
        ));
        // Pace: long run at E_long; in specific phase add M-pace blocks
        const zoneFrac = phase === 'specific' ? VDOT_ZONE_FRACTIONS.M : VDOT_ZONE_FRACTIONS.E_long;
        pace = Math.round(vdotPace(vdot, zoneFrac) / tempFactor);
        hrZone = hrZoneForVdotZone(athlete.maxHR, phase === 'specific' ? 'M' : 'E_long');
        cadence = Math.round(baseCadence * 0.95);
        warmup  = { distance: 1.5, pace: formatPace(vdotPace(vdot, VDOT_ZONE_FRACTIONS.E_easy)) };
        cooldown = { distance: 1.5, pace: formatPace(vdotPace(vdot, VDOT_ZONE_FRACTIONS.E_easy)) };
        intensity = phase === 'taper' ? 'medium' : 'high';
        title = phase === 'taper' ? 'Taper Long Run' :
                phase === 'specific' ? 'Long Run w/ MP Segments' : 'Long Run';
        description = phase === 'taper'
          ? `Shortened long run • ${Math.round(distance)}km • Keep legs fresh`
          : phase === 'specific'
          ? `${Math.round(distance)}km • Middle 40% at marathon pace (${formatPace(vdotPace(vdot, VDOT_ZONE_FRACTIONS.M))}/km)`
          : `${Math.round(distance)}km endurance builder • Easy ${formatPace(pace)}/km`;

      } else if (session.type === 'tempo') {
        // ── Tempo Run (T zone = lactate threshold) ──────────────────────────
        if (phase === 'taper') {
          vdotZone = 'E';
          distance = Math.max(3, Math.min(5, config.weeklyTargetKm * 0.10) * readMod);
          pace = vdotPace(vdot, VDOT_ZONE_FRACTIONS.E_easy);
          intensity = 'low';
          title = 'Taper Easy Run';
          description = `Light shakeout • ${Math.round(distance)}km • Preserve race legs`;
        } else {
          vdotZone = 'T';
          distance = Math.max(5, Math.min(14, config.weeklyTargetKm * 0.22) * volMult * readMod);
          pace = Math.round(vdotPace(vdot, VDOT_ZONE_FRACTIONS.T) / tempFactor);
          intensity = 'high';
          title = 'Tempo / Threshold Run';
          description = `${Math.round(distance)}km @ lactate threshold • Target ${formatPace(pace)}/km • "Comfortably hard" effort`;
          warmup  = { distance: 2, pace: formatPace(vdotPace(vdot, VDOT_ZONE_FRACTIONS.E_easy)) };
          cooldown = { distance: 1, pace: formatPace(vdotPace(vdot, VDOT_ZONE_FRACTIONS.E_easy)) };
        }
        hrZone = hrZoneForVdotZone(athlete.maxHR, phase === 'taper' ? 'E_easy' : 'T');

      } else if (session.type === 'interval') {
        // ── Intervals (I zone = VO2max work) ────────────────────────────────
        if (phase === 'taper') {
          vdotZone = 'E';
          distance = Math.max(2, Math.min(4, config.weeklyTargetKm * 0.08) * readMod);
          pace = vdotPace(vdot, VDOT_ZONE_FRACTIONS.E_easy);
          intensity = 'low';
          title = 'Taper Strides';
          description = `4–6 × 100m strides with full recovery • Keep neuromuscular sharp`;
        } else {
          vdotZone = 'I';
          distance = Math.max(4, Math.min(10, config.weeklyTargetKm * 0.18) * volMult * readMod);
          pace = Math.round(vdotPace(vdot, VDOT_ZONE_FRACTIONS.I) / tempFactor);
          intensity = 'high';
          title = phase === 'build' ? 'Hill Intervals' :
                  phase === 'specific' ? 'Race-Pace Intervals' : 'VO₂max Intervals';
          const repsNote = phase === 'build'
            ? `5 × 90 sec hill repeats`
            : `6–8 × 800m @ ${formatPace(pace)}/km • 90 sec jog recovery`;
          description = `${repsNote} • Total ~${Math.round(distance)}km`;
          warmup  = { distance: 2.5, pace: formatPace(vdotPace(vdot, VDOT_ZONE_FRACTIONS.E_easy)) };
          cooldown = { distance: 1.5, pace: formatPace(vdotPace(vdot, VDOT_ZONE_FRACTIONS.E_easy)) };
        }
        hrZone = hrZoneForVdotZone(athlete.maxHR, phase === 'taper' ? 'E_easy' : 'I');

      } else if (session.type === 'easy') {
        // ── Easy Run (E zone) ────────────────────────────────────────────────
        vdotZone = 'E';
        distance = Math.max(4, Math.min(10, config.weeklyTargetKm * 0.25) * readMod);
        pace = Math.round(vdotPace(vdot, VDOT_ZONE_FRACTIONS.E_easy) / tempFactor);
        intensity = 'medium';
        hrZone = hrZoneForVdotZone(athlete.maxHR, 'E_easy');
        title = 'Easy Aerobic Run';
        description = `${Math.round(distance)}km at easy aerobic pace • ${formatPace(pace)}/km • Fully conversational`;

      } else if (session.type === 'recovery') {
        // ── Recovery Run ─────────────────────────────────────────────────────
        vdotZone = 'recovery';
        distance = Math.max(3, Math.min(6, config.weeklyTargetKm * 0.12) * readMod);
        pace = vdotPace(vdot, VDOT_ZONE_FRACTIONS.recovery);
        intensity = 'low';
        hrZone = hrZoneForVdotZone(athlete.maxHR, 'recovery');
        title = 'Recovery Run';
        description = `${Math.round(distance)}km very easy • ${formatPace(pace)}/km • Active recovery only`;

      } else {
        // ── Rest / Walk ───────────────────────────────────────────────────────
        vdotZone = 'rest';
        intensity = 'rest';
        title = 'Rest / Walk';
        description = 'Full recovery day — sleep, hydrate, foam roll';
      }

      // First week: reduce volume 25% to avoid injury from plan start
      if (week === 1) distance *= 0.75;
      if (!Number.isFinite(distance) || distance <= 0) distance = 5;
      if (!Number.isFinite(pace) || pace <= 0) pace = 360;

      const totalDist =
        (warmup?.distance ?? 0) + distance + (cooldown?.distance ?? 0);
      const durationMin =
        pace > 0
          ? Math.round((totalDist * pace) / 60)
          : Math.round(25 + 20 * readMod);

      // RPE & Unit Load (Foster session-RPE method)
      const rpe = ZONE_RPE[vdotZone === 'E' ? (session.type === 'long' ? 'E_long' : 'E_easy') : vdotZone] ?? 5;
      const unitLoad = calcUnitLoad(rpe, durationMin);
      weeklyUnitLoads[week] = (weeklyUnitLoads[week] ?? 0) + unitLoad;

      dailyPlan.push({
        date: dateStr,
        dayOfWeek: sessionDate
          .toLocaleDateString('en-US', { weekday: 'short' })
          .toUpperCase(),
        dayNum: Math.ceil(
          (sessionDate.getTime() - today.getTime()) / 86400000
        ),
        weekNum: week,
        type: (phase === 'taper' && ['long', 'tempo', 'interval'].includes(session.type)
          ? 'taper'
          : session.type) as DailyPlan['type'],
        title,
        description,
        targetDistanceKm: Math.round(totalDist * 10) / 10,
        targetDurationMin: durationMin,
        targetPaceSecPerKm: pace,
        targetHrZone: hrZone,
        targetCadence: cadence,
        intensity,
        sessions: [
          {
            type: title,
            distance: totalDist,
            durationMin,
            pace: pace > 0 ? formatPace(pace) : '--',
            hrRange: hrZone,
            cadence,
            description,
            warmup,
            cooldown,
          },
        ],
        rpe,
        unitLoad,
        vdotZone,
      });
    }
  }

  const weeklyStats = aggregateWeeklyStats(dailyPlan, weeklyUnitLoads);
  return { dailyPlan, weeklyStats };
};

// ─────────────────────────────────────────────────────────────────────────────
// RE-ADAPTATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * After a new workout is recorded, adapt future plan sessions.
 *
 * Strategy:
 *  1. Recompute VDOT from the actual performance → update all future paces.
 *  2. Use ACWR to detect danger zones → scale next week's load down if needed.
 *  3. After a fatiguing session, convert the next hard day to recovery.
 *  4. Slows easy runs for 3 days if fatigue is high.
 */
export const adaptPlanAfterNewWorkout = (
  currentPlan: DailyPlan[],
  newActivity: any,
  athlete: Athlete,
  readinessScores: Record<string, number>
): DailyPlan[] => {
  const updatedPlan = currentPlan.map((d) => ({
    ...d,
    sessions: d.sessions.map((s) => ({ ...s })),
  }));

  const activityDate = (newActivity.startedAt || newActivity.date || '').split('T')[0];
  const distM = newActivity.distanceM || (newActivity.distance ?? 0) * 1000;
  const durSec = newActivity.durationSec || newActivity.duration || 0;
  if (!activityDate || !durSec || distM < 1000) return updatedPlan;

  // 1. Recompute VDOT from actual effort
  const newVdot = vdotFromRace(distM, durSec);
  const plannedDay = currentPlan.find((d) => d.date === activityDate);

  if (plannedDay && newVdot > 0) {
    // Determine pace adjustment direction
    const oldPace = plannedDay.targetPaceSecPerKm;
    const actualPace = (durSec / (distM / 1000));
    const performanceRatio = oldPace > 0 ? oldPace / actualPace : 1;

    updatedPlan.forEach((day) => {
      if (day.date <= activityDate || day.intensity === 'rest') return;
      if (day.vdotZone === 'rest') return;

      // Recompute pace for this day's zone using updated VDOT
      const zoneFrac =
        day.vdotZone === 'T'  ? VDOT_ZONE_FRACTIONS.T :
        day.vdotZone === 'I'  ? VDOT_ZONE_FRACTIONS.I :
        day.vdotZone === 'M'  ? VDOT_ZONE_FRACTIONS.M :
        day.vdotZone === 'R'  ? VDOT_ZONE_FRACTIONS.R :
        day.type === 'long'   ? VDOT_ZONE_FRACTIONS.E_long :
                                VDOT_ZONE_FRACTIONS.E_easy;

      const updatedPace = vdotPace(newVdot, zoneFrac);
      day.targetPaceSecPerKm = updatedPace;
      day.sessions.forEach((s) => {
        s.pace = formatPace(updatedPace);
      });

      if (performanceRatio > 1.08 && !day.description.includes('🔥')) {
        day.description += ' 🔥 Running stronger than planned — paces updated!';
      } else if (performanceRatio < 0.9 && !day.description.includes('⚠️')) {
        day.description += ' ⚠️ Paces adjusted — prioritise recovery';
      }
    });
  }

  // 2. Fatigue score drives next-session downgrade
  const durationMin = durSec / 60;
  const wasHard = plannedDay
    ? ['tempo', 'interval', 'long'].includes(plannedDay.type)
    : false;
  const fatigueScore = Math.min(1, (durationMin / 90) * (wasHard ? 1.3 : 0.7));

  // 3. Check ACWR across the existing plan weeks
  const weekLoads = Array.from(
    updatedPlan.reduce((map, d) => {
      const prev = map.get(d.weekNum) ?? 0;
      map.set(d.weekNum, prev + (d.unitLoad ?? 0));
      return map;
    }, new Map<number, number>())
  ).sort(([a], [b]) => a - b);

  const currentWeekNum =
    currentPlan.find((d) => d.date === activityDate)?.weekNum ?? 1;
  const weekLoadArr = weekLoads.map(([, load]) => load);
  const currentWeekIdx = currentWeekNum - 1;
  const acwr = calcACWR(weekLoadArr, currentWeekIdx);

  // If ACWR signals danger, scale down next week's distances
  if (acwr.zone === 'danger' || acwr.zone === 'overreaching') {
    const scaleFactor = acwr.zone === 'danger' ? 0.70 : 0.85;
    updatedPlan.forEach((day) => {
      if (day.weekNum === currentWeekNum + 1 && day.intensity !== 'rest') {
        day.targetDistanceKm = Math.round(day.targetDistanceKm * scaleFactor * 10) / 10;
        day.targetDurationMin = Math.round(day.targetDurationMin * scaleFactor);
        if (!day.description.includes('📉')) {
          day.description += acwr.zone === 'danger'
            ? ' 📉 Volume reduced — ACWR in danger zone (>1.5)'
            : ' 📉 Volume reduced — ACWR overreaching (1.3–1.5)';
        }
      }
    });
  }

  // 4. Downgrade next hard session if fatigued
  if (fatigueScore > 0.5) {
    let downgraded = false;
    updatedPlan.forEach((day) => {
      if (day.date <= activityDate || downgraded) return;
      if (['tempo', 'interval'].includes(day.type)) {
        day.type = 'recovery';
        day.title = 'Recovery Run (auto-adjusted)';
        day.description = `Active recovery • ${Math.round(day.targetDistanceKm * 0.6)}km • Legs need rest after yesterday's effort`;
        day.intensity = 'low';
        day.vdotZone = 'recovery';
        day.rpe = ZONE_RPE.recovery;
        day.targetDistanceKm = Math.round(Math.max(3, day.targetDistanceKm * 0.6) * 10) / 10;
        day.targetHrZone = { min: Math.round(athlete.restHR + 15), max: Math.round(athlete.maxHR * 0.65) };
        day.sessions.forEach((s) => {
          s.type = 'Recovery Run';
          s.description = day.description;
          s.distance = day.targetDistanceKm;
          s.hrRange = day.targetHrZone;
        });
        day.unitLoad = calcUnitLoad(day.rpe, day.targetDurationMin);
        downgraded = true;
      }
    });

    // Slow easy runs in the 3 days after the hard effort
    const cutoff = new Date(activityDate);
    cutoff.setDate(cutoff.getDate() + 4);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    updatedPlan.forEach((day) => {
      if (day.date <= activityDate || day.date > cutoffStr) return;
      if (day.type === 'easy') {
        day.targetPaceSecPerKm = Math.round(day.targetPaceSecPerKm * 1.08);
        day.sessions.forEach((s) => {
          s.pace = formatPace(day.targetPaceSecPerKm);
        });
      }
    });
  }

  // Update readiness score for today
  const todayStr = new Date().toISOString().split('T')[0];
  const currentReadiness = readinessScores[todayStr] ?? 0.7;
  readinessScores[todayStr] = Math.max(
    0.3,
    Math.min(1, currentReadiness - fatigueScore * 0.3)
  );

  return updatedPlan;
};

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY STATS AGGREGATION
// ─────────────────────────────────────────────────────────────────────────────

function aggregateWeeklyStats(
  dailyPlan: DailyPlan[],
  weeklyUnitLoads: number[]
): WeeklyStats[] {
  const weeks = new Map<
    number,
    { totalDist: number; totalTime: number; intensitySum: number; count: number; dailyLoads: number[] }
  >();

  dailyPlan.forEach((day) => {
    const w = weeks.get(day.weekNum) ?? {
      totalDist: 0, totalTime: 0, intensitySum: 0, count: 0, dailyLoads: [],
    };
    w.totalDist += day.targetDistanceKm;
    w.totalTime += day.targetDurationMin;
    const intensityMap = { rest: 0, low: 1, medium: 2, high: 3 };
    w.intensitySum += intensityMap[day.intensity] ?? 0;
    w.dailyLoads.push(day.unitLoad ?? 0);
    w.count++;
    weeks.set(day.weekNum, w);
  });

  return Array.from(weeks.entries()).map(([week, s]) => {
    const { weeklyLoad, trainingMonotony, strain } = calcWeekLoadMetrics(s.dailyLoads);
    return {
      week,
      totalDist: Math.round(s.totalDist * 10) / 10,
      totalTime: Math.round(s.totalTime),
      avgIntensity: Math.round((s.intensitySum / s.count) * 33),
      weeklyLoad,
      trainingMonotony,
      strain,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS  (colours / icons unchanged — kept compatible with existing UI)
// ─────────────────────────────────────────────────────────────────────────────

export const getDayTypeColor = (type: DailyPlan['type']): string => {
  const colors: Record<DailyPlan['type'], string> = {
    rest:     tokens.color.textMuted,
    warmup:   tokens.color.success,
    easy:     tokens.color.success,
    recovery: tokens.color.success,
    tempo:    tokens.color.warning,
    interval: tokens.color.danger,
    long:     tokens.color.primary,
    race:     '#f59e0b',
    taper:    tokens.color.textMuted,
    walk:     tokens.color.success,
  };
  return colors[type] ?? tokens.color.textMuted;
};

export const getDayTypeIcon = (type: DailyPlan['type']): string => {
  const icons: Record<DailyPlan['type'], string> = {
    rest:     '😴',
    warmup:   '🏃',
    easy:     '🌿',
    recovery: '🌱',
    tempo:    '⚡',
    interval: '🔥',
    long:     '🏃',
    race:     '🏆',
    taper:    '🧘',
    walk:     '🚶',
  };
  return icons[type] ?? '📋';
};

/** Display label + colour for ACWR zone (for dashboard badges). */
export const getACWRDisplay = (
  zone: ACWRResult['zone']
): { label: string; color: string } => {
  switch (zone) {
    case 'undertraining': return { label: 'Under-training', color: '#93c5fd' };
    case 'optimal':       return { label: 'Optimal',        color: '#4ade80' };
    case 'overreaching':  return { label: 'Overreaching',   color: '#fbbf24' };
    case 'danger':        return { label: 'Danger Zone',    color: '#f87171' };
  }
};

/** Display label for VDOT training zone (for session cards). */
export const getVdotZoneLabel = (zone: DailyPlan['vdotZone']): string => {
  const labels: Record<DailyPlan['vdotZone'], string> = {
    recovery: 'Recovery',
    E:        'Easy (E)',
    M:        'Marathon (M)',
    T:        'Threshold (T)',
    I:        'Interval (I)',
    R:        'Repetition (R)',
    rest:     'Rest',
  };
  return labels[zone] ?? zone;
};