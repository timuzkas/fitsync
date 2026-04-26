import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, LayoutAnimation, UIManager, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDeviceStore } from '../store/useDeviceStore';
import { api } from '../api/client';
import {
  generateSmartPlan,
  adaptPlanAfterNewWorkout,
  DailyPlan,
  getDayTypeColor,
  getDayTypeIcon,
  getVdotZoneLabel,
} from '../lib/dailyPlanner';
import { evaluateAdaptiveLevel } from '../../../../packages/shared/planner';
import { TrainingTarget } from '../types';
import { tokens } from '../tokens';
import { ActionSheet } from '../components/ui/BottomSheet';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type PlanRouteParams = {
  Plan: { target?: TrainingTarget; refresh?: boolean };
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlannedRaceAction {
  race: any;
  dayType?: 'today' | 'tomorrow' | 'upcoming';
}

export default function PlanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PlanRouteParams, 'Plan'>>();
  const {
    deviceId, deviceSecret, athleteProfile, planConfig, target: storedTarget,
    setTarget: setStoredTarget, _hasHydrated, updatePlanConfig,
  } = useDeviceStore();

  const [target, setTarget] = useState<TrainingTarget | null>(route.params?.target || storedTarget || null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [plannedRaces, setPlannedRaces] = useState<any[]>([]);
  const [availableWorkouts, setAvailableWorkouts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [readiness, setReadiness] = useState(0.7);
  const [hideRestDays, setHideRestDays] = useState(false);

  // ActionSheet state
  const [raceAction, setRaceAction] = useState<PlannedRaceAction | null>(null);
  const [resetSheet, setResetSheet] = useState(false);

  const handleSavePlan = useCallback(() => {
    if (target) {
      setStoredTarget(target);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [target, setStoredTarget]);

  const formatDuration = (sec: number) => {
    if (!sec) return '--';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleLinkRace = useCallback(async (race: any) => {
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
      api.getPlannedRaces(deviceId, deviceSecret).then(r => setPlannedRaces(r.plannedRaces || [])).catch(console.error);

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
        await api.linkWorkoutToPlannedRace(deviceId, deviceSecret, race.id, nearbyWorkouts[0].id);
        refreshRaces();
      } catch { /* silent */ }
    } else {
      // Multiple nearby — for now link first; ideally show a picker sheet (future improvement)
      try {
        await api.linkWorkoutToPlannedRace(deviceId, deviceSecret, race.id, nearbyWorkouts[0].id);
        refreshRaces();
      } catch { /* silent */ }
    }
  }, [deviceId, deviceSecret, availableWorkouts]);

  const handleUnlinkRace = useCallback(async (race: any) => {
    try {
      await api.linkWorkoutToPlannedRace(deviceId, deviceSecret, race.id, null);
      api.getPlannedRaces(deviceId, deviceSecret).then(r => setPlannedRaces(r.plannedRaces || [])).catch(console.error);
    } catch { /* silent */ }
  }, [deviceId, deviceSecret]);

  const handleDeletePlanned = useCallback(async (raceId: string) => {
    try {
      await api.deleteWorkout(deviceId, deviceSecret, raceId);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      api.getPlannedRaces(deviceId, deviceSecret).then(r => setPlannedRaces(r.plannedRaces || [])).catch(console.error);
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

  const { dailyPlan, weeklyStats, progress, daysRemaining, completedDist, targetDist } = useMemo(() => {
    if (!_hasHydrated || !target) return { dailyPlan: [], weeklyStats: [], progress: 0, daysRemaining: 0, completedDist: 0, targetDist: 0 };

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

    return { dailyPlan, weeklyStats, progress, daysRemaining, completedDist, targetDist: target.distanceKm };
  }, [target, workouts, athleteProfile, planConfig, today, _hasHydrated, readiness]);

  const todayPlan = dailyPlan.find(d => d.dayNum === 1);
  const tomorrowPlan = dailyPlan.find(d => d.dayNum === 2);

  const getPlannedRaceForDay = (day: any) => {
    if (!day?.date) return null;
    const d = new Date(day.date);
    const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return plannedRaces.find((r: any) => {
      const rd = new Date(r.startedAt);
      const rdStr = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`;
      return rdStr === dayStr;
    });
  };

  const upcomingPlanRaw = expanded ? dailyPlan.slice(2) : dailyPlan.slice(2, 5);
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

  // Build ActionSheet actions for a planned race
  const buildRaceActions = (race: any) => {
    const isLinked = !!race?.linkedWorkoutId;
    const actions = [
      {
        label: 'Edit',
        icon: 'pencil-outline',
        onPress: () => navigation.navigate('AddWorkout', { editWorkout: race }),
      },
      isLinked
        ? {
            label: 'Unlink Completed Workout',
            icon: 'unlink-outline',
            onPress: () => handleUnlinkRace(race),
          }
        : {
            label: 'Link to Completed Workout',
            icon: 'link-outline',
            onPress: () => handleLinkRace(race),
          },
      {
        label: 'Delete',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => handleDeletePlanned(race.id),
      },
    ];
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

        {/* ── Today card ── */}
        {todayPlan && (() => {
          const plannedOnDay = getPlannedRaceForDay(todayPlan);
          const isLinked = !!plannedOnDay?.linkedWorkoutId;
          const linkedWorkout = plannedOnDay?.workout;
          return (
            <TouchableOpacity
              style={styles.todayCard}
              onPress={() => { if (plannedOnDay) setRaceAction({ race: plannedOnDay, dayType: 'today' }); }}
              activeOpacity={plannedOnDay ? 0.8 : 1}
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
                    {isLinked && (
                      <View style={styles.linkedBadge}>
                        <Ionicons name="checkmark-circle" size={10} color={tokens.color.success} />
                        <Text style={styles.linkedBadgeText}>DONE</Text>
                      </View>
                    )}
                    {todayPlan.rpe > 0 && (
                      <Text style={styles.rpeText}>RPE {todayPlan.rpe}</Text>
                    )}
                  </View>
                  {isLinked && linkedWorkout && (
                    <Text style={styles.linkedWorkoutText}>
                      {linkedWorkout.distanceM ? `${(linkedWorkout.distanceM / 1000).toFixed(1)}km` : ''}
                      {linkedWorkout.durationSec ? ` · ${formatDuration(linkedWorkout.durationSec)}` : ''}
                    </Text>
                  )}
                  <Text style={styles.todayDesc}>{todayPlan.description}</Text>
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
                    {plannedOnDay && (
                      <View style={styles.tapHint}>
                        <Ionicons name="ellipsis-horizontal" size={14} color={tokens.color.textTertiary} />
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.restLabel}>Rest Day</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* ── Tomorrow card ── */}
        {tomorrowPlan && (() => {
          const plannedOnDay = getPlannedRaceForDay(tomorrowPlan);
          const isLinked = !!plannedOnDay?.linkedWorkoutId;
          return (
            <TouchableOpacity
              style={styles.tomorrowCard}
              onPress={() => { if (plannedOnDay) setRaceAction({ race: plannedOnDay, dayType: 'tomorrow' }); }}
              activeOpacity={plannedOnDay ? 0.8 : 1}
            >
              <View style={styles.tomorrowBadge}>
                <Text style={styles.tomorrowBadgeText}>TOMORROW</Text>
              </View>
              <View style={styles.tomorrowContent}>
                <View style={styles.tomorrowMain}>
                  <Text style={styles.tomorrowIcon}>{getDayTypeIcon(tomorrowPlan.type)}</Text>
                  <View style={styles.tomorrowInfo}>
                    <Text style={styles.tomorrowTitle}>{tomorrowPlan.title}</Text>
                    <Text style={styles.tomorrowDesc}>{tomorrowPlan.description}</Text>
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
                  {plannedOnDay && (
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
              const d = new Date(day.date);
              const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const plannedOnDay = plannedRaces.find((r: any) => {
                const rd = new Date(r.startedAt);
                const rdStr = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`;
                return rdStr === dayStr;
              });
              const isClickable = !!(plannedOnDay || day.isRaceDay);
              const accentColor = getDayTypeColor(day.type);
              const isLast = idx === upcomingPlan.length - 1;

              return (
                <View key={day.date.toString()} style={styles.dayRow}>
                  {/* Timeline column */}
                  <View style={styles.timeline}>
                    <View style={[styles.timelineDot, { backgroundColor: accentColor }]} />
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: accentColor + '40' }]} />}
                  </View>

                  {/* Card */}
                  <TouchableOpacity
                    style={[styles.dayCard, isClickable && styles.dayCardClickable]}
                    onPress={() => {
                      if (plannedOnDay) setRaceAction({ race: plannedOnDay, dayType: 'upcoming' });
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
                      </View>
                    </View>

                    {day.targetDistanceKm > 0 && (
                      <View style={styles.dayMetrics}>
                        <Text style={styles.dayMetricValue}>{day.targetDistanceKm}km</Text>
                        <Text style={styles.dayMetricSep}>·</Text>
                        <Text style={styles.dayMetricValue}>{day.targetDurationMin}min</Text>
                        <Text style={styles.dayMetricSep}>·</Text>
                        <Text style={styles.dayMetricValue}>{formatPace(day.targetPaceSecPerKm)}/km</Text>
                        {plannedOnDay && (
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
        title={activeRace?.title || 'Planned Workout'}
        subtitle={activeRace ? (() => {
          const d = new Date(activeRace.startedAt);
          const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return activeRace.distanceM
            ? `${dateStr} · ${(activeRace.distanceM / 1000).toFixed(1)} km`
            : dateStr;
        })() : undefined}
        actions={activeRace ? buildRaceActions(activeRace) : []}
      />

      {/* ── Reset plan ActionSheet ── */}
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
  rpeText: { fontSize: 10, color: tokens.color.textMuted, fontWeight: '600' },
  todayDesc: { fontSize: tokens.font.sm, color: tokens.color.textSecondary, marginTop: 2 },
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
