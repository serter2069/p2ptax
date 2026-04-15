import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'accent' | 'familiar';
export type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

const SIZE_STYLES: Record<BadgeSize, { fontSize: number; paddingH: number; paddingV: number }> = {
  xs: { fontSize: 10, paddingH: 4, paddingV: 2 },
  sm: { fontSize: 12, paddingH: 6, paddingV: 3 },
  md: { fontSize: 14, paddingH: 8, paddingV: 4 },
};

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.statusBg.success, text: Colors.statusSuccess },
  warning: { bg: Colors.statusBg.warning, text: Colors.statusWarning },
  error: { bg: Colors.statusBg.error, text: Colors.statusError },
  info: { bg: Colors.statusBg.info, text: Colors.statusInfo },
  accent: { bg: Colors.statusBg.accent, text: Colors.textAccent },
  familiar: { bg: Colors.statusBg.familiar, text: Colors.textFamiliar },
};

export function Badge({ variant = 'accent', label, size, style }: BadgeProps) {
  const isFamiliar = variant === 'familiar';
  const displayLabel = isFamiliar ? 'Знакомый в налоговой' : (label ?? variant);
  const colors = VARIANT_COLORS[variant];
  const sizeStyle = size ? SIZE_STYLES[size] : undefined;

  return (
    <View
      className="self-start px-2 py-[3px] rounded-full"
      style={[
        { backgroundColor: colors.bg },
        sizeStyle && { paddingHorizontal: sizeStyle.paddingH, paddingVertical: sizeStyle.paddingV },
        style,
      ]}
    >
      <Text
        className="text-[11px] font-semibold tracking-wide"
        style={[{ color: colors.text }, sizeStyle && { fontSize: sizeStyle.fontSize }]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}
