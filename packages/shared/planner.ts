
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

  if (mainTrainingWeeks >= 18) {
    // Full 4 phases, 4 weeks each if possible
    const phaseLen = Math.floor(mainTrainingWeeks / 4);
    const remainder = mainTrainingWeeks % 4;

    phases.push({ type: 'Base', startWeek: 1, endWeek: phaseLen + (remainder > 0 ? 1 : 0), focusZone: 'E' });
    phases.push({ type: 'Economy', startWeek: phases[0].endWeek + 1, endWeek: phases[0].endWeek + phaseLen + (remainder > 1 ? 1 : 0), focusZone: 'R' });
    phases.push({ type: 'Threshold', startWeek: phases[1].endWeek + 1, endWeek: phases[1].endWeek + phaseLen + (remainder > 2 ? 1 : 0), focusZone: 'T' });
    phases.push({ type: 'Peak', startWeek: phases[2].endWeek + 1, endWeek: mainTrainingWeeks, focusZone: 'I' });
  } else if (mainTrainingWeeks >= 12) {
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
  type: 'Rest' | 'Easy' | 'Long' | 'Quality' | 'Race';
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
  chronicLoad: number = 0,
  aRaceDate?: Date,
  aRaceDistance?: number
): DayPlan[] {
  let adjustedTarget = weeklyTargetKm;
  if (phase.type === 'Taper') {
    adjustedTarget *= 0.75; // 25% reduction for taper weeks
  } else if (phase.type === 'Recovery') {
    adjustedTarget *= 0.50; // 50% reduction for recovery weeks
  }

  const week: DayPlan[] = [];
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }

  // 1. Identify available days relative to startDate
  const availableIndices = availableIndicesFromDays(availableDays, startDate);
  
  // 2. Determine Quality Sessions based on Phase
  const qualitySessions: { zone: keyof typeof VDOT_COEFFS; distance: number }[] = [];
  const maxQuality = availableIndices.length >= 3 ? 2 : (availableIndices.length > 0 ? 1 : 0);
  
  // Rotating quality zone for variety if maxQuality is 1
  const weekNum = Math.floor(startDate.getTime() / (1000 * 60 * 60 * 24 * 7));
  const isAltWeek = weekNum % 2 === 0;

  if (phase.type === 'Recovery') {
    // No quality sessions in recovery phase
  } else if (phase.type === 'Taper') {
    // Taper keeps one quality session but reduces intensity or duration
    if (maxQuality >= 1) {
      qualitySessions.push({ zone: 'T', distance: Math.round(adjustedTarget * 0.1 * 10) / 10 });
    }
  } else if (phase.type === 'Base') {
    // Add light variety even in Base phase (Strides/Tempo every other week)
    if (maxQuality >= 1 && isAltWeek) {
      const zone: keyof typeof VDOT_COEFFS = (weekNum % 4 === 0) ? 'R' : 'T';
      qualitySessions.push({ zone, distance: Math.round(adjustedTarget * 0.08 * 10) / 10 });
    }
  } else if (phase.type === 'Economy' && maxQuality >= 1) {
    if (maxQuality === 1 && isAltWeek) {
       qualitySessions.push({ zone: 'T', distance: Math.round(adjustedTarget * 0.1 * 10) / 10 });
    } else {
       qualitySessions.push({ zone: 'R', distance: Math.min(Math.round(adjustedTarget * 0.05 * 10) / 10, 5) });
    }
  } else if (phase.type === 'Threshold' && maxQuality >= 1) {
    qualitySessions.push({ zone: 'T', distance: Math.round(adjustedTarget * 0.1 * 10) / 10 });
    if (maxQuality >= 2) {
      qualitySessions.push({ zone: 'T', distance: Math.round(adjustedTarget * 0.1 * 10) / 10 });
    }
  } else if (phase.type === 'Peak' && maxQuality >= 1) {
    if (maxQuality === 1 && isAltWeek) {
       qualitySessions.push({ zone: 'T', distance: Math.round(adjustedTarget * 0.1 * 10) / 10 });
    } else {
       qualitySessions.push({ zone: 'I', distance: Math.min(Math.round(adjustedTarget * 0.08 * 10) / 10, 10) });
    }
    if (maxQuality >= 2) {
      qualitySessions.push({ zone: 'T', distance: Math.round(adjustedTarget * 0.1 * 10) / 10 });
    }
  }

  // 3. Place Quality Sessions (Spaced apart, no consecutive)
  const plan: (DayPlan | null)[] = new Array(7).fill(null);

  // Check if A-Race is in this week
  let raceIdx = -1;
  if (aRaceDate) {
    raceIdx = days.findIndex(d => d.toDateString() === aRaceDate.toDateString());
    if (raceIdx !== -1) {
      plan[raceIdx] = createSession(days[raceIdx], 'Race', 'I', Math.round((aRaceDistance || 10) * 10) / 10, vdot);
      plan[raceIdx]!.rpe = 10; // Max effort for race
    }
  }
  
  if (qualitySessions.length > 0) {
    const qualityDays = availableIndices.filter(i => i !== raceIdx);
    if (qualitySessions.length === 1 && qualityDays.length > 0) {
      // Place quality session as far from race as possible
      const idx = qualityDays.sort((a, b) => Math.abs(b - (raceIdx === -1 ? 3 : raceIdx)) - Math.abs(a - (raceIdx === -1 ? 3 : raceIdx)))[0];
      plan[idx] = createSession(days[idx], 'Quality', qualitySessions[0].zone, qualitySessions[0].distance, vdot);
    } else if (qualitySessions.length >= 2 && qualityDays.length >= 2) {
      // Basic spacing
      let first = qualityDays[0];
      let second = qualityDays.find(i => i >= first + 2) ?? qualityDays[qualityDays.length - 1];
      
      plan[first] = createSession(days[first], 'Quality', qualitySessions[0].zone, qualitySessions[0].distance, vdot);
      if (second !== first) {
        plan[second] = createSession(days[second], 'Quality', qualitySessions[1].zone, qualitySessions[1].distance, vdot);
      }
    }
  }

  // 4. Place Long Run (25-30% of weekly volume) - Rule 2: Never the day before a quality session
  // Spec Rule 3.6: Cap enforced. Never more than 30% of total planned weekly mileage.
  const longRunDist = Math.round(Math.min(adjustedTarget * 0.28, adjustedTarget * 0.30) * 10) / 10;
  
  // Find a spot for long run that isn't the race or quality day
  const longRunIdx = [6, 5, 0].find(i => 
    availableIndices.includes(i) && 
    plan[i] === null && 
    (i === 0 || plan[i-1] === null) &&  // day before is empty
    (i === 6 || plan[i+1] === null)     // day after is empty (Rule 2)
  );

  // Skip long run in Race week if the race is long (> 10km)
  const isRaceLong = raceIdx !== -1 && (aRaceDistance || 0) >= 10;
  if (longRunIdx !== undefined && !isRaceLong && phase.type !== 'Recovery') {
    plan[longRunIdx] = createSession(days[longRunIdx], 'Long', 'E', longRunDist, vdot);
  }

  // 5. Fill remaining available days with Easy runs
  // Spec Rule 3.6: Any single run (even Easy) should not exceed 30% of weekly volume.
  const usedDist = plan.reduce((acc, p) => acc + (p?.distanceKm || 0), 0);
  const remainingDist = Math.max(0, adjustedTarget - usedDist);
  const emptyAvailableIndices = availableIndices.filter(i => plan[i] === null);
  
  if (emptyAvailableIndices.length > 0) {
    const capPerEasy = Math.round(Math.min(adjustedTarget * 0.20, longRunDist > 0 ? longRunDist : adjustedTarget * 0.3) * 10) / 10;
    const distPerEasy = Math.round(Math.min(remainingDist / emptyAvailableIndices.length, capPerEasy) * 10) / 10;
    
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
        session.distanceKm = Math.round(session.distanceKm * reductionFactor * 10) / 10;
        session.durationMin = Math.round(session.durationMin * reductionFactor);
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

function availableIndicesFromDays(availableDays: number[], startDate: Date): number[] {
  const startDay = startDate.getDay();
  // Map absolute days (0=Sun, 1=Mon...) to relative indices [0..6] from startDate
  return availableDays
    .map(day => (day - startDay + 7) % 7)
    .sort((a, b) => a - b);
}
