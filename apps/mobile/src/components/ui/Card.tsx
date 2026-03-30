import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { tokens } from '../../tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function Card({ children, style, elevated }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.space.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  elevated: {
    backgroundColor: tokens.color.elevated,
  },
});
