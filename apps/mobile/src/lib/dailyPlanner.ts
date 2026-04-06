
/**
 * dailyPlanner.ts — Mobile-side Training Plan Generator
 * Bridges shared algorithms with mobile-specific types and UI needs.
 */

import { 
  planSeason, 
  planWeek, 
  Phase, 
  DayPlan as SharedDayPlan 
} from '../../../../packages/shared/planner';
import { VDOT_COEFFS } from '../../../../packages/shared/training';
import { TrainingTarget } from '../types';
import { tokens } from '../tokens';

export interface Athlete {
  maxHR: number;
  restHR: number;
  weight: number;
  height?: number;
  sex?: 'M' | 'F';
  vdot?: number;
}

export interface DailyPlan extends SharedDayPlan {
  // UI Specific extensions
  title: string;
  description: string;
  intensity: 'rest' | 'low' | 'medium' | 'high';
  isTaper: boolean;
  // Fields for PlanScreen compatibility
  dayNum: number;
  dayOfWeek: string;
  vdotZone: string;
  targetDistanceKm: number;
  targetDurationMin: number;
  targetPaceSecPerKm: number;
  rpe: number;
}

export interface PlanConfig {
  freeDays: string[]; // 0-6 or names
  weeklyTargetKm: number;
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

export const getVdotZoneLabel = (zone: string | undefined) => {
  return zone || 'E';
};

const DAY_MAP: Record<string, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0
};

export const generateSmartPlan = (
  target: TrainingTarget,
  activities: any[],
  athlete: Athlete,
  config: PlanConfig,
  readinessScores: Record<string, number> = {},
  temps: Record<string, number> = {},
  plannedRaces: any[] = []
): { dailyPlan: DailyPlan[]; weeklyStats: any[] } => {
  const vdot = athlete.vdot || 40;
  
  // Use current system date for planning start
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  const aRaceDate = config.aRaceDate ? new Date(config.aRaceDate) : new Date(target.targetDate);
  aRaceDate.setHours(0, 0, 0, 0);
  
  // Build a map of race dates to avoid scheduling hard workouts nearby
  const raceDates = new Map<string, { distance: number; priority: string }>();
  for (const race of plannedRaces) {
    const raceDate = new Date(race.date || race.startedAt);
    raceDate.setHours(0, 0, 0, 0);
    const key = raceDate.toISOString().split('T')[0];
    raceDates.set(key, { distance: race.distance || 0, priority: race.racePriority || 'c-race' });
  }
  
  const season = planSeason(aRaceDate, startDate);
  
  // Add 2 weeks of recovery after the race if targetDate is reached
  const recoveryWeeks = 2;
  const totalWeeks = season.totalWeeks + recoveryWeeks;
  
  const freeDayIndices = config.freeDays.map(d => DAY_MAP[d.toLowerCase()] ?? parseInt(d)).filter(n => !isNaN(n));
  
  let allDays: DailyPlan[] = [];
  let chronicLoad = 0; 
  let dayCounter = 1;
  
  for (let w = 0; w < totalWeeks; w++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + w * 7);
    
    let phase = season.phases.find(p => w + 1 >= p.startWeek && w + 1 <= p.endWeek);
    if (!phase) {
      if (w + 1 > season.totalWeeks) {
        phase = { type: 'Recovery', startWeek: season.totalWeeks + 1, endWeek: totalWeeks, focusZone: 'E' };
      } else {
        phase = season.phases[0];
      }
    }
    
    const weekPlan = planWeek(
      weekStartDate,
      phase,
      freeDayIndices,
      config.weeklyTargetKm,
      vdot,
      chronicLoad,
      aRaceDate,
      target.distanceKm
    );
    
    const mobileWeekPlan: DailyPlan[] = weekPlan.map(dp => {
      const dayNum = dayCounter++;
      const dateObj = new Date(dp.date);
      const dateKey = dp.date;
      const raceInfo = raceDates.get(dateKey);
      
      // Check if this day is within 2 days of a planned race
      let nearRace = false;
      let raceAdjacent = false;
      for (let offset = -2; offset <= 2; offset++) {
        const checkDate = new Date(dateObj);
        checkDate.setDate(checkDate.getDate() + offset);
        const key = checkDate.toISOString().split('T')[0];
        if (raceDates.has(key)) {
          nearRace = true;
          if (offset !== 0) raceAdjacent = true;
        }
      }
      
      // If race day, mark as race; if near race, make it easy
      let finalType = dp.type;
      let finalTitle = getTitle(dp);
      let finalDesc = getDescription(dp);
      
      if (raceInfo) {
        finalType = 'Race' as any;
        finalTitle = '🏁 Race Day';
        finalDesc = `${raceInfo.distance}km ${raceInfo.priority === 'b-race' ? 'B' : 'C'} race`;
      } else if (raceAdjacent) {
        finalType = 'Easy' as any;
        finalTitle = `${finalTitle} (Near Race)`;
        finalDesc = `Easy day - race nearby. ${finalDesc}`;
      }
      
      return {
        ...dp,
        date: dp.date,
        dayNum,
        dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        vdotZone: dp.zone || 'E',
        targetDistanceKm: dp.distanceKm,
        targetDurationMin: dp.durationMin,
        targetPaceSecPerKm: dp.distanceKm > 0 ? (dp.durationMin * 60) / dp.distanceKm : 0,
        title: finalTitle,
        description: finalDesc,
        intensity: getIntensity(dp),
        isTaper: phase.type === 'Taper' || !!raceInfo
      };
    });
    
    allDays = allDays.concat(mobileWeekPlan);
    
    const weeklyLoad = weekPlan.reduce((acc, p) => acc + p.load, 0);
    chronicLoad = chronicLoad === 0 ? weeklyLoad : (chronicLoad * 3 + weeklyLoad) / 4;
  }
  
  return { dailyPlan: allDays, weeklyStats: [] };
};

