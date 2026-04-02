import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/Colors';

interface StarsProps {
  rating: number | null;
  reviewCount?: number;
  size?: 'sm' | 'md';
  showEmpty?: boolean;
}

export function Stars({ rating, reviewCount, size = 'sm', showEmpty = false }: StarsProps) {
  const fontSize = size === 'md' ? Typography.fontSize.lg : Typography.fontSize.sm;

  if (rating === null || rating === undefined) {
    if (!showEmpty) return null;
    return (
      <View style={styles.row}>
        <Text style={[styles.stars, { fontSize }]}>☆☆☆☆☆</Text>
        <Text style={[styles.label, { fontSize: fontSize - 2 }]}>Нет отзывов</Text>
      </View>
    );
  }

  const rounded = Math.round(rating);
  const filled = '★'.repeat(rounded);
  const empty = '☆'.repeat(5 - rounded);

  return (
    <View style={styles.row}>
      <Text style={[styles.stars, { fontSize }]}>
        <Text style={styles.filledStars}>{filled}</Text>
        <Text style={styles.emptyStars}>{empty}</Text>
      </Text>
      {reviewCount !== undefined && (
        <Text style={[styles.label, { fontSize: size === 'md' ? Typography.fontSize.sm : Typography.fontSize.xs }]}>
          {rating.toFixed(1)} ({reviewCount})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stars: {
    lineHeight: 20,
  },
  filledStars: {
    color: Colors.brandPrimary,
  },
  emptyStars: {
    color: Colors.border,
  },
  label: {
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
});
