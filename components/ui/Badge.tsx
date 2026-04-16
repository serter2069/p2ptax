import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/Colors';
import { Text } from './Text';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

function variantColors(variant: BadgeVariant) {
  switch (variant) {
    case 'success':
      return { bg: Colors.statusBg.success, text: Colors.statusSuccess };
    case 'warning':
      return { bg: Colors.statusBg.warning, text: Colors.statusWarning };
    case 'danger':
      return { bg: Colors.statusBg.error, text: Colors.statusError };
    case 'info':
      return { bg: Colors.statusBg.info, text: Colors.brandPrimary };
    case 'default':
    default:
      return { bg: Colors.statusBg.neutral, text: Colors.textSecondary };
  }
}

export function Badge({ variant = 'default', children, style }: BadgeProps) {
  const colors = variantColors(variant);
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.sm,
          borderRadius: BorderRadius.full,
          backgroundColor: colors.bg,
        },
        style,
      ]}
    >
      <Text
        variant="caption"
        style={{
          color: colors.text,
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.semibold,
          fontFamily: Typography.fontFamily.semibold,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
