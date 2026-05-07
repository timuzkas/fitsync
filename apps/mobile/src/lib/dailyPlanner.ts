
/**
 * Bridges shared algorithms with mobile-specific types and UI needs.
 */

import {
  planSeason,
  planWeek,
  Phase,
  DayPlan as SharedDayPlan,
  evaluateAdaptiveLevel,
  hudsonPlanSeason,
  hudsonPlanWeek,
  hudsonWeeklyKm,
  getHudsonPhaseForWeek,
  isHudsonRecoveryWeek,
  getRunsPerWeek,
  getTemplateRunDays,
  HudsonSeason,
  HudsonPhase,
  HudsonRaceDistance,
  CANONICAL_TRAINING_DAYS,
  HUDSON_PLAN_DURATION,
  HUDSON_MASTERS_PLAN_DURATION,
  HUDSON_VOLUME_BANDS,
  getStoredTrainingPhase,
  StoredTrainingPhase,
  redistributeWeekVolume,
} from '../../../../packages/shared/planner';
import { RunnerLevel } from '../../../../packages/shared/index';
import {
  getZonePace,
  calculateNextWeeklyKm,
  calculateACWR,
  classifyGoal,
  getNextVdotMilestone,
} from '../../../../packages/shared/training';
import {
  correctSession,
  SessionType,
  TrainingState,
} from '../../../../packages/shared/adaptiveCorrection';
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
  goalVdot?: number;
  previousWeeklyKm?: number;
  availableMinutesPerWeek?: number;
  weeklyPointsTarget?: number;
  adaptiveState?: AdaptiveState;
  pointsHistory?: PointsHistoryEntry[];
  runnerLevel?: RunnerLevel; // Hudson §4 level — drives volume bands when set
  isMasters?: boolean;       // true when ageCategory === 'masters' — enables XTrain off-days, 3-run minimum
}

export type PlanAdjustmentChoice = 'standard' | 'downgraded';

export interface PlanSuggestion {
  type: DailyPlan['type'];
  zone?: DailyPlan['zone'];
  vdotZone?: string;
  title: string;
  description: string;
  targetDistanceKm: number;
  distanceKm: number;
  targetDurationMin: number;
  durationMin: number;
  targetPaceSecPerKm: number;
  intensity: DailyPlan['intensity'];
  rpe: number;
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
  /** Feature 3: source reference tag shown in week header, e.g. "Marathon Level 2 · Week 7 of 20". */
  sourceTag?: string;
  /** Feature 3: stored training phase for this week. */
  trainingPhase?: StoredTrainingPhase;
  /** Feature 2: true if volume was redistributed due to daysConfigured != reference default. */
  recalculated?: boolean;
  adjustmentOptions?: {
    standard: PlanSuggestion;
    downgraded: PlanSuggestion;
    reason?: string;
  };
  selectedAdjustment?: PlanAdjustmentChoice;
  performedAdjustment?: PlanAdjustmentChoice;
}

