import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../tokens';

interface LoadBarProps {
  label: string;
  current: number;
  max?: number;
  unit?: string;
  color?: string;
}

export function LoadBar({ label, current, max = 100, color }: LoadBarProps) {
  const pct = Math.min((current / max) * 100, 100);
  const barColor = color || (
    pct > 85 ? tokens.color.danger :
    pct > 60 ? tokens.color.warning :
    tokens.color.primary
  );

  return (
    <View style={styles.container}>
      <Text style={styles.bullet}>▸</Text>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(pct, 2)}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.value, { color: barColor }]}>
        {Math.round(current)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: tokens.space.sm,
  },
  bullet: {
    color: tokens.color.textTertiary,
    fontSize: 10,
  },
  label: {
    color: tokens.color.textSecondary,
    fontSize: tokens.font.xs,
    width: 44,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: tokens.color.elevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  value: {
    fontSize: tokens.font.xs,
    fontWeight: '700',
    width: 24,
    textAlign: 'right',
  },
});