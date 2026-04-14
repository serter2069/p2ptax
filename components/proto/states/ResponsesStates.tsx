import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_RESPONSES } from '../../../constants/protoMockData';

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= Math.round(rating) ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

function ResponseItem({ name, price, message, rating, reviews, onAccept, onDecline }: {
  name: string; price: string; message: string; rating: number; reviews: number;
  onAccept: () => void; onDecline: () => void;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatar}><Text style={s.avatarText}>{name[0]}</Text></View>
        <View style={s.info}>
          <Text style={s.name}>{name}</Text>
          <View style={s.ratingRow}>
            <Stars rating={rating} />
            <Text style={s.ratingLabel}>{rating} ({reviews} отзывов)</Text>
          </View>
        </View>
        <View style={s.priceWrap}>
          <Feather name="dollar-sign" size={14} color={Colors.brandPrimary} />
          <Text style={s.price}>{price}</Text>
        </View>
      </View>
      <Text style={s.message} numberOfLines={2}>{message}</Text>
      <View style={s.actions}>
        <Pressable onPress={onAccept} style={s.btnAccept}>
          <Feather name="check" size={16} color={Colors.white} />
          <Text style={s.btnAcceptText}>Принять</Text>
        </Pressable>
        <Pressable onPress={onDecline} style={s.btnDecline}>
          <Feather name="x" size={16} color={Colors.textMuted} />
          <Text style={s.btnDeclineText}>Отклонить</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InteractiveResponses() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Feather name="message-circle" size={20} color={Colors.brandPrimary} />
        <Text style={s.pageTitle}>Отклики ({MOCK_RESPONSES.length})</Text>
      </View>
      {MOCK_RESPONSES.map((r) => (
        <ResponseItem
          key={r.id}
          name={r.specialistName}
          price={r.price}
          message={r.message}
          rating={r.rating}
          reviews={r.reviewCount}
          onAccept={() => {}}
          onDecline={() => {}}
        />
      ))}
    </View>
  );
}

export function ResponsesStates() {
  return (
    <StateSection title="INTERACTIVE">
      <InteractiveResponses />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  info: { flex: 1 },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  ratingLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  priceWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  price: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  message: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  btnAccept: {
    flex: 1, height: 40, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.xs, ...Shadows.sm,
  },
  btnAcceptText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  btnDecline: {
    flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', gap: Spacing.xs,
  },
  btnDeclineText: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
});
