import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

// ---------------------------------------------------------------------------
// DEFAULT state -- full detail
// ---------------------------------------------------------------------------
function DefaultState() {
  return (
    <View style={s.container}>
      {/* Breadcrumb */}
      <View style={s.breadcrumb}>
        <Text style={s.breadcrumbLink}>Заявки</Text>
        <Feather name="chevron-right" size={14} color={Colors.textMuted} />
        <Text style={s.breadcrumbCurrent}>Детали заявки</Text>
      </View>

      {/* Main card */}
      <View style={s.detailCard}>
        <View style={s.cardHeaderRow}>
          <View style={[s.statusBadge, { backgroundColor: Colors.statusBg.success }]}>
            <View style={s.statusDot} />
            <Text style={[s.statusText, { color: Colors.statusSuccess }]}>Активна</Text>
          </View>
          <Text style={s.dateText}>08.04.2026</Text>
        </View>

        <Text style={s.title}>Заполнить декларацию 3-НДФЛ за 2025 год</Text>

        <Text style={s.desc}>
          Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета за покупку квартиры. Документы готовы, нужен специалист, который знает процедуру и поможет всё оформить корректно.
        </Text>

        <View style={s.tags}>
          <View style={s.tag}>
            <Feather name="map-pin" size={12} color={Colors.brandPrimary} />
            <Text style={s.tagText}>Москва</Text>
          </View>
          <View style={s.tag}>
            <Feather name="briefcase" size={12} color={Colors.brandPrimary} />
            <Text style={s.tagText}>Декларация 3-НДФЛ</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.metaGrid}>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Бюджет</Text>
            <Text style={s.metaValue}>3 000 -- 5 000 RUB</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Клиент</Text>
            <Text style={s.metaValue}>Елена В.</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Откликов</Text>
            <Text style={s.metaValue}>3</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <Pressable style={s.respondBtn}>
        <Feather name="send" size={16} color={Colors.white} />
        <Text style={s.respondBtnText}>Откликнуться</Text>
      </Pressable>

      <View style={s.hintRow}>
        <Feather name="info" size={14} color={Colors.textMuted} />
        <Text style={s.hintText}>Для отклика необходимо войти как специалист</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// LOADING state
// ---------------------------------------------------------------------------
function LoadingState() {
  return (
    <View style={s.container}>
      <View style={s.detailCard}>
        <View style={[s.skelLine, { width: 80, height: 20 }]} />
        <View style={[s.skelLine, { width: '90%', height: 20, marginTop: Spacing.md }]} />
        <View style={[s.skelLine, { width: '100%', marginTop: Spacing.sm }]} />
        <View style={[s.skelLine, { width: '80%' }]} />
        <View style={[s.skelLine, { width: '60%' }]} />
        <View style={s.divider} />
        <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
          <View style={[s.skelLine, { width: 100, height: 14 }]} />
          <View style={[s.skelLine, { width: 80, height: 14 }]} />
        </View>
      </View>
      <View style={[s.skelLine, { width: '100%', height: 48, borderRadius: BorderRadius.btn }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------------------------
export function PublicRequestDetailStates() {
  return (
    <View style={{ gap: Spacing['4xl'] }}>
      <StateSection title="DEFAULT" pageId="public-request-detail">
        <DefaultState />
      </StateSection>

      <StateSection title="LOADING" pageId="public-request-detail">
        <LoadingState />
      </StateSection>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: { padding: Spacing.xl, gap: Spacing.lg },

  // Breadcrumb
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  breadcrumbLink: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  breadcrumbCurrent: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  // Detail card
  detailCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.statusSuccess },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  dateText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, lineHeight: 28 },
  desc: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },

  tags: { flexDirection: 'row', gap: Spacing.sm },
  tag: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: { fontSize: Typography.fontSize.xs, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },

  divider: { height: 1, backgroundColor: Colors.borderLight },

  metaGrid: { flexDirection: 'row', gap: Spacing.xl, flexWrap: 'wrap' },
  metaItem: { gap: 2 },
  metaLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },

  // CTA
  respondBtn: {
    height: 48,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  respondBtnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

  // Hint
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  hintText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  // Skeleton
  skelLine: { height: 12, borderRadius: 4, backgroundColor: Colors.bgSecondary },
});
