import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/Colors';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator
            size="small"
            color={variant === 'ghost' ? Colors.brandPrimary : Colors.textPrimary}
          />
        </View>
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles] as TextStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  primary: {
    backgroundColor: Colors.brandPrimary,
  },
  secondary: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.statusError,
  },
  disabled: {
    opacity: 0.45,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  primaryLabel: {
    color: Colors.textPrimary,
  },
  secondaryLabel: {
    color: Colors.textPrimary,
  },
  ghostLabel: {
    color: Colors.brandPrimary,
  },
  dangerLabel: {
    color: Colors.textPrimary,
  },
});
