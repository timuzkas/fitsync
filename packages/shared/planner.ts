
import { getZonePace, VDOT_COEFFS } from './training';

export type RaceType = 'A' | 'B' | 'C';

export interface Race {
  name: string;
  date: Date;
  type: RaceType;
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
 * Allocate phases backwards from A race date.
 * Phase 4 is placed immediately before the taper.
 */
export function planSeason(aRaceDate: Date, startDate: Date): TrainingCycle {
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const totalWeeks = Math.ceil((aRaceDate.getTime() - startDate.getTime()) / msPerWeek);

  const phases: Phase[] = [];

  // Taper is usually 2-3 weeks before A race
  const taperWeeks = 2;
  const mainTrainingWeeks = totalWeeks - taperWeeks;

  if (mainTrainingWeeks >= 16) {
    // Full 4 phases, 4 weeks each if possible
    const phaseLen = Math.floor(mainTrainingWeeks / 4);
    const remainder = mainTrainingWeeks % 4;

    phases.push({ type: 'Base', startWeek: 1, endWeek: phaseLen + (remainder > 0 ? 1 : 0), focusZone: 'E' });
    phases.push({ type: 'Economy', startWeek: phases[0].endWeek + 1, endWeek: phases[0].endWeek + phaseLen + (remainder > 1 ? 1 : 0), focusZone: 'R' });
    phases.push({ type: 'Threshold', startWeek: phases[1].endWeek + 1, endWeek: phases[1].endWeek + phaseLen + (remainder > 2 ? 1 : 0), focusZone: 'T' });
    phases.push({ type: 'Peak', startWeek: phases[2].endWeek + 1, endWeek: mainTrainingWeeks, focusZone: 'I' });
  } else if (mainTrainingWeeks >= 10) {
    // Compress phases to min weeks proportionally
    // Min weeks: Ph1:1, Ph2:2, Ph3:2, Ph4:2 (Total 7)
    const ph1 = 1 + Math.floor((mainTrainingWeeks - 7) / 4);
    const ph2 = 2 + Math.floor((mainTrainingWeeks - 7) / 4);
    const ph3 = 2 + Math.floor((mainTrainingWeeks - 7) / 4);
    const ph4 = mainTrainingWeeks - ph1 - ph2 - ph3;

    phases.push({ type: 'Base', startWeek: 1, endWeek: ph1, focusZone: 'E' });
    phases.push({ type: 'Economy', startWeek: ph1 + 1, endWeek: ph1 + ph2, focusZone: 'R' });
    phases.push({ type: 'Threshold', startWeek: ph1 + ph2 + 1, endWeek: ph1 + ph2 + ph3, focusZone: 'T' });
    phases.push({ type: 'Peak', startWeek: ph1 + ph2 + ph3 + 1, endWeek: mainTrainingWeeks, focusZone: 'I' });
  } else if (mainTrainingWeeks >= 6) {
    // 6–11 weeks: Ph 1+2 merged, Ph 3+4
    const ph12 = Math.floor(mainTrainingWeeks / 2);
    const ph34 = mainTrainingWeeks - ph12;
    phases.push({ type: 'Base', startWeek: 1, endWeek: ph12, focusZone: 'E' }); // Merged Ph1+2
    phases.push({ type: 'Threshold', startWeek: ph12 + 1, endWeek: mainTrainingWeeks, focusZone: 'T' }); // Ph 3+4
  } else {
    // < 6 weeks: Ph 3+4 only
    phases.push({ type: 'Threshold', startWeek: 1, endWeek: mainTrainingWeeks, focusZone: 'T' });
  }

  phases.push({ type: 'Taper', startWeek: mainTrainingWeeks + 1, endWeek: totalWeeks });

  return {
    aRaceDate,
    phases,
    totalWeeks
  };
}

export interface DayPlan {
  date: Date;
  type: 'Rest' | 'Easy' | 'Long' | 'Quality';
  zone?: keyof typeof VDOT_COEFFS;
  durationMin: number;
  distanceKm: number;
  rpe: number;
  load: number;
}

/**
 * Day Placement Algorithm
 * Follows the 6-rule priority system and 3.1 placement sequence.
 */
export function planWeek(
  startDate: Date,
  phase: Phase,
  availableDays: number[], // 0-6 (Sun-Sat)
  weeklyTargetKm: number,
  vdot: number,
  chronicLoad: number = 0
): DayPlan[] {
  const week: DayPlan[] = [];
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }

  // 1. Identify available days
  const availableIndices = availableIndicesFromDays(availableDays);
  const numAvailable = availableIndices.length;

  // 2. Determine Quality Sessions based on Phase
  const qualitySessions: { zone: keyof typeof VDOT_COEFFS; distance: number }[] = [];
  const maxQuality = numAvailable >= 3 ? 2 : (numAvailable > 0 ? 1 : 0);

