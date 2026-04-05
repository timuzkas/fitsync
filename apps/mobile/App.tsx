import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, Alert, ActivityIndicator
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
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

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }: any) {
  const { deviceId, deviceSecret, isLoading: regLoading, target, _hasHydrated } = useDeviceStore();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadData, setLoadData] = useState<any>(null);

  useEffect(() => {
    if (deviceId && deviceSecret) {
      Promise.all([fetchWorkouts(), fetchLoad()]);
    }
  }, [deviceId, deviceSecret]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (deviceId && deviceSecret) {
        Promise.all([fetchWorkouts(), fetchLoad()]);
      }
    });
    return unsub;
  }, [navigation, deviceId, deviceSecret]);

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
      await Promise.all([fetchWorkouts(), fetchLoad()]);
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

  const current = loadData?.current || { cardio: 0, legs: 0, upper: 0, core: 0, systemic: 0 };
  const history7d = loadData?.recentWorkouts
    ?.slice(0, 7)
    ?.reverse()
    ?.map((w: any) => w.loadScore ? (w.loadScore.cardio + w.loadScore.legs + w.loadScore.upper + w.loadScore.core + w.loadScore.systemic) : 0) || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fitsync</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Plan')}
          >
            <Text style={styles.headerBtnText}>🎯</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('AddWorkout')}
          >
            <Text style={[styles.headerBtnText, styles.addBtnText]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.headerBtnText}>⚙️</Text>
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
        {loadData && (
          <LoadDashboard
            readiness={loadData.readiness || 0}
            current={current}
            load7d={loadData.load7d ? Object.values(loadData.load7d).reduce((a: number, b: any) => a + b, 0) : 0}
            load28d={loadData.load28d ? Object.values(loadData.load28d).reduce((a: number, b: any) => a + b, 0) : 0}
            history7d={history7d}
          />
        )}

        {_hasHydrated && target ? (
          <TouchableOpacity 
            style={styles.planCard}
            onPress={() => navigation.navigate('Plan')}
          >
            <View style={styles.planCardIcon}>
              <Text style={styles.planCardIconText}>📋</Text>
            </View>
            <View style={styles.planCardContent}>
              <Text style={styles.planCardTitle}>
                {target.distanceKm}K {target.type === 'run' ? 'Run' : target.type === 'ride' ? 'Ride' : 'Swim'}
              </Text>
              <Text style={styles.planCardSub}>
                {Math.ceil((new Date(target.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days to go
              </Text>
            </View>
            <Text style={styles.planCardArrow}>→</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.planCard}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.planCardIcon}>
              <Text style={styles.planCardIconText}>🏃</Text>
            </View>
            <View style={styles.planCardContent}>
              <Text style={styles.planCardTitle}>Set Your Running Goal</Text>
              <Text style={styles.planCardSub}>Create a training plan for your next race</Text>
            </View>
            <Text style={styles.planCardArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Workouts</Text>
          <TouchableOpacity onPress={handleSync} disabled={syncing}>
            <Text style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}>
              {syncing ? '...' : 'Sync ↻'}
            </Text>
          </TouchableOpacity>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySub}>Sync from Strava or add manually</Text>
          </View>
        ) : (
          workouts.map((w) => <WorkoutCard key={w.id} workout={w} onDelete={handleDeleteWorkout} />)
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.space.md,
    paddingTop: 60,
    paddingBottom: tokens.space.md,
  },
  title: {
    fontSize: tokens.font.xxl,
    fontWeight: 'bold',
    color: tokens.color.textPrimary,
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
  addBtnText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.space.sm,
    marginTop: tokens.space.md,
  },
  sectionTitle: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  syncBtn: {
    fontSize: tokens.font.sm,
    color: tokens.color.primary,
    fontWeight: '600',
  },
  syncBtnDisabled: {
    opacity: 0.4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: tokens.space.xl,
  },
  emptyIcon: {
    fontSize: 48,
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
  },
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
  planCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md, padding: tokens.space.md, marginBottom: tokens.space.md,
    borderWidth: 1, borderColor: tokens.color.border,
  },
  planCardIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: tokens.color.primaryMuted,
    alignItems: 'center', justifyContent: 'center', marginRight: tokens.space.md,
  },
  planCardIconText: { fontSize: 22 },
  planCardContent: { flex: 1 },
  planCardTitle: { fontSize: tokens.font.md, fontWeight: '600', color: tokens.color.textPrimary },
  planCardSub: { fontSize: tokens.font.xs, color: tokens.color.textMuted, marginTop: 2 },
  planCardArrow: { fontSize: tokens.font.lg, color: tokens.color.textMuted },
});

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    enableScreens();
    async function init() {
      try {
        // Always use the old device that has all the workout data
        const oldId = 'device-1773856481563-awplmw';
        const oldSec = '7vozrkm7i78jhav4j7z0zm';
        await api.Storage.set('deviceId', oldId);
        await api.Storage.set('deviceSecret', oldSec);
        useDeviceStore.getState().setCredentials(oldId, oldSec);
      } catch (e) { console.error('Init error:', e); }
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}><ActivityIndicator size="large" color={tokens.color.primary} /></View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
