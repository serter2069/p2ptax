import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';
import { requests as requestsApi } from '../../lib/api/endpoints';
import { NotificationBell } from '../../components/NotificationBell';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestItem {
  id: string;
  title: string;
  serviceType: string;
  city: string;
  fnsName: string;
  status: string;
  createdAt: string;
  messageCount: number;
}

type TabKey = 'active' | 'completed' | 'all';

const ACTIVE_STATUSES = ['NEW', 'ACTIVE', 'IN_PROGRESS'];
const COMPLETED_STATUSES = ['COMPLETED', 'CANCELLED'];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary, bg: Colors.statusBg.info },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess, bg: Colors.statusBg.success },
  IN_PROGRESS: { label: 'В работе', color: Colors.statusWarning, bg: Colors.statusBg.warning },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted, bg: Colors.statusBg.neutral },
  CANCELLED: { label: 'Отменена', color: Colors.statusError, bg: Colors.statusBg.error },
};

// ---------------------------------------------------------------------------
// Request Card
// ---------------------------------------------------------------------------

function RequestCard({ item, onPress }: { item: RequestItem; onPress: () => void }) {
  const st = STATUS_MAP[item.status] || STATUS_MAP.NEW;
  const dateStr = new Date(item.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={[s.badge, { backgroundColor: st.bg }]}>
          <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      <View style={s.meta}>
        <Feather name="briefcase" size={12} color={Colors.textMuted} />
        <Text style={s.metaItem}>{item.serviceType}</Text>
        {item.fnsName ? (
          <>
            <Text style={s.metaDot}>{'·'}</Text>
            <Feather name="home" size={12} color={Colors.textMuted} />
            <Text style={s.metaItem} numberOfLines={1}>{item.fnsName}</Text>
          </>
        ) : null}
        {item.city ? (
          <>
            <Text style={s.metaDot}>{'·'}</Text>
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text style={s.metaItem}>{item.city}</Text>
          </>
        ) : null}
      </View>
      <View style={s.cardFooter}>
        <View style={s.dateRow}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text style={s.date}>{dateStr}</Text>
        </View>
        {item.messageCount > 0 && (
          <View style={s.responsesBadge}>
            <Feather name="message-circle" size={12} color={Colors.brandPrimary} />
            <Text style={s.responses}>{item.messageCount} сообщ.</Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ tab, onCreatePress }: { tab: TabKey; onCreatePress: () => void }) {
  const texts: Record<TabKey, { title: string; subtitle: string }> = {
    active: {
      title: 'Нет активных заявок',
      subtitle: 'Создайте заявку, чтобы найти специалиста',
    },
    completed: {
      title: 'Нет завершённых заявок',
      subtitle: 'Здесь появятся завершённые и отменённые заявки',
    },
    all: {
      title: 'Нет заявок',
      subtitle: 'Создайте первую заявку, чтобы найти специалиста',
    },
  };
  const t = texts[tab];

  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyIconWrap}>
        <Feather name="file-text" size={40} color={Colors.brandPrimary} />
      </View>
      <Text style={s.emptyTitle}>{t.title}</Text>
      <Text style={s.emptyText}>{t.subtitle}</Text>
      {tab !== 'completed' && (
        <Pressable style={s.emptyCta} onPress={onCreatePress}>
          <Feather name="plus" size={16} color={Colors.white} />
          <Text style={s.emptyCtaText}>Создать заявку</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Error State
// ---------------------------------------------------------------------------

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={s.emptyWrap}>
      <View style={s.errorIconWrap}>
        <Feather name="alert-triangle" size={36} color={Colors.statusError} />
      </View>
      <Text style={s.emptyTitle}>Ошибка загрузки</Text>
      <Text style={s.emptyText}>Не удалось загрузить список заявок</Text>
      <Pressable style={s.retryBtn} onPress={onRetry}>
        <Feather name="refresh-cw" size={16} color={Colors.white} />
        <Text style={s.retryBtnText}>Попробовать снова</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RequestsTab() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('active');
  const [allRequests, setAllRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchRequests = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(false);

      const res = await requestsApi.getMyRequests();
      const data: RequestItem[] = (res.data as RequestItem[] | { data: RequestItem[] }) instanceof Array
        ? (res.data as RequestItem[])
        : ((res.data as { data: RequestItem[] }).data ?? []);
      setAllRequests(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests]),
  );

  const activeRequests = allRequests.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const completedRequests = allRequests.filter((r) => COMPLETED_STATUSES.includes(r.status));

  const visibleRequests =
    tab === 'active' ? activeRequests : tab === 'completed' ? completedRequests : allRequests;

  const goToCreate = () => {
    router.push('/request/new' as never);
  };

  const goToDetail = (id: string) => {
    router.push(`/request/${id}` as never);
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'active', label: 'Активные', count: activeRequests.length },
    { key: 'completed', label: 'Завершённые', count: completedRequests.length },
    { key: 'all', label: 'Все', count: allRequests.length },
  ];

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.topBar}>
        <Text style={s.pageTitle}>Мои заявки</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <NotificationBell />
          <Pressable style={s.addBtn} onPress={goToCreate}>
            <Feather name="plus" size={16} color={Colors.white} />
            <Text style={s.addBtnText}>Новая</Text>
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[s.tab, tab === t.key && s.tabActive]}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
              {t.label}{!loading ? ` (${t.count})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      ) : error ? (
        <ErrorState onRetry={() => fetchRequests()} />
      ) : visibleRequests.length === 0 ? (
        <EmptyState tab={tab} onCreatePress={goToCreate} />
      ) : (
        <FlatList
          data={visibleRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard item={item} onPress={() => goToDetail(item.id)} />
          )}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRequests(true)}
              tintColor={Colors.brandPrimary}
            />
          }
        />
      )}

      {/* FAB */}
      {!loading && !error && visibleRequests.length > 0 && (
        <Pressable style={s.fab} onPress={goToCreate}>
          <Feather name="plus" size={24} color={Colors.white} />
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.md,
  },
  pageTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  addBtn: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  tabActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary },
  tabText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  tabTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },

  // List
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 80 },

  // Card
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  metaItem: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  metaDot: { fontSize: Typography.fontSize.xs, color: Colors.border },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  date: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  responsesBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  responses: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 44,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'],
    marginTop: Spacing.sm,
  },
  emptyCtaText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },

  // Error
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.statusBg.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 44,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'],
    marginTop: Spacing.sm,
  },
  retryBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
