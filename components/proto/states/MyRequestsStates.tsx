import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_REQUESTS } from '../../../constants/protoMockData';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary, bg: Colors.statusBg.info },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess, bg: Colors.statusBg.success },
  IN_PROGRESS: { label: 'В работе', color: Colors.statusWarning, bg: Colors.statusBg.warning },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted, bg: Colors.statusBg.neutral },
  CANCELLED: { label: 'Отменена', color: Colors.statusError, bg: Colors.statusBg.error },
};

function RequestCard({ title, service, city, status, date, responses }: {
  title: string; service: string; city: string; status: string; date: string; responses: number;
}) {
  const st = STATUS_MAP[status] || STATUS_MAP.NEW;
  return (
    <Pressable style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
        <View style={[s.badge, { backgroundColor: st.bg }]}>
          <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      <View style={s.meta}>
        <Feather name="briefcase" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{service}</Text>
        <Text style={s.metaDot}>{'·'}</Text>
        <Feather name="map-pin" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{city}</Text>
      </View>
      <View style={s.cardFooter}>
        <View style={s.dateRow}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text style={s.date}>{date}</Text>
        </View>
        {responses > 0 && (
          <View style={s.responsesBadge}>
            <Feather name="message-circle" size={12} color={Colors.statusSuccess} />
            <Text style={s.responses}>{responses} откликов</Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (interactive tabs)
// ---------------------------------------------------------------------------

function DefaultRequests() {
  const [tab, setTab] = useState<'active' | 'completed' | 'all'>('active');
  const activeRequests = MOCK_REQUESTS.filter((r) => ['NEW', 'ACTIVE', 'IN_PROGRESS'].includes(r.status));
  const completedRequests = MOCK_REQUESTS.filter((r) => ['COMPLETED', 'CANCELLED'].includes(r.status));
  const allRequests = MOCK_REQUESTS;
  const visibleRequests = tab === 'active' ? activeRequests : tab === 'completed' ? completedRequests : allRequests;

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Мои заявки</Text>
        <Pressable style={s.addBtn}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={s.addBtnText}>Новая</Text>
        </Pressable>
      </View>
      <View style={s.tabs}>
        {[
          { key: 'active' as const, label: `Активные (${activeRequests.length})` },
          { key: 'completed' as const, label: `Завершённые (${completedRequests.length})` },
          { key: 'all' as const, label: `Все (${allRequests.length})` },
        ].map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={[s.tab, tab === t.key && s.tabActive]}>
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {visibleRequests.map((r) => (
        <RequestCard
          key={r.id} title={r.title} service={r.service}
          city={r.city} status={r.status} date={r.createdAt} responses={r.responseCount}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING (skeleton)
// ---------------------------------------------------------------------------

function LoadingRequests() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <SkeletonBlock width="40%" height={22} />
        <SkeletonBlock width={80} height={36} radius={BorderRadius.btn} />
      </View>
      <View style={s.tabs}>
        <View style={[s.tab, { backgroundColor: Colors.bgSurface }]}>
          <SkeletonBlock width="70%" height={14} />
        </View>
        <View style={[s.tab, { backgroundColor: Colors.bgSurface }]}>
          <SkeletonBlock width="70%" height={14} />
        </View>
        <View style={[s.tab, { backgroundColor: Colors.bgSurface }]}>
          <SkeletonBlock width="50%" height={14} />
        </View>
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={s.skeletonCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <SkeletonBlock width="65%" height={16} />
            <SkeletonBlock width={60} height={22} radius={BorderRadius.full} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <SkeletonBlock width={100} height={12} />
            <SkeletonBlock width={80} height={12} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <SkeletonBlock width={80} height={12} />
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

function EmptyRequests() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Мои заявки</Text>
        <Pressable style={s.addBtn}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={s.addBtnText}>Новая</Text>
        </Pressable>
      </View>
      <View style={s.tabs}>
        <View style={[s.tab, s.tabActive]}>
          <Text style={[s.tabText, s.tabTextActive]}>Активные (0)</Text>
        </View>
        <View style={s.tab}>
          <Text style={s.tabText}>Завершённые (0)</Text>
        </View>
        <View style={s.tab}>
          <Text style={s.tabText}>Все (0)</Text>
        </View>
      </View>
      <View style={s.emptyWrap}>
        <View style={s.emptyIconWrap}>
          <Feather name="file-text" size={40} color={Colors.brandPrimary} />
        </View>
        <Text style={s.emptyTitle}>Нет заявок</Text>
        <Text style={s.emptyText}>Создайте первую заявку, чтобы найти специалиста</Text>
        <Pressable style={s.emptyCta}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={s.emptyCtaText}>Создать заявку</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE: ERROR
// ---------------------------------------------------------------------------

function ErrorRequests() {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Мои заявки</Text>
      </View>
      <View style={s.emptyWrap}>
        <View style={s.errorIconWrap}>
          <Feather name="alert-triangle" size={36} color={Colors.statusError} />
        </View>
        <Text style={s.emptyTitle}>Ошибка загрузки</Text>
        <Text style={s.emptyText}>Не удалось загрузить список заявок</Text>
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

export function MyRequestsStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultRequests />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingRequests />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyRequests />
      </StateSection>
      <StateSection title="ERROR">
        <ErrorRequests />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.brandPrimary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
  },
  addBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  tabs: { flexDirection: 'row', gap: Spacing.xs },
  tab: {
    flex: 1, height: 40, borderRadius: BorderRadius.btn, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  tabActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  tabTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  cardTitle: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaItem: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  metaDot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  date: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  responsesBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  responses: { fontSize: Typography.fontSize.sm, color: Colors.statusSuccess, fontWeight: Typography.fontWeight.medium },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.base, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
  },
  emptyCtaText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },

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
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7 },
  skeletonCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
});
