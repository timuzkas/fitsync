
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
    case 'quality': return tokens.color.primary;
    case 'long': return tokens.color.accent;
    case 'rest': return tokens.color.textTertiary;
    default: return tokens.color.success;
  }
};

export const getDayTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
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
  temps: Record<string, number> = {}
): { dailyPlan: DailyPlan[]; weeklyStats: any[] } => {
  const vdot = athlete.vdot || 40;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  const aRaceDate = config.aRaceDate || new Date(target.targetDate);
  const season = planSeason(aRaceDate, startDate);
  
  const freeDayIndices = config.freeDays.map(d => DAY_MAP[d.toLowerCase()] ?? parseInt(d)).filter(n => !isNaN(n));
  
  let allDays: DailyPlan[] = [];
  let chronicLoad = 0; 
  let dayCounter = 1;
  
  for (let w = 0; w < season.totalWeeks; w++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + w * 7);
    
    const phase = season.phases.find(p => w + 1 >= p.startWeek && w + 1 <= p.endWeek) || season.phases[0];
    
    const weekPlan = planWeek(
      weekStartDate,
      phase,
      freeDayIndices,
      config.weeklyTargetKm,
      vdot,
      chronicLoad
    );
    
    const mobileWeekPlan: DailyPlan[] = weekPlan.map(dp => {
      const dayNum = dayCounter++;
      const dateObj = new Date(dp.date);
      return {
        ...dp,
        date: dp.date,
        dayNum,
        dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        vdotZone: dp.zone || 'E',
        targetDistanceKm: dp.distanceKm,
        targetDurationMin: dp.durationMin,
        targetPaceSecPerKm: dp.distanceKm > 0 ? (dp.durationMin * 60) / dp.distanceKm : 0,
        title: getTitle(dp),
        description: getDescription(dp),
        intensity: getIntensity(dp)
      };
    });
    
    allDays = allDays.concat(mobileWeekPlan);
    
    const weeklyLoad = weekPlan.reduce((acc, p) => acc + p.load, 0);
    chronicLoad = chronicLoad === 0 ? weeklyLoad : (chronicLoad * 3 + weeklyLoad) / 4;
  }
  
  return { dailyPlan: allDays, weeklyStats: [] };
};

// Simple adaptation for now to satisfy imports
export const adaptPlanAfterNewWorkout = (basePlan: DailyPlan[], lastWorkout: any, athlete: any, readinessScores: any) => {
  return basePlan;
};

function getTitle(dp: SharedDayPlan): string {
  if (dp.type === 'Rest') return 'Rest Day';
  if (dp.type === 'Long') return 'Long Run';
  if (dp.type === 'Quality') return `${dp.zone} Intervals`;
  return 'Easy Run';
}

function getDescription(dp: SharedDayPlan): string {
  if (dp.type === 'Rest') return 'Full recovery day. Focus on mobility and sleep.';
  return `${dp.distanceKm}km at ${dp.zone || 'E'} pace. Target duration: ${dp.durationMin} min.`;
}

function getIntensity(dp: SharedDayPlan): DailyPlan['intensity'] {
  if (dp.type === 'Rest') return 'rest';
  if (dp.type === 'Quality') return 'high';
  if (dp.type === 'Long') return 'medium';
  return 'low';
}
