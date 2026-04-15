import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export interface EmptyStateProps {
  icon?: string;
  iconSize?: number;
  title?: string;
  description?: string;
  /** @deprecated use description */
  subtitle?: string;
  buttonLabel?: string;
  /** @deprecated use buttonLabel */
  ctaLabel?: string;
  onButtonPress?: () => void;
  /** @deprecated use onButtonPress */
  onCtaPress?: () => void;
}

export function EmptyState({
  icon,
  iconSize = 32,
  title,
  description,
  subtitle,
  buttonLabel,
  ctaLabel,
  onButtonPress,
  onCtaPress,
}: EmptyStateProps) {
  const resolvedDescription = description || subtitle;
  const resolvedButtonLabel = buttonLabel || ctaLabel;
  const resolvedOnButtonPress = onButtonPress || onCtaPress;
  return (
    <View className="items-center gap-3 py-10">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
        <Feather name={icon as any} size={iconSize} color={Colors.textMuted} />
      </View>
      <Text className="text-lg font-semibold text-textPrimary">{title}</Text>
      {resolvedDescription && (
        <Text className="max-w-[260px] text-center text-sm text-textMuted">{resolvedDescription}</Text>
      )}
      {resolvedButtonLabel && resolvedOnButtonPress && (
        <Pressable
          className="mt-2 h-10 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6"
          onPress={resolvedOnButtonPress}
        >
          <Text className="text-sm font-semibold text-white">{buttonLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
