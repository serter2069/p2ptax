import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface StatusBadgeProps {
  label: string;
  bg: string;
  fg: string;
  icon?: string;
}

export function StatusBadge({ label, bg, fg, icon }: StatusBadgeProps) {
  return (
    <View className="flex-row items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: bg }}>
      {icon && <Feather name={icon as any} size={12} color={fg} />}
      <Text className="text-xs font-medium" style={{ color: fg }}>{label}</Text>
    </View>
  );
}
