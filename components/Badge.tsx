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
  success: { bg: Colors.statusBg.success, text: Colors.statusSuccess },
  warning: { bg: Colors.statusBg.warning, text: Colors.statusWarning },
  error: { bg: Colors.statusBg.error, text: Colors.statusError },
  info: { bg: Colors.statusBg.info, text: Colors.statusInfo },
  accent: { bg: Colors.statusBg.accent, text: Colors.textAccent },
  familiar: { bg: Colors.statusBg.familiar, text: Colors.textFamiliar },
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
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
});
