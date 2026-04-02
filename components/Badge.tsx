import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/Colors';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'accent' | 'familiar';

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  style?: ViewStyle;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#1a3a1e', text: Colors.statusSuccess },
  warning: { bg: '#3a2c10', text: Colors.statusWarning },
  error: { bg: '#3a1414', text: Colors.statusError },
  info: { bg: '#132240', text: Colors.statusInfo },
  accent: { bg: '#2a1f4a', text: Colors.textAccent },
  familiar: { bg: '#2a2070', text: '#a5b4fc' },
};

export function Badge({ variant = 'accent', label, style }: BadgeProps) {
  const isFamiliar = variant === 'familiar';
  const displayLabel = isFamiliar ? 'Знакомый в налоговой' : (label ?? variant);
  const colors = VARIANT_COLORS[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.label, { color: colors.text }]}>
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
});
