import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Animated, Easing, ActivityIndicator
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../tokens';
import { useDeviceStore } from '../store/useDeviceStore';
import { api } from '../api/client';

export default function StravaIntegrationScreen() {
  const navigation = useNavigation<any>();
  const { deviceId, deviceSecret, athleteProfile, setAthleteProfile } = useDeviceStore();
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(statusOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  }, []);

  async function connectStrava() {
    if (!deviceId || !deviceSecret) return;
    setConnecting(true);
    try {
      const url = await api.connectStrava(deviceId, deviceSecret);
      console.log('Strava auth URL:', url);
      if (!url) throw new Error('No URL returned');
      const result = await WebBrowser.openAuthSessionAsync(url, 'fitsync://strava-callback');
      if (result.type === 'success') {
        Alert.alert('Success', 'Strava connected! Your training plan will now adapt to your activities.');
      }
    } catch (e: any) {
      console.error('Strava connect error:', e);
      Alert.alert('Connection Failed', e.message || 'Check your internet and try again.');
    } finally {
      setConnecting(false);
    }
  }

  async function syncProfile() {
    if (!deviceId || !deviceSecret) return;
    setSyncing(true);
    try {
      const athlete = await api.getStravaAthlete(deviceId, deviceSecret);
      setAthleteProfile({
        height: athlete.height,
        weight: athlete.weight,
        sex: athlete.sex,
        maxHR: athlete.max_heartrate,
        city: athlete.city,
        country: athlete.country,
      });
    } catch (e: any) {
      Alert.alert('Sync Error', 'We couldn\'t fetch your latest data from Strava.');
    } finally {
      setSyncing(false);
    }
  }

  const isConnected = !!athleteProfile;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.hero, { opacity: statusOpacity }]}>
          <View style={styles.stravaLogoContainer}>
            <Text style={styles.stravaLogoText}>STRAVA</Text>
          </View>
          <Text style={styles.title}>The Source of Truth</Text>
          <Text style={styles.subtitle}>
            FitSync uses your Strava data to calculate VDOT, track load, and prevent overtraining.
          </Text>
        </Animated.View>

        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Connection Status</Text>
            <View style={[styles.statusIndicator, isConnected ? styles.statusActive : styles.statusInactive]} />
          </View>
          
          <Text style={styles.statusValue}>
            {isConnected ? 'Connected & Active' : 'Not Connected'}
          </Text>
          
          <TouchableOpacity 
            style={[styles.mainBtn, isConnected && styles.connectedBtn]} 
            onPress={connectStrava}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.mainBtnText}>
                {isConnected ? 'Reconnect Account' : 'Connect Strava'}
              </Text>
            )}
          </TouchableOpacity>
          
          {!isConnected && (
            <Text style={styles.privacyNote}>
              We only request access to your activities and profile. Your data remains private.
            </Text>
          )}
        </View>

        {isConnected && (
          <Animated.View style={[styles.details, { opacity: statusOpacity }]}>
            <Text style={styles.sectionHeader}>Synchronized Metrics</Text>
            <View style={styles.metricGrid}>
              <MetricItem label="Weight" value={athleteProfile.weight ? `${athleteProfile.weight}kg` : '—'} />
              <MetricItem label="Max HR" value={athleteProfile.maxHR ? `${athleteProfile.maxHR}bpm` : '—'} />
              <MetricItem label="Location" value={athleteProfile.city || '—'} />
              <MetricItem label="Sex" value={athleteProfile.sex || '—'} />
            </View>

            <TouchableOpacity style={styles.syncBtn} onPress={syncProfile} disabled={syncing}>
              <Text style={styles.syncBtnText}>
                {syncing ? 'Synchronizing...' : 'Refresh from Strava'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <InfoRow 
            icon="⚡️" 
            title="Real-time VDOT" 
            desc="Every qualifying run updates your aerobic capacity score." 
          />
          <InfoRow 
            icon="📊" 
            title="Foster Load" 
            desc="Non-running activities are factored into your recovery score." 
          />
          <InfoRow 
            icon="🛡" 
            title="Injury Guard" 
            desc="Automatic volume trimming if your ACWR exceeds 1.5." 
          />
        </View>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function MetricItem({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoBody}>
        <Text style={styles.infoRowTitle}>{title}</Text>
        <Text style={styles.infoRowDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg },
  header: {
    paddingTop: 60,
    paddingHorizontal: tokens.space.lg,
    alignItems: 'flex-end',
  },
  backBtn: {
    padding: tokens.space.sm,
  },
  backText: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.primary,
  },
  scrollContent: {
    paddingHorizontal: tokens.space.lg,
  },
  hero: {
    alignItems: 'center',
    marginTop: tokens.space.md,
    marginBottom: tokens.space.xl,
  },
  stravaLogoContainer: {
    backgroundColor: '#FC4C02',
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.xs,
    borderRadius: tokens.radius.xs,
    marginBottom: tokens.space.md,
  },
  stravaLogoText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    fontSize: tokens.font.xxl,
    fontWeight: '800',
    color: tokens.color.textPrimary,
    textAlign: 'center',
    marginBottom: tokens.space.sm,
  },
  subtitle: {
    fontSize: tokens.font.md,
    color: tokens.color.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: tokens.space.md,
  },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.xl,
    padding: tokens.space.lg,
    borderWidth: 1,
    borderColor: tokens.color.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: tokens.font.xs,
    color: tokens.color.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: tokens.color.success,
    shadowColor: tokens.color.success,
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statusInactive: {
    backgroundColor: tokens.color.textTertiary,
  },
  statusValue: {
    fontSize: tokens.font.xl,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    marginBottom: tokens.space.lg,
  },
  mainBtn: {
    backgroundColor: '#FC4C02',
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedBtn: {
    backgroundColor: tokens.color.surfaceElevated,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  mainBtnText: {
    color: '#fff',
    fontSize: tokens.font.md,
    fontWeight: '700',
  },
  privacyNote: {
    fontSize: tokens.font.xs,
    color: tokens.color.textTertiary,
    textAlign: 'center',
    marginTop: tokens.space.md,
  },
  details: {
    marginTop: tokens.space.xl,
  },
  sectionHeader: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
    color: tokens.color.textSecondary,
    marginBottom: tokens.space.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
  },
  metricItem: {
    width: '48%',
    backgroundColor: tokens.color.surfaceGlass,
    borderRadius: tokens.radius.md,
    padding: tokens.space.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  metricLabel: {
    fontSize: tokens.font.xs,
    color: tokens.color.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  syncBtn: {
    marginTop: tokens.space.md,
    paddingVertical: tokens.space.sm,
    alignItems: 'center',
  },
  syncBtnText: {
    fontSize: tokens.font.sm,
    color: tokens.color.primary,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: tokens.space.hero,
  },
  infoTitle: {
    fontSize: tokens.font.lg,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    marginBottom: tokens.space.lg,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: tokens.space.lg,
    gap: tokens.space.md,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoBody: {
    flex: 1,
  },
  infoRowTitle: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
    marginBottom: 2,
  },
  infoRowDesc: {
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
    lineHeight: 18,
  },
});
