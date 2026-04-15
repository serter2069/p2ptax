import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Shadows, Spacing } from '../constants/Colors';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'border border-border',
  elevated: '',
  outlined: 'border border-border',
};

const variantShadows: Record<CardVariant, ViewStyle> = {
  default: Shadows.md,
  elevated: Shadows.lg,
  outlined: {},
};

export function Card({ children, style, padding = Spacing['2xl'], variant = 'default' }: CardProps) {
  return (
    <View
      className={`bg-bgCard rounded-[10px] ${variantClasses[variant]}`}
      style={[variantShadows[variant], { padding }, style]}
    >
      {children}
    </View>
  );
}
