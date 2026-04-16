import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/Colors';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

function variantColors(variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return { bg: Colors.brandPrimary, border: 'transparent', text: Colors.white };
    case 'secondary':
      return { bg: Colors.white, border: Colors.brandPrimary, text: Colors.brandPrimary };
    case 'ghost':
      return { bg: 'transparent', border: 'transparent', text: Colors.brandPrimary };
    case 'danger':
      return { bg: Colors.statusError, border: 'transparent', text: Colors.white };
  }
}

function sizeMetrics(size: ButtonSize) {
  if (size === 'lg') {
    return {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      fontSize: Typography.fontSize.lg,
      iconGap: Spacing.sm,
    };
  }
  return {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    iconGap: Spacing.xs + Spacing.xxs, // 7 ≈ 8
  };
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  icon,
  children,
  fullWidth,
  style,
  testID,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  const colors = variantColors(variant);
  const metrics = sizeMetrics(size);

  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: metrics.iconGap,
    paddingVertical: metrics.paddingVertical,
    paddingHorizontal: metrics.paddingHorizontal,
    borderRadius: BorderRadius.btn,
    backgroundColor: colors.bg,
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: colors.border,
    opacity: disabled ? 0.5 : 1,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    ...(Platform.OS === 'web' && !inactive ? ({ cursor: 'pointer' } as any) : null),
  };

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }: PressableStateCallbackType) => [
        baseStyle,
        pressed && !inactive ? { opacity: 0.75 } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : icon ? (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      ) : null}
      <Text
        style={{
          color: colors.text,
          fontSize: metrics.fontSize,
          fontWeight: Typography.fontWeight.semibold,
          fontFamily: Typography.fontFamily.semibold,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
