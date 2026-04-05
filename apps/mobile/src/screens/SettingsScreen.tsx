import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput
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
  const { deviceId, deviceSecret, athleteProfile, setAthleteProfile } = useDeviceStore();

  const [freeDays, setFreeDays] = useState<string[]>([]);
  const [maxHR, setMaxHR] = useState(athleteProfile?.maxHR?.toString() || '');
  const [restHR, setRestHR] = useState(athleteProfile?.restHR?.toString() || '');

  useEffect(() => {
    if (athleteProfile?.maxHR) setMaxHR(athleteProfile.maxHR.toString());
    if (athleteProfile?.restHR) setRestHR(athleteProfile.restHR.toString());
  }, [athleteProfile]);

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
    navigation.navigate('Target', { planConfig: { freeDays } });
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
          <Text style={styles.continueBtnText}>Continue to Target →</Text>
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