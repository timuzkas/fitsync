
import { getZonePace, VDOT_COEFFS, calculateDanielsPoints, calculateEquivalentKm } from './training';
import { Athlete, PointsHistoryEntry, AdaptiveState } from './index';

export type RaceType = 'A' | 'B' | 'C' | 'D'; // D = Trail Race.

export interface Race {
  name: string;
  date: Date;
  type: RaceType;
  dPlusM?: number;
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

/**
 * Section 10: Adaptive Points Level Logic
 * Evaluates performance over the last 3 weeks to adjust points target.
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

  // 10.1 Overload Step Down (2 consecutive weeks ACWR > 1.5)
  const last2Weeks = history.slice(-2);
  if (last2Weeks.length === 2 && last2Weeks.every(h => h.acwr > 1.5)) {
    return {
      newTarget: Math.round(currentTarget * 0.9),
      newState: 'frozen',
      reason: 'high_acwr_overload'
    };
  }

  // If frozen, wait until ACWR normalizes (< 1.3)
  if (newState === 'frozen') {
    const lastWeek = history[history.length - 1];
    if (lastWeek && lastWeek.acwr < 1.3) {
      newState = 'normal';
    } else {
      return { newTarget, newState, reason: 'high_acwr_persistent' };
    }
  }

  // 10.1 Step Up / Step Down (3 consecutive weeks)
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
 * Phase 4 is placed immediately before the taper.
 */
export function planSeason(aRaceDate: Date, startDate: Date, races: Race[] = []): TrainingCycle {
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const totalWeeks = Math.ceil((aRaceDate.getTime() - startDate.getTime()) / msPerWeek);

  const phases: Phase[] = [];
  
  // Section 2.2 Phase compression rules
  const taperWeeks = 2;
  const mainTrainingWeeks = totalWeeks - taperWeeks;

  if (mainTrainingWeeks >= 18) {
    // Full 4 phases, all phases at maximum length
    const phaseLen = Math.floor(mainTrainingWeeks / 4);
    phases.push({ type: 'Base', startWeek: 1, endWeek: phaseLen, focusZone: 'E' });
    phases.push({ type: 'Economy', startWeek: phaseLen + 1, endWeek: phaseLen * 2, focusZone: 'R' });
    phases.push({ type: 'Threshold', startWeek: phaseLen * 2 + 1, endWeek: phaseLen * 3, focusZone: 'T' });
    phases.push({ type: 'Peak', startWeek: phaseLen * 3 + 1, endWeek: mainTrainingWeeks, focusZone: 'I' });
  } else if (mainTrainingWeeks >= 12) {
    // Compress phases to min weeks proportionally (Min: 1, 2, 2, 2)
    const ph1 = Math.max(1, Math.floor(mainTrainingWeeks * 0.25));
    const ph2 = Math.max(2, Math.floor(mainTrainingWeeks * 0.25));
    const ph3 = Math.max(2, Math.floor(mainTrainingWeeks * 0.25));
    const ph4 = mainTrainingWeeks - ph1 - ph2 - ph3;
    phases.push({ type: 'Base', startWeek: 1, endWeek: ph1, focusZone: 'E' });
    phases.push({ type: 'Economy', startWeek: ph1 + 1, endWeek: ph1 + ph2, focusZone: 'R' });
    phases.push({ type: 'Threshold', startWeek: ph1 + ph2 + 1, endWeek: ph1 + ph2 + ph3, focusZone: 'T' });
    phases.push({ type: 'Peak', startWeek: ph1 + ph2 + ph3 + 1, endWeek: mainTrainingWeeks, focusZone: 'I' });
  } else if (mainTrainingWeeks >= 6) {
    // Ph 1+2 merged, Ph 3+4
    const ph12 = Math.floor(mainTrainingWeeks * 0.5);
    phases.push({ type: 'Base', startWeek: 1, endWeek: ph12, focusZone: 'E' });
    phases.push({ type: 'Threshold', startWeek: ph12 + 1, endWeek: mainTrainingWeeks, focusZone: 'T' });
  } else {
    // < 6 weeks: Ph 3+4 only
    phases.push({ type: 'Threshold', startWeek: 1, endWeek: mainTrainingWeeks, focusZone: 'T' });
  }

  phases.push({ type: 'Taper', startWeek: mainTrainingWeeks + 1, endWeek: totalWeeks });

  return { aRaceDate, phases, totalWeeks };
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
  planLimitationFlag?: string | null; // Section 9.5
}

/**
 * Day Placement Algorithm
 */
export function planWeek(
  startDate: Date,
  phase: Phase,
  availableDays: number[], // 0-6
  weeklyTargetKm: number,
  vdot: number,
  chronicLoad: number = 0,
  aRaceDate?: Date,
  aRaceDistance?: number,
  weeklyPointsTarget?: number
): DayPlan[] {
  let adjustedTarget = weeklyTargetKm;
  if (phase.type === 'Taper') adjustedTarget *= 0.75;
  else if (phase.type === 'Recovery') adjustedTarget *= 0.50;

  const week: DayPlan[] = [];
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }

