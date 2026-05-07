import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, Alert, ActivityIndicator,
  LayoutAnimation, UIManager, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { calculateVdot } from '@fitsync/shared/training';
import { useFonts } from 'expo-font';
import { useDeviceStore } from './src/store/useDeviceStore';
import { api } from './src/api/client';
import { LoadDashboard } from './src/components/ui/LoadDashboard';
import { WorkoutCard } from './src/components/ui/WorkoutCard';
import { ActionSheet } from './src/components/ui/BottomSheet';
import { tokens } from './src/tokens';
import { generateSmartPlan, adaptPlanAfterNewWorkout } from './src/lib/dailyPlanner';
import AddWorkoutScreen from './src/screens/AddWorkoutScreen';
import LoadEngineScreen from './src/screens/LoadEngineScreen';
import TrainingEngineScreen from './src/screens/TrainingEngineScreen';
import StravaIntegrationScreen from './src/screens/StravaIntegrationScreen';
import PlanScreen from './src/screens/PlanScreen';
import TargetScreen from './src/screens/TargetScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import WellnessCalibrationScreen from './src/screens/WellnessCalibrationScreen';
import RunnerProfileScreen from './src/screens/RunnerProfileScreen';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const Stack = createNativeStackNavigator();

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: tokens.color.bg,
    card: tokens.color.surface,
  },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function groupWorkoutsByDate(workouts: any[]) {
  const groups: { label: string; key: string; items: any[] }[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  for (const w of workouts) {
    const d = new Date(w.startedAt); d.setHours(0, 0, 0, 0);
    const key = d.toISOString();
    let label: string;
    if (d.getTime() === today.getTime()) label = 'Today';
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const existing = groups.find(g => g.key === key);
    if (existing) existing.items.push(w);
    else groups.push({ label, key, items: [w] });
  }
  return groups;
}

function HomeScreen({ navigation }: any) {
  const {
    deviceId, deviceSecret, isLoading: regLoading, target, _hasHydrated,
    planConfig, updatePlanConfig, wellness, wellnessCalibrationHours,
    athleteProfile, planWorkoutLinks = {},
  } = useDeviceStore();

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadData, setLoadData] = useState<any>(null);

  // ActionSheet state
  const [deleteSheet, setDeleteSheet] = useState<string | null>(null);
  const [upcomingSheet, setUpcomingSheet] = useState<any>(null);

  useEffect(() => {
    if (deviceId && deviceSecret) {
      Promise.all([fetchWorkouts(), fetchLoad(), fetchPlanned(), fetchConfig()]);
    }
  }, [deviceId, deviceSecret]);

  async function fetchConfig() {
    if (!deviceId || !deviceSecret) return;
    try {
      const cfg = await api.getLoadConfig(deviceId, deviceSecret);
      updatePlanConfig(cfg);
    } catch (e) { console.error(e); }
  }

  const checkForVdotUpdate = (newWorkouts: any[]) => {
    const currentVdot = planConfig?.vdot || 40;
    const currentPointsTarget = planConfig?.weeklyPointsTarget || 50;
    for (const w of newWorkouts) {
      const distM = w.distanceM || 0;
      const durationSec = w.durationSec || 0;
      const rpe = w.rpe || 0;
      if (distM >= 3000 && rpe >= 7 && durationSec > 0) {
        const totalMin = durationSec / 60;
        const newVdot = calculateVdot(distM, totalMin);
        if (newVdot > currentVdot) {
          const pace = (durationSec / (distM / 1000)).toFixed(0);
          const min = Math.floor(+pace / 60);
          const sec = (+pace % 60).toFixed(0);
          const newPointsTarget = Math.round(currentPointsTarget * (newVdot / currentVdot));
          Alert.alert(
            '🎉 New PR Detected!',
            `Your ${(distM/1000).toFixed(1)}km run in ${min}:${sec.padStart(2,'0')} gives you VDOT ${newVdot.toFixed(1)} (currently ${currentVdot.toFixed(1)}).\n\nUpdate your VDOT and raise your points target to ${newPointsTarget}?`,
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Update VDOT', onPress: () => {
                const updatedConfig = {
                  ...planConfig,
                  vdot: Math.round(newVdot * 10) / 10,
                  weeklyPointsTarget: newPointsTarget,
                };
                updatePlanConfig(updatedConfig);
                api.updateLoadConfig(deviceId!, deviceSecret!, updatedConfig);
              }},
            ]
          );
          break;
        }
      }
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (deviceId && deviceSecret) {
        Promise.all([fetchWorkouts(), fetchLoad(), fetchPlanned(), fetchConfig()]);
      }
    });
    return unsub;
  }, [navigation, deviceId, deviceSecret]);

  async function fetchPlanned() {
    if (!deviceId || !deviceSecret) return;
    try {
      const data = await api.getPlannedRaces(deviceId, deviceSecret);
      setPlannedWorkouts(data.plannedRaces || []);
    } catch (e) { console.error(e); }
  }

  async function fetchWorkouts() {
    if (!deviceId || !deviceSecret) return;
    try {
      const data = await api.getWorkouts(deviceId, deviceSecret);
      setWorkouts(data);
    } catch (e) { console.error(e); }
  }

  async function fetchLoad() {
    if (!deviceId || !deviceSecret) return;
    try {
      const data = await api.getLoadToday(deviceId, deviceSecret, athleteProfile?.runnerLevel || null);
      setLoadData(data);
    } catch (e) { console.error(e); }
  }

  async function handleSync() {
    if (!deviceId || !deviceSecret) return;
    setSyncing(true);
    try {
      const result = await api.syncStrava(deviceId, deviceSecret);
      Alert.alert('Synced', `Imported ${result.imported} workouts`);
      const workoutsData = await api.getWorkouts(deviceId, deviceSecret);
      setWorkouts(workoutsData);
      checkForVdotUpdate(workoutsData);
      await Promise.all([fetchLoad()]);
    } catch (e: any) {
      Alert.alert('Sync Failed', e.message);
    } finally {
      setSyncing(false);
    }
  }

  async function confirmDeleteWorkout(id: string) {
    if (!deviceId || !deviceSecret) return;
    try {
      await api.deleteWorkout(deviceId, deviceSecret, id);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      await Promise.all([fetchWorkouts(), fetchLoad()]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  const isWellnessToday = wellness?.calibratedAt
    ? new Date(wellness.calibratedAt).toDateString() === new Date().toDateString()
    : false;
  const loadReadiness = loadData?.readiness || 0;
  const effectiveReadiness = isWellnessToday
    ? Math.max(0, Math.min(100, wellness!.readinessScore + (loadReadiness - 65)))
    : loadReadiness;

  const homeDailyPlan = useMemo(() => {
    if (!_hasHydrated || !target) return [];
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
      vdot: athleteProfile?.vdot || planConfig?.vdot,
      runnerLevel: athleteProfile?.runnerLevel,
      isMasters: athleteProfile?.ageCategory === 'masters' && athleteProfile?.ageLevelMode === 'age',
    };
    const defaults = { freeDays: ['wed', 'sat', 'sun'], weeklyTargetKm: 30, longRunTargetKm: 12, sessionsPerWeek: 3 };
    const config = planConfig ? { ...defaults, ...planConfig } : defaults;
    const futurePlannedRaceActivities = plannedWorkouts
      .filter((r: any) => new Date(r.startedAt) >= new Date())
      .map((r: any) => ({
        date: new Date(r.startedAt),
        distance: (r.distanceM || 0) / 1000,
        duration: r.targetTimeSec || r.durationSec || 0,
        hrAvg: r.avgHr || 140,
        isRace: true,
        racePriority: r.sessionPurpose || 'c-race',
        title: r.title,
      }));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const completedWorkouts = workouts
      .filter((w: any) => (w.startedAt || '').split('T')[0] <= todayStr)
      .sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    const readinessScores: Record<string, number> = {
      [todayStr]: loadData ? effectiveReadiness : 100,
    };
    const { dailyPlan: basePlan } = generateSmartPlan(target, activities, athlete, config, readinessScores, {}, futurePlannedRaceActivities);
    if (completedWorkouts.length > 0) {
      return adaptPlanAfterNewWorkout(basePlan, completedWorkouts[0], athlete, readinessScores, workouts);
    }
    return basePlan;
  }, [_hasHydrated, target, workouts, plannedWorkouts, athleteProfile, planConfig, effectiveReadiness]);

  if (regLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.color.primary} />
      </View>
    );
  }

  const weekStart = (() => {
    const d = new Date(); d.setHours(0,0,0,0);
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    return d;
  })();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const isRunWorkout = (w: any) => String(w.type || '').toLowerCase() === 'run';
  const isStravaRun = (w: any) => !w.isManual && String(w.source || '').toLowerCase() === 'strava';
  const weekWorkouts = workouts.filter(w => {
    const startedAt = new Date(w.startedAt);
    return isRunWorkout(w) && isStravaRun(w) && startedAt >= weekStart && startedAt < weekEnd;
  });
  const weekSessions = weekWorkouts.length;
  const weekKm = weekWorkouts.reduce((s, w) => s + (w.distanceM || 0) / 1000, 0);
  const weekElevation = weekWorkouts.reduce((s, w) => s + (w.elevationGainM || w.elevationGain || 0), 0);
  const plannedWeekKm = homeDailyPlan.reduce((sum, day) => {
    const dayDate = new Date(day.date);
    return dayDate >= weekStart && dayDate < weekEnd ? sum + (day.targetDistanceKm || 0) : sum;
  }, 0);

  const daysToRace = target ? Math.ceil((new Date(target.targetDate).getTime() - Date.now()) / 86400000) : null;

  const currentHour = new Date().getHours();
  const { start: winStart = 6, end: winEnd = 11 } = wellnessCalibrationHours || {};
  const inCalibrationWindow = currentHour >= winStart && currentHour < winEnd;
  const todayPlanForDashboard = homeDailyPlan.find(day => {
    const d = new Date(day.date);
    const today = new Date();
    return d.getFullYear() === today.getFullYear()
      && d.getMonth() === today.getMonth()
      && d.getDate() === today.getDate();
  });
  const dashboardUsesCorrection = !!todayPlanForDashboard?.title?.includes('(Adjusted)');
  const correctionTitle = dashboardUsesCorrection ? todayPlanForDashboard?.title : undefined;
  const correctionSentence = dashboardUsesCorrection ? todayPlanForDashboard?.description : undefined;

  // ActionSheet for upcoming workout
  const upcomingSheetActions = upcomingSheet ? [
    {
      label: 'Edit',
      icon: 'pencil-outline',
      onPress: () => navigation.navigate('AddWorkout', { editWorkout: upcomingSheet }),
    },
    {
      label: 'Delete',
      icon: 'trash-outline',
      destructive: true,
      onPress: async () => {
        try {
          await api.deleteWorkout(deviceId, deviceSecret, upcomingSheet.id);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          fetchPlanned();
        } catch { Alert.alert('Error', 'Failed to delete'); }
      },
    },
  ] : [];

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={[styles.headerBtn, syncing && { opacity: 0.4 }]}
            onPress={handleSync}
            disabled={syncing}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-download-outline" size={18} color={tokens.color.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('RunnerProfile')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle-outline" size={18} color={tokens.color.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={18} color={tokens.color.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await Promise.all([fetchWorkouts(), fetchLoad()]);
              setRefreshing(false);
            }}
            tintColor={tokens.color.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Load dashboard ── */}
        {loadData && (
          <LoadDashboard
            readiness={effectiveReadiness}
            acwr={loadData.acwr}
            legMuscularRisk={loadData.legMuscularRisk}
            totalBodyFatigue={loadData.totalBodyFatigue}
            onCalibrate={() => {
              if (inCalibrationWindow) {
                navigation.navigate('WellnessCalibration');
              } else {
                Alert.alert('Calibration Unavailable', `Available between ${winStart}:00 and ${winEnd}:00. Adjust in Settings.`);
              }
            }}
            calibrateEnabled={inCalibrationWindow}
            isWellnessActive={isWellnessToday}
            calibratedAt={isWellnessToday ? wellness!.calibratedAt : undefined}
            statusTitleOverride={correctionTitle}
            statusSentenceOverride={correctionSentence}
          />
        )}

        {/* ── Weekly run summary ── */}
        <View style={styles.weekStatsPanel}>
          <View style={styles.weekStatsHeader}>
            <Text style={styles.weekStatsTitle}>This week</Text>
            <Text style={styles.weekStatsSub}>{weekSessions} exported runs</Text>
          </View>
          <View style={styles.weekStatsGrid}>
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>{weekKm.toFixed(1)}</Text>
              <Text style={styles.weekStatLabel}>run km</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>{plannedWeekKm.toFixed(1)}</Text>
              <Text style={styles.weekStatLabel}>planned km</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>{Math.round(weekElevation)}</Text>
              <Text style={styles.weekStatLabel}>vertical m</Text>
            </View>
          </View>
        </View>

        {/* ── Race card ── */}
        {_hasHydrated && (
          <TouchableOpacity
            style={styles.raceCard}
            onPress={() => navigation.navigate(target ? 'Plan' : 'Target')}
            activeOpacity={0.75}
          >
            {target && daysToRace != null && daysToRace > 0 ? (
              (() => {
                const totalDays = target.createdAt
                  ? Math.max(1, Math.ceil((new Date(target.targetDate).getTime() - new Date(target.createdAt).getTime()) / 86400000))
                  : daysToRace;
                const pct = Math.round(Math.min(100, Math.max(0, (1 - daysToRace / totalDays) * 100)));
                const goalTimeSec = target.targetTimeSec;
                const goalTimeStr = goalTimeSec
                  ? `${Math.floor(goalTimeSec / 3600)}h ${String(Math.floor((goalTimeSec % 3600) / 60)).padStart(2, '0')}m`
                  : null;
                const typeLabel = target.type === 'run' ? 'Run' : target.type === 'ride' ? 'Ride' : 'Swim';
                const nextUp = plannedWorkouts[0];
                const nextUpDay = nextUp
                  ? new Date(nextUp.startedAt).toLocaleDateString('en-US', { weekday: 'short' })
                  : null;
                const nextUpDist = nextUp?.distanceM
                  ? `${(nextUp.distanceM / 1000).toFixed(1)} km`
                  : null;

                return (
                  <>
                    {/* ── Header: info left, next up right ── */}
                    <View style={styles.raceCardHeader}>
                      <View style={styles.raceCardHeaderLeft}>
                        <Text style={styles.raceCardRaceName}>{target.distanceKm}K {typeLabel}</Text>
                        <Text style={styles.raceCardRaceDate}>
                          {new Date(target.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {` · ${pct}% complete`}
                          {goalTimeStr ? `  ·  Goal ${goalTimeStr}` : ''}
                        </Text>
                      </View>
                      {nextUp && (
                        <View style={styles.raceCardNextUp}>
                          <Text style={styles.raceCardNextUpLabel}>next up</Text>
                          <Text style={styles.raceCardNextUpValue}>
                            {[nextUpDist, nextUpDay].filter(Boolean).join(' ')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* ── Progress bar ── */}
                    <View style={styles.raceCardProgressRow}>
                      <View style={styles.raceCardProgressBg}>
                        <View style={[styles.raceCardProgressFill, { width: `${pct}%` as any }]} />
                      </View>
                    </View>
                  </>
                );
              })()
            ) : (
              <View style={styles.raceCardEmpty}>
                <Ionicons name="flag-outline" size={20} color={tokens.color.textTertiary} />
                <Text style={styles.raceCardEmptyText}>Set a race goal</Text>
                <Ionicons name="chevron-forward" size={16} color={tokens.color.textTertiary} style={{ marginLeft: 'auto' }} />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* ── Week summary strip ── */}
        {_hasHydrated && (() => {
          const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
          const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

          const sameDay = (a: Date, b: Date) =>
            a.getFullYear() === b.getFullYear() &&
            a.getMonth()    === b.getMonth()    &&
            a.getDate()     === b.getDate();

          const dateKey = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

          type WeekDayStatus = {
            label: string;
            status: 'completed' | 'planned' | 'missed' | 'none';
            isToday: boolean;
            distKm: number | null;
          };

          const plannedDaysThisWeek = Array.from({ length: 7 }, (_, i): WeekDayStatus => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const planEntry = homeDailyPlan.find(p => sameDay(new Date(p.date), dayDate));
            const plannedOnDay = plannedWorkouts.find((w: any) => sameDay(new Date(w.startedAt), dayDate));
            const hasTraining = (planEntry?.targetDistanceKm ?? 0) > 0 || !!plannedOnDay;

            const isToday = sameDay(dayDate, todayMidnight);
            if (!hasTraining) {
              return { label: DAY_LABELS[i], status: 'none', isToday, distKm: null };
            }

            const planKey = planEntry
              ? `${target?.id || 'target'}:${dateKey(new Date(planEntry.date))}:${planEntry.dayNum}`
              : null;
            const isLinked = !!(
              plannedOnDay?.workout ||
              plannedOnDay?.linkedWorkoutId ||
              (planKey && planWorkoutLinks[planKey])
            );
            const nextTrainingDay = homeDailyPlan
              .filter(p => (p.targetDistanceKm ?? 0) > 0 && dateKey(new Date(p.date)) > dateKey(dayDate))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
            const missedCutoff = nextTrainingDay ? new Date(nextTrainingDay.date) : null;
            missedCutoff?.setHours(0, 0, 0, 0);

            let status: Exclude<WeekDayStatus['status'], 'none'>;
            if (isLinked) {
              status = 'completed';
            } else if (missedCutoff && todayMidnight >= missedCutoff) {
              status = 'missed';
            } else {
              status = 'planned';
            }

            const distKm = !isLinked
              ? (planEntry?.targetDistanceKm ?? (plannedOnDay?.distanceM ? plannedOnDay.distanceM / 1000 : null))
              : null;
            return { label: DAY_LABELS[i], status, isToday, distKm };
          });

          return (
            <View style={styles.weekStrip}>
              {plannedDaysThisWeek.map((day, i) => {
                const squareStyle =
                  day.status === 'completed' ? styles.weekDaySquareFilled :
                  day.status === 'planned'   ? { backgroundColor: '#2a1f00', borderColor: tokens.color.warning, borderWidth: 1.5 } :
                  day.status === 'missed'    ? { backgroundColor: tokens.color.dangerMuted, borderColor: tokens.color.danger, borderWidth: 1.5 } :
                  day.isToday                ? styles.weekDaySquareToday :
                  undefined;

                const labelColor =
                  day.status === 'completed' ? tokens.color.success :
                  day.status === 'planned'   ? tokens.color.warning :
                  day.status === 'missed'    ? tokens.color.danger :
                  day.isToday                ? tokens.color.primary :
                  undefined;

                return (
                  <View key={i} style={styles.weekDay}>
                    <View style={[styles.weekDaySquare, squareStyle]} />
                    <Text style={[styles.weekDayLabel, labelColor ? { color: labelColor } : undefined]}>{day.label}</Text>
                    {day.distKm ? (
                      <Text style={[styles.weekDayPlan, { color: labelColor }]}>{`${day.distKm.toFixed(0)}k`}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          );
        })()}

        {/* ── Recent workouts ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySub}>Connect Strava or log manually</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleSync} disabled={syncing} activeOpacity={0.8}>
              <Text style={styles.emptyBtnText}>{syncing ? 'Syncing…' : 'Sync from Strava'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupWorkoutsByDate(workouts).map(group => (
            <View key={group.key}>
              <Text style={styles.groupHeader}>{group.label}</Text>
              {group.items.map(w => (
                <WorkoutCard
                  key={w.id}
                  workout={w}
                  runnerLevel={athleteProfile?.runnerLevel || null}
                  onDelete={(id) => setDeleteSheet(id)}
                />
              ))}
            </View>
          ))
        )}

        {/* ── Upcoming planned ── */}
        {plannedWorkouts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
            </View>
            <View style={styles.upcomingList}>
              {plannedWorkouts.slice(0, 3).map((w, idx) => {
                const d = new Date(w.startedAt);
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const isLast = idx === Math.min(plannedWorkouts.length, 3) - 1;
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.upcomingRow, !isLast && styles.upcomingRowBorder]}
                    onPress={() => setUpcomingSheet(w)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.upcomingDate}>{dateStr}</Text>
                    <Text style={styles.upcomingTitle} numberOfLines={1}>
                      {w.title || ((w.type || 'workout').charAt(0).toUpperCase() + (w.type || 'workout').slice(1))}
                    </Text>
                    {w.distanceM ? (
                      <Text style={styles.upcomingDist}>{(w.distanceM / 1000).toFixed(1)} km</Text>
                    ) : null}
                    <Ionicons name="ellipsis-horizontal" size={16} color={tokens.color.textTertiary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddWorkout')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Delete confirmation sheet ── */}
      <ActionSheet
        visible={deleteSheet !== null}
        onClose={() => setDeleteSheet(null)}
        title="Remove workout?"
        subtitle="This action cannot be undone."
        actions={[
          {
            label: 'Delete Workout',
            icon: 'trash-outline',
            destructive: true,
            onPress: () => { if (deleteSheet) confirmDeleteWorkout(deleteSheet); },
          },
        ]}
      />

      {/* ── Upcoming workout actions sheet ── */}
      <ActionSheet
        visible={upcomingSheet !== null}
        onClose={() => setUpcomingSheet(null)}
        title={upcomingSheet?.title || 'Planned Workout'}
        subtitle={upcomingSheet ? (() => {
          const d = new Date(upcomingSheet.startedAt);
          const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return upcomingSheet.distanceM
            ? `${dateStr} · ${(upcomingSheet.distanceM / 1000).toFixed(1)} km`
            : dateStr;
        })() : undefined}
        actions={upcomingSheetActions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.color.bg },
  container: { flex: 1, backgroundColor: tokens.color.bg },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: tokens.space.md,
    paddingTop: 60,
    paddingBottom: tokens.space.md,
  },
  greeting: {
    fontSize: tokens.font.xl,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    letterSpacing: -0.3,
  },
  headerDate: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: tokens.space.xs,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.color.border,
  },

  /* Scroll */
  content: { flex: 1 },
  contentContainer: {
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.xs,
  },

  /* Race card */
  raceCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: tokens.space.sm,
    overflow: 'hidden',
  },
  /* ── Race card: populated ── */
  raceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.space.md,
    paddingBottom: tokens.space.sm,
    gap: tokens.space.md,
  },
  raceCardHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  raceCardRaceName: {
    fontSize: tokens.font.lg,
    fontWeight: '800',
    color: tokens.color.textPrimary,
    letterSpacing: -0.3,
  },
  raceCardRaceDate: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    fontWeight: '500',
  },
  raceCardNextUp: {
    alignItems: 'flex-end',
  },
  raceCardNextUpLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: tokens.color.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  raceCardNextUpValue: {
    fontSize: tokens.font.sm,
    fontWeight: '700',
    color: tokens.color.primary,
  },
  raceCardProgressRow: {
    paddingHorizontal: tokens.space.md,
    paddingBottom: tokens.space.md,
  },
  raceCardProgressBg: {
    flex: 1,
    height: 3,
    backgroundColor: tokens.color.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  raceCardProgressFill: {
    height: '100%',
    backgroundColor: tokens.color.primary,
    borderRadius: 2,
  },
  raceCardEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.space.md,
    gap: tokens.space.sm,
  },
  raceCardEmptyText: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
    fontWeight: '500',
    flex: 1,
  },

  /* Weekly run summary */
  weekStatsPanel: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: tokens.space.sm,
    padding: tokens.space.md,
  },
  weekStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space.sm,
  },
  weekStatsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  weekStatsSub: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    fontWeight: '600',
  },
  weekStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  weekStatValue: {
    fontSize: tokens.font.xl,
    fontWeight: '800',
    color: tokens.color.textPrimary,
  },
  weekStatLabel: {
    fontSize: 10,
    color: tokens.color.textMuted,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  weekStatDivider: {
    width: 1,
    height: 34,
    backgroundColor: tokens.color.border,
  },

  /* Week strip */
  weekStrip: {
    flexDirection: 'row',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: tokens.space.sm,
    paddingVertical: tokens.space.sm,
    paddingHorizontal: tokens.space.sm,
    justifyContent: 'space-around',
  },
  weekDay: {
    alignItems: 'center',
    gap: 4,
  },
  weekDaySquare: {
    width: 26,
    height: 26,
    borderRadius: tokens.radius.xs,
    backgroundColor: tokens.color.elevated,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  weekDaySquareFilled: {
    backgroundColor: tokens.color.successMuted,
    borderColor: tokens.color.success,
  },
  weekDaySquareToday: {
    borderColor: tokens.color.textMuted,
  },
  weekDayLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: tokens.color.textTertiary,
  },
  weekDayLabelToday: {
    color: tokens.color.textSecondary,
  },
  weekDayPlan: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: tokens.space.sm,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  /* Date group header */
  groupHeader: {
    fontSize: tokens.font.xs,
    fontWeight: '700',
    color: tokens.color.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: tokens.space.sm,
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: tokens.space.xl,
  },
  emptyIcon: { fontSize: 44, marginBottom: tokens.space.sm },
  emptyTitle: { fontSize: tokens.font.lg, fontWeight: '600', color: tokens.color.textPrimary },
  emptySub: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
    marginTop: 4,
    marginBottom: tokens.space.md,
  },
  emptyBtn: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.sm,
  },
  emptyBtnText: { color: '#fff', fontSize: tokens.font.sm, fontWeight: '700' },

  /* Upcoming list */
  upcomingList: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: tokens.space.sm,
    overflow: 'hidden',
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space.md,
    paddingVertical: 11,
    gap: tokens.space.sm,
  },
  upcomingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
  },
  upcomingDate: {
    fontSize: tokens.font.xs,
    fontWeight: '700',
    color: tokens.color.textMuted,
    width: 52,
    flexShrink: 0,
  },
  upcomingTitle: {
    flex: 1,
    fontSize: tokens.font.sm,
    fontWeight: '600',
    color: tokens.color.textSecondary,
  },
  upcomingDist: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    fontWeight: '500',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: tokens.space.lg,
    right: tokens.space.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: tokens.color.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default function App() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    NicoMoji: require('./assets/fonts/NicoMoji-Regular.ttf'),
  });

  async function init() {
    try {
      let storedId = await api.Storage.get('deviceId');
      let storedSec = await api.Storage.get('deviceSecret');
      if (!storedId || !storedSec) {
        const newId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        const newSec = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await api.Storage.set('deviceId', newId);
        await api.Storage.set('deviceSecret', newSec);
        await api.registerDevice(newId, newSec);
        storedId = newId;
        storedSec = newSec;
      }
      useDeviceStore.getState().setCredentials(storedId, storedSec);
    } catch (e) { console.error('Init error:', e); }
    setReady(true);
  }

  useEffect(() => {
    enableScreens();
    init();
  }, []);

  useEffect(() => {
    const unsubscribe = useDeviceStore.subscribe(
      (state) => state.deviceId,
      (deviceId, prevDeviceId) => {
        if (prevDeviceId && !deviceId) init();
      }
    );
    return unsubscribe;
  }, []);

  if (!ready || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}><ActivityIndicator size="large" color={tokens.color.primary} /></View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={AppTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.color.bg } }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddWorkout" component={AddWorkoutScreen} />
          <Stack.Screen name="LoadEngine" component={LoadEngineScreen} />
          <Stack.Screen name="TrainingEngine" component={TrainingEngineScreen} />
          <Stack.Screen name="StravaIntegration" component={StravaIntegrationScreen} />
          <Stack.Screen name="Plan" component={PlanScreen} />
          <Stack.Screen name="Target" component={TargetScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
          <Stack.Screen name="WellnessCalibration" component={WellnessCalibrationScreen} />
          <Stack.Screen name="RunnerProfile" component={RunnerProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
