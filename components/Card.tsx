import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/Colors';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  variant?: CardVariant;
}

export function Card({ children, style, padding = Spacing['2xl'], variant = 'default' }: CardProps) {
  return (
    <View style={[styles.card, variantStyles[variant], { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
  },
});

const variantStyles = StyleSheet.create({
  default: {
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  elevated: {
    ...Shadows.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
