import React from 'react';
import { Text, StyleSheet, View, ViewStyle } from 'react-native';
import { tokens } from '../../tokens';

type PillVariant = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

interface PillProps {
  label: string;
  variant?: PillVariant;
  size?: 'sm' | 'md';
  outlined?: boolean;
  showCheck?: boolean;
  style?: ViewStyle;
}

export function Pill({ label, variant = 'muted', size = 'md', outlined = false, showCheck = false, style }: PillProps) {
  const colors: Record<PillVariant, { bg: string; text: string; border: string }> = {
    primary: { bg: tokens.color.primaryMuted, text: '#818cf8', border: tokens.color.primary },
    success: { bg: tokens.color.successMuted, text: '#4ade80', border: tokens.color.success },
    warning: { bg: tokens.color.warningMuted, text: '#fbbf24', border: tokens.color.warning },
    danger: { bg: tokens.color.dangerMuted, text: '#f87171', border: tokens.color.danger },
    muted: { bg: '#1e293b', text: tokens.color.textMuted, border: tokens.color.border },
  };

  const activeColors = colors[variant];

  return (
    <View style={[
      styles.pill,
      {
        backgroundColor: outlined ? 'transparent' : activeColors.bg,
        borderColor: outlined ? tokens.color.border : activeColors.border,
        borderWidth: 1,
      },
      size === 'sm' && styles.sm,
      style,
    ]}>
      <View style={styles.content}>
        {showCheck && <Text style={[styles.text, { color: activeColors.text, marginRight: 4 }]}>✓</Text>}
        <Text style={[styles.text, { color: activeColors.text }, size === 'sm' && styles.textSm]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 3,
    borderRadius: tokens.radius.full,
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
  },
  textSm: {
    fontSize: tokens.font.xs,
  },
});
