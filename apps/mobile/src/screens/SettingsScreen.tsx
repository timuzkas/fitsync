import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../tokens';
import { useDeviceStore } from '../store/useDeviceStore';
import { api } from '../api/client';

export interface AthleteProfile {
  height?: number;
  weight?: number;
  sex?: 'M' | 'F';
  maxHR?: number;
  restHR?: number;
  dob?: string;
  city?: string;
  country?: string;
}

const DAYS = [
  { id: 'mon', label: 'Mo' },
  { id: 'tue', label: 'Tu' },
  { id: 'wed', label: 'We' },
  { id: 'thu', label: 'Th' },
  { id: 'fri', label: 'Fr' },
  { id: 'sat', label: 'Sa' },
  { id: 'sun', label: 'Su' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { deviceId, deviceSecret, athleteProfile, setAthleteProfile, planConfig, setPlanConfig, target, wellnessCalibrationHours, setWellnessCalibrationHours } = useDeviceStore();

  const [freeDays, setFreeDays] = useState<string[]>(planConfig?.freeDays || ['mon', 'wed', 'fri']);
  const [winStart, setWinStart] = useState(String(wellnessCalibrationHours?.start ?? 6));
  const [winEnd, setWinEnd] = useState(String(wellnessCalibrationHours?.end ?? 11));
  const [maxHR, setMaxHR] = useState(athleteProfile?.maxHR?.toString() || '');
  const [restHR, setRestHR] = useState(athleteProfile?.restHR?.toString() || '');
  const [loadConfig, setLoadConfig] = useState<any>(null);
  const [includeHevyInLoad, setIncludeHevyInLoad] = useState(true);

  useEffect(() => {
    if (athleteProfile?.maxHR) setMaxHR(athleteProfile.maxHR.toString());
    if (athleteProfile?.restHR) setRestHR(athleteProfile.restHR.toString());
    if (planConfig?.freeDays) setFreeDays(planConfig.freeDays);
  }, [athleteProfile, planConfig]);

  useEffect(() => {
    if (!deviceId || !deviceSecret) return;
    api.getLoadConfig(deviceId, deviceSecret)
      .then((cfg: any) => {
        setLoadConfig(cfg);
        setIncludeHevyInLoad(cfg.includeHevyInLoad !== false);
      })
      .catch(() => {});
  }, [deviceId, deviceSecret]);

  async function toggleHevyInLoad(value: boolean) {
    setIncludeHevyInLoad(value);
    if (!deviceId || !deviceSecret || !loadConfig) return;
    try {
      await api.updateLoadConfig(deviceId, deviceSecret, { ...loadConfig, includeHevyInLoad: value });
      setLoadConfig((prev: any) => ({ ...prev, includeHevyInLoad: value }));
    } catch {
      setIncludeHevyInLoad(!value);
      Alert.alert('Error', 'Failed to save setting');
    }
  }

  function toggleDay(dayId: string) {
    setFreeDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId].sort((a, b) =>
            DAYS.findIndex(d => d.id === a) - DAYS.findIndex(d => d.id === b)
          )
    );
  }

  function saveHR() {
    const max = parseInt(maxHR);
    const rest = parseInt(restHR);
    
    if (maxHR && (isNaN(max) || max < 100 || max > 220)) {
      Alert.alert('Invalid Max HR', 'Max HR should be between 100-220 BPM');
      return;
    }
    if (restHR && (isNaN(rest) || rest < 30 || rest > 100)) {
      Alert.alert('Invalid Rest HR', 'Resting HR should be between 30-100 BPM');
      return;
    }

    const profile = {
      ...athleteProfile,
      maxHR: maxHR ? max : undefined,
      restHR: restHR ? rest : undefined,
    };
    setAthleteProfile(profile);
    Alert.alert('Saved', 'Heart rate settings updated');
  }

  function savePlanSettings() {
    if (freeDays.length === 0) {
      Alert.alert('Select Training Days', 'Pick at least one day you can run.');
      return;
    }
    
    const newConfig = {
      ...(planConfig || { weeklyTargetKm: 30, longRunTargetKm: 12, sessionsPerWeek: 3 }),
      freeDays
    };
    
    setPlanConfig(newConfig);
    navigation.goBack();
  }

  function saveWellnessHours() {
    const s = parseInt(winStart);
    const e = parseInt(winEnd);
    if (isNaN(s) || s < 0 || s > 23 || isNaN(e) || e < 1 || e > 24 || s >= e) {
      Alert.alert('Invalid Hours', 'Start must be before end, both in 0–23 range.');
      return;
    }
    setWellnessCalibrationHours({ start: s, end: e });
    Alert.alert('Saved', `Wellness window: ${s}:00 – ${e}:00`);
  }

  function resetDevice() {
    Alert.alert(
      'Reset Device',
      'This will create a new device ID and disconnect Strava. Your old data will stay on the server. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => {
          try {
            await api.Storage.delete('deviceId');
            await api.Storage.delete('deviceSecret');
            useDeviceStore.getState().clearCredentials();
            useDeviceStore.getState().setAthleteProfile(null);
            const newId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
            const newSec = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            await api.Storage.set('deviceId', newId);
            await api.Storage.set('deviceSecret', newSec);
            await api.registerDevice(newId, newSec);
            useDeviceStore.getState().setCredentials(newId, newSec);
            Alert.alert('Done', 'New device registered: ' + newId);
          } catch (e) {
            Alert.alert('Error', 'Failed to reset device');
          }
        }}
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Device ID section */}
        <Text style={styles.sectionLabel}>DEVICE</Text>

        <View style={styles.rowCard}>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Device ID</Text>
            <Text style={styles.rowSub} numberOfLines={1}>{deviceId}</Text>
          </View>
          <TouchableOpacity onPress={resetDevice}>
            <Text style={{ color: '#ef4444', fontSize: tokens.font.sm, fontWeight: '600' }}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Training Target section */}
        <Text style={styles.sectionLabel}>TRAINING GOAL</Text>

        <TouchableOpacity
          style={styles.rowCard}
          onPress={() => navigation.navigate('Target')}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIcon, { backgroundColor: tokens.color.primary }]}>
            <Text style={styles.rowIconText}>🎯</Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Race Target</Text>
            <Text style={styles.rowSub}>
              {target ? `${target.distanceKm}K on ${new Date(target.targetDate).toLocaleDateString()}` : 'Set your race date and distance'}
            </Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        {/* Connections section */}
        <Text style={styles.sectionLabel}>CONNECTIONS</Text>

        <TouchableOpacity
          style={styles.rowCard}
          onPress={() => navigation.navigate('StravaIntegration')}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIcon, { backgroundColor: '#FC4C02' }]}>
            <Text style={styles.rowIconText}>S</Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Strava Integration</Text>
            <Text style={[styles.rowSub, {
              color: athleteProfile ? tokens.color.success : tokens.color.textMuted
            }]}>
              {athleteProfile ? '● Active' : '○ Not connected'}
            </Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        {/* Algorithm section */}
        <Text style={styles.sectionLabel}>ALGORITHM</Text>

        <TouchableOpacity
          style={styles.rowCard}
          onPress={() => navigation.navigate('TrainingEngine')}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIcon, { backgroundColor: tokens.color.primary }]}>
            <Text style={styles.rowIconText}>⚙</Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>The Training Engine</Text>
            <Text style={styles.rowSub}>Tune VDOT, ACWR, and Foster Weights</Text>
          </View>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.rowCard}>
          <View style={[styles.rowIcon, { backgroundColor: tokens.color.warning }]}>
            <Text style={styles.rowIconText}>🏋</Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Hevy Load in Training Load</Text>
            <Text style={styles.rowSub}>
              {includeHevyInLoad
                ? 'Strength sessions count toward 7d/28d load'
                : 'Strength sessions excluded from load (Muscle Risk still active)'}
            </Text>
          </View>
          <Switch
            value={includeHevyInLoad}
            onValueChange={toggleHevyInLoad}
            trackColor={{ false: tokens.color.border, true: tokens.color.primaryMuted }}
            thumbColor={includeHevyInLoad ? tokens.color.primary : tokens.color.textMuted}
          />
        </View>

        {/* Heart Rate Settings */}
        <Text style={styles.sectionLabel}>HEART RATE ZONES</Text>

        <View style={styles.hrCard}>
          <View style={styles.hrRow}>
            <View style={styles.hrInputGroup}>
              <Text style={styles.hrLabel}>Max HR</Text>
              <TextInput
                style={styles.hrInput}
                value={maxHR}
                onChangeText={setMaxHR}
                keyboardType="numeric"
                placeholder="190"
                placeholderTextColor={tokens.color.textTertiary}
              />
            </View>
            <View style={styles.hrInputGroup}>
              <Text style={styles.hrLabel}>Resting HR</Text>
              <TextInput
                style={styles.hrInput}
                value={restHR}
                onChangeText={setRestHR}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={tokens.color.textTertiary}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.hrSaveBtn} onPress={saveHR}>
            <Text style={styles.hrSaveBtnText}>Save HR Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Wellness calibration hours */}
        <Text style={styles.sectionLabel}>WELLNESS CALIBRATION HOURS</Text>

        <View style={styles.hrCard}>
          <Text style={[styles.hrLabel, { marginBottom: tokens.space.sm }]}>
            Allow readiness calibration only within this daily time window.
          </Text>
          <View style={styles.hrRow}>
            <View style={styles.hrInputGroup}>
              <Text style={styles.hrLabel}>Start (hour)</Text>
              <TextInput
                style={styles.hrInput}
                value={winStart}
                onChangeText={setWinStart}
                keyboardType="numeric"
                placeholder="6"
                placeholderTextColor={tokens.color.textTertiary}
              />
            </View>
            <View style={styles.hrInputGroup}>
              <Text style={styles.hrLabel}>End (hour)</Text>
              <TextInput
                style={styles.hrInput}
                value={winEnd}
                onChangeText={setWinEnd}
                keyboardType="numeric"
                placeholder="11"
                placeholderTextColor={tokens.color.textTertiary}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.hrSaveBtn} onPress={saveWellnessHours}>
            <Text style={styles.hrSaveBtnText}>Save Window</Text>
          </TouchableOpacity>
        </View>

        {/* Plan settings */}
        <Text style={styles.sectionLabel}>TRAINING SCHEDULE</Text>

        <View style={styles.planCard}>
          <Text style={styles.planDesc}>
            Select which days you can train. The planner will assign sessions to these days.
          </Text>

          <View style={styles.daysRow}>
            {DAYS.map(day => {
              const active = freeDays.includes(day.id);
              return (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayBtn, active && styles.dayBtnActive]}
                  onPress={() => toggleDay(day.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayBtnText, active && styles.dayBtnTextActive]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {freeDays.length > 0 && (
            <Text style={styles.daysHint}>
              {freeDays.length} day{freeDays.length !== 1 ? 's' : ''} selected
            </Text>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, freeDays.length === 0 && styles.continueBtnDim]}
          onPress={savePlanSettings}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Save & Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space.md,
    paddingTop: 60,
    paddingBottom: tokens.space.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    fontSize: 22,
    color: tokens.color.textSecondary,
  },
  headerTitle: {
    fontSize: tokens.font.lg,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.space.md,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 2,
    marginTop: tokens.space.lg,
    marginBottom: tokens.space.sm,
    marginLeft: 2,
  },

  rowCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.space.md,
    gap: tokens.space.md,
    marginBottom: tokens.space.sm,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIconText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  rowSub: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    marginTop: 2,
  },
  rowArrow: {
    fontSize: 22,
    color: tokens.color.textTertiary,
    fontWeight: '300',
  },

  planCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.md,
  },
  planDesc: {
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
    lineHeight: 20,
    marginBottom: tokens.space.md,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.color.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    maxWidth: 44,
  },
  dayBtnActive: {
    backgroundColor: tokens.color.primaryMuted,
    borderColor: tokens.color.primary,
  },
  dayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.color.textMuted,
  },
  dayBtnTextActive: {
    color: tokens.color.primary,
  },
  daysHint: {
    fontSize: tokens.font.xs,
    color: tokens.color.primary,
    marginTop: tokens.space.sm,
    fontWeight: '600',
  },

  hrCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.lg,
  },
  hrRow: {
    flexDirection: 'row',
    gap: tokens.space.md,
    marginBottom: tokens.space.lg,
  },
  hrInputGroup: {
    flex: 1,
  },
  hrLabel: {
    fontSize: tokens.font.xs,
    color: tokens.color.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  hrInput: {
    backgroundColor: tokens.color.elevated,
    borderRadius: tokens.radius.sm,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 14,
    fontSize: tokens.font.xl,
    color: tokens.color.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  hrSaveBtn: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.sm,
    paddingVertical: tokens.space.md,
    alignItems: 'center',
  },
  hrSaveBtnText: {
    color: '#fff',
    fontSize: tokens.font.sm,
    fontWeight: '700',
  },

  footer: {
    padding: tokens.space.md,
    paddingBottom: tokens.space.xl,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
  },
  continueBtn: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space.md,
    alignItems: 'center',
  },
  continueBtnDim: {
    opacity: 0.45,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: tokens.font.md,
    fontWeight: '700',
  },
});