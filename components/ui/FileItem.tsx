import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export interface FileItemProps {
  name: string;
  size: string;
  onRemove: () => void;
}

export function FileItem({ name, size, onRemove }: FileItemProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-borderLight bg-bgSurface px-3 py-2">
      <Feather name="file" size={16} color={Colors.brandPrimary} />
      <View className="flex-1">
        <Text className="text-sm text-textPrimary" numberOfLines={1}>{name}</Text>
        <Text className="text-xs text-textMuted">{size}</Text>
      </View>
      <Pressable onPress={onRemove}>
        <Feather name="x" size={16} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}
