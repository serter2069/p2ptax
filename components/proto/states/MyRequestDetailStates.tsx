import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_RESPONSES } from '../../../constants/protoMockData';
import { ProtoPlaceholderImage } from '../ProtoPlaceholderImage';

function ResponseCard({ name, city, rating, reviews, price, message }: {
  name: string; city: string; rating: number; reviews: number; price: string; message: string;
}) {
  const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  return (
    <View style={s.respCard}>
      <View style={s.respHeader}>
        <ProtoPlaceholderImage type="avatar" height={40} />
        <View style={s.respInfo}>
          <Text style={s.respName}>{name}</Text>
          <Text style={s.respCity}>{city}</Text>
        </View>
        <Text style={s.respPrice}>{price}</Text>
      </View>
      <View style={s.respRating}>
        <Text style={s.stars}>{stars}</Text>
        <Text style={s.ratingText}>{rating} ({reviews})</Text>
      </View>
      <Text style={s.respMessage} numberOfLines={2}>{message}</Text>
      <View style={s.respActions}>
        <View style={s.respBtnPrimary}><Text style={s.respBtnPrimaryText}>Принять</Text></View>
        <View style={s.respBtnSecondary}><Text style={s.respBtnSecondaryText}>Написать</Text></View>
      </View>
    </View>
  );
}

function DetailScreen({ mode }: { mode: 'responses' | 'no_responses' | 'closed' }) {
  return (
    <View style={s.container}>
      <View style={s.detailCard}>
        <View style={s.detailHeader}>
          <Text style={s.detailTitle}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
          <View style={[s.badge, { backgroundColor: mode === 'closed' ? Colors.textMuted + '20' : Colors.brandPrimary + '20' }]}>
            <Text style={[s.badgeText, { color: mode === 'closed' ? Colors.textMuted : Colors.brandPrimary }]}>
              {mode === 'closed' ? 'Закрыта' : 'Активная'}
            </Text>
          </View>
        </View>
        <Text style={s.detailDesc}>
          Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета за покупку квартиры.
        </Text>
        <View style={s.detailMeta}>
          <View style={s.metaItem}><Text style={s.metaLabel}>Город</Text><Text style={s.metaValue}>Москва</Text></View>
          <View style={s.metaItem}><Text style={s.metaLabel}>Услуга</Text><Text style={s.metaValue}>Декларация 3-НДФЛ</Text></View>
          <View style={s.metaItem}><Text style={s.metaLabel}>Бюджет</Text><Text style={s.metaValue}>3 000 — 5 000 ₽</Text></View>
          <View style={s.metaItem}><Text style={s.metaLabel}>Дата</Text><Text style={s.metaValue}>08.04.2026</Text></View>
        </View>
        <Text style={s.attachLabel}>Прикрепленные документы</Text>
        <View style={s.attachRow}>
          <ProtoPlaceholderImage type="document" width={80} height={64} label="Справка" borderRadius={6} />
          <ProtoPlaceholderImage type="photo" width={80} height={64} label="Фото" borderRadius={6} />
        </View>
      </View>

      <Text style={s.sectionTitle}>
        Отклики {mode === 'responses' ? `(${MOCK_RESPONSES.length})` : '(0)'}
      </Text>

      {mode === 'responses' ? (
        MOCK_RESPONSES.map((r) => (
          <ResponseCard
            key={r.id} name={r.specialistName} city={r.specialistCity}
            rating={r.rating} reviews={r.reviewCount} price={r.price} message={r.message}
          />
        ))
      ) : mode === 'no_responses' ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyTitle}>Пока нет откликов</Text>
          <Text style={s.emptyText}>Специалисты увидят вашу заявку и смогут предложить свои услуги</Text>
        </View>
      ) : (
        <View style={s.emptyWrap}>
          <Text style={s.emptyTitle}>Заявка закрыта</Text>
          <Text style={s.emptyText}>Эта заявка была завершена или отменена</Text>
        </View>
      )}
    </View>
  );
}

export function MyRequestDetailStates() {
  return (
    <>
      <StateSection title="WITH_RESPONSES">
        <DetailScreen mode="responses" />
      </StateSection>
      <StateSection title="NO_RESPONSES">
        <DetailScreen mode="no_responses" />
      </StateSection>
      <StateSection title="CLOSED">
        <DetailScreen mode="closed" />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  detailCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  detailTitle: { flex: 1, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  detailDesc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  detailMeta: { gap: Spacing.sm },
  metaItem: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  metaValue: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  attachLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  attachRow: { flexDirection: 'row', gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  respCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  respHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  respAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  respAvatarText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  respInfo: { flex: 1 },
  respName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  respCity: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  respPrice: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  respRating: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  stars: { fontSize: 14, color: Colors.brandPrimary },
  ratingText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  respMessage: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  respActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  respBtnPrimary: {
    flex: 1, height: 38, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  respBtnPrimaryText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  respBtnSecondary: {
    flex: 1, height: 38, backgroundColor: 'transparent', borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  respBtnSecondaryText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  emptyWrap: { alignItems: 'center', padding: Spacing['2xl'], gap: Spacing.sm },
  emptyTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
});
