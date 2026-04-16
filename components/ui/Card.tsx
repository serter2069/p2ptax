import React from 'react';
import {
  Platform,
  Pressable,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/Colors';

export type CardVariant = 'elevated' | 'outlined';
export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: CardPadding;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const PADDING_MAP: Record<CardPadding, number> = {
  sm: Spacing.md,
  md: Spacing.lg,
  lg: Spacing.xl,
};

export function Card({
  children,
  onPress,
  padding = 'md',
  variant = 'elevated',
  style,
  testID,
}: CardProps) {
  const baseStyle: ViewStyle = {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    padding: PADDING_MAP[padding],
    ...(variant === 'elevated' ? Shadows.md : null),
    ...(variant === 'outlined'
      ? { borderWidth: 1, borderColor: Colors.borderLight }
      : null),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        style={({ pressed }: PressableStateCallbackType) => [
          baseStyle,
          pressed ? { transform: [{ scale: 0.98 }] } : null,
          Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]} testID={testID}>{children}</View>;
}