export interface PlanConfig {
  freeDays: string[];
  weeklyTargetKm?: number;       // optional fallback; adaptive km is computed each week
  longRunTargetKm?: number;
  aRaceDate?: Date;
  /** Feature 1: user-selected training days (4–7). null = masters/youth (fixed schedule). */
  daysConfigured?: number | null;
  /** Feature 3: first week of the reference plan to serve (1 = full plan, >1 = trim or skip). */
  entryWeekIndex?: number;
  /** Feature 3: entry mode for source reference labels. */
  entryMode?: 'full' | 'trim_start' | 'skip_to';
  /** Feature 3: reference plan label, e.g. "Marathon Level 2". */
  referencePlanLabel?: string;
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

function distanceToHudsonRaceDistance(km: number): HudsonRaceDistance {
  if (km <= 6)  return '5K';
  if (km <= 12) return '10K';
  if (km <= 25) return 'HM';
  return 'marathon';
}

export const generateSmartPlan = (
  target: TrainingTarget,
  activities: any[],
  athlete: Athlete,
  config: PlanConfig,
  readinessScores: Record<string, number> = {},
  temps: Record<string, number> = {},
  plannedRaces: any[] = [],
  startDateOverride?: Date | string
): { dailyPlan: DailyPlan[]; weeklyStats: any[] } => {
  const startDate = startDateOverride ? new Date(startDateOverride) : new Date();
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

  // Hudson branch: when runnerLevel is set, use §4 volume bands + §5 period structure
  const isMasters = athlete.isMasters ?? false;
  const runnerLevel = athlete.runnerLevel ?? (isMasters ? 'lowKey' : undefined);
  const hudsonRaceDistance = distanceToHudsonRaceDistance(target.distanceKm || 10);
  const fixedMastersWeeks = isMasters ? HUDSON_MASTERS_PLAN_DURATION[hudsonRaceDistance] : undefined;
  const hudsonSeason: HudsonSeason | null = runnerLevel
    ? hudsonPlanSeason(aRaceDate, startDate, hudsonRaceDistance, fixedMastersWeeks)
    : null;

  const season = planSeason(aRaceDate, startDate); // Daniels fallback
  const freeDayIndices = config.freeDays
    .map(d => DAY_MAP[d.toLowerCase()] ?? parseInt(d))
    .filter(n => !isNaN(n));

  // Feature 3: plan entry point — which reference week to start from
  const entryWeekIndex = config.entryWeekIndex ?? 1;
  const referencePlanTotal = hudsonSeason?.totalWeeks ?? season.totalWeeks;
  const referencePlanLabel = config.referencePlanLabel ?? (hudsonRaceDistance ? `${hudsonRaceDistance} Plan` : 'Training Plan');
  const totalWeeks = runnerLevel
    ? Math.max(0, referencePlanTotal - entryWeekIndex + 1)
    : season.totalWeeks + 2;

  // Feature 1: canonical day mapping for level plans
  // daysConfigured (4–7) → fixed day-of-week slots; null = masters/youth fixed schedule
  const daysConfigured = config.daysConfigured;
  const canonicalDays = (daysConfigured != null && !isMasters)
    ? (CANONICAL_TRAINING_DAYS[daysConfigured] ?? getTemplateRunDays(daysConfigured))
    : null;

  // Feature 2: determine if recalculation is needed
  // Reference plan default runs/week is derived from the plan's peak volume band
  const refPeakKm = runnerLevel
    ? Math.round((HUDSON_VOLUME_BANDS[runnerLevel][hudsonRaceDistance].min + HUDSON_VOLUME_BANDS[runnerLevel][hudsonRaceDistance].max) / 2)
    : null;
  const refRunsPerWeek = refPeakKm ? getRunsPerWeek(refPeakKm, isMasters) : null;
  const needsRecalculation = !!(
    canonicalDays &&
    daysConfigured != null &&
    refRunsPerWeek != null &&
    daysConfigured !== refRunsPerWeek
  );
  const isCompetitive = runnerLevel === 'competitive' || runnerLevel === 'highlyCompetitive' || runnerLevel === 'elite';

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
    const referenceWeekIndex = entryWeekIndex + w;
    // ── Phase resolution ──
    let hudsonPhase: HudsonPhase | undefined;
    let weekInPeriod = 1;
    let periodLength = 1;
    if (hudsonSeason) {
      hudsonPhase = getHudsonPhaseForWeek(hudsonSeason, referenceWeekIndex);
      if (!hudsonPhase) {
        // Post-plan recovery weeks
        hudsonPhase = { type: 'Sharpening', startWeek: referenceWeekIndex, endWeek: referenceWeekIndex };
      }
      // Masters plans have no Introductory phase — override to Fundamental so
      // workout descriptions match the book (speed fartlek @ 10K-3K, progression runs).
      if (isMasters && hudsonPhase.type === 'Introductory') {
        const sharpPhase = hudsonSeason.phases.find(p => p.type === 'Sharpening');
        const fundEnd = sharpPhase ? sharpPhase.startWeek - 1 : hudsonSeason.totalWeeks - 4;
        hudsonPhase = { type: 'Fundamental', startWeek: 1, endWeek: fundEnd };
      }
      weekInPeriod = referenceWeekIndex - hudsonPhase.startWeek + 1;
      periodLength = hudsonPhase.endWeek - hudsonPhase.startWeek + 1;
    }

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

    // ── Adaptive points target ──
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

    // Pass live fatigue only for the current week; future weeks = 0
    const lmr = w === 0 ? liveLMR : 0;
    const tbf = w === 0 ? liveTBF : 0;
    const readiness = w === 0 ? todayReadiness : 100;

    // ── Weekly km target ──
    let weeklyKm: number;
    if (runnerLevel && hudsonPhase) {
      // Hudson §4: volume band target, ramped per §14 rules
      weeklyKm = hudsonWeeklyKm(
        runnerLevel,
        hudsonRaceDistance,
        previousWeeklyKm,
        hudsonPhase.type,
        weekInPeriod,
        periodLength,
        referenceWeekIndex,
        currentAcwr,
      );
    } else {
      // Daniels fallback
      const phaseNum = phaseToNumber(phase);
      weeklyKm = calculateNextWeeklyKm(
        previousWeeklyKm,
        availableMinPerWeek,
        easyPaceMinPerKm,
        phaseNum,
        currentAcwr,
        w === 0 ? todayReadiness : 100,
        freeDayIndices.length,
      );
      if (w > 0 && (w + 1) % 4 === 0) weeklyKm = Math.round(weeklyKm * 0.80 * 10) / 10;
    }

    const chronicLoad = last4WeeklyLoads.length > 0
      ? last4WeeklyLoads.reduce((a, b) => a + b, 0) / last4WeeklyLoads.length
      : 0;

    // Feature 3: reference week index — which page of the book this week corresponds to
    // Feature 3: source tag shown in week header
    const sourceTag = `${referencePlanLabel} · Week ${referenceWeekIndex} of ${referencePlanTotal}`;

    // Feature 3: stored training phase for this week
    const storedPhase: StoredTrainingPhase = hudsonPhase && hudsonSeason
      ? getStoredTrainingPhase(hudsonPhase.type, referenceWeekIndex, hudsonSeason.totalWeeks)
      : 'fundamental';

    // ── Plan the week ──
    // Feature 1: canonical day mapping — use user's daysConfigured (4–7) if set;
    // otherwise fall back to template-derived days from volume.
    const hudsonRunDays = runnerLevel
      ? (isMasters ? getTemplateRunDays(3, true) : (canonicalDays ?? getTemplateRunDays(getRunsPerWeek(weeklyKm, false), false)))
      : freeDayIndices;

    // Feature 2: volume redistribution — override weeklyKm distribution if daysConfigured
    // differs from the reference plan default. The target km stays the same; only the
    // per-day allocation changes.
    let effectiveWeeklyKm = weeklyKm;
    let redistributed = false;
    let redistributedVolume: ReturnType<typeof redistributeWeekVolume> | undefined;
    if (needsRecalculation && runnerLevel && refPeakKm) {
      const redistribution = redistributeWeekVolume(weeklyKm, daysConfigured as number, isCompetitive);
      // Validate that redistribution total is within 5% of target
      const total = redistribution.longKm + redistribution.hard1Km + redistribution.hard2Km
        + redistribution.fillerEachKm * redistribution.fillerSlots;
      if (Math.abs(total - weeklyKm) <= weeklyKm * 0.05) {
        effectiveWeeklyKm = weeklyKm; // pass same target; hudsonPlanWeek handles allocation
        redistributedVolume = redistribution;
        redistributed = true;
      }
    }

    const weekPlan = runnerLevel && hudsonPhase
      ? hudsonPlanWeek(
          weekStartDate,
          hudsonPhase,
          referenceWeekIndex,
          weekInPeriod,
          periodLength,
          effectiveWeeklyKm,
          planningVdot,
          hudsonRunDays,
          chronicLoad,
          aRaceDate,
          target.distanceKm,
          hudsonRaceDistance,
          adaptivePointsTarget,
          lmr,
          tbf,
          readiness,
          runnerLevel,
          isMasters,
          redistributedVolume,
        )
      : planWeek(
          weekStartDate,
          phase,
          freeDayIndices,
          effectiveWeeklyKm,
          planningVdot,
          chronicLoad,
          aRaceDate,
          target.distanceKm,
          adaptivePointsTarget,
          lmr,
          tbf,
          readiness,
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
        isTaper: phase!.type === 'Taper' || (hudsonPhase?.type === 'Sharpening' && weekInPeriod > periodLength / 2) || !!raceInfo,
        isRaceDay: !!raceInfo,
        racePriority: raceInfo?.priority || null,
        sourceTag,
        trainingPhase: storedPhase,
        recalculated: redistributed,
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
): DailyPlan[] => {
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

  const recentDailyLoads = allRecentWorkouts
    .filter(w => w.startedAt)
    .map(w => ({
      date: new Date(w.startedAt),
      load: (w.rpe || 5) * (((w.durationSec || 0) / 60) || w.durationMin || 0),
    }));
  const lastRestDate = findLastRestDate(recentDailyLoads, today);
  const daysSinceLastRest = lastRestDate
    ? Math.max(0, Math.round((today.getTime() - lastRestDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 7;
  const currentAcuteLoad = recentDailyLoads
    .filter(w => today.getTime() - w.date.getTime() <= 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, w) => sum + w.load, 0);
  const currentChronicLoad = recentDailyLoads
    .filter(w => today.getTime() - w.date.getTime() <= 28 * 24 * 60 * 60 * 1000)
    .reduce((sum, w) => sum + w.load, 0) / 4;
  const liveAcwr = currentChronicLoad > 0 ? currentAcuteLoad / currentChronicLoad : 1;
  const liveTsb = currentChronicLoad - currentAcuteLoad;

  const toPlanSuggestion = (plan: DailyPlan): PlanSuggestion => ({
    type: plan.type,
    zone: plan.zone,
    vdotZone: plan.vdotZone,
    title: plan.title,
    description: plan.description,
    targetDistanceKm: plan.targetDistanceKm,
    distanceKm: plan.distanceKm,
    targetDurationMin: plan.targetDurationMin,
    durationMin: plan.durationMin,
    targetPaceSecPerKm: plan.targetPaceSecPerKm,
    intensity: plan.intensity,
    rpe: plan.rpe,
  });

  const withAdjustmentOptions = (standard: DailyPlan, downgraded: DailyPlan, reason?: string): DailyPlan => ({
    ...downgraded,
    adjustmentOptions: {
      standard: toPlanSuggestion(standard),
      downgraded: toPlanSuggestion(downgraded),
      reason,
    },
    selectedAdjustment: 'downgraded',
  });

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

    // Constraint-based adaptive correction for today's planned session.
    const finalLegRiskLevel = Math.max(muscularRisk.legMuscularRisk, muscularRisk.totalBodyFatigue * 0.7);
    const readiness = readinessScores[todayStr] ?? 100;
    if (isToday && day.type !== 'Rest' && day.type !== 'Race') {
      const correction = correctSession(
        {
          sessionType: dailyPlanToSessionType(day),
          plannedLoadAu: day.load || (day.targetDurationMin || day.durationMin || 0) * (day.rpe || 5),
          durationMin: day.targetDurationMin || day.durationMin || 0,
          reps: day.reps,
          totalKm: day.targetDistanceKm || day.distanceKm,
          intensityPct: dailyPlanIntensityPct(day),
          includesPlyos: day.hudsonWorkoutType === 'hillSprint' || day.hudsonWorkoutType === 'strides',
          includesEccentrics: day.hudsonWorkoutType === 'hillReps' || day.hudsonWorkoutType === 'uphillProgression',
        },
        {
          readiness,
          legFreshness: Math.max(0, 100 - finalLegRiskLevel),
          acwr: Math.round(liveAcwr * 100) / 100,
          soreness: inferSoreness(lastWorkout, finalLegRiskLevel),
          wellnessZscore: readiness >= 70 ? 0 : readiness >= 55 ? -0.7 : -1.6,
          tsb: liveTsb,
          weeklyDelta: 0,
          daysSinceLastRest,
        }
      );

      if (correction.modifications.length > 0 || correction.state !== 'green') {
        const correctedType = sessionTypeToDailyType(correction.sessionType);
        const correctedKm = correction.totalKm ?? day.targetDistanceKm;
        const correctedDuration = correction.durationMin;
        const paceSec = correctedPaceForSession(correction.sessionType, athlete.vdot || 40, day.targetPaceSecPerKm);
        const correctedDay: DailyPlan = {
          ...day,
          type: correctedType as any,
          zone: sessionTypeToZone(correction.sessionType, day.zone) as any,
          title: correctedTitle(correction.state, correction.sessionType, day.title),
          description: correction.modifications[0]?.reason || correction.stateSummary,
          targetDistanceKm: correctedKm,
          distanceKm: correctedKm,
          targetDurationMin: correctedDuration,
          durationMin: correctedDuration,
          targetPaceSecPerKm: paceSec,
          intensity: trainingStateToIntensity(correction.state, correctedType) as any
        };
        return withAdjustmentOptions(day, correctedDay, correction.modifications[0]?.reason || correction.stateSummary);
      }
    }

    // Readiness trimming
    const diffDays = Math.round((dayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (readiness < 55 && diffDays >= 0 && diffDays <= 1) {
      if (day.type === 'Quality') {
        if (readiness < 40) {
          const paceSec = getZonePace(athlete.vdot || 40, 'E');
          const downgradedDay: DailyPlan = {
            ...day,
            type: 'Easy' as any,
            zone: 'E' as any,
            title: 'Easy Run (Low Readiness)',
            description: `Downgraded — readiness ${readiness.toFixed(0)}% (red zone).`,
            targetPaceSecPerKm: paceSec,
            targetDurationMin: Math.round((day.targetDistanceKm * paceSec) / 60),
            intensity: 'low' as any,
          };
          return withAdjustmentOptions(day, downgradedDay, downgradedDay.description);
        }
        return {
          ...day,
          title: `⚠️ ${day.title} (Low Readiness)`,
          description: `Readiness ${readiness.toFixed(0)}% — consider reducing intensity.`,
          intensity: 'high' as any,
          adjustmentOptions: {
            standard: toPlanSuggestion(day),
            downgraded: toPlanSuggestion({
              ...day,
              title: `${day.title} (Low Readiness)`,
              description: `Readiness ${readiness.toFixed(0)}%: consider reducing intensity.`,
              intensity: 'high' as any,
            }),
            reason: `Readiness ${readiness.toFixed(0)}%: consider reducing intensity.`,
          },
          selectedAdjustment: 'downgraded',
        };
      }

      if (day.type === 'Easy' || day.type === 'Long') {
        const reduction = readiness < 40 ? (diffDays === 0 ? 0.6 : 0.8) : 0.85;
        return {
          ...day,
          title: `${day.title} (Adjusted)`,
          distanceKm: Math.round(day.distanceKm * reduction * 10) / 10,
          durationMin: Math.round(day.durationMin * reduction),
          adjustmentOptions: {
            standard: toPlanSuggestion(day),
            downgraded: toPlanSuggestion({
              ...day,
              title: `${day.title} (Adjusted)`,
              distanceKm: Math.round(day.distanceKm * reduction * 10) / 10,
              durationMin: Math.round(day.durationMin * reduction),
              description: `Volume trimmed: readiness ${readiness.toFixed(0)}%.`,
            }),
            reason: `Volume trimmed: readiness ${readiness.toFixed(0)}%.`,
          },
          selectedAdjustment: 'downgraded',
          description: `Volume trimmed — readiness ${readiness.toFixed(0)}%.`,
        };
      }
    }

    return day;
  });
};

const HUDSON_TITLES: Record<string, string> = {
  fartlek:           'Fartlek Run',
  hillSprint:        'Easy + Hill Sprints',
  hillReps:          'Hill Repetitions',
  uphillProgression: 'Uphill Progression',
  threshold:         'Threshold Run',
  ladder:            'Ladder Workout',
  progression:       'Progression Run',
  specEndIntervals:  'Specific-Endurance Intervals',
  speedIntervals:    'Speed Intervals',
  strides:           'Easy + Strides',
  long:              'Long Run',
  easy:              'Easy Run',
  rest:              'Rest Day',
  xTrain:            'Cross-Training',
  race:              'Race Day',
  tuneUpRace:        'Tune-Up Race',
  timeTrial:         'Time Trial',
  marathonPaceRun:   'Marathon Pace Run',
  hardLongRun:       'Hard Long Run',
  aerobicTest:       'Aerobic Test',
};

function getTitle(dp: SharedDayPlan): string {
  if (dp.hudsonWorkoutType && HUDSON_TITLES[dp.hudsonWorkoutType]) {
    return HUDSON_TITLES[dp.hudsonWorkoutType];
  }
  if (dp.type === 'Rest') return 'Rest Day';
  if (dp.type === 'Race') return 'Race Day';
  if (dp.type === 'Long') return 'Long Run';
  if (dp.type === 'Quality') {
    if (dp.zone === 'T') return 'Tempo Run';
    if (dp.zone === 'R') return 'Cadence Intervals';
    return `${dp.zone} Intervals`;
  }
  return 'Easy Run';
}

function getDescription(dp: SharedDayPlan): string {
  // Hudson plans carry a pre-built notes string
  if (dp.notes) return dp.notes;
  if (dp.type === 'Rest') return 'Full recovery day. Focus on mobility and sleep.';
  if (dp.type === 'Race') return `Target: ${dp.distanceKm}km. This is what we trained for. Good luck!`;
  if (dp.type === 'Quality' && dp.reps) {
    return `${dp.reps} × ${Math.round((dp.durationMin / dp.reps))} min at ${dp.zone} pace. Rest: ${Math.round((dp.restSec ?? 0) / 60)} min between reps.`;
  }
  return `${dp.distanceKm}km at ${dp.zone || 'E'} pace. Target duration: ${dp.durationMin} min.`;
}

function getIntensity(dp: SharedDayPlan): DailyPlan['intensity'] {
  if (dp.type === 'Rest') return 'rest';
  if (dp.hudsonWorkoutType === 'xTrain') return 'low';
  if (dp.type === 'Race') return 'high';
  if (dp.type === 'Quality') return 'high';
  if (dp.hudsonWorkoutType === 'tuneUpRace') return 'high';
  if (dp.hudsonWorkoutType === 'progression' || dp.hudsonWorkoutType === 'hillSprint') return 'medium';
  if (dp.hudsonWorkoutType === 'hardLongRun' || dp.hudsonWorkoutType === 'marathonPaceRun') return 'high';
  if (dp.type === 'Long') return 'medium';
  return 'low';
}

function dailyPlanToSessionType(day: DailyPlan): SessionType {
  if (day.hudsonWorkoutType === 'hillReps' || day.hudsonWorkoutType === 'uphillProgression') return 'hill_reps';
  if (day.hudsonWorkoutType === 'progression' || day.hudsonWorkoutType === 'hardLongRun') return 'progression_run';
  if (day.hudsonWorkoutType === 'xTrain') return 'cross_train';
  if (day.type === 'Long') return 'long_run';
  if (day.type === 'Easy') return 'easy_run';
  if (day.type === 'Quality') {
    if (day.zone === 'T') return 'tempo';
    if (day.zone === 'R') return 'interval_short';
    return 'interval_long';
  }
  return 'recovery_run';
}

function sessionTypeToDailyType(sessionType: SessionType): DailyPlan['type'] {
  switch (sessionType) {
    case 'rest':
      return 'Rest' as any;
    case 'long_run':
      return 'Long' as any;
    case 'tempo':
    case 'interval_short':
    case 'interval_long':
    case 'hill_reps':
    case 'progression_run':
      return 'Quality' as any;
    default:
      return 'Easy' as any;
  }
}

function sessionTypeToZone(sessionType: SessionType, fallback?: string) {
  switch (sessionType) {
    case 'tempo':
      return 'T';
    case 'interval_short':
      return 'R';
    case 'interval_long':
      return 'I';
    case 'easy_run':
    case 'recovery_run':
    case 'long_run':
    case 'cross_train':
    case 'rest':
      return 'E';
    default:
      return fallback || 'E';
  }
}

function correctedPaceForSession(sessionType: SessionType, vdot: number, fallback: number): number {
  const zone = sessionTypeToZone(sessionType, undefined);
  if (zone === 'T' || zone === 'I' || zone === 'R' || zone === 'E') return getZonePace(vdot, zone);
  return fallback || getZonePace(vdot, 'E');
}

function dailyPlanIntensityPct(day: DailyPlan): number {
  if (day.zone === 'R') return 95;
  if (day.zone === 'I') return 92;
  if (day.zone === 'T') return 88;
  if (day.type === 'Long') return 75;
  return 70;
}

function correctedTitle(state: TrainingState, sessionType: SessionType, fallback: string): string {
  if (state === 'green') return fallback;
  if (sessionType === 'rest') return 'Rest Day (Adjusted)';
  if (sessionType === 'recovery_run') return 'Recovery Run (Adjusted)';
  if (sessionType === 'easy_run') return 'Easy Run (Adjusted)';
  if (sessionType === 'cross_train') return 'Cross-Training (Adjusted)';
  return `${fallback} (Adjusted)`;
}

function trainingStateToIntensity(state: TrainingState, type: DailyPlan['type']): DailyPlan['intensity'] {
  if (type === 'Rest') return 'rest';
  if (state === 'red') return 'low';
  if (state === 'yellow' && type !== 'Quality') return 'low';
  if (type === 'Quality') return 'high';
  if (type === 'Long') return 'medium';
  return 'low';
}

function inferSoreness(lastWorkout: any, legRisk: number): number {
  const explicit = Number(lastWorkout?.soreness ?? lastWorkout?.sorenessScore);
  if (Number.isFinite(explicit) && explicit > 0) return Math.max(0, Math.min(10, explicit));
  if (legRisk >= 75) return 8;
  if (legRisk >= 60) return 6;
  if (legRisk >= 40) return 4;
  return 2;
}

function findLastRestDate(loads: Array<{ date: Date; load: number }>, today: Date): Date | null {
  for (let daysAgo = 1; daysAgo <= 14; daysAgo++) {
    const day = new Date(today);
    day.setDate(today.getDate() - daysAgo);
    const dayKey = day.toLocaleDateString('en-CA');
    const hadWorkout = loads.some(w => w.date.toLocaleDateString('en-CA') === dayKey && w.load > 0);
    if (!hadWorkout) return day;
  }
  return null;
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
