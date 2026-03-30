import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../tokens';

interface MetricRingProps {
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}

export function MetricRing({ value, label, size = 120, strokeWidth = 10 }: MetricRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const ringColor =
    clamped > 70 ? '#22c55e' :
    clamped > 40 ? '#f59e0b' :
    '#ef4444';

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = clamped / 100;
  const dashLength = circumference * 0.75;
  const dashOffset = circumference * (1 - progress * 0.75);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[
        styles.trackRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: tokens.color.border,
        }
      ]} />
      <View
        style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: ringColor,
            borderLeftColor: ringColor,
            transform: [{ rotate: '-135deg' }],
          }
        ]}
      />
      <View style={styles.center}>
        <Text style={styles.value}>{Math.round(clamped)}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackRing: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
    color: tokens.color.textPrimary,
    lineHeight: 40,
  },
  label: {
    fontSize: 12,
    color: tokens.color.textMuted,
    marginTop: 2,
  },
});
