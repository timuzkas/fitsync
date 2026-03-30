import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../tokens';

interface LoadBarProps {
  label: string;
  current: number;
  max?: number;
  unit?: string;
}

export function LoadBar({ label, current, max = 100, unit }: LoadBarProps) {
  const pct = Math.min((current / max) * 100, 100);
  const barColor =
    pct > 85 ? tokens.color.danger :
    pct > 60 ? tokens.color.warning :
    tokens.color.primary;

  return (
    <View style={styles.container}>
      <Text style={styles.bullet}>▸</Text>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.value}>
        {Math.round(current)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: tokens.space.sm,
  },
  bullet: {
    color: tokens.color.primary,
    fontSize: 14,
  },
  label: {
    color: tokens.color.textSecondary,
    fontSize: tokens.font.sm,
    width: 60,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: tokens.color.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  value: {
    color: tokens.color.textPrimary,
    fontSize: tokens.font.sm,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
});
