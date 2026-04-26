import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, Alert, ActivityIndicator
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
import { tokens } from './src/tokens';
import AddWorkoutScreen from './src/screens/AddWorkoutScreen';
import LoadEngineScreen from './src/screens/LoadEngineScreen';
import TrainingEngineScreen from './src/screens/TrainingEngineScreen';
import StravaIntegrationScreen from './src/screens/StravaIntegrationScreen';
import PlanScreen from './src/screens/PlanScreen';
import TargetScreen from './src/screens/TargetScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import WellnessCalibrationScreen from './src/screens/WellnessCalibrationScreen';

const Stack = createNativeStackNavigator();

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
  const { deviceId, deviceSecret, isLoading: regLoading, target, _hasHydrated, planConfig, updatePlanConfig, wellness, wellnessCalibrationHours } = useDeviceStore();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadData, setLoadData] = useState<any>(null);

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
          
          // Section 10.1: Proportional points target increase
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
                  weeklyPointsTarget: newPointsTarget 
                };
                updatePlanConfig(updatedConfig);
                api.updateLoadConfig(deviceId!, deviceSecret!, updatedConfig);
              }}
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
      const data = await api.getLoadToday(deviceId, deviceSecret);
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

  async function handleDeleteWorkout(id: string) {
    if (!deviceId || !deviceSecret) return;
    Alert.alert('Delete Workout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.deleteWorkout(deviceId, deviceSecret, id);
          await Promise.all([fetchWorkouts(), fetchLoad()]);
        } catch (e: any) {
          Alert.alert('Error', e.message);
        }
      }}
    ]);
  }

  if (regLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.color.primary} />
      </View>
    );
  }

  const weekStart = (() => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1)); return d; })();
  const weekWorkouts = workouts.filter(w => new Date(w.startedAt) >= weekStart);
  const weekSessions = weekWorkouts.length;
  const weekKm = weekWorkouts.reduce((s, w) => s + (w.distanceM || 0) / 1000, 0);
  const weekLoad = weekWorkouts.reduce((s, w) => s + (w.rpe && w.durationSec ? Math.round(w.rpe * w.durationSec / 60) : 0), 0);

  const daysToRace = target ? Math.ceil((new Date(target.targetDate).getTime() - Date.now()) / 86400000) : null;

  const isWellnessToday = wellness?.calibratedAt
    ? new Date(wellness.calibratedAt).toDateString() === new Date().toDateString()
    : false;
  const effectiveReadiness = isWellnessToday ? wellness!.readinessScore : (loadData?.readiness || 0);

  const now = new Date();
  const currentHour = now.getHours();
  const { start: winStart = 6, end: winEnd = 11 } = wellnessCalibrationHours || {};
  const inCalibrationWindow = currentHour >= winStart && currentHour < winEnd;

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
            style={[styles.headerBtn, syncing && { opacity: 0.35 }]}
            onPress={handleSync}
            disabled={syncing}
          >
            <Ionicons name="refresh" size={18} color={tokens.color.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Settings')}
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
      >
        {/* ── Load dashboard ── */}
        {loadData && (
          <LoadDashboard
            readiness={effectiveReadiness}
            load7d={loadData.load7d ? Object.values(loadData.load7d).reduce((a: number, b: any) => a + b, 0) : 0}
            load28d={loadData.load28d ? Object.values(loadData.load28d).reduce((a: number, b: any) => a + b, 0) : 0}
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
          />
        )}

        {/* ── Race card ── */}
        {_hasHydrated && (
          <TouchableOpacity
            style={styles.raceCard}
            onPress={() => navigation.navigate(target ? 'Plan' : 'Target')}
            activeOpacity={0.75}
          >
            {target && daysToRace != null && daysToRace > 0 ? (
              <>
                <View style={styles.raceCardTop}>
                  <View style={styles.raceCardLeft}>
                    <Text style={styles.raceCardLabel}>GOAL RACE</Text>
                    <Text style={styles.raceCardTitle}>
                      {target.distanceKm}K {target.type === 'run' ? 'Run' : target.type === 'ride' ? 'Ride' : 'Swim'}
                    </Text>
                    <Text style={styles.raceCardDate}>
                      {new Date(target.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.raceCardDaysWrap}>
                    <Text style={styles.raceCardDaysNum}>{daysToRace}</Text>
                    <Text style={styles.raceCardDaysLabel}>days</Text>
                  </View>
                </View>
                {plannedWorkouts[0] && (
                  <View style={styles.raceCardNext}>
                    <Text style={styles.raceCardNextLabel}>NEXT PLANNED</Text>
                    <View style={styles.raceCardNextRow}>
                      <View style={[styles.raceCardNextDot, { backgroundColor: tokens.color.primary }]} />
                      <Text style={styles.raceCardNextText}>
                        {plannedWorkouts[0].title || (plannedWorkouts[0].type.charAt(0).toUpperCase() + plannedWorkouts[0].type.slice(1))}
                      </Text>
                      <Text style={styles.raceCardNextSep}>·</Text>
                      <Text style={styles.raceCardNextMeta}>
                        {new Date(plannedWorkouts[0].startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                      {plannedWorkouts[0].distanceM ? (
                        <>
                          <Text style={styles.raceCardNextSep}>·</Text>
                          <Text style={styles.raceCardNextMeta}>{(plannedWorkouts[0].distanceM / 1000).toFixed(1)} km</Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                )}
              </>
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
        {workouts.length > 0 && (
          <View style={styles.weekStrip}>
            <View style={styles.weekChip}>
              <Text style={styles.weekChipNum}>{weekSessions}</Text>
              <Text style={styles.weekChipLabel}>sessions</Text>
            </View>
            <View style={styles.weekDivider} />
            <View style={styles.weekChip}>
              <Text style={styles.weekChipNum}>{weekKm.toFixed(1)}</Text>
              <Text style={styles.weekChipLabel}>km this week</Text>
            </View>
            <View style={styles.weekDivider} />
            <View style={styles.weekChip}>
              <Text style={styles.weekChipNum}>{weekLoad}</Text>
              <Text style={styles.weekChipLabel}>load pts</Text>
            </View>
          </View>
        )}

        {/* ── Recent workouts ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySub}>Connect Strava or log manually</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleSync} disabled={syncing}>
              <Text style={styles.emptyBtnText}>{syncing ? 'Syncing…' : 'Sync from Strava'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupWorkoutsByDate(workouts).map(group => (
            <View key={group.key}>
              <Text style={styles.groupHeader}>{group.label}</Text>
              {group.items.map(w => (
                <WorkoutCard key={w.id} workout={w} onDelete={handleDeleteWorkout} />
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
                    onPress={() =>
                      Alert.alert(
                        w.title || 'Planned Workout',
                        `${d.toLocaleDateString()}${w.distanceM ? ` • ${(w.distanceM / 1000).toFixed(1)}km` : ''}`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Edit', onPress: () => navigation.navigate('AddWorkout', { editWorkout: w }) },
                          { text: 'Delete', style: 'destructive', onPress: async () => {
                            try { await api.deleteWorkout(deviceId, deviceSecret, w.id); fetchPlanned(); }
                            catch { Alert.alert('Error', 'Failed to delete'); }
                          }},
                        ]
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.upcomingDate}>{dateStr}</Text>
                    <Text style={styles.upcomingTitle} numberOfLines={1}>{w.title || ((w.type || 'workout').charAt(0).toUpperCase() + (w.type || 'workout').slice(1))}</Text>
                    {w.distanceM ? <Text style={styles.upcomingDist}>{(w.distanceM / 1000).toFixed(1)} km</Text> : null}
                    <Ionicons name="chevron-forward" size={14} color={tokens.color.textTertiary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddWorkout')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  headerBtnText: {
    fontSize: tokens.font.md,
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
  raceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.space.md,
    gap: tokens.space.md,
  },
  raceCardLeft: { flex: 1 },
  raceCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  raceCardTitle: {
    fontSize: tokens.font.lg,
    fontWeight: '800',
    color: tokens.color.textPrimary,
    letterSpacing: -0.3,
  },
  raceCardDate: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    marginTop: 2,
  },
  raceCardDaysWrap: {
    alignItems: 'center',
    backgroundColor: tokens.color.primaryMuted,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    minWidth: 56,
  },
  raceCardDaysNum: {
    fontSize: 26,
    fontWeight: '800',
    color: tokens.color.primary,
    letterSpacing: -1,
    lineHeight: 30,
  },
  raceCardDaysLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.color.primary,
    letterSpacing: 0.5,
    opacity: 0.75,
  },
  raceCardNext: {
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
  },
  raceCardNextLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  raceCardNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  raceCardNextDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  raceCardNextText: {
    fontSize: tokens.font.xs,
    fontWeight: '700',
    color: tokens.color.textSecondary,
  },
  raceCardNextSep: {
    fontSize: tokens.font.xs,
    color: tokens.color.textTertiary,
  },
  raceCardNextMeta: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
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

  /* Week strip */
  weekStrip: {
    flexDirection: 'row',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: tokens.space.sm,
    overflow: 'hidden',
  },
  weekChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.space.sm,
  },
  weekChipNum: {
    fontSize: tokens.font.lg,
    fontWeight: '800',
    color: tokens.color.textPrimary,
    letterSpacing: -0.5,
  },
  weekChipLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: tokens.color.textTertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  weekDivider: {
    width: 1,
    backgroundColor: tokens.color.border,
    marginVertical: tokens.space.sm,
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
  emptyIcon: {
    fontSize: 44,
    marginBottom: tokens.space.sm,
  },
  emptyTitle: {
    fontSize: tokens.font.lg,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
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
  emptyBtnText: {
    color: '#fff',
    fontSize: tokens.font.sm,
    fontWeight: '700',
  },

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
    paddingVertical: 10,
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
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
        if (prevDeviceId && !deviceId) {
          init();
        }
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
      <NavigationContainer theme={DarkTheme}>
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
