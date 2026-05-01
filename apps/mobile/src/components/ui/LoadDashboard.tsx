import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MetricRing } from '../ui/MetricRing';
import { tokens } from '../../tokens';

interface LoadDashboardProps {
  readiness: number;
  acwr?: number;
  legMuscularRisk?: number;
  totalBodyFatigue?: number;
  onCalibrate?: () => void;
  calibrateEnabled?: boolean;
  isWellnessActive?: boolean;
  calibratedAt?: string;
}

function acwrZone(v?: number): { color: string } {
  if (v == null) return { color: tokens.color.textTertiary };
  if (v > 1.5)  return { color: tokens.color.danger };
  if (v > 1.3)  return { color: tokens.color.warning };
  if (v >= 0.8) return { color: tokens.color.success };
  return         { color: tokens.color.warning };
}

function riskZone(v: number): { color: string } {
  if (v >= 75) return { color: tokens.color.danger };
  if (v >= 45) return { color: tokens.color.warning };
  if (v >= 20) return { color: '#84cc16' };
  return         { color: tokens.color.success };
}

function MetricCol({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={col.container}>
      <Text style={col.label}>{label}</Text>
      <Text style={[col.value, { color }]}>{value}</Text>
    </View>
  );
}

const col = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 8,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  value: {
    fontSize: tokens.font.md,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
});

export function LoadDashboard({
  readiness, acwr,
  legMuscularRisk = 0, totalBodyFatigue = 0,
  onCalibrate, calibrateEnabled, isWellnessActive, calibratedAt,
}: LoadDashboardProps) {
  const calibratedTime = isWellnessActive && calibratedAt
    ? new Date(calibratedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const readinessColor =
    readiness > 70 ? tokens.color.success :
    readiness >= 50 ? tokens.color.warning :
    tokens.color.amber;

  const readinessTitle =
    readiness > 70 ? 'Ready to train' :
    readiness >= 50 ? 'Take it moderate' :
    'Take it easy today';

  const readinessSentence =
    readiness > 70
      ? "You're in good shape. Go for your target session."
      : readiness >= 50
      ? "Moderate effort today. Listen to your body."
      : "Your body is still recovering. Light activity or rest.";

  const aw  = acwrZone(acwr);
  const lmr = riskZone(legMuscularRisk);
  const tbf = riskZone(totalBodyFatigue);

  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionLabel}>READINESS</Text>
        {calibratedTime ? (
          <Text style={styles.calibratedAt}>calibrated {calibratedTime}</Text>
        ) : onCalibrate && calibrateEnabled ? (
          <TouchableOpacity
            onPress={onCalibrate}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.calibrateBtnText}>
              {isWellnessActive ? 'Re-calibrate' : 'Calibrate wellness'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.heroRow}>

        {/* ── Ring ── */}
        <MetricRing value={readiness} size={120} strokeWidth={14} />

        {/* ── Right panel ── */}
        <View style={styles.panel}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusTitle, { color: readinessColor }]}>
              {readinessTitle}
            </Text>
            {isWellnessActive && (
              <View style={styles.wellnessPill}>
                <Text style={styles.wellnessPillText}>Wellness</Text>
              </View>
            )}
          </View>

          <Text style={styles.statusSentence}>{readinessSentence}</Text>

          <View style={styles.metricsDivider} />

          <View style={styles.metricsRow}>
            <MetricCol
              label="Workload"
              value={acwr != null ? acwr.toFixed(2) : '—'}
              color={aw.color}
            />
            <View style={styles.metricsColDivider} />
            <MetricCol
              label="Leg fatigue"
              value={String(Math.round(legMuscularRisk))}
              color={lmr.color}
            />
            <View style={styles.metricsColDivider} />
            <MetricCol
              label="Fat burn"
              value={String(Math.round(totalBodyFatigue))}
              color={tbf.color}
            />
          </View>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.md,
    marginBottom: tokens.space.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space.sm,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
  },
  panel: {
    flex: 1,
    gap: 5,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusTitle: {
    fontSize: tokens.font.sm,
    fontWeight: '700',
    letterSpacing: 0.1,
    flex: 1,
  },
  statusSentence: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    lineHeight: 16,
  },
  metricsDivider: {
    height: 1,
    backgroundColor: tokens.color.border,
    marginVertical: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsColDivider: {
    width: 1,
    height: 30,
    backgroundColor: tokens.color.border,
  },
  wellnessPill: {
    backgroundColor: tokens.color.primaryMuted,
    borderRadius: tokens.radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  wellnessPillText: {
    fontSize: 9,
    color: tokens.color.primary,
    fontWeight: '700',
  },
  calibratedAt: {
    fontSize: 9,
    color: tokens.color.textTertiary,
    letterSpacing: 0.2,
  },
  calibrateBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.color.primary,
    letterSpacing: 0.1,
  },
});
