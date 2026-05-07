import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../tokens';
import { useDeviceStore } from '../store/useDeviceStore';
import { api } from '../api/client';

function calculateVdotFrom5k(minutes: number, seconds: number): number {
  const totalMin = minutes + seconds / 60;
  if (totalMin <= 0) return 0;
  const distM = 5000;
  const v = distM / totalMin;
  const t = totalMin;
  const pctVO2max = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
  const vo2 = -4.60 + 0.182258 * v + 0.000104 * v * v;
  return vo2 / pctVO2max;
}

interface EngineConfig {
  vdot?: number;
}

const DEFAULT_CONFIG: EngineConfig = {
  vdot: 40,
};

const RUNNER_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  lowKey: 'Low Key',
  competitive: 'Competitive',
  highlyCompetitive: 'Highly Competitive',
  elite: 'Elite',
};

const YOUTH_LEVEL_LABELS: Record<string, string> = {
  freshman: 'Freshman',
  sophomore: 'Sophomore',
  junior: 'Junior',
  senior: 'Senior',
};

export default function TrainingEngineScreen() {
  const navigation = useNavigation();
  const { deviceId, deviceSecret, athleteProfile } = useDeviceStore();
  const [config, setConfig] = useState<EngineConfig>(DEFAULT_CONFIG);
  const [serverConfig, setServerConfig] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const [fivekMin, setFivekMin] = useState('25');
  const [fivekSec, setFivekSec] = useState('00');

  useEffect(() => {
    if (deviceId && deviceSecret) {
      api.getLoadConfig(deviceId, deviceSecret)
        .then(c => {
          setServerConfig(c || {});
          setConfig({ ...DEFAULT_CONFIG, vdot: c?.vdot ?? DEFAULT_CONFIG.vdot });
        })
        .catch(() => {});
    }
  }, [deviceId, deviceSecret]);

  async function handleSave() {
    if (!deviceId || !deviceSecret) return;
    try {
      await api.updateLoadConfig(deviceId, deviceSecret, { ...serverConfig, ...config });
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
                <Text style={styles.cardValue}>{(config.vdot || 40).toFixed(1)}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>ELITE</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>
              Enter your best recent 5K time to calculate your VDOT, or use the slider to adjust manually.
            </Text>
            
            {/* 5K Time Input */}
            <View style={{ marginTop: 12, marginBottom: 8 }}>
              <Text style={{ color: tokens.color.textMuted, fontSize: tokens.font.xs, marginBottom: 4 }}>
                Calculate from 5K time (optional)
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: tokens.color.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <TextInput
                    style={{ color: tokens.color.textPrimary, fontSize: tokens.font.lg, width: 30, textAlign: 'center' }}
                    keyboardType="number-pad"
                    placeholder="25"
                    placeholderTextColor={tokens.color.textMuted}
                    maxLength={2}
                    onChangeText={(text: string) => setFivekMin(text || '25')}
                  />
                  <Text style={{ color: tokens.color.textMuted, fontSize: tokens.font.lg }}>:</Text>
                  <TextInput
                    style={{ color: tokens.color.textPrimary, fontSize: tokens.font.lg, width: 30, textAlign: 'center' }}
                    keyboardType="number-pad"
                    placeholder="00"
                    placeholderTextColor={tokens.color.textMuted}
                    maxLength={2}
                    onChangeText={(text: string) => setFivekSec(text || '00')}
                  />
                  <Text style={{ color: tokens.color.textMuted, fontSize: tokens.font.sm, marginLeft: 4 }}>min</Text>
                </View>
                <TouchableOpacity 
                  style={{ backgroundColor: tokens.color.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
                  onPress={() => {
                    const vdot = calculateVdotFrom5k(parseInt(fivekMin) || 25, parseInt(fivekSec) || 0);
                    if (vdot > 0) {
                      updateConfig({ vdot: Math.round(vdot * 10) / 10 });
                      Alert.alert('VDOT Updated', `Calculated VDOT: ${vdot.toFixed(1)} from 5K in ${fivekMin}:${fivekSec.padStart(2,'0')}`);
                    }
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Calculate</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Slider
              style={styles.slider}
              minimumValue={20}
              maximumValue={85}
              step={0.5}
              value={config.vdot || 40}
              onValueChange={v => updateConfig({ vdot: v })}
              minimumTrackTintColor={tokens.color.primary}
              maximumTrackTintColor={tokens.color.border}
              thumbTintColor={tokens.color.primary}
            />
          </View>
        </View>

        {/* --- RUNNER LEVEL --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Runner Level</Text>
          <View style={styles.glassCard}>
            {(() => {
              const p = athleteProfile;
              if (!p?.runnerLevel) {
                return (
                  <>
                    <View style={styles.row}>
                      <Text style={styles.cardLabel}>Your Level</Text>
                      <Text style={styles.cardValue}>Not determined</Text>
                    </View>
                    <Text style={styles.cardDesc}>
                      Complete the Runner Profile quiz (person icon on the home screen) to determine your level.
                    </Text>
                  </>
                );
              }

              const usingAge = p.ageLevelMode === 'age';
              const isMasters = p.ageCategory === 'masters';
              const isYouth = p.ageCategory === 'youth';

              const trackLabel = usingAge
                ? (isMasters ? 'Masters Plan' : 'Youth Plan')
                : 'Standard Level';

              const levelDisplay = usingAge
                ? (isMasters
                    ? 'Masters'
                    : (p.youthLevel ? YOUTH_LEVEL_LABELS[p.youthLevel] : RUNNER_LEVEL_LABELS[p.runnerLevel]))
                : (RUNNER_LEVEL_LABELS[p.runnerLevel] ?? p.runnerLevel);

              const baseLevel = RUNNER_LEVEL_LABELS[p.runnerLevel] ?? p.runnerLevel;

              return (
                <>
                  <View style={styles.row}>
                    <View>
                      <Text style={styles.cardLabel}>{trackLabel}</Text>
                      <Text style={styles.cardValue}>{levelDisplay}</Text>
                    </View>
                    {usingAge && (
                      <View style={styles.ageBadge}>
                        <Text style={styles.ageBadgeText}>
                          {isMasters ? '40+' : isYouth ? 'U25' : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  {usingAge && (
                    <Text style={[styles.cardDesc, { marginTop: 6, marginBottom: 0 }]}>
                      Based on {baseLevel} scoring
                    </Text>
                  )}

                  {p.runnerLevelDeterminedAt ? (
                    <Text style={styles.cardDesc}>
                      Last determined: {new Date(p.runnerLevelDeterminedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  ) : null}
                </>
              );
            })()}
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
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
  ageBadge: {
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    borderRadius: tokens.radius.xs,
  },
  ageBadgeText: {
    color: tokens.color.warning,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  slider: {
    width: '100%',
    height: 40,
    marginHorizontal: -10,
  },
});
