import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../tokens';

interface StepIndicatorProps {
  current: number;
  total: number;
  labels?: string[];
}

export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < current && styles.dotFilled,
              i === current && styles.dotActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>{current + 1} of {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.space.md,
    gap: tokens.space.md,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.color.surfaceElevated,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
  },
  dotFilled: {
    backgroundColor: tokens.color.primaryMuted,
    borderColor: tokens.color.primaryMuted,
  },
  dotActive: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary,
    width: 24,
  },
  label: {
    fontSize: tokens.font.xs,
    color: tokens.color.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
