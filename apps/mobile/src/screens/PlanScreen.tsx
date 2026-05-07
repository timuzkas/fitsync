import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, LayoutAnimation, UIManager, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDeviceStore } from '../store/useDeviceStore';
import { api } from '../api/client';
import {
  generateSmartPlan,
  adaptPlanAfterNewWorkout,
  DailyPlan,
  PlanAdjustmentChoice,
  getDayTypeColor,
  getDayTypeIcon,
  getVdotZoneLabel,
} from '../lib/dailyPlanner';
import { evaluateAdaptiveLevel } from '../../../../packages/shared/planner';
import { TrainingTarget } from '../types';
import { tokens } from '../tokens';
import { ActionSheet, BottomSheet } from '../components/ui/BottomSheet';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type PlanRouteParams = {
  Plan: { target?: TrainingTarget; refresh?: boolean };
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlannedRaceAction {
  day?: DailyPlan;
  race?: any;
  dayType?: 'today' | 'tomorrow' | 'upcoming';
}

export default function PlanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PlanRouteParams, 'Plan'>>();
  const {
    deviceId, deviceSecret, athleteProfile, planConfig, target: storedTarget,
    setTarget: setStoredTarget, _hasHydrated, updatePlanConfig,
    planWorkoutLinks = {}, setPlanWorkoutLink, unsetPlanWorkoutLink,
    planAdjustmentChoices = {}, planPerformedChoices = {},
    setPlanAdjustmentChoice, setPlanPerformedChoice,
  } = useDeviceStore();

  const [target, setTarget] = useState<TrainingTarget | null>(route.params?.target || storedTarget || null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [plannedRaces, setPlannedRaces] = useState<any[]>([]);
  const [availableWorkouts, setAvailableWorkouts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [readiness, setReadiness] = useState(0.7);
  const [hideRestDays, setHideRestDays] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ActionSheet state
  const [raceAction, setRaceAction] = useState<PlannedRaceAction | null>(null);
  const [linkSheetDay, setLinkSheetDay] = useState<DailyPlan | null>(null);
  const [linkSheetRace, setLinkSheetRace] = useState<any | null>(null);
  const [linkPerformedChoice, setLinkPerformedChoiceState] = useState<PlanAdjustmentChoice>('downgraded');
  const [resetSheet, setResetSheet] = useState(false);

  const handleSavePlan = useCallback(() => {
    if (target) {
      setStoredTarget(target);
      setSaved(true);
    }
  }, [target, setStoredTarget]);

  const formatDuration = (sec: number) => {
    if (!sec) return '--';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const dateKey = (dateVal: string | Date | undefined) => {
    if (!dateVal) return '';
    const d = typeof dateVal === 'string' ? new Date(dateVal) : new Date(dateVal);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getPlanKey = useCallback((day: DailyPlan) => (
    `${target?.id || 'target'}:${dateKey(day.date)}:${day.dayNum}`
  ), [target?.id]);

  const formatWorkoutLine = (w: any) => {
    const dist = w.distanceM ? `${(w.distanceM / 1000).toFixed(1)}km` : '';
    const pace = w.distanceM && w.durationSec
      ? `${formatPaceFromSec(w.durationSec / (w.distanceM / 1000))}/km`
      : '';
    const dur = w.durationSec ? formatDuration(w.durationSec) : '';
    return [dist, pace, dur].filter(Boolean).join(' · ');
  };

  const formatPaceFromSec = (sec: number) => {
    if (!sec || !Number.isFinite(sec)) return '--';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLinkRace = useCallback(async (race: any) => {
    const did = deviceId;
    const secret = deviceSecret;
    if (!did || !secret) return;
    const raceDate = new Date(race.startedAt);
    const raceDateTime = raceDate.getTime();

    const formatWorkout = (w: any) => {
      const wDate = new Date(w.startedAt);
      const diff = Math.round((wDate.getTime() - raceDateTime) / (1000 * 60 * 60 * 24));
      const diffStr = diff === 0 ? 'same day' : diff > 0 ? `+${diff}d` : `${diff}d`;
      const dist = w.distanceM ? `${(w.distanceM / 1000).toFixed(1)}km` : '';
      const dur = w.durationSec ? formatDuration(w.durationSec) : '';
      const parts = [w.title || w.type, dist, dur, diffStr].filter(Boolean);
      return parts.join(' · ');
    };

    const refreshRaces = () =>
      api.getPlannedRaces(did, secret).then(r => setPlannedRaces(r.plannedRaces || [])).catch(console.error);

    const nearbyWorkouts = availableWorkouts.filter((w: any) => {
      const diffDays = Math.abs(new Date(w.startedAt).getTime() - raceDateTime) / (1000 * 60 * 60 * 24);
      return diffDays <= 5;
    });

    if (nearbyWorkouts.length === 0) {
      // No workouts near the date — show sheet with message
      return;
    }

    if (nearbyWorkouts.length === 1) {
      try {
        await api.linkWorkoutToPlannedRace(did, secret, race.id, nearbyWorkouts[0].id);
        refreshRaces();
      } catch { /* silent */ }
    } else {
      // Multiple nearby — for now link first; ideally show a picker sheet (future improvement)
      try {
        await api.linkWorkoutToPlannedRace(did, secret, race.id, nearbyWorkouts[0].id);
        refreshRaces();
      } catch { /* silent */ }
    }
  }, [deviceId, deviceSecret, availableWorkouts]);

  const handleUnlinkRace = useCallback(async (race: any) => {
    const did = deviceId;
    const secret = deviceSecret;
    if (!did || !secret) return;
    try {
      await api.linkWorkoutToPlannedRace(did, secret, race.id, null);
      api.getPlannedRaces(did, secret).then(r => setPlannedRaces(r.plannedRaces || [])).catch(console.error);
    } catch { /* silent */ }
  }, [deviceId, deviceSecret]);

  const handleDeletePlanned = useCallback(async (raceId: string) => {
    const did = deviceId;
    const secret = deviceSecret;
    if (!did || !secret) return;
    try {
      await api.deleteWorkout(did, secret, raceId);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      api.getPlannedRaces(did, secret).then(r => setPlannedRaces(r.plannedRaces || [])).catch(console.error);
    } catch { /* silent */ }
  }, [deviceId, deviceSecret]);

  useEffect(() => {
    if (deviceId && deviceSecret) {
      api.getWorkouts(deviceId, deviceSecret).then(setWorkouts).catch(console.error);
      api.getPlannedRaces(deviceId, deviceSecret).then(result => {
        setPlannedRaces(result.plannedRaces || []);
        setAvailableWorkouts(result.availableWorkouts || []);
      }).catch(console.error);
      api.getLoadToday(deviceId, deviceSecret)
        .then(data => { if (data?.readiness != null) setReadiness(data.readiness); })
        .catch(() => {});
      api.getLoadConfig(deviceId, deviceSecret).then(cfg => {
        updatePlanConfig(cfg);
        const athleteData = {
          ...athleteProfile,
          vdot: cfg.vdot || 40,
          weeklyPointsTarget: cfg.weeklyPointsTarget || 50,
          adaptiveState: cfg.adaptiveState || 'normal',
          pointsHistory: cfg.pointsHistory || [],
        };
        const adaptation = evaluateAdaptiveLevel(athleteData as any);
        if (adaptation.newTarget !== athleteData.weeklyPointsTarget) {
          // Non-blocking: just update silently — user can see it in TrainingEngine screen
          const newCfg = { ...cfg, weeklyPointsTarget: adaptation.newTarget, adaptiveState: adaptation.newState };
          updatePlanConfig(newCfg);
          api.updateLoadConfig(deviceId, deviceSecret, newCfg);
        }
      }).catch(() => {});
    }
  }, [deviceId, deviceSecret, updatePlanConfig]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { dailyPlan, historyPlan, weeklyStats, progress, daysRemaining, completedDist, targetDist } = useMemo(() => {
    if (!_hasHydrated || !target) return { dailyPlan: [], historyPlan: [], weeklyStats: [], progress: 0, daysRemaining: 0, completedDist: 0, targetDist: 0 };

    const activities = workouts.map(w => ({
      date: new Date(w.startedAt),
      distance: (w.distanceM || 0) / 1000,
      duration: w.durationSec || 0,
      hrAvg: w.avgHr || 140,
      elevationGain: w.elevationGain || 0,
    }));

    const athlete = {
      maxHR: athleteProfile?.maxHR || 190,
      restHR: athleteProfile?.restHR || 60,
      weight: athleteProfile?.weight || 75,
      height: athleteProfile?.height,
      sex: athleteProfile?.sex,
      vdot: athleteProfile?.vdot || planConfig?.vdot,
      runnerLevel: athleteProfile?.runnerLevel,
      isMasters: athleteProfile?.ageCategory === 'masters' && athleteProfile?.ageLevelMode === 'age',
    };

    const defaults = { freeDays: ['wed', 'sat', 'sun'], weeklyTargetKm: 30, longRunTargetKm: 12, sessionsPerWeek: 3 };
    const config = planConfig ? { ...defaults, ...planConfig } : defaults;

    const readinessScores: Record<string, number> = {};
    readinessScores[today.toISOString().split('T')[0]] = readiness;
    const temps: Record<string, number> = {};

    const futurePlannedRaces = plannedRaces.filter((r: any) => {
      const raceDate = new Date(r.startedAt); raceDate.setHours(0, 0, 0, 0);
      return raceDate >= today;
    });

    const plannedRaceActivities = futurePlannedRaces.map((r: any) => ({
      date: new Date(r.startedAt),
      distance: (r.distanceM || 0) / 1000,
      duration: r.targetTimeSec || r.durationSec || 0,
      hrAvg: r.avgHr || 140,
      isRace: true,
      racePriority: r.sessionPurpose || 'c-race',
      title: r.title,
    }));

    const { dailyPlan: basePlan, weeklyStats } = generateSmartPlan(
      target, activities, athlete, config, readinessScores, temps, plannedRaceActivities,
    );

    const targetCreatedAt = target.createdAt ? new Date(target.createdAt) : null;
    targetCreatedAt?.setHours(0, 0, 0, 0);
    const shouldBuildHistory = !!targetCreatedAt && targetCreatedAt < today;
    const historyPlan = shouldBuildHistory
      ? generateSmartPlan(
          target, activities, athlete, config, readinessScores, temps, plannedRaceActivities, targetCreatedAt!,
        ).dailyPlan.filter(day => dateKey(day.date) < dateKey(today))
      : [];

    let dailyPlan = basePlan;
    const todayStr = today.toISOString().split('T')[0];
    const completedWorkouts = workouts
      .filter((w: any) => (w.startedAt || '').split('T')[0] <= todayStr)
      .sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    if (completedWorkouts.length > 0) {
      dailyPlan = adaptPlanAfterNewWorkout(basePlan, completedWorkouts[0], athlete, readinessScores, workouts);
    }

    const targetDate = new Date(target.targetDate);
    const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const progress = totalDays > 0 ? Math.round(((totalDays - daysRemaining) / totalDays) * 100) : 100;

    const completedDist = dailyPlan
      .filter(d => d.dayNum < (totalDays - daysRemaining))
      .reduce((sum, d) => sum + d.targetDistanceKm, 0);

    return { dailyPlan, historyPlan, weeklyStats, progress, daysRemaining, completedDist, targetDist: target.distanceKm };
  }, [target, workouts, plannedRaces, athleteProfile, planConfig, today, _hasHydrated, readiness]);

  const getChosenPlan = useCallback((day: DailyPlan): DailyPlan => {
    if (!day.adjustmentOptions) return day;
    const choice = planAdjustmentChoices[getPlanKey(day)] || day.selectedAdjustment || 'downgraded';
    const suggestion = day.adjustmentOptions[choice];
    return suggestion ? { ...day, ...suggestion, selectedAdjustment: choice } : day;
  }, [getPlanKey, planAdjustmentChoices]);

  const visibleDailyPlan = useMemo(
    () => dailyPlan.map(getChosenPlan),
    [dailyPlan, getChosenPlan],
  );
  const visibleHistoryPlan = useMemo(
    () => historyPlan.map(getChosenPlan),
    [historyPlan, getChosenPlan],
  );

  const getChoiceForDay = useCallback((day: DailyPlan): PlanAdjustmentChoice => (
    planAdjustmentChoices[getPlanKey(day)] || day.selectedAdjustment || 'downgraded'
  ), [getPlanKey, planAdjustmentChoices]);

  const setChoiceForDay = useCallback((day: DailyPlan, choice: PlanAdjustmentChoice) => {
    setPlanAdjustmentChoice(getPlanKey(day), choice);
  }, [getPlanKey, setPlanAdjustmentChoice]);

  const getPerformedChoiceForDay = useCallback((day: DailyPlan): PlanAdjustmentChoice | null => (
    planPerformedChoices[getPlanKey(day)] || null
  ), [getPlanKey, planPerformedChoices]);

  const todayPlan = visibleDailyPlan.find(d => d.dayNum === 1);
  const tomorrowPlan = visibleDailyPlan.find(d => d.dayNum === 2);

  const getPlannedRaceForDay = (day: any) => {
    if (!day?.date) return null;
    const dayStr = dateKey(day.date);
    return plannedRaces.find((r: any) => {
      return dateKey(r.startedAt) === dayStr;
    });
  };

  const workoutById = useMemo(() => {
    const map = new Map<string, any>();
    [...workouts, ...availableWorkouts].forEach((w: any) => {
      if (w?.id) map.set(w.id, w);
    });
    plannedRaces.forEach((r: any) => {
      if (r?.workout?.id) map.set(r.workout.id, r.workout);
    });
    return map;
  }, [workouts, availableWorkouts, plannedRaces]);

  const getLinkedWorkoutForDay = (day: DailyPlan, plannedOnDay?: any) => {
    if (plannedOnDay?.workout) return plannedOnDay.workout;
    const linkedId = plannedOnDay?.linkedWorkoutId || planWorkoutLinks[getPlanKey(day)];
    return linkedId ? workoutById.get(linkedId) : null;
  };

  const getPlanStatus = (day: DailyPlan, plannedOnDay?: any): 'planned' | 'missed' | 'completed' => {
    if (getLinkedWorkoutForDay(day, plannedOnDay)) return 'completed';
    if (day.targetDistanceKm > 0 && dateKey(day.date) < dateKey(today)) return 'missed';
    return 'planned';
  };

  const getStatusStyle = (status: 'planned' | 'missed' | 'completed') => {
    if (status === 'completed') return { label: 'COMPLETED', color: tokens.color.success, icon: 'checkmark-circle-outline' };
    if (status === 'missed') return { label: 'MISSED', color: tokens.color.danger, icon: 'close-circle-outline' };
    return { label: 'PLANNED', color: tokens.color.textMuted, icon: 'time-outline' };
  };

  const linkLocalPlanDay = (day: DailyPlan, workout: any) => {
    setPlanWorkoutLink(getPlanKey(day), workout.id);
    if (day.adjustmentOptions) {
      setPlanPerformedChoice(getPlanKey(day), linkPerformedChoice);
    }
    setLinkSheetDay(null);
  };

  const unlinkLocalPlanDay = (day: DailyPlan) => {
    unsetPlanWorkoutLink(getPlanKey(day));
  };

  const refreshPlannedRaces = () => {
    if (!deviceId || !deviceSecret) return Promise.resolve();
    return api.getPlannedRaces(deviceId, deviceSecret).then(r => {
      setPlannedRaces(r.plannedRaces || []);
      setAvailableWorkouts(r.availableWorkouts || []);
    }).catch(console.error);
  };

  const linkBackendPlan = async (race: any, workout: any) => {
    if (!deviceId || !deviceSecret) return;
    try {
      await api.linkWorkoutToPlannedRace(deviceId, deviceSecret, race.id, workout.id);
      if (linkSheetDay?.adjustmentOptions) {
        setPlanPerformedChoice(getPlanKey(linkSheetDay), linkPerformedChoice);
      }
      setLinkSheetRace(null);
      setLinkSheetDay(null);
      refreshPlannedRaces();
    } catch {
      Alert.alert('Link failed', 'Could not link this exported record.');
    }
  };

  const upcomingPlanRaw = expanded ? visibleDailyPlan.slice(2) : visibleDailyPlan.slice(2, 5);
  const upcomingPlan = hideRestDays ? upcomingPlanRaw.filter(d => d.type !== 'Rest') : upcomingPlanRaw;

  const formatPace = (sec: number) => {
    if (!sec) return '--';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateVal: string | Date | undefined) => {
    if (!dateVal) return 'Unknown';
    const d = typeof dateVal === 'string' ? new Date(dateVal.split('-w')[0]) : new Date(dateVal);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const ringColor = progress > 70 ? tokens.color.success : progress > 30 ? tokens.color.warning : tokens.color.primary;

  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(e => !e);
  };

  const handleToggleRest = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHideRestDays(h => !h);
  };

  const handleToggleHistory = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowHistory(h => !h);
  };

  // Build ActionSheet actions for a plan block or backend planned workout.
  const buildRaceActions = (action: PlannedRaceAction) => {
    const race = action.race;
    const day = action.day;
    const isLinked = !!(race?.linkedWorkoutId || (day && planWorkoutLinks[getPlanKey(day)]));
    const actions = [
      race && {
        label: 'Edit',
        icon: 'pencil-outline',
        onPress: () => navigation.navigate('AddWorkout', { editWorkout: race }),
      },
      isLinked
        ? {
            label: 'Unlink Completed Workout',
            icon: 'unlink-outline',
            onPress: () => race ? handleUnlinkRace(race) : day && unlinkLocalPlanDay(day),
          }
        : {
            label: 'Link Strava Record',
            icon: 'link-outline',
            onPress: () => {
              if (!day && !race) return;
              if (availableWorkouts.length === 0) {
                Alert.alert('No exported records', 'Sync Strava first, then link the planned run to a completed record.');
                return;
              }
              if (race) setLinkSheetRace(race);
              setLinkSheetDay(day || null);
              if (day?.adjustmentOptions) {
                setLinkPerformedChoiceState(getChoiceForDay(day));
              }
            },
          },
      race && {
        label: 'Delete',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => handleDeletePlanned(race.id),
      },
    ].filter(Boolean) as any[];
    return actions;
  };

  if (!_hasHydrated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.emptyTitle}>Loading…</Text>
        </View>
      </View>
    );
  }

  if (!target) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>No Target Set</Text>
          <Text style={styles.emptySub}>Set a race goal to generate your training plan</Text>
          <TouchableOpacity style={styles.setTargetBtn} onPress={() => navigation.navigate('Target')} activeOpacity={0.85}>
            <Text style={styles.setTargetBtnText}>Set Target</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondarySettingsBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
            <Text style={styles.secondarySettingsText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const activeRace = raceAction?.race;
  const activeDay = raceAction?.day;

  const renderSuggestionToggle = (day: DailyPlan, compact = false) => {
    if (!day.adjustmentOptions) return null;
    const selected = getChoiceForDay(day);
    return (
      <View style={[styles.suggestionWrap, compact && styles.suggestionWrapCompact]}>
        {(['standard', 'downgraded'] as PlanAdjustmentChoice[]).map(choice => (
          <TouchableOpacity
            key={choice}
            style={[
              styles.suggestionBtn,
              selected === choice && styles.suggestionBtnActive,
            ]}
            onPress={(event) => {
              event.stopPropagation();
              setChoiceForDay(day, choice);
            }}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.suggestionBtnText,
              selected === choice && styles.suggestionBtnTextActive,
            ]}>
              {choice === 'standard' ? 'Standard' : 'Downgraded'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPerformedChoice = (day: DailyPlan) => {
    const performed = getPerformedChoiceForDay(day);
    if (!performed) return null;
    return (
      <Text style={styles.performedText}>
        Performed: {performed === 'standard' ? 'Standard' : 'Downgraded'}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.headerBackBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={tokens.color.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            onPress={handleSavePlan}
            style={styles.headerIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={21}
              color={saved ? tokens.color.primary : tokens.color.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setResetSheet(true)}
            style={styles.headerIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={19} color={tokens.color.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Goal header card ── */}
        <View style={styles.goalCard}>
          <View style={styles.ringContainer}>
            <View style={[styles.ring, { borderColor: ringColor }]}>
              <Text style={[styles.ringPercent, { color: ringColor }]}>{progress}%</Text>
              <Text style={styles.ringLabel}>to goal</Text>
            </View>
          </View>

          <View style={styles.targetStats}>
            <Text style={styles.targetTitle}>
              {target.distanceKm}K {target.type === 'run' ? 'Run' : target.type === 'ride' ? 'Ride' : 'Swim'}
            </Text>
            <Text style={styles.targetDate}>{formatDate(target.targetDate)}</Text>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{daysRemaining}</Text>
                <Text style={styles.statLabel}>days left</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatPace(target.targetPaceSecPerKm || 0)}</Text>
                <Text style={styles.statLabel}>target pace</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatPace(target.targetTimeSec ? target.targetTimeSec / target.distanceKm : 0)}
                </Text>
                <Text style={styles.statLabel}>finish</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Warning banner ── */}
        {todayPlan?.planLimitationFlag && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={14} color={tokens.color.warning} />
            <Text style={styles.warningText}>{todayPlan.planLimitationFlag}</Text>
          </View>
        )}

        {/* ── Past blocks ── */}
        {visibleHistoryPlan.length > 0 && (
          <View style={styles.historySection}>
            <TouchableOpacity style={styles.historyHeader} onPress={handleToggleHistory} activeOpacity={0.75}>
              <View>
                <Text style={styles.historyTitle}>Past blocks</Text>
                <Text style={styles.historySub}>
                  {formatDate(visibleHistoryPlan[0].date)} to {formatDate(visibleHistoryPlan[visibleHistoryPlan.length - 1].date)}
                </Text>
              </View>
              <View style={styles.historyHeaderRight}>
                <Text style={styles.historyCount}>{visibleHistoryPlan.length}</Text>
                <Ionicons
                  name={showHistory ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={tokens.color.textMuted}
                />
              </View>
            </TouchableOpacity>

            {showHistory && visibleHistoryPlan.map((day) => {
              const plannedOnDay = getPlannedRaceForDay(day);
              const linkedWorkout = getLinkedWorkoutForDay(day, plannedOnDay);
              const status = getPlanStatus(day, plannedOnDay);
              const statusStyle = getStatusStyle(status);
              const isClickable = !!(plannedOnDay || day.isRaceDay || day.targetDistanceKm > 0);
              const accentColor = getDayTypeColor(day.type);

              return (
                <TouchableOpacity
                  key={`history-${day.date.toString()}`}
                  style={[styles.historyDayCard, isClickable && styles.historyDayCardClickable]}
                  onPress={() => {
                    if (isClickable) setRaceAction({ day, race: plannedOnDay, dayType: 'upcoming' });
                  }}
                  activeOpacity={isClickable ? 0.75 : 1}
                >
                  <View style={styles.historyDayTop}>
                    <View style={styles.historyDayDateWrap}>
                      <View style={[styles.historyDot, { backgroundColor: accentColor }]} />
                      <Text style={styles.historyDayName}>{day.dayOfWeek}, {formatDate(day.date)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.color + '18' }]}>
                      <Ionicons name={statusStyle.icon as any} size={10} color={statusStyle.color} />
                      <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                    </View>
                  </View>
                  <View style={styles.historyDayBody}>
                    <Text style={styles.historyDayIcon}>{getDayTypeIcon(day.type)}</Text>
                    <View style={styles.historyDayInfo}>
                      <Text style={styles.historyDayWorkout}>{day.title}</Text>
                      <Text style={styles.historyDayDesc} numberOfLines={2}>{day.description}</Text>
                      {linkedWorkout && (
                        <Text style={styles.linkedWorkoutText}>Actual {formatWorkoutLine(linkedWorkout)}</Text>
                      )}
                      {linkedWorkout && renderPerformedChoice(day)}
                    </View>
                    {day.targetDistanceKm > 0 && (
                      <Text style={styles.historyMetric}>{day.targetDistanceKm}km</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Today card ── */}
        {todayPlan && (() => {
          const plannedOnDay = getPlannedRaceForDay(todayPlan);
          const linkedWorkout = getLinkedWorkoutForDay(todayPlan, plannedOnDay);
          const status = getPlanStatus(todayPlan, plannedOnDay);
          const statusStyle = getStatusStyle(status);
          return (
            <TouchableOpacity
              style={styles.todayCard}
              onPress={() => { if (todayPlan.targetDistanceKm > 0 || plannedOnDay) setRaceAction({ day: todayPlan, race: plannedOnDay, dayType: 'today' }); }}
              activeOpacity={todayPlan.targetDistanceKm > 0 || plannedOnDay ? 0.8 : 1}
            >
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
              <View style={styles.todayMain}>
                <Text style={styles.todayIcon}>{getDayTypeIcon(todayPlan.type)}</Text>
                <View style={styles.todayInfo}>
                  <Text style={styles.todayTitle}>{todayPlan.title}</Text>
                  <View style={styles.zoneBadgeRow}>
                    <View style={[styles.zoneBadge, { backgroundColor: getDayTypeColor(todayPlan.type) + '30' }]}>
                      <Text style={[styles.zoneBadgeText, { color: getDayTypeColor(todayPlan.type) }]}>
                        {getVdotZoneLabel(todayPlan.vdotZone)}
                      </Text>
                    </View>
                    {todayPlan.isTaper && (
                      <View style={styles.taperBadge}>
                        <Text style={styles.taperBadgeText}>↓ TAPER</Text>
                      </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.color + '22' }]}>
                      <Ionicons name={statusStyle.icon as any} size={10} color={statusStyle.color} />
                      <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                    </View>
                    {linkedWorkout && (
                      <View style={styles.linkedBadge}>
                        <Ionicons name="link-outline" size={10} color={tokens.color.success} />
                        <Text style={styles.linkedBadgeText}>LINKED</Text>
                      </View>
                    )}
                    {todayPlan.rpe > 0 && (
                      <Text style={styles.rpeText}>RPE {todayPlan.rpe}</Text>
                    )}
                  </View>
                  {linkedWorkout && (
                    <Text style={styles.linkedWorkoutText}>
                      {linkedWorkout.distanceM ? `${(linkedWorkout.distanceM / 1000).toFixed(1)}km` : ''}
                      {linkedWorkout.durationSec ? ` · ${formatDuration(linkedWorkout.durationSec)}` : ''}
                    </Text>
                  )}
                  <Text style={styles.todayDesc}>{todayPlan.description}</Text>
                  {renderSuggestionToggle(todayPlan)}
                </View>
              </View>
              <View style={styles.todayMetrics}>
                {todayPlan.targetDistanceKm > 0 ? (
                  <>
                    <View style={styles.todayMetric}>
                      <Text style={styles.todayMetricValue}>{todayPlan.targetDistanceKm}km</Text>
                      <Text style={styles.todayMetricLabel}>distance</Text>
                    </View>
                    <View style={styles.todayMetric}>
                      <Text style={styles.todayMetricValue}>{todayPlan.targetDurationMin}min</Text>
                      <Text style={styles.todayMetricLabel}>duration</Text>
                    </View>
                    <View style={styles.todayMetric}>
                      <Text style={styles.todayMetricValue}>{formatPace(todayPlan.targetPaceSecPerKm)}</Text>
                      <Text style={styles.todayMetricLabel}>pace</Text>
                    </View>
                    {(todayPlan.targetDistanceKm > 0 || plannedOnDay) && (
                      <View style={styles.tapHint}>
                        <Ionicons name="ellipsis-horizontal" size={14} color={tokens.color.textTertiary} />
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.restLabel}>Rest Day</Text>
                )}
              </View>
              {linkedWorkout && todayPlan.targetDistanceKm > 0 && (
                <View style={styles.compareRow}>
                  <Text style={styles.compareText}>Plan {todayPlan.targetDistanceKm}km · {formatPace(todayPlan.targetPaceSecPerKm)}/km</Text>
                  <Text style={styles.compareText}>Real {formatWorkoutLine(linkedWorkout)}</Text>
                  {renderPerformedChoice(todayPlan)}
                </View>
              )}
            </TouchableOpacity>
          );
        })()}

        {/* ── Tomorrow card ── */}
        {tomorrowPlan && (() => {
          const plannedOnDay = getPlannedRaceForDay(tomorrowPlan);
          const linkedWorkout = getLinkedWorkoutForDay(tomorrowPlan, plannedOnDay);
          const status = getPlanStatus(tomorrowPlan, plannedOnDay);
          const statusStyle = getStatusStyle(status);
          return (
            <TouchableOpacity
              style={styles.tomorrowCard}
              onPress={() => { if (tomorrowPlan.targetDistanceKm > 0 || plannedOnDay) setRaceAction({ day: tomorrowPlan, race: plannedOnDay, dayType: 'tomorrow' }); }}
              activeOpacity={tomorrowPlan.targetDistanceKm > 0 || plannedOnDay ? 0.8 : 1}
            >
              <View style={styles.tomorrowBadge}>
                <Text style={styles.tomorrowBadgeText}>TOMORROW</Text>
              </View>
              <View style={styles.tomorrowContent}>
                <View style={styles.tomorrowMain}>
                  <Text style={styles.tomorrowIcon}>{getDayTypeIcon(tomorrowPlan.type)}</Text>
                  <View style={styles.tomorrowInfo}>
                    <Text style={styles.tomorrowTitle}>{tomorrowPlan.title}</Text>
                    <View style={[styles.statusBadge, styles.statusBadgeInline, { backgroundColor: statusStyle.color + '22' }]}>
                      <Ionicons name={statusStyle.icon as any} size={10} color={statusStyle.color} />
                      <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                    </View>
                    {linkedWorkout && <Text style={styles.linkedWorkoutText}>Actual {formatWorkoutLine(linkedWorkout)}</Text>}
                    <Text style={styles.tomorrowDesc}>{tomorrowPlan.description}</Text>
                    {renderSuggestionToggle(tomorrowPlan, true)}
                    {linkedWorkout && renderPerformedChoice(tomorrowPlan)}
                  </View>
                </View>
                <View style={styles.tomorrowRight}>
                  {tomorrowPlan.targetDistanceKm > 0 ? (
                    <>
                      <Text style={styles.tomorrowMetric}>{tomorrowPlan.targetDistanceKm}km</Text>
                      <Text style={styles.tomorrowMetricSub}>{formatPace(tomorrowPlan.targetPaceSecPerKm)}/km</Text>
                    </>
                  ) : (
                    <Text style={styles.restLabelSm}>Rest</Text>
                  )}
                  {(tomorrowPlan.targetDistanceKm > 0 || plannedOnDay) && (
                    <Ionicons name="ellipsis-horizontal" size={14} color={tokens.color.textTertiary} style={{ marginTop: 4 }} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* ── Upcoming days ── */}
        {upcomingPlan.length > 0 && (
          <>
            <View style={styles.upcomingHeader}>
              <TouchableOpacity style={styles.expandBtn} onPress={handleToggleExpand} activeOpacity={0.7}>
                <Text style={styles.expandBtnText}>{expanded ? 'Show Less' : 'Show more days'}</Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={tokens.color.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, hideRestDays && styles.toggleBtnActive]}
                onPress={handleToggleRest}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleBtnText, hideRestDays && styles.toggleBtnTextActive]}>
                  {hideRestDays ? 'Show Rest' : 'Hide Rest'}
                </Text>
              </TouchableOpacity>
            </View>

            {upcomingPlan.map((day, idx) => {
              const dayStr = dateKey(day.date);
              const plannedOnDay = plannedRaces.find((r: any) => {
                return dateKey(r.startedAt) === dayStr;
              });
              const linkedWorkout = getLinkedWorkoutForDay(day, plannedOnDay);
              const status = getPlanStatus(day, plannedOnDay);
              const statusStyle = getStatusStyle(status);
              const isClickable = !!(plannedOnDay || day.isRaceDay || day.targetDistanceKm > 0);
              const accentColor = getDayTypeColor(day.type);
              const isLast = idx === upcomingPlan.length - 1;

              // Show week header (source tag) when the tag changes from the previous day
              const prevTag = idx > 0 ? (upcomingPlan[idx - 1] as any).sourceTag : null;
              const showWeekHeader = (day as any).sourceTag && (day as any).sourceTag !== prevTag;

              return (
                <View key={day.date.toString()}>
                  {showWeekHeader && (
                    <View style={styles.weekHeaderRow}>
                      <Text style={styles.weekHeaderText}>{(day as any).sourceTag}</Text>
                    </View>
                  )}
                <View style={styles.dayRow}>
                  {/* Timeline column */}
                  <View style={styles.timeline}>
                    <View style={[styles.timelineDot, { backgroundColor: accentColor }]} />
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: accentColor + '40' }]} />}
                  </View>

                  {/* Card */}
                  <TouchableOpacity
                    style={[styles.dayCard, isClickable && styles.dayCardClickable]}
                    onPress={() => {
                      if (isClickable) setRaceAction({ day, race: plannedOnDay, dayType: 'upcoming' });
                    }}
                    activeOpacity={isClickable ? 0.75 : 1}
                  >
                    <View style={styles.dayHeader}>
                      <View>
                        <Text style={styles.dayName}>{day.dayOfWeek}, {formatDate(day.date)}</Text>
                        <Text style={styles.dayNum}>Day {day.dayNum}</Text>
                      </View>
                      <View style={styles.badgeRow}>
                        {day.isRaceDay && (
                          <View style={[styles.raceBadge, day.racePriority === 'b-race' ? styles.badgeB : day.racePriority === 'd-race' ? styles.badgeD : styles.badgeC]}>
                            <Text style={styles.raceBadgeText}>🏁 {day.racePriority === 'b-race' ? 'B' : day.racePriority === 'd-race' ? 'D Trail' : 'C'}</Text>
                          </View>
                        )}
                        {day.isTaper && (
                          <View style={styles.taperBadge}>
                            <Text style={styles.taperBadgeText}>↓ TAPER</Text>
                          </View>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.color + '22' }]}>
                          <Ionicons name={statusStyle.icon as any} size={10} color={statusStyle.color} />
                          <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                        </View>
                        <View style={[styles.dayTypeBadge, { backgroundColor: accentColor + '20' }]}>
                          <Text style={[styles.dayTypeText, { color: accentColor }]}>
                            {day.type.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.dayContent}>
                      <Text style={styles.dayIcon}>{getDayTypeIcon(day.type)}</Text>
                      <View style={styles.dayInfo}>
                        <Text style={styles.dayTitle}>{day.title}</Text>
                        <Text style={[styles.dayZoneLabel, { color: accentColor }]}>
                          {getVdotZoneLabel(day.vdotZone)}
                        </Text>
                        <Text style={styles.dayDesc}>{day.description}</Text>
                        {renderSuggestionToggle(day, true)}
                        {linkedWorkout && (
                          <Text style={styles.linkedWorkoutText}>Actual {formatWorkoutLine(linkedWorkout)}</Text>
                        )}
                        {linkedWorkout && renderPerformedChoice(day)}
                      </View>
                    </View>

                    {day.targetDistanceKm > 0 && (
                      <View style={styles.dayMetrics}>
                        <Text style={styles.dayMetricValue}>{day.targetDistanceKm}km</Text>
                        <Text style={styles.dayMetricSep}>·</Text>
                        <Text style={styles.dayMetricValue}>{day.targetDurationMin}min</Text>
                        <Text style={styles.dayMetricSep}>·</Text>
                        <Text style={styles.dayMetricValue}>{formatPace(day.targetPaceSecPerKm)}/km</Text>
                        {(day.targetDistanceKm > 0 || plannedOnDay) && (
                          <Ionicons
                            name="ellipsis-horizontal"
                            size={14}
                            color={tokens.color.textTertiary}
                            style={{ marginLeft: 'auto' }}
                          />
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Planned race ActionSheet ── */}
      <ActionSheet
        visible={raceAction !== null}
        onClose={() => setRaceAction(null)}
        title={activeRace?.title || activeDay?.title || 'Planned Workout'}
        subtitle={raceAction ? (() => {
          const d = new Date(activeRace?.startedAt || activeDay?.date);
          const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return activeRace?.distanceM
            ? `${dateStr} · ${(activeRace.distanceM! / 1000).toFixed(1)} km`
            : activeDay?.targetDistanceKm
            ? `${dateStr} · ${activeDay.targetDistanceKm} km planned`
            : dateStr;
        })() : undefined}
        actions={raceAction ? buildRaceActions(raceAction) : []}
      />

      {/* ── Reset plan ActionSheet ── */}
      <BottomSheet
        visible={linkSheetDay !== null || linkSheetRace !== null}
        onClose={() => { setLinkSheetDay(null); setLinkSheetRace(null); }}
        title="Link Strava Record"
      >
        <ScrollView style={styles.linkList} showsVerticalScrollIndicator={false}>
          {linkSheetDay?.adjustmentOptions && (
            <View style={styles.performedPicker}>
              <Text style={styles.performedPickerLabel}>Performed variant</Text>
              <View style={styles.suggestionWrap}>
                {(['standard', 'downgraded'] as PlanAdjustmentChoice[]).map(choice => (
                  <TouchableOpacity
                    key={choice}
                    style={[
                      styles.suggestionBtn,
                      linkPerformedChoice === choice && styles.suggestionBtnActive,
                    ]}
                    onPress={() => setLinkPerformedChoiceState(choice)}
                    activeOpacity={0.75}
                  >
                    <Text style={[
                      styles.suggestionBtnText,
                      linkPerformedChoice === choice && styles.suggestionBtnTextActive,
                    ]}>
                      {choice === 'standard' ? 'Standard' : 'Downgraded'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {availableWorkouts
            .filter((w: any) => {
              const plannedDate = linkSheetDay?.date || linkSheetRace?.startedAt;
              if (!plannedDate) return false;
              const diffDays = Math.abs(new Date(w.startedAt).getTime() - new Date(plannedDate).getTime()) / (1000 * 60 * 60 * 24);
              return diffDays <= 7;
            })
            .map((w: any) => (
              <TouchableOpacity
                key={w.id}
                style={styles.linkOption}
                onPress={() => linkSheetRace ? linkBackendPlan(linkSheetRace, w) : linkSheetDay && linkLocalPlanDay(linkSheetDay, w)}
                activeOpacity={0.7}
              >
                <View style={styles.linkOptionIcon}>
                  <Ionicons name="walk-outline" size={18} color={tokens.color.primary} />
                </View>
                <View style={styles.linkOptionBody}>
                  <Text style={styles.linkOptionTitle}>{w.title || 'Strava activity'}</Text>
                  <Text style={styles.linkOptionMeta}>{formatDate(w.startedAt)} · {formatWorkoutLine(w)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={tokens.color.textTertiary} />
              </TouchableOpacity>
            ))}
          {availableWorkouts.filter((w: any) => {
            const plannedDate = linkSheetDay?.date || linkSheetRace?.startedAt;
            if (!plannedDate) return false;
            const diffDays = Math.abs(new Date(w.startedAt).getTime() - new Date(plannedDate).getTime()) / (1000 * 60 * 60 * 24);
            return diffDays <= 7;
          }).length === 0 && (
            <Text style={styles.emptyLinkText}>No exported records within 7 days of this plan block.</Text>
          )}
        </ScrollView>
      </BottomSheet>

      <ActionSheet
        visible={resetSheet}
        onClose={() => setResetSheet(false)}
        title="Reset training plan?"
        subtitle="Your current plan and race target will be removed."
        actions={[
          {
            label: 'Reset Plan',
            icon: 'refresh-outline',
            destructive: true,
            onPress: () => {
              setStoredTarget(null);
              setTarget(null);
            },
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space.md,
    paddingTop: 60,
    paddingBottom: tokens.space.sm,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: tokens.font.lg,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: tokens.space.sm,
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },

  // Scroll content
  content: { flex: 1, paddingHorizontal: tokens.space.md },

  // Goal card
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.lg,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.lg,
    marginBottom: tokens.space.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  ringContainer: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.elevated,
  },
  ringPercent: { fontSize: tokens.font.xl, fontWeight: '800' },
  ringLabel: { fontSize: 10, color: tokens.color.textMuted },

  targetStats: { flex: 1 },
  targetTitle: { fontSize: tokens.font.lg, fontWeight: '700', color: tokens.color.textPrimary },
  targetDate: { fontSize: tokens.font.sm, color: tokens.color.textMuted, marginBottom: tokens.space.sm },

  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary },
  statLabel: { fontSize: 10, color: tokens.color.textMuted },
  statDivider: { width: 1, height: 24, backgroundColor: tokens.color.border },

  // Warning banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.xs,
    backgroundColor: tokens.color.warningMuted,
    padding: tokens.space.sm,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.space.sm,
    borderWidth: 1,
    borderColor: tokens.color.warning + '60',
  },
  warningText: {
    fontSize: 12,
    color: tokens.color.warning,
    fontWeight: '600',
    flex: 1,
  },

  // Today card
  todayCard: {
    backgroundColor: tokens.color.primaryMuted,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.lg,
    marginBottom: tokens.space.sm,
    borderWidth: 2,
    borderColor: tokens.color.primary,
  },
  todayBadge: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.xs,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: tokens.space.sm,
  },
  todayBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  todayMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space.md,
    marginBottom: tokens.space.md,
  },
  todayIcon: { fontSize: 36 },
  todayInfo: { flex: 1 },
  todayTitle: { fontSize: tokens.font.xl, fontWeight: '700', color: tokens.color.textPrimary, letterSpacing: -0.3 },
  zoneBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.xs, marginVertical: 4, flexWrap: 'wrap' },
  zoneBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  zoneBadgeText: { fontSize: 10, fontWeight: '700' },
  taperBadge: { backgroundColor: tokens.color.accentMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  taperBadgeText: { fontSize: 9, fontWeight: '700', color: tokens.color.accent },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: tokens.color.successMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  linkedBadgeText: { fontSize: 9, fontWeight: '700', color: tokens.color.success },
  linkedWorkoutText: { fontSize: tokens.font.xs, color: tokens.color.success, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeInline: { alignSelf: 'flex-start', marginTop: 3 },
  statusBadgeText: { fontSize: 9, fontWeight: '700' },
  compareRow: {
    borderTopWidth: 1,
    borderTopColor: tokens.color.primary + '30',
    marginTop: tokens.space.sm,
    paddingTop: tokens.space.sm,
    gap: 2,
  },
  compareText: { fontSize: tokens.font.xs, color: tokens.color.textSecondary, fontWeight: '600' },
  performedText: { fontSize: tokens.font.xs, color: tokens.color.primary, fontWeight: '700', marginTop: 2 },
  rpeText: { fontSize: 10, color: tokens.color.textMuted, fontWeight: '600' },
  todayDesc: { fontSize: tokens.font.sm, color: tokens.color.textSecondary, marginTop: 2 },
  suggestionWrap: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.elevated,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: 2,
    marginTop: tokens.space.sm,
    gap: 2,
  },
  suggestionWrapCompact: { marginTop: 6 },
  suggestionBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: tokens.radius.xs,
  },
  suggestionBtnActive: { backgroundColor: tokens.color.primary },
  suggestionBtnText: { fontSize: 10, color: tokens.color.textMuted, fontWeight: '800' },
  suggestionBtnTextActive: { color: '#fff' },
  todayMetrics: { flexDirection: 'row', gap: tokens.space.lg, alignItems: 'center' },
  todayMetric: { alignItems: 'center' },
  todayMetricValue: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary },
  todayMetricLabel: { fontSize: 10, color: tokens.color.textMuted },
  tapHint: { marginLeft: 'auto' },
  restLabel: { fontSize: tokens.font.md, color: tokens.color.textMuted },

  // Tomorrow card
  tomorrowCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.md,
    marginBottom: tokens.space.lg,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  tomorrowBadge: {
    backgroundColor: tokens.color.elevated,
    borderRadius: tokens.radius.xs,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: tokens.space.sm,
  },
  tomorrowBadgeText: { fontSize: 9, fontWeight: '700', color: tokens.color.textMuted, letterSpacing: 1 },
  tomorrowContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tomorrowMain: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, flex: 1 },
  tomorrowIcon: { fontSize: 24 },
  tomorrowInfo: { flex: 1 },
  tomorrowTitle: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary },
  tomorrowDesc: { fontSize: tokens.font.xs, color: tokens.color.textMuted, marginTop: 2 },
  tomorrowRight: { alignItems: 'flex-end' },
  tomorrowMetric: { fontSize: tokens.font.md, fontWeight: '700', color: tokens.color.textSecondary },
  tomorrowMetricSub: { fontSize: tokens.font.xs, color: tokens.color.textMuted },
  restLabelSm: { fontSize: tokens.font.sm, color: tokens.color.textMuted },

  // Past blocks
  historySection: {
    marginBottom: tokens.space.md,
    paddingVertical: tokens.space.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: tokens.color.border,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.space.sm,
  },
  historyTitle: {
    fontSize: tokens.font.sm,
    fontWeight: '700',
    color: tokens.color.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  historySub: { fontSize: tokens.font.xs, color: tokens.color.textTertiary, marginTop: 2 },
  historyHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyCount: { fontSize: tokens.font.xs, color: tokens.color.textMuted, fontWeight: '700' },
  historyDayCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.sm,
    marginBottom: tokens.space.xs,
    opacity: 0.82,
  },
  historyDayCardClickable: { borderColor: tokens.color.border },
  historyDayTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyDayDateWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyDot: { width: 6, height: 6, borderRadius: 3 },
  historyDayName: { fontSize: tokens.font.xs, color: tokens.color.textMuted, fontWeight: '600' },
  historyDayBody: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  historyDayIcon: { fontSize: 16, opacity: 0.75 },
  historyDayInfo: { flex: 1 },
  historyDayWorkout: { fontSize: tokens.font.sm, color: tokens.color.textSecondary, fontWeight: '600' },
  historyDayDesc: { fontSize: tokens.font.xs, color: tokens.color.textTertiary, marginTop: 1 },
  historyMetric: { fontSize: tokens.font.sm, color: tokens.color.textMuted, fontWeight: '700' },

  // Upcoming controls
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space.sm,
  },
  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: tokens.space.sm },
  expandBtnText: { fontSize: tokens.font.sm, color: tokens.color.primary, fontWeight: '600' },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  toggleBtnActive: { backgroundColor: tokens.color.primary, borderColor: tokens.color.primary },
  toggleBtnText: { fontSize: 10, fontWeight: '700', color: tokens.color.textSecondary },
  toggleBtnTextActive: { color: '#fff' },

  // Week header (source reference tag)
  weekHeaderRow: {
    paddingVertical: tokens.space.xs,
    paddingHorizontal: 2,
    marginBottom: tokens.space.xs,
    marginTop: tokens.space.sm,
  },
  weekHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Timeline + day rows
  dayRow: { flexDirection: 'row', gap: tokens.space.sm, marginBottom: tokens.space.sm },
  timeline: { width: 16, alignItems: 'center', paddingTop: 14 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  timelineLine: { width: 2, flex: 1, borderRadius: 1, marginTop: 4 },

  // Day card
  dayCard: {
    flex: 1,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.space.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  dayCardClickable: {
    borderColor: tokens.color.primary + '80',
    shadowColor: tokens.color.primary,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.space.sm,
  },
  dayName: { fontSize: tokens.font.sm, color: tokens.color.textSecondary, fontWeight: '500' },
  dayNum: { fontSize: tokens.font.xs, color: tokens.color.textTertiary, marginTop: 1 },
  badgeRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  raceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  raceBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  badgeB: { backgroundColor: tokens.color.warning + '30' },
  badgeC: { backgroundColor: tokens.color.primary + '30' },
  badgeD: { backgroundColor: tokens.color.success + '30' },
  dayTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dayTypeText: { fontSize: 9, fontWeight: '700' },
  dayContent: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, marginBottom: 2 },
  dayIcon: { fontSize: 20 },
  dayInfo: { flex: 1 },
  dayTitle: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary },
  dayZoneLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  dayDesc: { fontSize: tokens.font.xs, color: tokens.color.textMuted },
  dayMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: tokens.space.sm,
    paddingTop: tokens.space.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
  },
  dayMetricValue: { fontSize: tokens.font.sm, color: tokens.color.textSecondary, fontWeight: '500' },
  dayMetricSep: { fontSize: tokens.font.xs, color: tokens.color.textTertiary },

  // Link picker
  linkList: { maxHeight: 360 },
  performedPicker: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.md,
    marginBottom: tokens.space.sm,
  },
  performedPickerLabel: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  linkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.md,
    marginBottom: tokens.space.sm,
  },
  linkOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkOptionBody: { flex: 1 },
  linkOptionTitle: { fontSize: tokens.font.sm, fontWeight: '700', color: tokens.color.textPrimary },
  linkOptionMeta: { fontSize: tokens.font.xs, color: tokens.color.textMuted, marginTop: 2 },
  emptyLinkText: { color: tokens.color.textMuted, textAlign: 'center', padding: tokens.space.lg },

  // Empty states
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: tokens.space.xl },
  emptyIcon: { fontSize: 64, marginBottom: tokens.space.md },
  emptyTitle: { fontSize: tokens.font.xl, fontWeight: '700', color: tokens.color.textPrimary, marginBottom: tokens.space.xs },
  emptySub: { fontSize: tokens.font.md, color: tokens.color.textMuted, textAlign: 'center', marginBottom: tokens.space.lg },
  setTargetBtn: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space.xl,
    paddingVertical: tokens.space.md,
  },
  setTargetBtnText: { color: '#fff', fontSize: tokens.font.md, fontWeight: '700' },
  secondarySettingsBtn: { marginTop: tokens.space.md, paddingVertical: tokens.space.sm, paddingHorizontal: tokens.space.md },
  secondarySettingsText: { color: tokens.color.textSecondary, fontSize: tokens.font.sm, fontWeight: '600' },
});
