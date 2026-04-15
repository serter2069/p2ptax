import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface StarsProps {
  rating: number;
  size?: number;
  filledColor?: string;
  emptyColor?: string;
}

export function Stars({ rating, size = 14, filledColor = '#F59E0B', emptyColor = '#E2E8F0' }: StarsProps) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? filledColor : emptyColor} />
      ))}
    </View>
  );
}
