import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/Colors';
import { Text } from './Text';

export type RatingSize = 'sm' | 'md';

export interface RatingProps {
  value: number;
  reviewCount?: number;
  size?: RatingSize;
  showNumeric?: boolean;
  style?: StyleProp<ViewStyle>;
}

const STAR_COUNT = 5;

function iconSize(size: RatingSize) {
  return size === 'sm' ? 12 : 16;
}

function textSize(size: RatingSize) {
  return size === 'sm' ? Typography.fontSize.xs : Typography.fontSize.sm;
}

/**
 * Rating row: star icons + numeric value + optional review count.
 * `value` may be fractional (0–5). Stars render as full when >= i+1, otherwise empty.
 * (Half-star uses Feather which lacks `star-half` — we round-to-nearest for simplicity;
 * fractional numeric is still shown.)
 */
export function Rating({ value, reviewCount, size = 'md', showNumeric = true, style }: RatingProps) {
  const clamped = Math.max(0, Math.min(STAR_COUNT, value));
  const iSize = iconSize(size);
  const tSize = textSize(size);

  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + Spacing.xxs },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        {Array.from({ length: STAR_COUNT }).map((_, i) => {
          const filled = clamped >= i + 0.5;
          return (
            <Feather
              key={i}
              name="star"
              size={iSize}
              color={filled ? Colors.amber : Colors.borderLight}
            />
          );
        })}
      </View>
      {showNumeric ? (
        <Text
          style={{
            fontSize: tSize,
            color: Colors.textPrimary,
            fontWeight: Typography.fontWeight.semibold,
            fontFamily: Typography.fontFamily.semibold,
          }}
        >
          {clamped.toFixed(1)}
        </Text>
      ) : null}
      {typeof reviewCount === 'number' ? (
        <Text style={{ fontSize: tSize, color: Colors.textMuted }}>
          ({reviewCount})
        </Text>
      ) : null}
    </View>
  );
}
