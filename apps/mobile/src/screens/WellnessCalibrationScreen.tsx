import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../tokens';
import { useDeviceStore, WellnessScores } from '../store/useDeviceStore';

const ASPECTS: { key: keyof WellnessScores; label: string }[] = [
  { key: 'sleep',      label: 'Sleep Quality' },
  { key: 'fatigue',    label: 'Fatigue' },
  { key: 'soreness',   label: 'Muscle Soreness' },
  { key: 'stress',     label: 'Stress' },
  { key: 'motivation', label: 'Motivation' },
  { key: 'health',     label: 'Health' },
  { key: 'mood',       label: 'Mood State' },
];

const LABELS: Record<number, string> = {
  1: 'Awful',
  2: 'Poor',
  3: 'OK',
  4: 'Good',
  5: 'Excellent',
};

const LABEL_COLORS: Record<number, string> = {
  1: tokens.color.danger,
  2: '#f97316',
  3: tokens.color.warning,
  4: '#84cc16',
  5: tokens.color.success,
};

export default function WellnessCalibrationScreen() {
  const navigation = useNavigation<any>();
  const { setWellness } = useDeviceStore();

  const [scores, setScores] = useState<WellnessScores>({
    sleep: 3, fatigue: 3, soreness: 3, stress: 3, motivation: 3, health: 3, mood: 3,
  });

  const sum = Object.values(scores).reduce((a, b) => a + b, 0);
  const readinessScore = Math.round((sum / 35) * 100);

  const readinessLabel =
    readinessScore > 70 ? 'Ready to train' :
    readinessScore > 40 ? 'Light session only' :
    'Rest recommended';

  const readinessColor =
    readinessScore > 70 ? tokens.color.success :
    readinessScore > 40 ? tokens.color.warning :
    tokens.color.danger;

  function setScore(key: keyof WellnessScores, value: number) {
    setScores(prev => ({ ...prev, [key]: value }));
  }

  function save() {
    setWellness({
      scores,
      readinessScore,
      calibratedAt: new Date().toISOString(),
    });
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wellness Calibration</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Rate how you feel right now. This will override today's readiness score.
        </Text>

        {ASPECTS.map(({ key, label }) => (
          <View key={key} style={styles.aspectCard}>
            <View style={styles.aspectHeader}>
              <Text style={styles.aspectLabel}>{label}</Text>
              <Text style={[styles.aspectValue, { color: LABEL_COLORS[scores[key]] }]}>
                {LABELS[scores[key]]}
              </Text>
            </View>
            <View style={styles.stepsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.step,
                    scores[key] === n && { backgroundColor: LABEL_COLORS[n], borderColor: LABEL_COLORS[n] },
                    scores[key] > n && styles.stepPassed,
                  ]}
                  onPress={() => setScore(key, n)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.stepText,
                    scores[key] === n && styles.stepTextActive,
                  ]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Score preview */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>WELLNESS READINESS</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNum, { color: readinessColor }]}>{readinessScore}</Text>
            <View style={styles.scoreMeta}>
              <Text style={[styles.scoreStatus, { color: readinessColor }]}>{readinessLabel}</Text>
              <Text style={styles.scoreFormula}>{sum} / 35 × 100</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Update Readiness Score</Text>
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
  intro: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
    marginBottom: tokens.space.md,
    lineHeight: 20,
  },
  aspectCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.md,
    marginBottom: tokens.space.sm,
  },
  aspectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.space.sm,
  },
  aspectLabel: {
    fontSize: tokens.font.md,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  aspectValue: {
    fontSize: tokens.font.sm,
    fontWeight: '700',
  },
  stepsRow: {
    flexDirection: 'row',
    gap: tokens.space.xs,
  },
  step: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.elevated,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    alignItems: 'center',
  },
  stepPassed: {
    borderColor: tokens.color.border,
    opacity: 0.5,
  },
  stepText: {
    fontSize: tokens.font.sm,
    fontWeight: '700',
    color: tokens.color.textMuted,
  },
  stepTextActive: {
    color: '#fff',
  },
  scoreCard: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.lg,
    marginTop: tokens.space.md,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 2,
    marginBottom: tokens.space.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
  },
  scoreNum: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
  },
  scoreMeta: {
    flex: 1,
    gap: 4,
  },
  scoreStatus: {
    fontSize: tokens.font.md,
    fontWeight: '700',
  },
  scoreFormula: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
  },
  footer: {
    padding: tokens.space.md,
    paddingBottom: tokens.space.xl,
    borderTopWidth: 1,
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
