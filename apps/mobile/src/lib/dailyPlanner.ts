
/**
 * Bridges shared algorithms with mobile-specific types and UI needs.
 */

import {
  planSeason,
  planWeek,
  Phase,
  DayPlan as SharedDayPlan,
  evaluateAdaptiveLevel,
} from '../../../../packages/shared/planner';
import {
  getZonePace,
  calculateNextWeeklyKm,
  calculateACWR,
  classifyGoal,
  getNextVdotMilestone,
} from '../../../../packages/shared/training';
import { calculateMuscularRisks } from '../../../backend/src/lib/load';
import { TrainingTarget } from '../types';
import { tokens } from '../tokens';
import { AdaptiveState, PointsHistoryEntry } from '../../../../packages/shared/index';

export interface Athlete {
  maxHR: number;
  restHR: number;
  weight: number;
  height?: number;
  sex?: 'M' | 'F';
  vdot?: number;
  goalVdot?: number;             // target VDOT for goal classification
  previousWeeklyKm?: number;     // actual km completed last week (seed for calculateNextWeeklyKm)
  availableMinutesPerWeek?: number; // total weekly time budget
  weeklyPointsTarget?: number;
  adaptiveState?: AdaptiveState;
  pointsHistory?: PointsHistoryEntry[];
}

export interface DailyPlan extends SharedDayPlan {
  title: string;
  description: string;
  intensity: 'rest' | 'low' | 'medium' | 'high';
  isTaper: boolean;
  isRaceDay: boolean;
  racePriority: string | null;
  dayNum: number;
  dayOfWeek: string;
  vdotZone: string;
  targetDistanceKm: number;
  targetDurationMin: number;
  targetPaceSecPerKm: number;
  rpe: number;
}

export interface PlanConfig {
  freeDays: string[];
  weeklyTargetKm?: number;       // optional fallback; adaptive km is computed each week
  longRunTargetKm?: number;
  aRaceDate?: Date;
}

export const getDayTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'race': return tokens.color.warning;
    case 'quality': return tokens.color.primary;
    case 'long': return tokens.color.accent;
    case 'rest': return tokens.color.textTertiary;
    default: return tokens.color.success;
  }
};

export const getDayTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'race': return '🏁';
    case 'quality': return '⚡️';
    case 'long': return '🏔';
    case 'rest': return '😴';
    default: return '🍃';
  }
};

export const getVdotZoneLabel = (zone: string | undefined) => zone || 'E';

const DAY_MAP: Record<string, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0
};

function phaseToNumber(phase: Phase): number {
  switch (phase.type) {
    case 'Base':      return 1;
    case 'Economy':   return 2;
    case 'Threshold': return 3;
    default:          return 4; // Peak, Taper, Recovery
  }
}