  const availableIndices = availableIndicesFromDays(availableDays, startDate);
  const plan: (DayPlan | null)[] = new Array(7).fill(null);
  
  // Section 2.5 Quality Session Caps (Hard limits)
  const caps = {
    T: Math.round(adjustedTarget * 0.10 * 10) / 10,
    I: Math.min(Math.round(adjustedTarget * 0.08 * 10) / 10, 10),
    R: Math.round(adjustedTarget * 0.05 * 10) / 10,
  };

  const qualitySessions: { zone: keyof typeof VDOT_COEFFS; distance: number }[] = [];
  const maxQuality = availableIndices.length >= 3 ? 2 : (availableIndices.length > 0 ? 1 : 0);
  const weekNum = Math.floor(startDate.getTime() / (msPerDay * 7));
  const isAltWeek = weekNum % 2 === 0;

  if (phase.type !== 'Recovery') {
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
  qualitySessions.slice(0, maxQuality).forEach((qs, i) => {
    const idx = findQualityDay(qualityDays, plan, raceIdx);
    if (idx !== -1) {
      plan[idx] = createSession(days[idx], 'Quality', qs.zone, qs.distance, vdot);
    }
  });

  // Place Long Run (25-30% weekly km)
  const longRunDist = Math.round(Math.min(adjustedTarget * 0.28, adjustedTarget * 0.30) * 10) / 10;
  const longRunIdx = availableIndices.find(i => 
    plan[i] === null && 
    (i === 0 || plan[i-1] === null) && 
    (i === 6 || plan[i+1] === null)
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

  // Section 9.3 Zone Distribution & Points Rule
  // Easy (E) must represent 75-80% of total weekly points
  const totalPoints = finalWeek.reduce((acc, p) => acc + p.danielsPoints, 0);
  
  if (weeklyPointsTarget && totalPoints < weeklyPointsTarget * 0.9) {
    // Section 9.5 Plan Limitation Flag
    const flag = `Target of ${weeklyPointsTarget} pts is unreachable with only ${availableIndices.length} days. Consider adding a running day.`;
    finalWeek.forEach(p => p.planLimitationFlag = flag);
  }

  // ACWR Trim
  const totalLoad = finalWeek.reduce((acc, p) => acc + p.load, 0);
  if (chronicLoad > 0 && totalLoad / chronicLoad > 1.5) {
    trimWeekVolume(finalWeek, chronicLoad * 1.3);
  }

  return finalWeek;
}

const msPerDay = 1000 * 60 * 60 * 24;

function createSession(date: Date, type: DayPlan['type'], zone: keyof typeof VDOT_COEFFS, distanceKm: number, vdot: number): DayPlan {
  const paceSec = getZonePace(vdot, zone);
  const durationMin = Math.round((distanceKm * paceSec) / 60);
  const rpe = type === 'Quality' ? (zone === 'R' ? 9 : zone === 'I' ? 8 : 7) : (type === 'Long' ? 5 : 4);
  
  return {
    date,
    type,
    zone,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMin,
    rpe,
    load: rpe * durationMin,
    danielsPoints: calculateDanielsPoints(durationMin, zone)
  };
}

function findQualityDay(available: number[], plan: (DayPlan|null)[], raceIdx: number): number {
  return available.find(i => 
    plan[i] === null && 
    (i === 0 || plan[i-1]?.type !== 'Quality') && 
    (i === 6 || plan[i+1]?.type !== 'Quality') &&
    (raceIdx === -1 || Math.abs(i - raceIdx) >= 2)
  ) ?? -1;
}

function trimWeekVolume(week: DayPlan[], targetLoad: number) {
  let currentLoad = week.reduce((acc, p) => acc + p.load, 0);
  for (const s of week) {
    if ((s.type === 'Easy' || s.type === 'Long') && currentLoad > targetLoad) {
      const factor = Math.max(0.5, targetLoad / currentLoad);
      s.distanceKm = Math.round(s.distanceKm * factor * 10) / 10;
      s.durationMin = Math.round(s.durationMin * factor);
      const oldLoad = s.load;
      s.load = s.rpe * s.durationMin;
      currentLoad -= (oldLoad - s.load);
    }
  }
}

function availableIndicesFromDays(availableDays: number[], startDate: Date): number[] {
  const startDay = startDate.getDay();
  return availableDays.map(day => (day - startDay + 7) % 7).sort((a, b) => a - b);
}
