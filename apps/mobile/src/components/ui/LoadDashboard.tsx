
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
  return (
    <View style={styles.container}>
      <View style={styles.heroRow}>
        <MetricRing value={readiness} label="Readiness" size={140} strokeWidth={16} />
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryLabel}>WEEKLY LOAD</Text>
            <Text style={styles.summaryValue}>{Math.round(load7d)}</Text>
          </View>
          <View style={[styles.summaryStat, { borderLeftColor: tokens.color.accent }]}>
            <Text style={styles.summaryLabel}>MONTHLY LOAD</Text>
            <Text style={styles.summaryValue}>{Math.round(load28d)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>LOAD TREND (7D)</Text>
          <View style={styles.sparklineCard}>
            {history7d && history7d.length > 0 ? (
              <LoadSparkline data={history7d} color={tokens.color.primary} />
            ) : (
              <Text style={styles.emptyText}>No recent data</Text>
            )}
          </View>
        </View>

        <View style={styles.column}>
          <Text style={styles.sectionTitle}>SYSTEM STRESS</Text>
          <View style={styles.stressCard}>
            <LoadBar label="Cardio" current={current.cardio} max={100} color={tokens.color.primary} />
            <LoadBar label="Legs" current={current.legs} max={100} color={tokens.color.success} />
            <LoadBar label="Upper" current={current.upper} max={100} color={tokens.color.warning} />
            <LoadBar label="Core" current={current.core} max={100} color={tokens.color.accent} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.space.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.xl,
    paddingVertical: tokens.space.md,
  },
  summaryStats: {
    flex: 1,
    gap: tokens.space.lg,
  },
  summaryStat: {
    borderLeftWidth: 3,
    borderLeftColor: tokens.color.primary,
    paddingLeft: tokens.space.md,
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: tokens.color.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: tokens.color.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    gap: tokens.space.md,
    marginTop: tokens.space.md,
  },
  column: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: tokens.color.textTertiary,
    letterSpacing: 1.2,
    marginBottom: tokens.space.sm,
    marginLeft: 2,
  },
  sparklineCard: {
    backgroundColor: tokens.color.surfaceElevated,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    height: 90,
    justifyContent: 'center',
  },
  stressCard: {
    backgroundColor: tokens.color.surfaceElevated,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    height: 90,
    justifyContent: 'center',
    gap: 4,
  },
  emptyText: {
    fontSize: 10,
    color: tokens.color.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