export const generateSmartPlan = (
  target: TrainingTarget,
  activities: any[],
  athlete: Athlete,
  config: PlanConfig,
  readinessScores: Record<string, number> = {},
  temps: Record<string, number> = {},
  plannedRaces: any[] = []
): { dailyPlan: DailyPlan[]; weeklyStats: any[] } => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const aRaceDate = config.aRaceDate ? new Date(config.aRaceDate) : new Date(target.targetDate);
  aRaceDate.setHours(0, 0, 0, 0);

  // Goal VDOT classification — determine effective planning VDOT
  const currentVdot = athlete.vdot || 40;
  const goalVdot = athlete.goalVdot ?? currentVdot;
  const goalClass = classifyGoal(currentVdot, goalVdot);
  // For multi-cycle goals, plan toward the next intermediate milestone instead of the full goal
  const planningVdot = goalClass === 'multi_cycle_goal'
    ? getNextVdotMilestone(currentVdot, goalVdot)
    : currentVdot;

  // Compute initial easy pace (min/km) for time-budget derivation
  const easyPaceSecPerKm = getZonePace(planningVdot, 'E');
  const easyPaceMinPerKm = easyPaceSecPerKm / 60;

  // Seed for adaptive weekly km computation
  const seedWeeklyKm = athlete.previousWeeklyKm ?? config.weeklyTargetKm ?? 30;
  const availableMinPerWeek = athlete.availableMinutesPerWeek ?? (seedWeeklyKm * easyPaceMinPerKm * 1.2);

  // Race date map
  const raceDates = new Map<string, { distance: number; priority: string; title: string; durationMin: number }>();
  for (const race of plannedRaces) {
    const raceDate = new Date(race.date || race.startedAt);
    raceDates.set(raceDate.toLocaleDateString('en-CA'), {
      distance: (race.distanceM || 0) / 1000 || race.distance || 0,
      priority: race.racePriority || 'c-race',
      title: race.title || 'Race Day',
      durationMin: Math.round(((race.durationSec || race.duration) || 0) / 60) || 0
    });
  }

  // Compute live fatigue from actual activities (used for first week only)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { legMuscularRisk: liveLMR, totalBodyFatigue: liveTBF } = calculateMuscularRisks(
    activities.map(w => ({
      legStress: w.legStress || 0,
      totalStress: w.systemicStress || 0,
      date: new Date(w.startedAt)
    })),
    today
  );
  const todayStr = today.toISOString().split('T')[0];
  const todayReadiness = readinessScores[todayStr] ?? 100;

  const season = planSeason(aRaceDate, startDate);
  const recoveryWeeks = 2;
  const totalWeeks = season.totalWeeks + recoveryWeeks;
  const freeDayIndices = config.freeDays
    .map(d => DAY_MAP[d.toLowerCase()] ?? parseInt(d))
    .filter(n => !isNaN(n));

  let allDays: DailyPlan[] = [];
  let dayCounter = 1;

  // Rolling state across weeks
  let previousWeeklyKm = seedWeeklyKm;
  const last4WeeklyLoads: number[] = []; // true 4-week rolling history
  let adaptivePointsTarget = athlete.weeklyPointsTarget ?? 50;
  let adaptiveState: AdaptiveState = athlete.adaptiveState ?? 'normal';
  const pointsHistory: PointsHistoryEntry[] = [...(athlete.pointsHistory ?? [])];

  for (let w = 0; w < totalWeeks; w++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + w * 7);

    let phase = season.phases.find(p => w + 1 >= p.startWeek && w + 1 <= p.endWeek);
    if (!phase) {
      phase = w + 1 > season.totalWeeks
        ? { type: 'Recovery', startWeek: season.totalWeeks + 1, endWeek: totalWeeks, focusZone: 'E' }
        : season.phases[0];
    }

    // ── Adaptive ACWR (true 4-week rolling) ──
    const acuteLoad = last4WeeklyLoads[last4WeeklyLoads.length - 1] ?? 0;
    const chronicHistory = last4WeeklyLoads.length > 1 ? last4WeeklyLoads.slice(0, -1) : last4WeeklyLoads;
    const currentAcwr = calculateACWR(acuteLoad, chronicHistory.length > 0 ? chronicHistory : [acuteLoad]);

    // ── Adaptive points target (Section 10) ──
    const adaptResult = evaluateAdaptiveLevel({
      maxHR: athlete.maxHR,
      restHR: athlete.restHR,
      weight: athlete.weight,
      vdot: planningVdot,
      weeklyPointsTarget: adaptivePointsTarget,
      adaptiveState,
      pointsHistory,
    });
    adaptivePointsTarget = adaptResult.newTarget;
    adaptiveState = adaptResult.newState;

    // ── Compute this week's km target (derived output) ──
    const phaseNum = phaseToNumber(phase);
    let weeklyKm = calculateNextWeeklyKm(
      previousWeeklyKm,
      availableMinPerWeek,
      easyPaceMinPerKm,
      phaseNum,
      currentAcwr,
      w === 0 ? todayReadiness : 100, // only penalise for known readiness (today)
      freeDayIndices.length
    );

    // 4th-week deload: –20% every 4th week in the cycle
    if (w > 0 && (w + 1) % 4 === 0) {
      weeklyKm = Math.round(weeklyKm * 0.80 * 10) / 10;
    }

    // Pass live fatigue only for the current week; future weeks = 0
    const lmr = w === 0 ? liveLMR : 0;
    const tbf = w === 0 ? liveTBF : 0;
    const readiness = w === 0 ? todayReadiness : 100;

    const weekPlan = planWeek(
      weekStartDate,
      phase,
      freeDayIndices,
      weeklyKm,
      planningVdot,
      last4WeeklyLoads.length > 0
        ? last4WeeklyLoads.reduce((a, b) => a + b, 0) / last4WeeklyLoads.length
        : 0,
      aRaceDate,
      target.distanceKm,
      adaptivePointsTarget,
      lmr,
      tbf,
      readiness
    );

    // ── Map to mobile DailyPlan ──
    const mobileWeekPlan: DailyPlan[] = weekPlan.map(dp => {
      const dayNum = dayCounter++;
      const dateObj = new Date(dp.date);
      const dateKey = dateObj.toLocaleDateString('en-CA');
      const raceInfo = raceDates.get(dateKey);

      let bRaceNear = false;
      for (let offset = -3; offset <= 3; offset++) {
        const checkDate = new Date(dateObj);
        checkDate.setDate(checkDate.getDate() + offset);
        const nearbyRace = raceDates.get(checkDate.toLocaleDateString('en-CA'));
        if (nearbyRace?.priority === 'b-race' || nearbyRace?.priority === 'd-race') bRaceNear = true;
      }

      let finalType = dp.type;
      let finalTitle = getTitle(dp);
      let finalDesc = getDescription(dp);
      let finalDistance = dp.distanceKm;
      let finalDuration = dp.durationMin;

      if (raceInfo) {
        finalType = 'Race' as any;
        finalTitle = raceInfo.title || '🏁 Race Day';
        finalDistance = raceInfo.distance;
        finalDuration = raceInfo.durationMin > 0
          ? raceInfo.durationMin
          : Math.round(raceInfo.distance * (target.distanceKm > 10 ? 6 : 5.5));
        finalDesc = raceInfo.priority === 'd-race'
          ? `${raceInfo.distance}km trail race. Taper well and account for vertical gain.`
          : `${raceInfo.distance}km ${raceInfo.priority === 'b-race' ? 'B' : 'C'} race. This is a ${raceInfo.priority === 'b-race' ? 'key preparation' : 'training'} race.`;
      } else if (bRaceNear && dp.type !== 'Rest') {
        if (dp.type === 'Quality') {
          finalType = 'Easy' as any;
          finalTitle = 'Easy (B race prep)';
          finalDesc = 'Reduced load before B race.';
          finalDistance = Math.round(finalDistance * 0.6);
          finalDuration = Math.round(finalDuration * 0.6);
        } else if (dp.type === 'Long') {
          finalDistance = Math.round(finalDistance * 0.7);
          finalDuration = Math.round(finalDuration * 0.7);
          finalTitle = `${finalTitle} (tapered)`;
          finalDesc = 'Tapered long run before B race.';
        } else if (dp.type === 'Easy' && dp.distanceKm > 5) {
          finalDistance = Math.round(finalDistance * 0.8);
          finalDuration = Math.round(finalDuration * 0.8);
        }
      }

      return {
        ...dp,
        type: finalType,
        date: dp.date,
        dayNum,
        dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        vdotZone: dp.zone || 'E',
        targetDistanceKm: finalDistance,
        targetDurationMin: finalDuration,
        targetPaceSecPerKm: finalDistance > 0 ? (finalDuration * 60) / finalDistance : 0,
        title: finalTitle,
        description: finalDesc,
        intensity: getIntensity(dp),
        isTaper: phase!.type === 'Taper' || !!raceInfo,
        isRaceDay: !!raceInfo,
        racePriority: raceInfo?.priority || null
      };
    });

    allDays = allDays.concat(mobileWeekPlan);

    // ── Update rolling state for next iteration ──
    const weeklyLoad = weekPlan.reduce((acc, p) => acc + p.load, 0);
    last4WeeklyLoads.push(weeklyLoad);
    if (last4WeeklyLoads.length > 4) last4WeeklyLoads.shift(); // keep only last 4 weeks

    // Record this week in points history for adaptive logic
    const weekActualPoints = weekPlan.reduce((acc, p) => acc + p.danielsPoints, 0);
    pointsHistory.push({
      week: w + 1,
      target: adaptivePointsTarget,
      actual: Math.round(weekActualPoints),
      acwr: Math.round(currentAcwr * 100) / 100,
    });
    if (pointsHistory.length > 6) pointsHistory.shift(); // keep rolling window

    previousWeeklyKm = weeklyKm;
  }

  return { dailyPlan: allDays, weeklyStats: [] };
};

