/**
 * MetricRing — React Native
 *
 * Correct two-half-mask arc. The previous version had a positioning bug
 * where `left: r` placed the right-half clip container outside the ring,
 * and the absolute child wasn't offset back to align with the full circle.
 *
 * SVG version (react-native-svg) is included as comments — far more reliable
 * for arbitrary angles. Use it if the package is available.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../tokens';

interface MetricRingProps {
  value: number;   // 0–100
  label: string;
  size?: number;
  strokeWidth?: number;
}

export function MetricRing({
  value,
  label,
  size = 140,
  strokeWidth = 16,
}: MetricRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const degrees = (clamped / 100) * 360;

  const ringColor =
    clamped > 70 ? tokens.color.success :
    clamped > 40 ? tokens.color.warning :
    tokens.color.danger;

  const r = size / 2;

  // Right half shows 0–180°: rotated by (min(degrees,180) - 180)
  const rightRotate = Math.min(degrees, 180) - 180;
  // Left half shows 180–360°: only appears after 180°
  const leftRotate  = degrees > 180 ? degrees - 180 : 0;
  const leftVisible = degrees > 180;

  return (
    <View style={[styles.container, { width: size, height: size }]}>

      {/* Track */}
      <View style={[styles.abs, {
        width: size, height: size,
        borderRadius: r,
        borderWidth: strokeWidth,
        borderColor: tokens.color.elevated,
      }]} />

      {/* Right half clip (0°–180°) */}
      <View style={[styles.abs, { width: r, height: size, left: r, overflow: 'hidden' }]}>
        {/* The full circle is shifted left by `r` so its center aligns with the ring center */}
        <View style={{
          position: 'absolute', left: -r, top: 0,
          width: size, height: size,
          borderRadius: r,
          borderWidth: strokeWidth,
          borderColor: clamped > 0 ? ringColor : 'transparent',
          transform: [{ rotate: `${rightRotate}deg` }],
        }} />
      </View>

      {/* Left half clip (180°–360°) */}
      <View style={[styles.abs, { width: r, height: size, left: 0, overflow: 'hidden' }]}>
        <View style={{
          position: 'absolute', left: 0, top: 0,
          width: size, height: size,
          borderRadius: r,
          borderWidth: strokeWidth,
          borderColor: leftVisible ? ringColor : 'transparent',
          transform: [{ rotate: `${leftRotate}deg` }],
        }} />
      </View>

      {/* Center */}
      <View style={styles.center}>
        <Text style={[styles.value, { color: tokens.color.textPrimary }]} allowFontScaling={false}>
          {Math.round(clamped)}
        </Text>
        <Text style={[styles.label, { color: tokens.color.textMuted }]} allowFontScaling={false}>
          {label.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  abs:       { position: 'absolute', top: 0, left: 0 },
  center:    { alignItems: 'center', justifyContent: 'center' },
  value: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: -1,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 1,
  },
});

/*
 * ─── SVG VERSION (recommended if react-native-svg is installed) ──────────────
 *
 * import Svg, { Circle, G } from 'react-native-svg';
 *
 * export function MetricRing({ value, label, size = 140, strokeWidth = 16 }) {
 *   const clamped = Math.max(0, Math.min(100, value));
 *   const ringColor = clamped > 70 ? tokens.color.success
 *                   : clamped > 40 ? tokens.color.warning
 *                   : tokens.color.danger;
 *   const r    = (size - strokeWidth) / 2;
 *   const circ = 2 * Math.PI * r;
 *   const dash = (clamped / 100) * circ;
 *   const cx   = size / 2;
 *   return (
 *     <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
 *       <Svg width={size} height={size} style={{ position: 'absolute' }}>
 *         <G rotation="-90" origin={`${cx},${cx}`}>
 *           <Circle cx={cx} cy={cx} r={r} stroke={tokens.color.elevated}
 *             strokeWidth={strokeWidth} fill="none" />
 *           <Circle cx={cx} cy={cx} r={r} stroke={ringColor}
 *             strokeWidth={strokeWidth} fill="none"
 *             strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
 *         </G>
 *       </Svg>
 *       <Text style={{ fontSize: 40, fontWeight: '800', color: tokens.color.textPrimary }}>
 *         {Math.round(clamped)}
 *       </Text>
 *       <Text style={{ fontSize: 9, color: tokens.color.textMuted, letterSpacing: 2 }}>
 *         {label.toUpperCase()}
 *       </Text>
 *     </View>
 *   );
 * }
 * ─────────────────────────────────────────────────────────────────────────────
 */