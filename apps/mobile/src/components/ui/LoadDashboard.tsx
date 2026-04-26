import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MetricRing } from '../ui/MetricRing';
import { tokens } from '../../tokens';

interface LoadDashboardProps {
  readiness: number;
  load7d: number;
  load28d: number;
  acwr?: number;
  legMuscularRisk?: number;
  totalBodyFatigue?: number;
  onCalibrate?: () => void;
  calibrateEnabled?: boolean;
  isWellnessActive?: boolean;
}

function acwrZone(v?: number): { label: string; color: string } {
  if (v == null) return { label: 'No data', color: tokens.color.textTertiary };
  if (v > 1.5)   return { label: 'Overreach', color: tokens.color.danger };
  if (v > 1.3)   return { label: 'Caution',   color: tokens.color.warning };
  if (v >= 0.8)  return { label: 'Sweet spot', color: tokens.color.success };
  return           { label: 'Low',        color: tokens.color.warning };
}

function riskZone(v: number): { label: string; color: string } {
  if (v >= 75) return { label: 'High',     color: tokens.color.danger };
  if (v >= 45) return { label: 'Moderate', color: tokens.color.warning };
  if (v >= 20) return { label: 'Low–mid',  color: '#84cc16' };
  return         { label: 'Low',       color: tokens.color.success };
}

export function LoadDashboard({
  readiness, load7d, load28d, acwr,
  legMuscularRisk = 0, totalBodyFatigue = 0,
  onCalibrate, calibrateEnabled, isWellnessActive,
}: LoadDashboardProps) {
  const readinessLabel =
    readiness > 70 ? 'Ready to train' :
    readiness > 40 ? 'Light session only' :
    'Rest recommended';

  const readinessColor =
    readiness > 70 ? tokens.color.success :
    readiness > 40 ? tokens.color.warning :
    tokens.color.danger;

  const aw = acwrZone(acwr);
  const lmr = riskZone(legMuscularRisk);
  const tbf = riskZone(totalBodyFatigue);

  return (
    <View style={styles.container}>

      {/* ── Hero: ring + load numbers ── */}
      <View style={styles.heroRow}>
        <View style={styles.ringWrap}>
          <MetricRing value={readiness} label="Readiness" size={138} strokeWidth={16} />
        </View>

        <View style={styles.statsCol}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>WEEKLY LOAD</Text>
            <View style={styles.statValueRow}>
              <View style={[styles.accent, { backgroundColor: tokens.color.primary }]} />
              <Text style={styles.statNum}>{Math.round(load7d)}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>MONTHLY LOAD</Text>
            <View style={styles.statValueRow}>
              <View style={[styles.accent, { backgroundColor: tokens.color.warning }]} />
              <Text style={styles.statNum}>{Math.round(load28d)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Status + calibrate row ── */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: readinessColor }]} />
        <Text style={[styles.statusText, { color: readinessColor }]}>{readinessLabel}</Text>
        {isWellnessActive && (
          <View style={styles.wellnessBadge}>
            <Text style={styles.wellnessBadgeText}>Wellness</Text>
          </View>
        )}
        {onCalibrate && (
          <TouchableOpacity
            onPress={onCalibrate}
            style={styles.calibrateLink}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.calibrateLinkText, { color: calibrateEnabled ? tokens.color.primary : tokens.color.textTertiary }]}>
              {isWellnessActive ? 'Re-calibrate' : 'Calibrate'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Metrics strip: ACWR | Leg Risk | Body Fatigue ── */}
      <View style={styles.strip}>
        <View style={styles.stripChip}>
          <Text style={styles.stripLabel}>ACWR</Text>
          <Text style={[styles.stripValue, { color: aw.color }]}>
            {acwr != null ? acwr.toFixed(2) : '—'}
          </Text>
          <Text style={[styles.stripZone, { color: aw.color }]}>{aw.label}</Text>
        </View>

        <View style={styles.stripDivider} />

        <View style={styles.stripChip}>
          <Text style={styles.stripLabel}>LEG RISK</Text>
          <Text style={[styles.stripValue, { color: lmr.color }]}>
            {Math.round(legMuscularRisk)}
          </Text>
          <Text style={[styles.stripZone, { color: lmr.color }]}>{lmr.label}</Text>
        </View>

        <View style={styles.stripDivider} />

        <View style={styles.stripChip}>
          <Text style={styles.stripLabel}>BODY FAT.</Text>
          <Text style={[styles.stripValue, { color: tbf.color }]}>
            {Math.round(totalBodyFatigue)}
          </Text>
          <Text style={[styles.stripZone, { color: tbf.color }]}>{tbf.label}</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.space.sm,
  },

  /* Hero */
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.lg,
    paddingVertical: tokens.space.xs,
  },
  ringWrap: {
    width: 138,
    height: 138,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statsCol: {
    flex: 1,
    height: 138,
    justifyContent: 'center',
  },
  statItem: {
    flex: 1,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 1.8,
    marginBottom: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accent: {
    width: 3,
    height: 22,
    borderRadius: 2,
  },
  statNum: {
    fontSize: 28,
    fontWeight: '800',
    color: tokens.color.textPrimary,
    letterSpacing: -1,
  },
  separator: {
    height: 1,
    backgroundColor: tokens.color.border,
    marginVertical: 2,
  },

  /* Status row */
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    marginBottom: tokens.space.sm,
    paddingLeft: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: tokens.font.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
    flex: 1,
  },
  wellnessBadge: {
    backgroundColor: tokens.color.primaryMuted,
    borderRadius: tokens.radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  wellnessBadgeText: {
    fontSize: 9,
    color: tokens.color.primary,
    fontWeight: '700',
  },
  calibrateLink: {
    paddingLeft: tokens.space.xs,
  },
  calibrateLinkText: {
    fontSize: tokens.font.xs,
    fontWeight: '600',
  },

  /* Metrics strip */
  strip: {
    flexDirection: 'row',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: tokens.space.sm,
    overflow: 'hidden',
  },
  stripChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: tokens.space.xs,
  },
  stripLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  stripValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  stripZone: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  stripDivider: {
    width: 1,
    backgroundColor: tokens.color.border,
    marginVertical: tokens.space.sm,
  },
});
