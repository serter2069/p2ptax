import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_RESPONSES } from '../../../constants/protoMockData';

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

function ResponseCard({ name, city, rating, reviews, price, message }: {
  name: string; city: string; rating: number; reviews: number; price: string; message: string;
}) {
  const [accepted, setAccepted] = useState(false);
  return (
    <View style={s.respCard}>
      <View style={s.respHeader}>
        <Image source={{ uri: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/40/40` }} style={{ width: 40, height: 40, borderRadius: 20 }} />
        <View style={s.respInfo}>
          <Text style={s.respName}>{name}</Text>
          <View style={s.respCityRow}>
            <Feather name="map-pin" size={11} color={Colors.textMuted} />
            <Text style={s.respCity}>{city}</Text>
          </View>
        </View>
        <Text style={s.respPrice}>{price}</Text>
      </View>
      <View style={s.respRating}>
        <Stars rating={Math.round(rating)} size={14} />
        <Text style={s.ratingText}>{rating} ({reviews})</Text>
      </View>
      <Text style={s.respMessage} numberOfLines={2}>{message}</Text>
      <View style={s.respActions}>
        <Pressable style={[s.respBtnPrimary, accepted && s.respBtnAccepted]} onPress={() => setAccepted(!accepted)}>
          <Feather name={accepted ? 'check' : 'user-check'} size={14} color={Colors.white} />
          <Text style={s.respBtnPrimaryText}>{accepted ? 'Принято' : 'Принять'}</Text>
        </Pressable>
        <Pressable style={s.respBtnSecondary}>
          <Feather name="message-circle" size={14} color={Colors.textPrimary} />
          <Text style={s.respBtnSecondaryText}>Написать</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MyRequestDetailStates() {
  return (
    <StateSection title="WITH_RESPONSES">
      <View style={s.container}>
        <View style={s.detailCard}>
          <View style={s.detailHeader}>
            <Text style={s.detailTitle}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
            <View style={[s.badge, { backgroundColor: Colors.brandPrimary + '20' }]}>
              <Text style={[s.badgeText, { color: Colors.brandPrimary }]}>Активная</Text>
            </View>
          </View>
          <Text style={s.detailDesc}>
            Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета за покупку квартиры.
          </Text>
          <View style={s.detailMeta}>
            <View style={s.metaItem}>
              <Feather name="map-pin" size={14} color={Colors.textMuted} />
              <Text style={s.metaLabel}>Город</Text>
              <Text style={s.metaValue}>Москва</Text>
            </View>
            <View style={s.metaItem}>
              <Feather name="briefcase" size={14} color={Colors.textMuted} />
              <Text style={s.metaLabel}>Услуга</Text>
              <Text style={s.metaValue}>Декларация 3-НДФЛ</Text>
            </View>
            <View style={s.metaItem}>
              <Feather name="dollar-sign" size={14} color={Colors.textMuted} />
              <Text style={s.metaLabel}>Бюджет</Text>
              <Text style={s.metaValue}>3 000 - 5 000 &#8381;</Text>
            </View>
            <View style={s.metaItem}>
              <Feather name="calendar" size={14} color={Colors.textMuted} />
              <Text style={s.metaLabel}>Дата</Text>
              <Text style={s.metaValue}>08.04.2026</Text>
            </View>
          </View>
          <View style={s.attachSection}>
            <View style={s.attachLabelRow}>
              <Feather name="paperclip" size={14} color={Colors.textPrimary} />
              <Text style={s.attachLabel}>Прикрепленные документы</Text>
            </View>
            <View style={s.attachRow}>
              <Image source={{ uri: 'https://picsum.photos/seed/doc-spravka/80/64' }} style={{ width: 80, height: 64, borderRadius: 6 }} />
              <Image source={{ uri: 'https://picsum.photos/seed/photo-attach/80/64' }} style={{ width: 80, height: 64, borderRadius: 6 }} />
            </View>
          </View>
        </View>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Отклики ({MOCK_RESPONSES.length})</Text>
        </View>

        {MOCK_RESPONSES.map((r) => (
          <ResponseCard
            key={r.id} name={r.specialistName} city={r.specialistCity}
            rating={r.rating} reviews={r.reviewCount} price={r.price} message={r.message}
          />
        ))}
      </View>
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  detailCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  detailTitle: { flex: 1, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  detailDesc: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  detailMeta: { gap: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metaLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, flex: 1 },
  metaValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  attachSection: { gap: Spacing.sm },
  attachLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  attachLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  attachRow: { flexDirection: 'row', gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  respCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  respHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  respInfo: { flex: 1 },
  respName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  respCityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  respCity: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  respPrice: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  respRating: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  ratingText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  respMessage: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  respActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  respBtnPrimary: {
    flex: 1, height: 40, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.xs,
  },
  respBtnAccepted: { backgroundColor: Colors.statusSuccess },
  respBtnPrimaryText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  respBtnSecondary: {
    flex: 1, height: 40, backgroundColor: 'transparent', borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', gap: Spacing.xs,
  },
  respBtnSecondaryText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
});
