import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
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
  const totalCurrent = current.cardio + current.legs + current.upper + current.core + current.systemic;

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <MetricRing value={readiness} label="Readiness" size={100} strokeWidth={8} />
        <View style={styles.bars}>
          <LoadBar label="Cardio" current={current.cardio} max={100} />
          <LoadBar label="Legs" current={current.legs} max={100} />
          <LoadBar label="Upper" current={current.upper} max={100} />
          <LoadBar label="Core" current={current.core} max={100} />
        </View>
      </View>
      <View style={styles.periods}>
        <View style={styles.period}>
          <Text style={styles.periodLabel}>7d Load</Text>
          {history7d && history7d.length > 0 ? (
            <LoadSparkline data={history7d} color={tokens.color.primary} showValue valueColor={tokens.color.textPrimary} />
          ) : (
            <Text style={styles.periodValue}>{Math.round(load7d)}</Text>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.period}>
          <Text style={styles.periodLabel}>28d Load</Text>
          <Text style={styles.periodValue}>{Math.round(load28d)}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: tokens.space.mdSm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    marginBottom: tokens.space.md,
  },
  bars: {
    flex: 1,
  },
  periods: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    paddingTop: tokens.space.md,
  },
  period: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  periodLabel: {
    fontSize: tokens.font.xs,
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  periodValue: {
    fontSize: tokens.font.xl,
    fontWeight: 'bold',
    color: tokens.color.textPrimary,
  },
  divider: {
    width: 1,
    backgroundColor: tokens.color.border,
  },
});
