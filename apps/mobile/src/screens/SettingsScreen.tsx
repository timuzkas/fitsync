import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, TextInput, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const {
    deviceId, deviceSecret, athleteProfile, setAthleteProfile,
    target,
    wellnessCalibrationHours, setWellnessCalibrationHours,
  } = useDeviceStore();

  const [winStart, setWinStart] = useState(String(wellnessCalibrationHours?.start ?? 6));
  const [winEnd, setWinEnd] = useState(String(wellnessCalibrationHours?.end ?? 11));
  const [maxHR, setMaxHR] = useState(athleteProfile?.maxHR?.toString() || '');
  const [restHR, setRestHR] = useState(athleteProfile?.restHR?.toString() || '');
  const [loadConfig, setLoadConfig] = useState<any>(null);
  const [includeHevyInLoad, setIncludeHevyInLoad] = useState(true);

  useEffect(() => {
    if (athleteProfile?.maxHR) setMaxHR(athleteProfile.maxHR.toString());
    if (athleteProfile?.restHR) setRestHR(athleteProfile.restHR.toString());
  }, [athleteProfile]);

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

  function saveAll() {
    // Validate HR
    if (maxHR) {
      const max = parseInt(maxHR);
      if (isNaN(max) || max < 100 || max > 220) {
        Alert.alert('Invalid Max HR', 'Must be between 100–220 bpm');
        return;
      }
    }
    if (restHR) {
      const rest = parseInt(restHR);
      if (isNaN(rest) || rest < 30 || rest > 100) {
        Alert.alert('Invalid Resting HR', 'Must be between 30–100 bpm');
        return;
      }
    }

    // Validate wellness window
    const s = parseInt(winStart);
    const e = parseInt(winEnd);
    if (isNaN(s) || s < 0 || s > 23 || isNaN(e) || e < 1 || e > 24 || s >= e) {
      Alert.alert('Invalid Calibration Window', 'Start must be before end (0–23)');
      return;
    }

    // Save
    setAthleteProfile({
      ...athleteProfile,
      maxHR: maxHR ? parseInt(maxHR) : undefined,
      restHR: restHR ? parseInt(restHR) : undefined,
    });
    setWellnessCalibrationHours({ start: s, end: e });

    navigation.goBack();
  }

  function resetDevice() {
    Alert.alert(
      'Reset Device',
      'This will create a new device ID and disconnect Strava. Your existing data stays on the server.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive', onPress: async () => {
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
              Alert.alert('Done', 'New device registered');
            } catch {
              Alert.alert('Error', 'Failed to reset device');
            }
          },
        },
      ]
    );
  }

  const stravaActive = !!athleteProfile;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={tokens.color.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── PROFILE ── */}
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Target')} activeOpacity={0.7}>
            <View style={[styles.rowIconWrap, { backgroundColor: tokens.color.primaryMuted }]}>
              <Ionicons name="flag-outline" size={16} color={tokens.color.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Race Goal</Text>
              {target ? (
                <Text style={styles.rowSub}>{target.distanceKm}K · {new Date(target.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              ) : (
                <Text style={styles.rowSub}>Not set</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={tokens.color.textTertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('StravaIntegration')} activeOpacity={0.7}>
            <View style={[styles.rowIconWrap, { backgroundColor: '#FC4C0220' }]}>
              <Text style={{ color: '#FC4C02', fontSize: 13, fontWeight: '800' }}>S</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Strava</Text>
              <Text style={[styles.rowSub, { color: stravaActive ? tokens.color.success : tokens.color.textMuted }]}>
                {stravaActive ? '● Connected' : '○ Not connected'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={tokens.color.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* ── TRAINING ── */}
        <Text style={styles.sectionLabel}>TRAINING</Text>
        <View style={styles.group}>

          {/* Max HR */}
          <View style={styles.row}>
            <View style={[styles.rowIconWrap, { backgroundColor: tokens.color.dangerMuted }]}>
              <Ionicons name="heart-outline" size={16} color={tokens.color.danger} />
            </View>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Max HR</Text>
            <View style={styles.inlineInputWrap}>
              <TextInput
                style={styles.inlineInput}
                value={maxHR}
                onChangeText={setMaxHR}
                keyboardType="numeric"
                placeholder="190"
                placeholderTextColor={tokens.color.textTertiary}
                maxLength={3}
              />
              <Text style={styles.inlineUnit}>bpm</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Resting HR */}
          <View style={styles.row}>
            <View style={[styles.rowIconWrap, { backgroundColor: tokens.color.elevated }]}>
              <Ionicons name="heart-dislike-outline" size={16} color={tokens.color.textSecondary} />
            </View>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Resting HR</Text>
            <View style={styles.inlineInputWrap}>
              <TextInput
                style={styles.inlineInput}
                value={restHR}
                onChangeText={setRestHR}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={tokens.color.textTertiary}
                maxLength={3}
              />
              <Text style={styles.inlineUnit}>bpm</Text>
            </View>
          </View>
        </View>

        {/* ── ADVANCED ── */}
        <Text style={styles.sectionLabel}>ADVANCED</Text>
        <View style={styles.group}>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('TrainingEngine')} activeOpacity={0.7}>
            <View style={[styles.rowIconWrap, { backgroundColor: tokens.color.elevated }]}>
              <Ionicons name="cog-outline" size={16} color={tokens.color.textSecondary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Training Engine</Text>
              <Text style={styles.rowSub}>VDOT, ACWR, Foster weights</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={tokens.color.textTertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={[styles.rowIconWrap, { backgroundColor: tokens.color.warningMuted }]}>
              <Ionicons name="barbell-outline" size={16} color={tokens.color.warning} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Hevy in Training Load</Text>
              <Text style={styles.rowSub}>{includeHevyInLoad ? 'Counts toward 7d / 28d load' : 'Excluded from load'}</Text>
            </View>
            <Switch
              value={includeHevyInLoad}
              onValueChange={toggleHevyInLoad}
              trackColor={{ false: tokens.color.border, true: tokens.color.primaryMuted }}
              thumbColor={includeHevyInLoad ? tokens.color.primary : tokens.color.textMuted}
            />
          </View>

          <View style={styles.divider} />

          {/* Wellness calibration window */}
          <View style={styles.row}>
            <View style={[styles.rowIconWrap, { backgroundColor: tokens.color.elevated }]}>
              <Ionicons name="time-outline" size={16} color={tokens.color.textSecondary} />
            </View>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Calibration window</Text>
            <View style={styles.timeInputWrap}>
              <TextInput
                style={styles.timeInput}
                value={winStart}
                onChangeText={setWinStart}
                keyboardType="numeric"
                placeholder="6"
                placeholderTextColor={tokens.color.textTertiary}
                maxLength={2}
              />
              <Text style={styles.timeSep}>–</Text>
              <TextInput
                style={styles.timeInput}
                value={winEnd}
                onChangeText={setWinEnd}
                keyboardType="numeric"
                placeholder="11"
                placeholderTextColor={tokens.color.textTertiary}
                maxLength={2}
              />
              <Text style={styles.inlineUnit}>h</Text>
            </View>
          </View>
        </View>

        {/* ── DEVICE ── */}
        <Text style={styles.sectionLabel}>DEVICE</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={[styles.rowIconWrap, { backgroundColor: tokens.color.elevated }]}>
              <Ionicons name="phone-portrait-outline" size={16} color={tokens.color.textSecondary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Device ID</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{deviceId}</Text>
            </View>
            <TouchableOpacity onPress={resetDevice} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.dangerLink}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveAll}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space.md,
    paddingTop: 60,
    paddingBottom: tokens.space.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: tokens.font.lg,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: tokens.space.md },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 2,
    marginTop: tokens.space.lg,
    marginBottom: tokens.space.sm,
    marginLeft: 2,
  },

  /* Grouped card */
  group: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.color.border,
    marginLeft: 52,
  },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space.md,
    paddingVertical: 13,
    gap: tokens.space.sm,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  rowSub: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    marginTop: 1,
  },

  /* Inline number input (HR) */
  inlineInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineInput: {
    backgroundColor: tokens.color.elevated,
    borderRadius: tokens.radius.xs,
    borderWidth: 1,
    borderColor: tokens.color.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: tokens.font.md,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    textAlign: 'center',
    minWidth: 52,
  },
  inlineUnit: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    fontWeight: '500',
  },

  /* Time window inputs */
  timeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeInput: {
    backgroundColor: tokens.color.elevated,
    borderRadius: tokens.radius.xs,
    borderWidth: 1,
    borderColor: tokens.color.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: tokens.font.sm,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    textAlign: 'center',
    width: 40,
  },
  timeSep: {
    fontSize: tokens.font.sm,
    color: tokens.color.textTertiary,
    fontWeight: '600',
  },

  /* Danger */
  dangerLink: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
    color: tokens.color.danger,
  },

  /* Footer */
  footer: {
    padding: tokens.space.md,
    paddingBottom: tokens.space.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.color.border,
  },
  saveBtn: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: tokens.font.md,
    fontWeight: '700',
  },
});