// Adaptation logic to handle completed workouts and readiness-based adjustments
export const adaptPlanAfterNewWorkout = (
  basePlan: DailyPlan[], 
  lastWorkout: any, 
  athlete: any, 
  readinessScores: Record<string, number>
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  return basePlan.map(day => {
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    const isToday = dayDate.getTime() === today.getTime();
    
    // 1. "Today" Guard: If we already worked out today, mark this slot as done
    if (isToday && lastWorkout) {
      const workoutDate = new Date(lastWorkout.startedAt || lastWorkout.date);
      workoutDate.setHours(0, 0, 0, 0);
      
      if (workoutDate.getTime() === today.getTime()) {
        const distKm = (lastWorkout.distanceM || 0) / 1000 || lastWorkout.distance || 0;
        return {
          ...day,
          type: 'Rest' as any, // Treat rest of day as recovery
          title: 'Workout Completed',
          description: `You already ran ${distKm.toFixed(1)}km today. Focus on recovery.`,
          distanceKm: 0,
          durationMin: 0,
          intensity: 'rest' as any
        };
      }
    }

    // 2. Readiness Trimming (Section 5.1): Apply ONLY to the immediate next session (Today/Tomorrow)
    const readiness = readinessScores[todayStr] ?? 100;
    const diffTime = dayDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Only adapt the immediate horizon (Today = 0, Tomorrow = 1)
    // We don't touch Day 2+ because readiness will likely have recovered by then
    if (readiness < 30 && diffDays >= 0 && diffDays <= 1) {
      if (day.type === 'Quality') {
        return {
          ...day,
          title: `⚠️ ${day.title} (High Risk)`,
          description: `Current readiness is ${readiness.toFixed(0)}%. Reference 5.1.10: Manual review recommended.`,
          intensity: 'high' as any
        };
      }
      
      if (day.type === 'Easy' || day.type === 'Long') {
        // Section 5.1.9: Reduce volume proportionally
        // We apply a steeper cut today (0.6) than tomorrow (0.8)
        const reduction = diffDays === 0 ? 0.6 : 0.8;
        return {
          ...day,
          title: `${day.title} (Adjusted)`,
          distanceKm: Math.round(day.distanceKm * reduction * 10) / 10,
          durationMin: Math.round(day.durationMin * reduction),
          description: `Volume trimmed per ACWR safety rule (Readiness: ${readiness.toFixed(0)}%).`
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
  return `${dp.distanceKm}km at ${dp.zone || 'E'} pace. Target duration: ${dp.durationMin} min.`;
}

function getIntensity(dp: SharedDayPlan): DailyPlan['intensity'] {
  if (dp.type === 'Rest') return 'rest';
  if (dp.type === 'Race') return 'high';
  if (dp.type === 'Quality') return 'high';
  if (dp.type === 'Long') return 'medium';
  return 'low';
}
