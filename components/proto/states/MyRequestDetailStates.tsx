import React, { useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_RESPONSES } from '../../../constants/protoMockData';

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

function ResponseCard({ name, city, rating, reviews, price, message }: {
  name: string; city: string; rating: number; reviews: number; price: string; message: string;
}) {
  const [accepted, setAccepted] = useState(false);
  return (
    <View style={s.respCard}>
      <View style={s.respHeader}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{name.split(' ').map(n => n[0]).join('')}</Text>
        </View>
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

function StatusTimeline() {
  const steps = [
    { label: 'Создана', date: '08.04.2026', done: true },
    { label: 'Отклики получены', date: '08.04.2026', done: true },
    { label: 'В работе', date: '', done: false, active: true },
    { label: 'Завершена', date: '', done: false },
  ];
  return (
    <View style={s.timeline}>
      {steps.map((st, i) => (
        <View key={i} style={s.timelineItem}>
          <View style={s.timelineDotCol}>
            <View style={[s.timelineDot, st.done && s.timelineDotDone, st.active && s.timelineDotActive]} />
            {i < steps.length - 1 && <View style={[s.timelineLine, st.done && s.timelineLineDone]} />}
          </View>
          <View style={s.timelineContent}>
            <Text style={[s.timelineLabel, st.done && s.timelineLabelDone, st.active && s.timelineLabelActive]}>{st.label}</Text>
            {st.date ? <Text style={s.timelineDate}>{st.date}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (with responses)
// ---------------------------------------------------------------------------

function DefaultDetail() {
  return (
    <View style={s.container}>
      <View style={s.detailCard}>
        <View style={s.detailHeader}>
          <Text style={s.detailTitle}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
          <View style={[s.badge, { backgroundColor: Colors.statusBg.info }]}>
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

        {/* Action buttons */}
        <View style={s.detailActions}>
          <Pressable style={s.actionBtnSecondary}>
            <Feather name="edit-2" size={14} color={Colors.brandPrimary} />
            <Text style={s.actionBtnSecondaryText}>Редактировать</Text>
          </Pressable>
          <Pressable style={s.actionBtnDanger}>
            <Feather name="x-circle" size={14} color={Colors.statusError} />
            <Text style={s.actionBtnDangerText}>Закрыть</Text>
          </Pressable>
        </View>
      </View>

      {/* Status timeline */}
      <StatusTimeline />

      {/* Responses */}
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
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING (skeleton)
// ---------------------------------------------------------------------------

function LoadingDetail() {
  return (
    <View style={s.container}>
      <View style={s.detailCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SkeletonBlock width="70%" height={20} />
          <SkeletonBlock width={60} height={22} radius={BorderRadius.full} />
        </View>
        <SkeletonBlock width="100%" height={40} />
        <View style={{ gap: Spacing.sm }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <SkeletonBlock width={14} height={14} radius={7} />
              <SkeletonBlock width={60} height={14} />
              <SkeletonBlock width={100} height={14} />
            </View>
          ))}
        </View>
      </View>
      {[1, 2].map(i => (
        <View key={i} style={s.skeletonRespCard}>
          <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
            <SkeletonBlock width={40} height={40} radius={20} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBlock width="60%" height={14} />
              <SkeletonBlock width="40%" height={12} />
            </View>
            <SkeletonBlock width={60} height={18} />
          </View>
          <SkeletonBlock width="90%" height={14} />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <SkeletonBlock width="48%" height={40} radius={BorderRadius.btn} />
            <SkeletonBlock width="48%" height={40} radius={BorderRadius.btn} />
          </View>
        </View>
      ))}
      <View style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: EMPTY (no responses yet)
// ---------------------------------------------------------------------------

function EmptyDetail() {
  return (
    <View style={s.container}>
      <View style={s.detailCard}>
        <View style={s.detailHeader}>
          <Text style={s.detailTitle}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>
          <View style={[s.badge, { backgroundColor: Colors.statusBg.info }]}>
            <Text style={[s.badgeText, { color: Colors.brandPrimary }]}>Новая</Text>
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
        </View>
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Отклики (0)</Text>
      </View>
      <View style={s.emptyBlock}>
        <View style={s.emptyIconWrap}>
          <Feather name="clock" size={36} color={Colors.brandPrimary} />
        </View>
        <Text style={s.emptyTitle}>Пока нет откликов</Text>
        <Text style={s.emptyText}>Специалисты рассматривают вашу заявку. Обычно первые отклики приходят в течение часа.</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR
// ---------------------------------------------------------------------------

function ErrorDetail() {
  return (
    <View style={s.container}>
      <View style={s.errorBlock}>
        <View style={s.errorIconWrap}>
          <Feather name="alert-triangle" size={36} color={Colors.statusError} />
        </View>
        <Text style={s.emptyTitle}>Заявка не найдена</Text>
        <Text style={s.emptyText}>Возможно, заявка была удалена или у вас нет доступа</Text>
        <Pressable style={s.retryBtn}>
          <Feather name="arrow-left" size={16} color={Colors.white} />
          <Text style={s.retryBtnText}>К моим заявкам</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MyRequestDetailStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultDetail />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingDetail />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyDetail />
      </StateSection>
      <StateSection title="ERROR">
        <ErrorDetail />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },

  // Detail card
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

  // Action buttons
  detailActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  actionBtnSecondary: {
    flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.brandPrimary, flexDirection: 'row', gap: Spacing.xs,
  },
  actionBtnSecondaryText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.brandPrimary },
  actionBtnDanger: {
    flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.statusBg.error, backgroundColor: Colors.statusBg.error,
    flexDirection: 'row', gap: Spacing.xs,
  },
  actionBtnDangerText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.statusError },

  // Timeline
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', minHeight: 44 },
  timelineDotCol: { alignItems: 'center', width: 24 },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.bgCard, marginTop: 4,
  },
  timelineDotDone: { borderColor: Colors.statusSuccess, backgroundColor: Colors.statusSuccess },
  timelineDotActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary },
  timelineLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 2 },
  timelineLineDone: { backgroundColor: Colors.statusSuccess },
  timelineContent: { flex: 1, paddingLeft: Spacing.sm, paddingBottom: Spacing.md },
  timelineLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  timelineLabelDone: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.medium },
  timelineLabelActive: { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold },
  timelineDate: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },

  // Response card
  respCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  respHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  avatarText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
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

  // Empty
  emptyBlock: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 300 },

  // Error
  errorBlock: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.statusBg.error,
    alignItems: 'center', justifyContent: 'center',
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
  },
  retryBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Skeleton
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7, borderRadius: BorderRadius.md },
  skeletonRespCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
});
