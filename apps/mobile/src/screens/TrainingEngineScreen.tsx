import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Animated, Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../tokens';
import { useDeviceStore } from '../store/useDeviceStore';
import { api } from '../api/client';

interface EngineConfig {
  halfLifeHours: { cardio: number; legs: number; upper: number; core: number };
  multipliers: { cardio: number; legs: number; upper: number; core: number };
  weeklyTarget: number;
  readinessFormula: 'simple' | 'exponential';
  acwrThreshold: number;
  vdotOverride?: number;
  baselineLevel?: 'beginner' | 'intermediate' | 'advanced';
}

const DEFAULT_CONFIG: EngineConfig = {
  halfLifeHours: { cardio: 84, legs: 96, upper: 84, core: 60 },
  multipliers: { cardio: 1.2, legs: 1.5, upper: 1.0, core: 0.8 },
  weeklyTarget: 400,
  readinessFormula: 'simple',
  acwrThreshold: 1.5,
};

const BASELINE_VDOT = {
  beginner: 30,
  intermediate: 40,
  advanced: 50,
};

export default function TrainingEngineScreen() {
  const navigation = useNavigation();
  const { deviceId, deviceSecret } = useDeviceStore();
  const [config, setConfig] = useState<EngineConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (deviceId && deviceSecret) {
      api.getLoadConfig(deviceId, deviceSecret)
        .then(c => {
          setConfig({ ...DEFAULT_CONFIG, ...c });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [deviceId, deviceSecret]);

  async function handleSave() {
    if (!deviceId || !deviceSecret) return;
    try {
      await api.updateLoadConfig(deviceId, deviceSecret, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  }

  function updateConfig(patch: Partial<EngineConfig>) {
    setConfig(prev => ({ ...prev, ...patch }));
    setSaved(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Done</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Engine</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.save, saved && styles.saved]}>{saved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>The Training Engine</Text>
        <Text style={styles.heroSub}>Tune the algorithms that drive your training plan.</Text>

        {/* --- DANIELS VDOT --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aerobic Capacity (VDOT)</Text>
          <View style={styles.glassCard}>
            <View style={styles.row}>
              <View>
                <Text style={styles.cardLabel}>Current VDOT</Text>
                <Text style={styles.cardValue}>{(config.vdotOverride || 40).toFixed(1)}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>ELITE</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>
              Automatically updated by Strava, but you can override it if you have a recent laboratory VO2max test.
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={20}
              maximumValue={85}
              step={0.5}
              value={config.vdotOverride || 40}
              onValueChange={v => updateConfig({ vdotOverride: v })}
              minimumTrackTintColor={tokens.color.primary}
              maximumTrackTintColor={tokens.color.border}
              thumbTintColor={tokens.color.primary}
            />
          </View>
        </View>

        {/* --- FITNESS BASELINE --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Baseline</Text>
          <View style={styles.glassCard}>
            <Text style={styles.cardDesc}>
              Select your fitness level to set an initial VDOT. This will be automatically replaced when you complete a qualifying Strava run (≥3km, RPE ≥7).
            </Text>
            
            <View style={styles.baselineGrid}>
              {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.baselineCard,
                    config.baselineLevel === level && styles.baselineCardActive
                  ]}
                  onPress={() => {
                    updateConfig({ 
                      baselineLevel: level,
                      vdotOverride: BASELINE_VDOT[level]
                    });
                    Alert.alert(
                      'VDOT Updated', 
                      `Set to ${BASELINE_VDOT[level]} (${level} level). This will adjust your training zones.`
                    );
                  }}
                >
                  <View>
                    <Text style={[
                      styles.baselineLabel,
                      config.baselineLevel === level && styles.baselineLabelActive
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                    <Text style={styles.baselineDesc}>
                      {level === 'beginner' && '>35 min 5K'}
                      {level === 'intermediate' && '25-35 min 5K'}
                      {level === 'advanced' && '<25 min 5K'}
                    </Text>
                  </View>
                  <Text style={styles.baselineVdot}>VDOT {BASELINE_VDOT[level]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* --- FOSTER LOAD DECAY --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Load Persistence</Text>
          <View style={styles.glassCard}>
            <Text style={styles.cardDesc}>
              How many days it takes for a session's physiological stress to decay to 50%.
            </Text>
            
            <EngineSlider 
              label="Cardio" 
              value={config.halfLifeHours.cardio} 
              format={v => `${(v/24).toFixed(1)}d`}
              min={24} max={168}
              onChange={v => setConfig(p => ({ ...p, halfLifeHours: { ...p.halfLifeHours, cardio: v } }))}
            />
            <EngineSlider 
              label="Muscular (Legs)" 
              value={config.halfLifeHours.legs} 
              format={v => `${(v/24).toFixed(1)}d`}
              min={24} max={168}
              onChange={v => setConfig(p => ({ ...p, halfLifeHours: { ...p.halfLifeHours, legs: v } }))}
            />
          </View>
        </View>

        {/* --- INJURY GUARD --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Injury Guard (ACWR)</Text>
          <View style={styles.glassCard}>
            <View style={styles.row}>
              <Text style={styles.cardLabel}>Risk Threshold</Text>
              <Text style={styles.cardValue}>{config.acwrThreshold.toFixed(2)}</Text>
            </View>
            <Text style={styles.cardDesc}>
              If your Acute:Chronic Workload Ratio exceeds this, the plan will automatically trim easy volume.
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1.0}
              maximumValue={2.0}
              step={0.05}
              value={config.acwrThreshold}
              onValueChange={v => updateConfig({ acwrThreshold: v })}
              minimumTrackTintColor={tokens.color.accent}
              maximumTrackTintColor={tokens.color.border}
              thumbTintColor={tokens.color.accent}
            />
            <View style={styles.scale}>
              <Text style={styles.scaleText}>Safe</Text>
              <Text style={styles.scaleText}>Aggressive</Text>
              <Text style={styles.scaleText}>Danger</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function EngineSlider({ label, value, format, min, max, onChange }: any) {
  return (
    <View style={styles.engineSliderRow}>
      <View style={styles.row}>
        <Text style={styles.engineSliderLabel}>{label}</Text>
        <Text style={styles.engineSliderValue}>{format(value)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={tokens.color.primary}
        maximumTrackTintColor={tokens.color.border}
        thumbTintColor={tokens.color.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space.lg,
    paddingTop: 60,
    paddingBottom: tokens.space.md,
  },
  back: { fontSize: tokens.font.md, color: tokens.color.textSecondary },
  save: { fontSize: tokens.font.md, color: tokens.color.primary, fontWeight: '700' },
  saved: { color: tokens.color.success },
  headerTitle: { fontSize: tokens.font.lg, fontWeight: '700', color: tokens.color.textPrimary },
  content: { flex: 1, paddingHorizontal: tokens.space.lg },
  heroTitle: {
    fontSize: tokens.font.hero,
    fontWeight: '800',
    color: tokens.color.textPrimary,
    marginTop: tokens.space.md,
  },
  heroSub: {
    fontSize: tokens.font.md,
    color: tokens.color.textSecondary,
    marginBottom: tokens.space.xl,
    lineHeight: 22,
  },
  section: {
    marginBottom: tokens.space.xl,
  },
  sectionTitle: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
    color: tokens.color.textSecondary,
    marginBottom: tokens.space.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  glassCard: {
    backgroundColor: tokens.color.surfaceElevated,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.lg,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
  },
  cardValue: {
    fontSize: tokens.font.xl,
    fontWeight: '800',
    color: tokens.color.textPrimary,
  },
  cardDesc: {
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
    marginTop: tokens.space.sm,
    marginBottom: tokens.space.md,
    lineHeight: 18,
  },
  badge: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    borderRadius: tokens.radius.xs,
  },
  badgeText: {
    color: tokens.color.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  slider: {
    width: '100%',
    height: 40,
    marginHorizontal: -10,
  },
  engineSliderRow: {
    marginTop: tokens.space.md,
  },
  engineSliderLabel: {
    fontSize: tokens.font.sm,
    color: tokens.color.textPrimary,
    fontWeight: '500',
  },
  engineSliderValue: {
    fontSize: tokens.font.sm,
    color: tokens.color.primary,
    fontWeight: '700',
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  scaleText: {
    fontSize: 10,
    color: tokens.color.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  baselineGrid: {
    flexDirection: 'column',
    gap: tokens.space.sm,
  },
  baselineCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  baselineCardActive: {
    borderColor: tokens.color.primary,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  baselineLabel: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
    color: tokens.color.textSecondary,
    marginBottom: 4,
  },
  baselineLabelActive: {
    color: tokens.color.primary,
  },
  baselineVdot: {
    fontSize: tokens.font.md,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  baselineDesc: {
    fontSize: 10,
    color: tokens.color.textMuted,
    marginTop: 2,
  },
});