  if (phase.type === 'Economy' && maxQuality >= 1) {
    qualitySessions.push({ zone: 'R', distance: Math.min(weeklyTargetKm * 0.05, 5) });
  } else if (phase.type === 'Threshold' && maxQuality >= 1) {
    qualitySessions.push({ zone: 'T', distance: weeklyTargetKm * 0.1 });
    if (maxQuality >= 2) {
      qualitySessions.push({ zone: 'T', distance: weeklyTargetKm * 0.1 });
    }
  } else if (phase.type === 'Peak' && maxQuality >= 1) {
    qualitySessions.push({ zone: 'I', distance: Math.min(weeklyTargetKm * 0.08, 10) });
    if (maxQuality >= 2) {
      qualitySessions.push({ zone: 'T', distance: weeklyTargetKm * 0.1 });
    }
  }

  // 3. Place Quality Sessions (Spaced apart, no consecutive)
  const plan: (DayPlan | null)[] = new Array(7).fill(null);
  
  if (qualitySessions.length > 0) {
    if (qualitySessions.length === 1) {
      // Place in middle of week (Wed/Thu) if available, or first available
      const preferred = [3, 2, 4, 1, 5, 0, 6];
      const idx = preferred.find(i => availableIndices.includes(i)) ?? availableIndices[0];
      plan[idx] = createSession(days[idx], 'Quality', qualitySessions[0].zone, qualitySessions[0].distance, vdot);
    } else {
      // Place two sessions spaced out (Tue & Thu or Wed & Sat etc)
      let first = availableIndices.find(i => i >= 1) ?? availableIndices[0];
      let second = availableIndices.find(i => i >= first + 2) ?? availableIndices.find(i => i > first + 1);
      
      if (first !== undefined) {
        plan[first] = createSession(days[first], 'Quality', qualitySessions[0].zone, qualitySessions[0].distance, vdot);
      }
      if (second !== undefined) {
        plan[second] = createSession(days[second], 'Quality', qualitySessions[1].zone, qualitySessions[1].distance, vdot);
      }
    }
  }

  // 4. Place Long Run (25-30% of weekly volume)
  const longRunDist = weeklyTargetKm * 0.28;
  const longRunIdx = [6, 5, 0].find(i => availableIndices.includes(i) && plan[i] === null && (i === 0 || plan[i-1] === null));
  if (longRunIdx !== undefined) {
    plan[longRunIdx] = createSession(days[longRunIdx], 'Long', 'E', longRunDist, vdot);
  }

  // 5. Fill remaining available days with Easy runs
  const usedDist = plan.reduce((acc, p) => acc + (p?.distanceKm || 0), 0);
  const remainingDist = Math.max(0, weeklyTargetKm - usedDist);
  const emptyAvailableIndices = availableIndices.filter(i => plan[i] === null);
  
  if (emptyAvailableIndices.length > 0) {
    const distPerEasy = remainingDist / emptyAvailableIndices.length;
    emptyAvailableIndices.forEach(i => {
      plan[i] = createSession(days[i], 'Easy', 'E', distPerEasy, vdot);
    });
  }

  // 6. Finalize week and handle Rest days
  const finalWeek: DayPlan[] = plan.map((p, i) => p || {
    date: days[i],
    type: 'Rest',
    durationMin: 0,
    distanceKm: 0,
    rpe: 0,
    load: 0
  });

  // 7. ACWR Auto-trim check
  const totalWeeklyLoad = finalWeek.reduce((acc, p) => acc + p.load, 0);
  const projectedACWR = chronicLoad > 0 ? totalWeeklyLoad / chronicLoad : 1.0;

  if (projectedACWR > 1.5) {
    // Reduce Easy/Long volume until ACWR <= 1.3
    const targetLoad = chronicLoad * 1.3;
    let currentLoad = totalWeeklyLoad;
    for (const session of finalWeek) {
      if ((session.type === 'Easy' || session.type === 'Long') && currentLoad > targetLoad) {
        const reductionFactor = Math.max(0.5, targetLoad / currentLoad);
        const oldLoad = session.load;
        session.distanceKm *= reductionFactor;
        session.durationMin *= reductionFactor;
        session.load = Math.round(session.rpe * session.durationMin);
        currentLoad -= (oldLoad - session.load);
      }
    }
  }

  return finalWeek;
}

function createSession(date: Date, type: DayPlan['type'], zone: keyof typeof VDOT_COEFFS, distanceKm: number, vdot: number): DayPlan {
  const paceSec = getZonePace(vdot, zone);
  const durationMin = (distanceKm * paceSec) / 60;
  const rpe = type === 'Quality' ? (zone === 'R' ? 9 : zone === 'I' ? 8 : 7) : (type === 'Long' ? 5 : 4);
  
  return {
    date,
    type,
    zone,
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMin: Math.round(durationMin),
    rpe,
    load: Math.round(rpe * durationMin)
  };
}

function availableIndicesFromDays(availableDays: number[]): number[] {
  // Convert [0,1,2] to indices where 0 is the start of the week provided
  return availableDays.sort((a, b) => a - b);
}
