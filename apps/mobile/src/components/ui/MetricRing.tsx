
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../tokens';

interface MetricRingProps {
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}

export function MetricRing({ value, label, size = 120, strokeWidth = 14 }: MetricRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  
  // Use tokens for ring colors
  const ringColor =
    clamped > 70 ? tokens.color.success :
    clamped > 40 ? tokens.color.warning :
    tokens.color.danger;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Track */}
      <View style={[
        styles.trackRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: tokens.color.surfaceElevated,
        }
      ]} />
      
      {/* Progress Ring - Simplified for React Native View-based drawing */}
      <View
        style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderTopColor: ringColor,
            borderRightColor: ringColor,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            opacity: 0.9,
            transform: [{ rotate: '45deg' }],
          }
        ]}
      />
      
      <View style={styles.centerContent}>
        <Text style={styles.valueText}>{Math.round(clamped)}</Text>
        <Text style={styles.labelText}>{label.toUpperCase()}</Text>
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
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 42,
    fontWeight: '800',
    color: tokens.color.textPrimary,
    lineHeight: 48,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.color.textSecondary,
    marginTop: -2,
    letterSpacing: 1,
  },
});