export const adaptPlanAfterNewWorkout = (
  basePlan: DailyPlan[],
  lastWorkout: any,
  athlete: any,
  readinessScores: Record<string, number>,
  allRecentWorkouts: any[] = []
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const muscularRisk = calculateMuscularRisks(
    allRecentWorkouts.map(w => ({
      legStress: w.legStress || 0,
      totalStress: w.systemicStress || 0,
      date: new Date(w.startedAt)
    })),
    today
  );

  return basePlan.map(day => {
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    const isToday = dayDate.getTime() === today.getTime();

    // "Today" Guard — already trained
    if (isToday && lastWorkout) {
      const workoutDate = new Date(lastWorkout.startedAt || lastWorkout.date);
      workoutDate.setHours(0, 0, 0, 0);
      if (workoutDate.getTime() === today.getTime()) {
        const distKm = (lastWorkout.distanceM || 0) / 1000 || lastWorkout.distance || 0;
        return {
          ...day,
          type: 'Rest' as any,
          title: 'Workout Completed',
          description: `You already ran ${distKm.toFixed(1)}km today. Focus on recovery.`,
          distanceKm: 0,
          durationMin: 0,
          intensity: 'rest' as any
        };
      }
    }

    // Auto-downgrade quality if fatigue gate fails (LMR > 68 or readiness < 55)
    const finalLegRiskLevel = Math.max(muscularRisk.legMuscularRisk, muscularRisk.totalBodyFatigue * 0.7);
    const readiness = readinessScores[todayStr] ?? 100;
    if (isToday && (finalLegRiskLevel > 68 || readiness < 55) && day.type === 'Quality') {
      const paceSec = getZonePace(athlete.vdot || 40, 'E');
      const reason = finalLegRiskLevel > 68
        ? `high Leg Muscular Risk (${Math.round(finalLegRiskLevel)}%)`
        : `low readiness (${Math.round(readiness)}%)`;
      return {
        ...day,
        type: 'Easy' as any,
        zone: 'E' as any,
        title: 'Easy Run (Recovery)',
        description: `Downgraded from quality — ${reason}.`,
        targetPaceSecPerKm: paceSec,
        targetDurationMin: Math.round((day.targetDistanceKm * paceSec) / 60),
        intensity: 'low' as any
      };
    }

    // Readiness trimming
    const diffDays = Math.round((dayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (readiness < 55 && diffDays >= 0 && diffDays <= 1) {
      if (day.type === 'Quality') {
        if (readiness < 40) {
          const paceSec = getZonePace(athlete.vdot || 40, 'E');
          return {
            ...day,
            type: 'Easy' as any,
            zone: 'E' as any,
            title: 'Easy Run (Low Readiness)',
            description: `Downgraded — readiness ${readiness.toFixed(0)}% (red zone).`,
            targetPaceSecPerKm: paceSec,
            targetDurationMin: Math.round((day.targetDistanceKm * paceSec) / 60),
            intensity: 'low' as any,
          };
        }
        return {
          ...day,
          title: `⚠️ ${day.title} (Low Readiness)`,
          description: `Readiness ${readiness.toFixed(0)}% — consider reducing intensity.`,
          intensity: 'high' as any,
        };
      }

      if (day.type === 'Easy' || day.type === 'Long') {
        const reduction = readiness < 40 ? (diffDays === 0 ? 0.6 : 0.8) : 0.85;
        return {
          ...day,
          title: `${day.title} (Adjusted)`,
          distanceKm: Math.round(day.distanceKm * reduction * 10) / 10,
          durationMin: Math.round(day.durationMin * reduction),
          description: `Volume trimmed — readiness ${readiness.toFixed(0)}%.`,
        };
      }
    }

    return day;
  });
};

function getTitle(dp: SharedDayPlan): string {
  if (dp.type === 'Rest') return 'Rest Day';
  if (dp.type === 'Race') return '🏆 Race Day!';
  if (dp.type === 'Long') return 'Long Run';
  if (dp.type === 'Quality') {
    if (dp.zone === 'T') return 'Tempo Run';
    if (dp.zone === 'R') return 'Cadence Intervals';
    return `${dp.zone} Intervals`;
  }
  return 'Easy Run';
}

function getDescription(dp: SharedDayPlan): string {
  if (dp.type === 'Rest') return 'Full recovery day. Focus on mobility and sleep.';
  if (dp.type === 'Race') return `Target: ${dp.distanceKm}km. This is what we trained for. Good luck!`;
  if (dp.type === 'Quality' && dp.reps) {
    return `${dp.reps} × ${Math.round((dp.durationMin / dp.reps))} min at ${dp.zone} pace. Rest: ${Math.round((dp.restSec ?? 0) / 60)} min between reps.`;
  }
  return `${dp.distanceKm}km at ${dp.zone || 'E'} pace. Target duration: ${dp.durationMin} min.`;
}

function getIntensity(dp: SharedDayPlan): DailyPlan['intensity'] {
  if (dp.type === 'Rest') return 'rest';
  if (dp.type === 'Race') return 'high';
  if (dp.type === 'Quality') return 'high';
  if (dp.type === 'Long') return 'medium';
  return 'low';
}

export interface LoadMetrics {
  acwr: number;
  monotony: number;
  strain: number;
  acuteLoad: number;
  chronicLoad: number;
  warnings: string[];
}

export function calculateLoadMetrics(
  dailyPlan: DailyPlan[],
  currentAcuteLoad: number = 0,
  currentChronicLoad: number = 0
): LoadMetrics {
  const warnings: string[] = [];

  const dailyLoads = dailyPlan.map(day => (day.durationMin || 0) * (day.rpe || 5));
  const totalWeeklyLoad = dailyLoads.reduce((a, b) => a + b, 0);

  const chronicLoad = currentChronicLoad > 0
    ? currentChronicLoad
    : currentAcuteLoad > 0 ? currentAcuteLoad : totalWeeklyLoad;

  const acwr = chronicLoad > 0 ? totalWeeklyLoad / chronicLoad : 1.0;

  const avgDailyLoad = totalWeeklyLoad / 7;
  const variance = dailyLoads.reduce((sum, l) => sum + Math.pow(l - avgDailyLoad, 2), 0) / 7;
  const stdDev = Math.sqrt(variance);
  const monotony = stdDev > 0 ? avgDailyLoad / stdDev : 1.0;
  const strain = totalWeeklyLoad * monotony;

  if (acwr > 1.5) warnings.push(`⚠️ ACWR is ${acwr.toFixed(1)} (safe: 0.8–1.3). Easy runs will be trimmed.`);
  else if (acwr < 0.8) warnings.push(`📉 ACWR is ${acwr.toFixed(1)} — consider increasing load.`);
  if (monotony > 2.0 && totalWeeklyLoad > 300) warnings.push(`⚠️ Monotony ${monotony.toFixed(1)} (safe: <2.0). Vary intensity.`);
  if (strain > 5000 && monotony > 1.5) warnings.push(`🚨 High strain — illness risk elevated.`);

  return {
    acwr: Math.round(acwr * 100) / 100,
    monotony: Math.round(monotony * 100) / 100,
    strain: Math.round(strain),
    acuteLoad: Math.round(totalWeeklyLoad),
    chronicLoad: Math.round(chronicLoad),
    warnings
  };
}
