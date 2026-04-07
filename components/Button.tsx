import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/Colors';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'white' | 'outline-white';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const hoverBg: Record<string, string> = {
  primary: '#2368BE',
  secondary: Colors.bgPrimary,
  ghost: 'rgba(26,91,168,0.06)',
  danger: '#991818',
  outline: 'rgba(26,91,168,0.06)',
  white: '#F0F4FA',
  'outline-white': 'rgba(255,255,255,0.15)',
};

const webTransition = Platform.OS === 'web'
  ? ({ transition: 'background-color 0.15s ease, box-shadow 0.15s ease' } as any)
  : {};

export function Button({
  onPress,
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const [hovered, setHovered] = useState(false);

  const hoverStyle: ViewStyle = (hovered && !isDisabled && Platform.OS === 'web')
    ? { backgroundColor: hoverBg[variant] }
    : {};

  const webProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        webTransition,
        hoverStyle,
        style,
      ]}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      dataSet={{ hoverManaged: '1' }}
      {...(webProps as any)}
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
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1A5BA8',
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  'outline-white': {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  secondaryLabel: {
    color: Colors.textPrimary,
  },
  ghostLabel: {
    color: Colors.brandPrimary,
  },
  dangerLabel: {
    color: '#FFFFFF',
  },
  outlineLabel: {
    color: '#1A5BA8',
  },
  whiteLabel: {
    color: '#1A5BA8',
  },
  'outline-whiteLabel': {
    color: '#FFFFFF',
  },
});
