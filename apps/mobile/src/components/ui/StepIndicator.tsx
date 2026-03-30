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
    justifyContent: 'space-between',
    paddingVertical: tokens.space.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.color.border,
  },
  dotFilled: {
    backgroundColor: tokens.color.primaryMuted,
  },
  dotActive: {
    backgroundColor: tokens.color.primary,
    width: 20,
  },
  label: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
  },
});
