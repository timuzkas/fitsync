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

function acwrZone(v?: number): { label: string; color: string; fill: number } {
  if (v == null) return { label: '—', color: tokens.color.textTertiary, fill: 0 };
  const fill = Math.min(1, v / 2);
  if (v > 1.5)  return { label: 'Overreach', color: tokens.color.danger,   fill };
  if (v > 1.3)  return { label: 'Caution',   color: tokens.color.warning,  fill };
  if (v >= 0.8) return { label: 'Good',      color: tokens.color.success,  fill };
  return                { label: 'Low',       color: tokens.color.warning,  fill };
}

function riskZone(v: number): { label: string; color: string; fill: number } {
  const fill = Math.min(1, v / 100);
  if (v >= 75) return { label: 'High',     color: tokens.color.danger,   fill };
  if (v >= 45) return { label: 'Moderate', color: tokens.color.warning,  fill };
  if (v >= 20) return { label: 'Low–mid',  color: '#84cc16',             fill };
  return         { label: 'Low',       color: tokens.color.success,  fill };
}

function MetricBar({
  label, value, zone,
}: {
  label: string;
  value: string;
  zone: { label: string; color: string; fill: number };
}) {
  return (
    <View style={bar.row}>
      <Text style={bar.label}>{label}</Text>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${Math.round(zone.fill * 100)}%` as any, backgroundColor: zone.color }]} />
      </View>
      <Text style={[bar.value, { color: zone.color }]}>{value}</Text>
    </View>
  );
}

const bar = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  label: {
    fontSize: 8,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 1.1,
    width: 28,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: tokens.color.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  value: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.4,
    width: 34,
    textAlign: 'right',
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

  const readinessLabel =
    readiness > 70 ? 'Ready to train' :
    readiness > 40 ? 'Light session only' :
    'Rest recommended';

  const readinessColor =
    readiness > 70 ? tokens.color.success :
    readiness > 40 ? tokens.color.warning :
    tokens.color.danger;

  const aw  = acwrZone(acwr);
  const lmr = riskZone(legMuscularRisk);
  const tbf = riskZone(totalBodyFatigue);

  return (
    <View style={styles.container}>
      <View style={styles.heroRow}>

        {/* ── Ring — left anchor ── */}
        <MetricRing value={readiness} label="Readiness" size={120} strokeWidth={14} />

        {/* ── Right panel ── */}
        <View style={styles.panel}>

          {/* Status */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: readinessColor }]} />
            <Text style={[styles.statusLabel, { color: readinessColor }]}>
              {readinessLabel}
            </Text>
            {isWellnessActive && (
              <View style={styles.wellnessPill}>
                <Text style={styles.wellnessPillText}>Wellness</Text>
              </View>
            )}
          </View>

          {/* Metric bars */}
          <View style={styles.metricsBlock}>
            <MetricBar
              label="ACWR"
              value={acwr != null ? acwr.toFixed(2) : '—'}
              zone={aw}
            />
            <MetricBar
              label="LEG"
              value={String(Math.round(legMuscularRisk))}
              zone={lmr}
            />
            <MetricBar
              label="FAT"
              value={String(Math.round(totalBodyFatigue))}
              zone={tbf}
            />
          </View>

          {/* Calculated timestamp */}
          {calibratedTime && (
            <Text style={styles.calibratedAt}>Calculated at {calibratedTime}</Text>
          )}

          {/* Calibrate action — only when in window */}
          {onCalibrate && calibrateEnabled && (
            <TouchableOpacity
              onPress={onCalibrate}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.calibrateBtn}
            >
              <Text style={styles.calibrateBtnText}>
                {isWellnessActive ? 'Re-calibrate' : 'Calibrate wellness'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.space.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.lg,
    paddingVertical: tokens.space.xs,
  },
  panel: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  statusLabel: {
    fontSize: tokens.font.sm,
    fontWeight: '700',
    letterSpacing: 0.1,
    flex: 1,
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
  metricsBlock: {
    gap: 0,
  },
  calibratedAt: {
    fontSize: 9,
    color: tokens.color.textTertiary,
    letterSpacing: 0.2,
    marginTop: 1,
  },
  calibrateBtn: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.elevated,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    marginTop: 3,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  calibrateBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.color.primary,
    letterSpacing: 0.1,
  },
});
