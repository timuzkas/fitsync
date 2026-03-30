import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../tokens';
import { useDeviceStore } from '../store/useDeviceStore';
import { api } from '../api/client';

interface LoadConfig {
  halfLifeHours: { cardio: number; legs: number; upper: number; core: number };
  multipliers: { cardio: number; legs: number; upper: number; core: number };
  weeklyTarget: number;
  readinessFormula: 'simple' | 'exponential';
}

const DEFAULT_CONFIG: LoadConfig = {
  halfLifeHours: { cardio: 84, legs: 96, upper: 84, core: 60 },
  multipliers: { cardio: 1.2, legs: 1.5, upper: 1.0, core: 0.8 },
  weeklyTarget: 400,
  readinessFormula: 'simple',
};

export default function LoadEngineScreen() {
  const navigation = useNavigation();
  const { deviceId, deviceSecret } = useDeviceStore();
  const [config, setConfig] = useState<LoadConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (deviceId && deviceSecret) {
      api.getLoadConfig(deviceId, deviceSecret)
        .then(c => {
          setConfig(c);
          setLoading(false);
        })
        .catch(e => {
          console.warn('Failed to fetch config, using defaults');
          setLoading(false);
        });
    }
  }, [deviceId, deviceSecret]);

  function setHalfLife(key: keyof LoadConfig['halfLifeHours'], val: number) {
    setConfig(prev => ({ ...prev, halfLifeHours: { ...prev.halfLifeHours, [key]: val } }));
    setSaved(false);
  }

  function setMultiplier(key: keyof LoadConfig['multipliers'], val: number) {
    setConfig(prev => ({ ...prev, multipliers: { ...prev.multipliers, [key]: val } }));
    setSaved(false);
  }

  async function handleSave() {
    if (!deviceId || !deviceSecret) return;
    try {
      await api.updateLoadConfig(deviceId, deviceSecret, config);
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
  }

  function handleReset() {
    setConfig(DEFAULT_CONFIG);
    setSaved(false);
  }

  const HALF_LABELS: Record<keyof LoadConfig['halfLifeHours'], string> = {
    cardio: 'Cardio',
    legs: 'Legs',
    upper: 'Upper',
    core: 'Core',
  };

  const MULT_LABELS: Record<keyof LoadConfig['multipliers'], string> = {
    cardio: 'Cardio',
    legs: 'Legs',
    upper: 'Upper',
    core: 'Core',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Load Engine</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Recovery Half-Life</Text>
        <Text style={styles.sectionSub}>Time for load to decay to 50%</Text>

        {(Object.keys(HALF_LABELS) as Array<keyof LoadConfig['halfLifeHours']>).map(key => (
          <View key={key} style={styles.sliderRow}>
            <View style={styles.sliderLabel}>
              <Text style={styles.sliderName}>{HALF_LABELS[key]}</Text>
              <Text style={styles.sliderValue}>{(config.halfLifeHours[key] / 24).toFixed(1)}d</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 32 }}
              minimumValue={12}
              maximumValue={168}
              step={4}
              value={config.halfLifeHours[key]}
              onValueChange={v => setHalfLife(key, v)}
              minimumTrackTintColor={tokens.color.primary}
              maximumTrackTintColor={tokens.color.border}
              thumbTintColor={tokens.color.primary}
            />
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: tokens.space.xl }]}>Load Multipliers</Text>
        <Text style={styles.sectionSub}>How much each type contributes to load</Text>

        {(Object.keys(MULT_LABELS) as Array<keyof LoadConfig['multipliers']>).map(key => (
          <View key={key} style={styles.sliderRow}>
            <View style={styles.sliderLabel}>
              <Text style={styles.sliderName}>{MULT_LABELS[key]}</Text>
              <Text style={styles.sliderValue}>{config.multipliers[key].toFixed(1)}×</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 32 }}
              minimumValue={0.5}
              maximumValue={3}
              step={0.1}
              value={config.multipliers[key]}
              onValueChange={v => setMultiplier(key, v)}
              minimumTrackTintColor={tokens.color.primary}
              maximumTrackTintColor={tokens.color.border}
              thumbTintColor={tokens.color.primary}
            />
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: tokens.space.xl }]}>Weekly Target</Text>
        <View style={styles.sliderRow}>
          <View style={styles.sliderLabel}>
            <Text style={styles.sliderName}>Total Load</Text>
            <Text style={styles.sliderValue}>{config.weeklyTarget}</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 32 }}
            minimumValue={100}
            maximumValue={1000}
            step={25}
            value={config.weeklyTarget}
            onValueChange={v => { setConfig(prev => ({ ...prev, weeklyTarget: v })); setSaved(false); }}
            minimumTrackTintColor={tokens.color.primary}
            maximumTrackTintColor={tokens.color.border}
            thumbTintColor={tokens.color.primary}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: tokens.space.xl }]}>Readiness Formula</Text>
        <View style={styles.formulaRow}>
          <TouchableOpacity
            style={[styles.formulaOption, config.readinessFormula === 'simple' && styles.formulaOptionActive]}
            onPress={() => { setConfig(prev => ({ ...prev, readinessFormula: 'simple' })); setSaved(false); }}
          >
            <Text style={[styles.formulaText, config.readinessFormula === 'simple' && styles.formulaTextActive]}>Simple</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formulaOption, config.readinessFormula === 'exponential' && styles.formulaOptionActive]}
            onPress={() => { setConfig(prev => ({ ...prev, readinessFormula: 'exponential' })); setSaved(false); }}
          >
            <Text style={[styles.formulaText, config.readinessFormula === 'exponential' && styles.formulaTextActive]}>Exponential</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save'}</Text>
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
    paddingBottom: tokens.space.md,
  },
  back: { fontSize: 24, color: tokens.color.textMuted },
  headerTitle: { fontSize: tokens.font.lg, fontWeight: '600', color: tokens.color.textPrimary },
  content: { flex: 1, paddingHorizontal: tokens.space.md },
  sectionTitle: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
    marginBottom: tokens.space.md,
  },
  sliderRow: {
    marginBottom: tokens.space.sm,
  },
  sliderLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderName: {
    fontSize: tokens.font.sm,
    color: tokens.color.textSecondary,
  },
  sliderValue: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  formulaRow: {
    flexDirection: 'row',
    gap: tokens.space.sm,
  },
  formulaOption: {
    flex: 1,
    paddingVertical: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  formulaOptionActive: {
    borderColor: tokens.color.primary,
    backgroundColor: tokens.color.primaryMuted,
  },
  formulaText: {
    fontSize: tokens.font.md,
    color: tokens.color.textSecondary,
  },
  formulaTextActive: {
    color: tokens.color.textPrimary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: tokens.space.sm,
    padding: tokens.space.md,
    paddingBottom: tokens.space.xl,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: tokens.space.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  resetBtnText: {
    fontSize: tokens.font.md,
    color: tokens.color.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: tokens.space.md,
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: tokens.font.md,
    color: '#fff',
    fontWeight: 'bold',
  },
});
