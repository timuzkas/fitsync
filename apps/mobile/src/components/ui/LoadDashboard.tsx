import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoadBar } from '../ui/LoadBar';
import { MetricRing } from '../ui/MetricRing';
import { LoadSparkline } from '../charts/LoadSparkline';
import { tokens } from '../../tokens';

interface LoadDashboardProps {
  readiness: number;
  current: { cardio: number; legs: number; upper: number; core: number; systemic: number };
  load7d: number;
  load28d: number;
  history7d?: number[];
}

export function LoadDashboard({ readiness, current, load7d, load28d, history7d }: LoadDashboardProps) {
  const readinessLabel =
    readiness > 70 ? 'Ready to train' :
    readiness > 40 ? 'Light session only' :
    'Rest recommended';

  const readinessColor =
    readiness > 70 ? tokens.color.success :
    readiness > 40 ? tokens.color.warning :
    tokens.color.danger;

  return (
    <View style={styles.container}>

      {/* ── Hero: ring + load numbers ── */}
      <View style={styles.heroRow}>
        {/* Ring — explicit size so it never stretches */}
        <View style={styles.ringWrap}>
          <MetricRing value={readiness} label="Readiness" size={138} strokeWidth={16} />
        </View>

        {/* Load stats */}
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

      {/* ── Status pill ── */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: readinessColor }]} />
        <Text style={[styles.statusText, { color: readinessColor }]}>{readinessLabel}</Text>
      </View>

      {/* ── Bottom grid: sparkline | system stress ── */}
      <View style={styles.grid}>
        <View style={styles.gridCard}>
          <Text style={styles.cardLabel}>LOAD TREND</Text>
          <View style={styles.sparklineArea}>
            {history7d && history7d.length > 1 ? (
              <LoadSparkline data={history7d} color={tokens.color.primary} height={44} />
            ) : (
              <Text style={styles.emptyText}>No data yet</Text>
            )}
          </View>
          <Text style={styles.cardSub}>7-day history</Text>
        </View>

        <View style={styles.gridCard}>
          <Text style={styles.cardLabel}>SYSTEM STRESS</Text>
          <View style={styles.barsArea}>
            <LoadBar label="Cardio" current={current.cardio} max={100} color={tokens.color.primary} />
            <LoadBar label="Legs"   current={current.legs}   max={100} color={tokens.color.success} />
            <LoadBar label="Upper"  current={current.upper}  max={100} color={tokens.color.warning} />
            <LoadBar label="Core"   current={current.core}   max={100} color={tokens.color.accent}  />
          </View>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.space.md,
  },

  /* Hero row */
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.lg,
    paddingVertical: tokens.space.xs,
  },
  ringWrap: {
    // Hard-size the ring so it cannot stretch the row
    width: 138,
    height: 138,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statsCol: {
    flex: 1,
    // Match ring height so items distribute evenly
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

  /* Status */
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    marginBottom: tokens.space.md,
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
  },

  /* Bottom grid */
  grid: {
    flexDirection: 'row',
    gap: tokens.space.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.md,
    // Fixed height so both cards match
    height: 120,
  },
  cardLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sparklineArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barsArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardSub: {
    fontSize: 8,
    color: tokens.color.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 10,
    color: tokens.color.textTertiary,
    fontStyle: 'italic',
  },
});