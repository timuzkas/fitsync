import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDeviceStore } from '../store/useDeviceStore';
import { api } from '../api/client';
import { 
  generateSmartPlan, 
  adaptPlanAfterNewWorkout, 
  DailyPlan, 
  getDayTypeColor, 
  getDayTypeIcon,
  getVdotZoneLabel 
} from '../lib/dailyPlanner';
import { TrainingTarget } from '../types';
import { tokens } from '../tokens';

type PlanRouteParams = {
  Plan: { target?: TrainingTarget; refresh?: boolean };
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PlanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PlanRouteParams, 'Plan'>>();
  const { deviceId, deviceSecret, athleteProfile, planConfig, target: storedTarget, setTarget: setStoredTarget, _hasHydrated, updatePlanConfig } = useDeviceStore();

  const [target, setTarget] = useState<TrainingTarget | null>(route.params?.target || storedTarget || null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [plannedRaces, setPlannedRaces] = useState<any[]>([]);
  const [availableWorkouts, setAvailableWorkouts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [readiness, setReadiness] = useState(0.7);
  const [hideRestDays, setHideRestDays] = useState(false);

  const handleSavePlan = useCallback(() => {
    if (target) {
      setStoredTarget(target);
      setSaved(true);
      Alert.alert('Plan Saved', 'Your training plan has been saved.');
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
    
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const formatWorkout = (w: any) => {
      const wDate = new Date(w.startedAt);
      const diff = Math.round((wDate.getTime() - raceDateTime) / (1000 * 60 * 60 * 24));
      const diffStr = diff === 0 ? 'same day' : diff > 0 ? `+${diff}d` : `${diff}d`;
      const dist = w.distanceM ? `${(w.distanceM / 1000).toFixed(1)}km` : '';
      const dur = w.durationSec ? formatDuration(w.durationSec) : '';
      const parts = [w.title || w.type, dist, dur, diffStr].filter(Boolean);
      return parts.join(' • ');
    };

    const isAlreadyLinked = !!race.linkedWorkoutId;

    if (isAlreadyLinked) {
      Alert.alert(
        'Already Linked',
        `This planned workout is linked to "${race.workout?.title || race.workout?.type || 'workout'}".`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Change Link',
            onPress: () => {
              const nearbyWorkouts = availableWorkouts.filter((w: any) => {
                const wDate = new Date(w.startedAt);
                const diffDays = Math.abs(wDate.getTime() - raceDateTime) / (1000 * 60 * 60 * 24);
                return diffDays <= 5;
              });
              if (nearbyWorkouts.length === 0) {
                Alert.alert('No workouts found', 'No workout found within 5 days of planned date.');
                return;
              }
              const options = nearbyWorkouts.map(formatWorkout);
              Alert.alert('Select Workout', 'Which workout should this race link to?', [
                ...nearbyWorkouts.map((w: any, i: number) => ({
                  text: options[i],
                  onPress: async () => {
                    try {
                      await api.linkWorkoutToPlannedRace(deviceId, deviceSecret, race.id, w.id);
                      Alert.alert('Linked!', 'Planned race linked to your workout.');
                      api.getPlannedRaces(deviceId, deviceSecret).then(result => {
                        setPlannedRaces(result.plannedRaces || []);
                      }).catch(console.error);
                    } catch (e) {
                      Alert.alert('Error', 'Failed to link workout');
                    }
                  }
                })),
                { text: 'Cancel', style: 'cancel' }
              ]);
            }
          },
          {
            text: 'Unlink',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.linkWorkoutToPlannedRace(deviceId, deviceSecret, race.id, null);
                Alert.alert('Unlinked', 'Workout link removed.');
                api.getPlannedRaces(deviceId, deviceSecret).then(result => {
                  setPlannedRaces(result.plannedRaces || []);
                }).catch(console.error);
              } catch (e) {
                Alert.alert('Error', 'Failed to unlink workout');
              }
            }
          }
        ]
      );
      return;
    }

    const nearbyWorkouts = availableWorkouts.filter((w: any) => {
      const wDate = new Date(w.startedAt);
      const diffDays = Math.abs(wDate.getTime() - raceDateTime) / (1000 * 60 * 60 * 24);
      return diffDays <= 5;
    });
    
    if (nearbyWorkouts.length === 0) {
      Alert.alert('No workouts found', `No workout found within 5 days of ${formatDate(raceDate)}. Run a workout or sync Strava first.`);
      return;
    }
    
    if (nearbyWorkouts.length === 1) {
      try {
        await api.linkWorkoutToPlannedRace(deviceId, deviceSecret, race.id, nearbyWorkouts[0].id);
        Alert.alert('Linked!', 'Planned race linked to your workout.');
        api.getPlannedRaces(deviceId, deviceSecret).then(result => {
          setPlannedRaces(result.plannedRaces || []);
        }).catch(console.error);
      } catch (e) {
        Alert.alert('Error', 'Failed to link workout');
      }
    } else {
      const options = nearbyWorkouts.map(formatWorkout);
      Alert.alert('Select Workout', 'Which workout should this race link to?', [
        ...nearbyWorkouts.map((w: any, i: number) => ({
          text: options[i],
          onPress: async () => {
            try {
              await api.linkWorkoutToPlannedRace(deviceId, deviceSecret, race.id, w.id);
              Alert.alert('Linked!', 'Planned race linked to your workout.');
              api.getPlannedRaces(deviceId, deviceSecret).then(result => {
                setPlannedRaces(result.plannedRaces || []);
              }).catch(console.error);
            } catch (e) {
              Alert.alert('Error', 'Failed to link workout');
            }
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  }, [deviceId, deviceSecret, availableWorkouts]);

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

    const defaults = {
      freeDays: ['wed', 'sat', 'sun'],
      weeklyTargetKm: 30,
      longRunTargetKm: 12,
      sessionsPerWeek: 3,
    };
    const config = planConfig ? { ...defaults, ...planConfig } : defaults;
    
    const readinessScores: Record<string, number> = {};
    const todayDateStr = today.toISOString().split('T')[0];
    readinessScores[todayDateStr] = readiness;
    const temps: Record<string, number> = {};
    
    // Only include future planned races - don't let them affect today's load/readiness
    const futurePlannedRaces = plannedRaces.filter((r: any) => {
      const raceDate = new Date(r.startedAt);
      raceDate.setHours(0, 0, 0, 0);
      return raceDate >= today;
    });
    
    // Convert planned races to activities format for the planner
    const plannedRaceActivities = futurePlannedRaces.map((r: any) => ({
      date: new Date(r.startedAt),
      distance: (r.distanceM || 0) / 1000,
      duration: r.targetTimeSec || r.durationSec || 0,
      hrAvg: r.avgHr || 140,
      isRace: true,
      racePriority: r.sessionPurpose || 'c-race',
      title: r.title,
    }));
    
    const { dailyPlan: basePlan, weeklyStats } = generateSmartPlan(target, activities, athlete, config, readinessScores, temps, plannedRaceActivities);

    // Adapt plan based on most recent completed workout
    let dailyPlan = basePlan;
    const todayStr = today.toISOString().split('T')[0];
    const completedWorkouts = workouts
      .filter((w: any) => (w.startedAt || '').split('T')[0] <= todayStr)
      .sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    const lastWorkout = completedWorkouts.length > 0 ? completedWorkouts[0] : null;
    if (lastWorkout) {
      dailyPlan = adaptPlanAfterNewWorkout(basePlan, lastWorkout, athlete, readinessScores, workouts);
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
    const dayDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return plannedRaces.find((r: any) => {
      const rd = new Date(r.startedAt);
      const rdStr = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`;
      return rdStr === dayDateStr;
    });
  };
  
  // The 'Upcoming' list should always start from Day 3 (index 2) to avoid 
  // repeating Today (Day 1) and Tomorrow (Day 2) which are shown at the top.
  const upcomingPlanRaw = expanded 
    ? dailyPlan.slice(2) 
    : dailyPlan.slice(2, 5); // Show next 3 days when collapsed (Day 3, 4, 5)

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

  const handleResetPlan = useCallback(() => {
    Alert.alert('Reset Plan', 'Delete your current plan and start over?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => {
        setStoredTarget(null);
        setTarget(null);
      }},
    ]);
  }, [setStoredTarget]);

  if (!_hasHydrated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.emptyTitle}>Loading...</Text>
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
          <TouchableOpacity style={styles.setTargetBtn} onPress={() => navigation.navigate('Target')}>
            <Text style={styles.setTargetBtnText}>Set Target</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondarySettingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.secondarySettingsText}>⚙ Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan</Text>
        <View style={styles.headerBtns}>
          {target && (
            <TouchableOpacity onPress={handleSavePlan}>
              <Text style={styles.headerSaveBtn}>{saved ? '✓' : '💾'}</Text>
            </TouchableOpacity>
          )}
          {target && (
            <TouchableOpacity onPress={handleResetPlan}>
              <Text style={styles.headerResetBtn}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarHeader}>
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
                <Text style={styles.statValue}>{formatPace(target.targetTimeSec ? target.targetTimeSec / target.distanceKm : 0)}</Text>
                <Text style={styles.statLabel}>finish</Text>
              </View>
            </View>
          </View>
        </View>

        {todayPlan?.planLimitationFlag && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ {todayPlan.planLimitationFlag}</Text>
          </View>
        )}

        {todayPlan && (() => {
          const plannedOnDay = getPlannedRaceForDay(todayPlan);
          const isLinked = !!plannedOnDay?.linkedWorkoutId;
          const linkedWorkout = plannedOnDay?.workout;
          return (
          <TouchableOpacity style={styles.todayCard} onPress={() => {
            const plannedOnDay = getPlannedRaceForDay(todayPlan);
            if (plannedOnDay) {
              Alert.alert(
                plannedOnDay.title || 'Planned Workout',
                `${formatDate(plannedOnDay.startedAt)}${
                  plannedOnDay.distanceM
                    ? ` • ${(plannedOnDay.distanceM / 1000).toFixed(1)}km`
                    : ''
                }`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Edit', onPress: () => navigation.navigate('AddWorkout', { editWorkout: plannedOnDay }) },
                  { text: 'Link to Completed', onPress: () => handleLinkRace(plannedOnDay) },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await api.deleteWorkout(deviceId, deviceSecret, plannedOnDay.id);
                        api.getPlannedRaces(deviceId, deviceSecret).then(result => {
                          setPlannedRaces(result.plannedRaces || []);
                        });
                      } catch (e) {
                        Alert.alert('Error', 'Failed to delete');
                      }
                    }
                  },
                ]
              );
            }
          }}>
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>TODAY</Text>
            </View>
            <View style={styles.todayContent}>
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
                        <Text style={styles.linkedBadgeText}>✓ DONE</Text>
                      </View>
                    )}
                    {todayPlan.rpe > 0 && (
                      <Text style={styles.rpeText}>RPE: {todayPlan.rpe}</Text>
                    )}
                  </View>
                  {isLinked && linkedWorkout && (
                    <Text style={styles.linkedWorkoutText}>
                      {linkedWorkout.distanceM ? `${(linkedWorkout.distanceM/1000).toFixed(1)}km` : ''} 
                      {linkedWorkout.durationSec ? ` • ${formatDuration(linkedWorkout.durationSec)}` : ''}
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
                      <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={styles.dayMetricHint}>Tap for actions ›</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.restLabel}>Rest Day</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
          );
        })()}

        {tomorrowPlan && (() => {
          const plannedOnDay = getPlannedRaceForDay(tomorrowPlan);
          const isLinked = !!plannedOnDay?.linkedWorkoutId;
          return (
          <TouchableOpacity style={styles.tomorrowCard} onPress={() => {
            const p = getPlannedRaceForDay(tomorrowPlan);
            if (p) {
              Alert.alert(
                p.title || 'Planned Workout',
                `${formatDate(p.startedAt)}${
                  p.distanceM ? ` • ${(p.distanceM / 1000).toFixed(1)}km` : ''
                }`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Edit', onPress: () => navigation.navigate('AddWorkout', { editWorkout: p }) },
                  { text: 'Link to Completed', onPress: () => handleLinkRace(p) },
                  { text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                      await api.deleteWorkout(deviceId, deviceSecret, p.id);
                      api.getPlannedRaces(deviceId, deviceSecret).then(result => setPlannedRaces(result.plannedRaces || []));
                    } catch (e) { Alert.alert('Error', 'Failed to delete'); }
                  }},
                ]
              );
            }
          }}>
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
              <View style={styles.tomorrowMetrics}>
                {tomorrowPlan.targetDistanceKm > 0 ? (
                  <>
                    <Text style={styles.tomorrowMetric}>{tomorrowPlan.targetDistanceKm}km</Text>
                    <Text style={styles.tomorrowMetric}>{formatPace(tomorrowPlan.targetPaceSecPerKm)}/km</Text>
                  </>
                ) : (
                  <Text style={styles.restLabel}>Rest</Text>
                )}
                {plannedOnDay && (
                  <Text style={styles.dayMetricHint}>Tap for actions ›</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
          );
        })()}

        {upcomingPlan.length > 0 && (
          <>
            <View style={styles.upcomingHeader}>
              <TouchableOpacity 
                style={styles.expandBtn} 
                onPress={() => setExpanded(!expanded)}
              >
                <Text style={styles.expandBtnText}>
                  {expanded ? 'Show Less' : `Show more days`}
                </Text>
                <Text style={styles.expandBtnIcon}>{expanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.toggleBtn, hideRestDays && styles.toggleBtnActive]}
                onPress={() => setHideRestDays(!hideRestDays)}
              >
                <Text style={[styles.toggleBtnText, hideRestDays && styles.toggleBtnTextActive]}>
                  {hideRestDays ? 'Show Rest' : 'Hide Rest'}
                </Text>
              </TouchableOpacity>
            </View>

            {upcomingPlan.map((day, idx) => {
              const d = new Date(day.date);
              const dayDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const plannedOnDay = plannedRaces.find((r: any) => {
                const rd = new Date(r.startedAt);
                const rdStr = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`;
                return rdStr === dayDateStr;
              });
              
              return (
                <TouchableOpacity 
                    key={day.date.toString()}
                    style={[
                      styles.dayCard,
                      (plannedOnDay || day.isRaceDay) && styles.dayCardClickable
                    ]}
                    onPress={() => {
                      if (plannedOnDay) {
                        Alert.alert(
                          plannedOnDay.title || 'Planned Workout',
                          `${formatDate(plannedOnDay.startedAt)}${
                            plannedOnDay.distanceM
                              ? ` • ${(plannedOnDay.distanceM / 1000).toFixed(1)}km`
                              : ''
                          }`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Edit', onPress: () => navigation.navigate('AddWorkout', { editWorkout: plannedOnDay }) },
                            { text: 'Link to Completed', onPress: () => handleLinkRace(plannedOnDay) },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await api.deleteWorkout(deviceId, deviceSecret, plannedOnDay.id);
                                  api.getPlannedRaces(deviceId, deviceSecret).then(result => {
                                    setPlannedRaces(result.plannedRaces || []);
                                  });
                                } catch (e) {
                                  Alert.alert('Error', 'Failed to delete');
                                }
                              }
                            },
                          ]
                        );
                      } else if (day.isRaceDay) {
                        Alert.alert(
                          `Race Day: ${day.title}`,
                          `${day.dayOfWeek}, ${formatDate(day.date)}\n\n${day.description || 'Race day - tap to add a planned workout'}`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Add Workout', onPress: () => navigation.navigate('AddWorkout', { presetDate: day.date }) },
                          ]
                        );
                      }
                    }}
                  >
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayName}>{day.dayOfWeek}, {formatDate(day.date)}</Text>
                    <Text style={styles.dayNum}>Day {day.dayNum}</Text>
                  </View>
                  <View style={styles.badgeRow}>
                    {day.isRaceDay && (
                      <View style={[styles.raceBadge, day.racePriority === 'b-race' ? styles.badgeB : styles.badgeC]}>
                        <Text style={styles.raceBadgeText}>🏁 {day.racePriority === 'b-race' ? 'B' : 'C'}</Text>
                      </View>
                    )}
                    {day.isTaper && (
                      <View style={styles.taperBadge}>
                        <Text style={styles.taperBadgeText}>↓ TAPER</Text>
                      </View>
                    )}
                    <View style={[styles.dayTypeBadge, { backgroundColor: getDayTypeColor(day.type) + '20' }]}>
                      <Text style={[styles.dayTypeText, { color: getDayTypeColor(day.type) }]}>
                        {day.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.dayContent}>
                  <Text style={styles.dayIcon}>{getDayTypeIcon(day.type)}</Text>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayTitle}>{day.title}</Text>
                    <Text style={[styles.dayZoneLabel, { color: getDayTypeColor(day.type) }]}>
                      {getVdotZoneLabel(day.vdotZone)}
                    </Text>
                    <Text style={styles.dayDesc}>{day.description}</Text>
                  </View>
                </View>

                {day.targetDistanceKm > 0 && (
                  <View style={styles.dayMetrics}>
                    <View style={styles.dayMetric}>
                      <Text style={styles.dayMetricValue}>{day.targetDistanceKm}km</Text>
                    </View>
                    <View style={styles.dayMetric}>
                      <Text style={styles.dayMetricValue}>{day.targetDurationMin}min</Text>
                    </View>
                    <View style={styles.dayMetric}>
                      <Text style={styles.dayMetricValue}>{formatPace(day.targetPaceSecPerKm)}</Text>
                    </View>
                    {plannedOnDay && (
                      <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={styles.dayMetricHint}>Tap for actions ›</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: tokens.space.md, paddingTop: 60, paddingBottom: tokens.space.sm,
  },
  back: { fontSize: 24, color: tokens.color.textMuted },
  headerTitle: { fontSize: tokens.font.lg, fontWeight: '600', color: tokens.color.textPrimary },
  editBtn: { fontSize: 20 },
  content: { flex: 1, paddingHorizontal: tokens.space.md },
  
  calendarHeader: {
    flexDirection: 'row', alignItems: 'center', gap: tokens.space.lg,
    backgroundColor: tokens.color.surface, borderRadius: tokens.radius.lg,
    padding: tokens.space.lg, marginBottom: tokens.space.lg, borderWidth: 1, borderColor: tokens.color.border,
  },
  ringContainer: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 4, alignItems: 'center', justifyContent: 'center',
    backgroundColor: tokens.color.elevated,
  },
  ringPercent: { fontSize: tokens.font.xl, fontWeight: 'bold' },
  ringLabel: { fontSize: 10, color: tokens.color.textMuted },
  
  targetStats: { flex: 1 },
  targetTitle: { fontSize: tokens.font.lg, fontWeight: 'bold', color: tokens.color.textPrimary },
  targetDate: { fontSize: tokens.font.sm, color: tokens.color.textMuted, marginBottom: tokens.space.sm },
  
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary },
  statLabel: { fontSize: 10, color: tokens.color.textMuted },
  statDivider: { width: 1, height: 24, backgroundColor: tokens.color.border },

  warningBanner: {
    backgroundColor: tokens.color.warning + '20',
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.space.md,
    borderWidth: 1,
    borderColor: tokens.color.warning,
  },
  warningText: {
    fontSize: 11,
    color: tokens.color.warning,
    fontWeight: '700',
    lineHeight: 16,
  },

  todayCard: {
    backgroundColor: tokens.color.primaryMuted, borderRadius: tokens.radius.lg,
    padding: tokens.space.lg, marginBottom: tokens.space.md, borderWidth: 2, borderColor: tokens.color.primary,
  },
  todayBadge: {
    backgroundColor: tokens.color.primary, borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space.sm, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: tokens.space.sm,
  },
  todayBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  todayContent: {},
  todayMain: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md, marginBottom: tokens.space.md },
  todayIcon: { fontSize: 36 },
  todayInfo: { flex: 1 },
  todayTitle: { fontSize: tokens.font.xl, fontWeight: 'bold', color: tokens.color.textPrimary },
  zoneBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, marginVertical: 4 },
  zoneBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  zoneBadgeText: { fontSize: 10, fontWeight: 'bold' },
  rpeText: { fontSize: 10, color: tokens.color.textMuted, fontWeight: '600' },
  todayDesc: { fontSize: tokens.font.sm, color: tokens.color.textSecondary, marginTop: 2 },
  todayMetrics: { flexDirection: 'row', gap: tokens.space.lg },
  todayMetric: { alignItems: 'center' },
  todayMetricValue: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary },
  todayMetricLabel: { fontSize: 10, color: tokens.color.textMuted },
  restLabel: { fontSize: tokens.font.md, color: tokens.color.textMuted },

  tomorrowCard: {
    backgroundColor: tokens.color.surface, borderRadius: tokens.radius.lg,
    padding: tokens.space.md, marginBottom: tokens.space.lg, borderWidth: 1, borderColor: tokens.color.border,
  },
  tomorrowBadge: {
    backgroundColor: tokens.color.elevated, borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space.sm, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: tokens.space.sm,
  },
  tomorrowBadgeText: { fontSize: 10, fontWeight: '600', color: tokens.color.textMuted },
  tomorrowContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tomorrowMain: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, flex: 1 },
  tomorrowIcon: { fontSize: 24 },
  tomorrowInfo: { flex: 1 },
  tomorrowTitle: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary },
  tomorrowDesc: { fontSize: tokens.font.xs, color: tokens.color.textMuted },
  tomorrowMetrics: { flexDirection: 'row', gap: tokens.space.sm, alignItems: 'center', flex: 1 },
  tomorrowMetric: { fontSize: tokens.font.sm, color: tokens.color.textSecondary },

  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space.sm,
  },
  expandBtn: {
    flexDirection: 'row', alignItems: 'center', gap: tokens.space.xs,
    paddingVertical: tokens.space.sm,
  },
  expandBtnText: { fontSize: tokens.font.sm, color: tokens.color.primary, fontWeight: '600' },
  expandBtnIcon: { fontSize: 12, color: tokens.color.primary },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  toggleBtnActive: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary,
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: tokens.color.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#fff',
  },

  dayCard: {
    backgroundColor: tokens.color.surface, borderRadius: tokens.radius.md,
    padding: tokens.space.md, marginBottom: tokens.space.sm, borderWidth: 1, borderColor: tokens.color.border,
  },
  dayCardClickable: {
    borderColor: tokens.color.primary,
    borderWidth: 1.5,
    shadowColor: tokens.color.primary,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: tokens.space.sm },
  dayName: { fontSize: tokens.font.sm, color: tokens.color.textMuted },
  dayNum: { fontSize: tokens.font.xs, color: tokens.color.textMuted },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  taperBadge: {
    backgroundColor: tokens.color.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taperBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: tokens.color.accent,
  },
  linkedBadge: {
    backgroundColor: tokens.color.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  linkedBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: tokens.color.success,
  },
  linkedWorkoutText: {
    fontSize: tokens.font.xs,
    color: tokens.color.success,
    marginTop: 2,
  },
  raceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  raceBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#fff' },
  dayTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dayTypeText: { fontSize: 9, fontWeight: 'bold' },
  dayContent: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  dayIcon: { fontSize: 20 },
  dayInfo: { flex: 1 },
  dayTitle: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary },
  dayZoneLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  dayDesc: { fontSize: tokens.font.xs, color: tokens.color.textMuted },
  dayMetrics: { flexDirection: 'row', gap: tokens.space.md, marginTop: tokens.space.sm, paddingTop: tokens.space.sm, borderTopWidth: 1, borderTopColor: tokens.color.border },
  dayMetric: {},
  dayMetricValue: { fontSize: tokens.font.sm, color: tokens.color.textSecondary },
  dayMetricHint: { fontSize: tokens.font.xs, color: tokens.color.textMuted, opacity: 0.7 },
	
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: tokens.space.xl },
  emptyIcon: { fontSize: 64, marginBottom: tokens.space.md },
  emptyTitle: { fontSize: tokens.font.xl, fontWeight: 'bold', color: tokens.color.textPrimary, marginBottom: tokens.space.xs },
  emptySub: { fontSize: tokens.font.md, color: tokens.color.textMuted, textAlign: 'center', marginBottom: tokens.space.lg },
  setTargetBtn: {
    backgroundColor: tokens.color.primary, borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space.xl, paddingVertical: tokens.space.md,
  },
  setTargetBtnText: { color: '#fff', fontSize: tokens.font.md, fontWeight: 'bold' },
  secondarySettingsBtn: {
    marginTop: tokens.space.md,
    paddingVertical: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
  },
  secondarySettingsText: {
    color: tokens.color.textSecondary,
    fontSize: tokens.font.sm,
    fontWeight: '600',
  },
  headerBtns: { flexDirection: 'row', gap: tokens.space.sm },
  headerSaveBtn: { fontSize: 20 },
  headerResetBtn: { fontSize: 18, marginLeft: tokens.space.xs },
  plannedRacesSection: { padding: tokens.space.md, paddingTop: 0 },
  plannedRacesTitle: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary, marginBottom: tokens.space.sm },
  plannedRaceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: tokens.color.surface, borderRadius: tokens.radius.md, padding: tokens.space.md, marginBottom: tokens.space.sm, borderWidth: 1, borderColor: tokens.color.border },
  plannedRacePast: { opacity: 0.5 },
  plannedRaceInfo: { flex: 1 },
  plannedRaceTitle: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary },
  plannedRaceDate: { fontSize: tokens.font.sm, color: tokens.color.textMuted, marginTop: 2 },
  priorityBadge: { paddingHorizontal: tokens.space.sm, paddingVertical: 4, borderRadius: tokens.radius.sm },
  badgeB: { backgroundColor: tokens.color.warning + '30' },
  badgeC: { backgroundColor: tokens.color.primary + '30' },
  priorityBadgeText: { fontSize: tokens.font.xs, fontWeight: 'bold', color: tokens.color.textPrimary },
});
