import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REVIEWS } from '../../../constants/protoMockData';

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
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
        <View style={s.reviewAuthorRow}>
          <Feather name="user" size={14} color={Colors.textMuted} />
          <Text style={s.reviewAuthor}>{author}</Text>
        </View>
        <View style={s.reviewDateRow}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text style={s.reviewDate}>{date}</Text>
        </View>
      </View>
      <Stars rating={rating} />
      <Text style={s.reviewText}>{text}</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={s.container}>
      <View style={s.profileCard}>
        <View style={s.profileTop}>
          <Image source={{ uri: 'https://picsum.photos/seed/aleksei-petrov/80/80' }} style={{ width: 80, height: 80, borderRadius: 40 }} />
          <View style={s.profileInfo}>
            <Text style={s.name}>Алексей Петров</Text>
            <View style={s.cityRow}>
              <Feather name="map-pin" size={14} color={Colors.textMuted} />
              <Text style={s.city}>Санкт-Петербург</Text>
            </View>
            <View style={s.ratingRow}>
              <Stars rating={5} size={16} />
              <Text style={s.ratingText}>4.8 (42 отзыва)</Text>
            </View>
          </View>
        </View>
        <View style={s.verified}>
          <Feather name="shield" size={16} color={Colors.statusSuccess} />
          <Text style={s.verifiedText}>Верифицирован через ФНС</Text>
        </View>
        <Text style={s.bio}>
          Налоговый консультант с опытом работы в ФНС. Специализация — НДФЛ и имущественные вычеты.
          Более 200 успешно поданных деклараций.
        </Text>
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Feather name="briefcase" size={16} color={Colors.brandPrimary} />
          <Text style={s.sectionTitle}>Услуги</Text>
        </View>
        <View style={s.servicesList}>
          {['Декларация 3-НДФЛ', 'Налоговый вычет', 'Консультация по налогам'].map((svc) => (
            <View key={svc} style={s.serviceChip}>
              <Feather name="check" size={12} color={Colors.brandPrimary} />
              <Text style={s.serviceText}>{svc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Feather name="award" size={18} color={Colors.brandPrimary} />
            <Text style={s.statValue}>8 лет</Text>
            <Text style={s.statLabel}>Опыт</Text>
          </View>
          <View style={s.statItem}>
            <Feather name="file-text" size={18} color={Colors.statusSuccess} />
            <Text style={s.statValue}>215</Text>
            <Text style={s.statLabel}>Заказов</Text>
          </View>
          <View style={s.statItem}>
            <Feather name="trending-up" size={18} color={Colors.statusWarning} />
            <Text style={s.statValue}>98%</Text>
            <Text style={s.statLabel}>Успешных</Text>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <View style={s.reviewsHeader}>
          <Feather name="message-square" size={16} color={Colors.brandPrimary} />
          <Text style={s.sectionTitle}>Отзывы</Text>
          <Pressable style={s.viewAllBtn}>
            <Text style={s.viewAll}>Все 42</Text>
            <Feather name="chevron-right" size={16} color={Colors.brandPrimary} />
          </Pressable>
        </View>
        {MOCK_REVIEWS.slice(0, 2).map((r) => (
          <ReviewItem key={r.id} author={r.author} rating={r.rating} text={r.text} date={r.date} />
        ))}
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Feather name="file" size={16} color={Colors.brandPrimary} />
          <Text style={s.sectionTitle}>Документы и сертификаты</Text>
        </View>
        <View style={s.docsRow}>
          <Image source={{ uri: 'https://picsum.photos/seed/diploma/100/80' }} style={s.docImg} />
          <Image source={{ uri: 'https://picsum.photos/seed/certificate/100/80' }} style={s.docImg} />
          <Image source={{ uri: 'https://picsum.photos/seed/license/100/80' }} style={s.docImg} />
        </View>
      </View>

      <Pressable style={s.contactBtn}>
        <Feather name="message-circle" size={18} color={Colors.white} />
        <Text style={s.contactBtnText}>Связаться</Text>
      </Pressable>
    </View>
  );
}

export function SpecialistProfilePublicStates() {
  return (
    <StateSection title="FULL">
      <ProfileScreen />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  profileCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  profileTop: { flexDirection: 'row', gap: Spacing.lg },
  profileInfo: { flex: 1, gap: 4 },
  name: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  city: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  ratingText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  verified: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.statusBg.success, padding: Spacing.sm, borderRadius: BorderRadius.btn,
  },
  verifiedText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.statusSuccess },
  bio: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  servicesList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  serviceChip: {
    backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  serviceText: { fontSize: Typography.fontSize.base, color: Colors.brandPrimary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statItem: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.md,
    alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  statValue: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  viewAll: { fontSize: Typography.fontSize.base, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  review: { gap: Spacing.xs, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  reviewAuthor: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  reviewDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewDate: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  reviewText: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  docsRow: { flexDirection: 'row', gap: Spacing.sm },
  docImg: { width: 100, height: 80, borderRadius: BorderRadius.card },
  contactBtn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm,
  },
  contactBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
});
