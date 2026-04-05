import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
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
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { deviceId, deviceSecret, athleteProfile, setAthleteProfile } = useDeviceStore();

  const [freeDays, setFreeDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function connectStrava() {
    if (!deviceId || !deviceSecret) return;
    setConnecting(true);
    try {
      const { url } = await api.connectStrava(deviceId, deviceSecret);
      const result = await WebBrowser.openAuthSessionAsync(url, 'fitsync://strava-callback');
      if (result.type === 'success') {
        Alert.alert('Success', 'Strava connected! You can now sync your activities.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to connect Strava');
    } finally {
      setConnecting(false);
    }
  }

  async function fetchStravaProfile() {
    if (!deviceId || !deviceSecret) return;
    setLoading(true);
    try {
      const athlete = await api.getStravaAthlete(deviceId, deviceSecret);
      const profile: AthleteProfile = {
        height: athlete.height,
        weight: athlete.weight,
        sex: athlete.sex,
        maxHR: athlete.max_heartrate,
        city: athlete.city,
        country: athlete.country,
      };
      setAthleteProfile(profile);
      Alert.alert('Success', 'Profile fetched from Strava!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }

  function toggleDay(dayId: string) {
    setFreeDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId].sort((a, b) => DAYS.findIndex(d => d.id === a) - DAYS.findIndex(d => d.id === b))
    );
  }

  function savePlanSettings() {
    if (freeDays.length === 0) {
      Alert.alert('Error', 'Select at least one day to run');
      return;
    }
    navigation.navigate('Target', { planConfig: { freeDays } });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Connections</Text>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('StravaIntegration')}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIcon, { backgroundColor: '#FC4C02' }]}>
                <Text style={styles.cardIconText}>S</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>Strava Integration</Text>
                <Text style={styles.cardSub}>Status: {athleteProfile ? 'Active' : 'Not Connected'}</Text>
              </View>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Algorithm & Analytics</Text>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('TrainingEngine')}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIcon, { backgroundColor: tokens.color.primary }]}>
                <Text style={styles.cardIconText}>⚙️</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>The Training Engine</Text>
                <Text style={styles.cardSub}>Tune VDOT, ACWR, and Foster Weights</Text>
              </View>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Plan Settings</Text>
        <View style={styles.card}>
          <Text style={styles.cardDesc}>
            Select which days you can run. The planner will assign sessions to these days.
          </Text>
          <View style={styles.daysGrid}>
            {DAYS.map(day => (
              <TouchableOpacity
                key={day.id}
                style={[styles.dayBtn, freeDays.includes(day.id) && styles.dayBtnActive]}
                onPress={() => toggleDay(day.id)}
              >
                <Text style={[styles.dayBtnText, freeDays.includes(day.id) && styles.dayBtnTextActive]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {freeDays.length > 0 && (
            <Text style={styles.daysSelected}>
              {freeDays.length} day{freeDays.length !== 1 ? 's' : ''} selected
            </Text>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={savePlanSettings}>
          <Text style={styles.continueBtnText}>Continue to Target</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: tokens.space.md, paddingTop: 60, paddingBottom: tokens.space.md,
  },
  back: { fontSize: 24, color: tokens.color.textMuted },
  headerTitle: { fontSize: tokens.font.lg, fontWeight: '600', color: tokens.color.textPrimary },
  content: { flex: 1, paddingHorizontal: tokens.space.md },
  sectionTitle: {
    fontSize: tokens.font.sm, fontWeight: '600', color: tokens.color.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginTop: tokens.space.lg, marginBottom: tokens.space.sm,
  },
  card: {
    backgroundColor: tokens.color.surfaceElevated, borderRadius: tokens.radius.md,
    padding: tokens.space.md, borderWidth: 1, borderColor: tokens.color.border,
    marginBottom: tokens.space.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    color: '#fff',
    fontSize: tokens.font.sm,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  cardSub: {
    fontSize: tokens.font.xs,
    color: tokens.color.textSecondary,
    marginTop: 2,
  },
  cardArrow: {
    fontSize: tokens.font.lg,
    color: tokens.color.textTertiary,
  },
  cardDesc: { fontSize: tokens.font.sm, color: tokens.color.textSecondary, marginBottom: tokens.space.md },
  btn: {
    backgroundColor: tokens.color.primary, borderRadius: tokens.radius.sm,
    padding: tokens.space.md, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: tokens.font.md, fontWeight: '600' },
  btnSecondary: {
    backgroundColor: tokens.color.elevated, borderRadius: tokens.radius.sm,
    padding: tokens.space.md, alignItems: 'center', borderWidth: 1, borderColor: tokens.color.border,
  },
  btnSecondaryText: { color: tokens.color.textPrimary, fontSize: tokens.font.md },
  profilePreview: { marginTop: tokens.space.md, paddingTop: tokens.space.md, borderTopWidth: 1, borderTopColor: tokens.color.border },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  profileLabel: { fontSize: tokens.font.sm, color: tokens.color.textMuted },
  profileValue: { fontSize: tokens.font.sm, color: tokens.color.textPrimary },
  daysGrid: { flexDirection: 'row', gap: tokens.space.sm, flexWrap: 'wrap' },
  dayBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: tokens.color.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: tokens.color.border,
  },
  dayBtnActive: { borderColor: tokens.color.primary, backgroundColor: tokens.color.primaryMuted },
  dayBtnText: { fontSize: tokens.font.sm, fontWeight: '600', color: tokens.color.textSecondary },
  dayBtnTextActive: { color: tokens.color.textPrimary },
  daysSelected: { fontSize: tokens.font.sm, color: tokens.color.primary, marginTop: tokens.space.sm },
  footer: { padding: tokens.space.md, paddingBottom: tokens.space.xl },
  continueBtn: {
    backgroundColor: tokens.color.primary, borderRadius: tokens.radius.sm,
    padding: tokens.space.md, alignItems: 'center',
  },
  continueBtnText: { color: '#fff', fontSize: tokens.font.lg, fontWeight: 'bold' },
});
