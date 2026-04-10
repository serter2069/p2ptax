import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { MOCK_REVIEWS } from '../../../constants/protoMockData';

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

function ReviewItem({ author, rating, text, date }: { author: string; rating: number; text: string; date: string }) {
  return (
    <View style={s.review}>
      <View style={s.reviewTop}>
        <Text style={s.reviewAuthor}>{author}</Text>
        <Text style={s.reviewDate}>{date}</Text>
      </View>
      <Stars rating={rating} />
      <Text style={s.reviewText}>{text}</Text>
    </View>
  );
}

function ProfileScreen({ showReviewsPopup }: { showReviewsPopup?: boolean }) {
  return (
    <View style={[s.container, showReviewsPopup ? { minHeight: 600 } : null]}>
      {showReviewsPopup && (
        <View style={s.overlay}>
          <View style={s.popup}>
            <View style={s.popupHeader}>
              <Text style={s.popupTitle}>Все отзывы (42)</Text>
              <Text style={s.popupClose}>{'x'}</Text>
            </View>
            {MOCK_REVIEWS.slice(0, 3).map((r) => (
              <ReviewItem key={r.id} author={r.author} rating={r.rating} text={r.text} date={r.date} />
            ))}
          </View>
        </View>
      )}
      <View style={s.profileCard}>
        <View style={s.profileTop}>
          <Image source={{ uri: 'https://picsum.photos/seed/aleksei-petrov/80/80' }} style={{ width: 80, height: 80, borderRadius: 40 }} />
          <View style={s.profileInfo}>
            <Text style={s.name}>Алексей Петров</Text>
            <Text style={s.city}>Санкт-Петербург</Text>
            <View style={s.ratingRow}>
              <Stars rating={5} size={14} />
              <Text style={s.ratingText}>4.8 (42 отзыва)</Text>
            </View>
          </View>
        </View>
        <View style={s.verified}>
          <Feather name="check" size={16} color={Colors.statusSuccess} />
          <Text style={s.verifiedText}>Верифицирован через ФНС</Text>
        </View>
        <Text style={s.bio}>
          Налоговый консультант с опытом работы в ФНС. Специализация — НДФЛ и имущественные вычеты.
          Более 200 успешно поданных деклараций.
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Услуги</Text>
        <View style={s.servicesList}>
          {['Декларация 3-НДФЛ', 'Налоговый вычет', 'Консультация по налогам'].map((svc) => (
            <View key={svc} style={s.serviceChip}>
              <Text style={s.serviceText}>{svc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>8 лет</Text>
            <Text style={s.statLabel}>Опыт</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>215</Text>
            <Text style={s.statLabel}>Заказов</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statValue}>98%</Text>
            <Text style={s.statLabel}>Успешных</Text>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <View style={s.reviewsHeader}>
          <Text style={s.sectionTitle}>Отзывы</Text>
          <Text style={s.viewAll}>Все 42 {'>'}</Text>
        </View>
        {MOCK_REVIEWS.slice(0, 2).map((r) => (
          <ReviewItem key={r.id} author={r.author} rating={r.rating} text={r.text} date={r.date} />
        ))}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Документы и сертификаты</Text>
        <View style={s.docsRow}>
          <Image source={{ uri: 'https://picsum.photos/seed/diploma/100/80' }} style={{ width: 100, height: 80, borderRadius: 6 }} />
          <Image source={{ uri: 'https://picsum.photos/seed/certificate/100/80' }} style={{ width: 100, height: 80, borderRadius: 6 }} />
          <Image source={{ uri: 'https://picsum.photos/seed/license/100/80' }} style={{ width: 100, height: 80, borderRadius: 6 }} />
        </View>
      </View>

      <View style={s.contactBtn}><Text style={s.contactBtnText}>Связаться</Text></View>
    </View>
  );
}

export function SpecialistProfilePublicStates() {
  return (
    <>
      <StateSection title="FULL">
        <ProfileScreen />
      </StateSection>
      <StateSection title="REVIEWS_POPUP">
        <ProfileScreen showReviewsPopup />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg, position: 'relative' },
  profileCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  profileTop: { flexDirection: 'row', gap: Spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  profileInfo: { flex: 1, gap: 2 },
  name: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  city: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  ratingText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  verified: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.statusBg.success, padding: Spacing.sm, borderRadius: BorderRadius.sm,
  },
  verifiedText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, color: Colors.statusSuccess },
  bio: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  servicesList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  serviceChip: {
    backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  serviceText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statItem: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  review: { gap: Spacing.xs, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewAuthor: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  reviewDate: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  reviewText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  docsRow: { flexDirection: 'row', gap: Spacing.sm },
  contactBtn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  contactBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  popup: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    width: '100%', maxWidth: 380, maxHeight: 500, gap: Spacing.md,
  },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popupTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  popupClose: { fontSize: Typography.fontSize.lg, color: Colors.textMuted, padding: Spacing.xs },
});
