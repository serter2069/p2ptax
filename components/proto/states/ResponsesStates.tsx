import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
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

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

function ResponseItem({ name, price, message, rating, reviews, onAccept, onDecline }: {
  name: string; price: string; message: string; rating: number; reviews: number;
  onAccept: () => void; onDecline: () => void;
}) {
  const initials = name.split(' ').map(n => n[0]).join('');
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
        <View style={s.info}>
          <Text style={s.name}>{name}</Text>
          <View style={s.ratingRow}>
            <Stars rating={rating} />
            <Text style={s.ratingLabel}>{rating} ({reviews} отзывов)</Text>
          </View>
        </View>
        <Text style={s.price}>{price}</Text>
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

// ---------------------------------------------------------------------------
// STATE: DEFAULT (with responses + price comparison)
// ---------------------------------------------------------------------------

function DefaultResponses() {
  const sorted = [...MOCK_RESPONSES].sort((a, b) => {
    const priceA = parseInt(a.price.replace(/\D/g, ''));
    const priceB = parseInt(b.price.replace(/\D/g, ''));
    return priceA - priceB;
  });
  const cheapest = sorted[0];

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Отклики</Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>{MOCK_RESPONSES.length}</Text>
        </View>
      </View>

      {/* Price comparison bar */}
      <View style={s.priceBar}>
        <Feather name="trending-down" size={14} color={Colors.statusSuccess} />
        <Text style={s.priceBarText}>
          Лучшая цена: <Text style={s.priceBarValue}>{cheapest.price}</Text> от {cheapest.specialistName}
        </Text>
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

// ---------------------------------------------------------------------------
// STATE: LOADING (skeleton)
// ---------------------------------------------------------------------------

function LoadingResponses() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <SkeletonBlock width="30%" height={22} />
        <SkeletonBlock width={28} height={28} radius={14} />
      </View>
      <SkeletonBlock width="100%" height={36} radius={BorderRadius.md} />
      {[1, 2, 3].map(i => (
        <View key={i} style={s.skeletonCard}>
          <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
            <SkeletonBlock width={44} height={44} radius={22} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBlock width="55%" height={14} />
              <SkeletonBlock width="40%" height={12} />
            </View>
            <SkeletonBlock width={64} height={18} />
          </View>
          <SkeletonBlock width="85%" height={14} />
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
// STATE: EMPTY
// ---------------------------------------------------------------------------

function EmptyResponses() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Отклики</Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>0</Text>
        </View>
      </View>
      <View style={s.emptyBlock}>
        <View style={s.emptyIconWrap}>
          <Feather name="inbox" size={36} color={Colors.brandPrimary} />
        </View>
        <Text style={s.emptyTitle}>Пока нет откликов</Text>
        <Text style={s.emptyText}>Специалисты рассматривают вашу заявку. Первые отклики обычно приходят в течение часа.</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR
// ---------------------------------------------------------------------------

function ErrorResponses() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Отклики</Text>
      </View>
      <View style={s.emptyBlock}>
        <View style={s.errorIconWrap}>
          <Feather name="alert-triangle" size={36} color={Colors.statusError} />
        </View>
        <Text style={s.emptyTitle}>Ошибка загрузки</Text>
        <Text style={s.emptyText}>Не удалось загрузить отклики</Text>
        <Pressable style={s.retryBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text style={s.retryBtnText}>Попробовать снова</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ResponsesStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultResponses />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingResponses />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyResponses />
      </StateSection>
      <StateSection title="ERROR">
        <ErrorResponses />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  countBadge: {
    backgroundColor: Colors.brandPrimary, minWidth: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  countText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.white },

  // Price comparison
  priceBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.statusBg.success, padding: Spacing.md, borderRadius: BorderRadius.card,
  },
  priceBarText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  priceBarValue: { fontWeight: Typography.fontWeight.bold, color: Colors.statusSuccess },

  // Card
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  avatarText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  info: { flex: 1 },
  name: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  ratingLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
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

  // Empty
  emptyBlock: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 300 },

  // Error
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
  skeletonCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
});
