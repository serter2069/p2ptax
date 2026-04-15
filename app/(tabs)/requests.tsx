import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { requests as requestsApi } from '../../lib/api/endpoints';

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
    <Pressable
      onPress={onPress}
      className="gap-2 rounded-xl border border-borderLight bg-white p-4"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}
    >
      {/* Header: title + badge */}
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>
          {item.title}
        </Text>
        <View className="rounded-full px-2 py-[2px]" style={{ backgroundColor: st.bg }}>
          <Text className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</Text>
        </View>
      </View>

      {/* Meta: service, fns, city */}
      <View className="flex-row flex-wrap items-center gap-1">
        <Feather name="briefcase" size={12} color={Colors.textMuted} />
        <Text className="text-xs text-textMuted">{item.serviceType}</Text>
        {item.fnsName ? (
          <>
            <Text className="text-xs text-border">{'·'}</Text>
            <Feather name="home" size={12} color={Colors.textMuted} />
            <Text className="text-xs text-textMuted" numberOfLines={1}>{item.fnsName}</Text>
          </>
        ) : null}
        {item.city ? (
          <>
            <Text className="text-xs text-border">{'·'}</Text>
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text className="text-xs text-textMuted">{item.city}</Text>
          </>
        ) : null}
      </View>

      {/* Footer: date, messages, chevron */}
      <View className="flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center gap-1">
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{dateStr}</Text>
        </View>
        {item.messageCount > 0 && (
          <View className="flex-row items-center gap-1">
            <Feather name="message-circle" size={12} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary">{item.messageCount} сообщ.</Text>
          </View>
        )}
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Skeleton (Loading State)
// ---------------------------------------------------------------------------

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View
      className="bg-bgSurface opacity-70"
      style={{ width: width as any, height, borderRadius: radius || 6 }}
    />
  );
}

function LoadingState() {
  return (
    <View className="gap-3 p-4">
      {/* Top bar skeleton */}
      <View className="flex-row items-center justify-between">
        <SkeletonBlock width="40%" height={22} />
        <SkeletonBlock width={80} height={36} radius={12} />
      </View>
      {/* Tab skeleton */}
      <View className="flex-row gap-1">
        <View className="h-10 flex-1 items-center justify-center rounded-xl bg-bgSurface">
          <SkeletonBlock width="70%" height={14} />
        </View>
        <View className="h-10 flex-1 items-center justify-center rounded-xl bg-bgSurface">
          <SkeletonBlock width="70%" height={14} />
        </View>
        <View className="h-10 flex-1 items-center justify-center rounded-xl bg-bgSurface">
          <SkeletonBlock width="50%" height={14} />
        </View>
      </View>
      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <View key={i} className="rounded-xl border border-borderLight bg-white p-4">
          <View className="flex-row justify-between">
            <SkeletonBlock width="65%" height={16} />
            <SkeletonBlock width={60} height={22} radius={9999} />
          </View>
          <View className="mt-2 flex-row gap-2">
            <SkeletonBlock width={100} height={12} />
            <SkeletonBlock width={80} height={12} />
          </View>
          <View className="mt-2 flex-row gap-2">
            <SkeletonBlock width={80} height={12} />
          </View>
        </View>
      ))}
      <View className="items-center pt-2">
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
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
    <View className="flex-1 items-center justify-center gap-3 p-4">
      <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-borderLight bg-bgSurface">
        <Feather name="file-text" size={40} color={Colors.brandPrimary} />
      </View>
      <Text className="text-lg font-semibold text-textPrimary">{t.title}</Text>
      <Text className="max-w-[280px] text-center text-base text-textMuted">{t.subtitle}</Text>
      {tab !== 'completed' && (
        <Pressable
          className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary px-6"
          onPress={onCreatePress}
        >
          <Feather name="plus" size={16} color={Colors.white} />
          <Text className="text-xs font-semibold text-white">Создать заявку</Text>
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
    <View className="flex-1 items-center justify-center gap-3 p-4">
      <View className="h-[72px] w-[72px] items-center justify-center rounded-full" style={{ backgroundColor: Colors.statusBg.error }}>
        <Feather name="alert-triangle" size={36} color={Colors.statusError} />
      </View>
      <Text className="text-lg font-semibold text-textPrimary">Ошибка загрузки</Text>
      <Text className="max-w-[280px] text-center text-base text-textMuted">Не удалось загрузить список заявок</Text>
      <Pressable
        className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary px-6"
        onPress={onRetry}
      >
        <Feather name="refresh-cw" size={16} color={Colors.white} />
        <Text className="text-xs font-semibold text-white">Попробовать снова</Text>
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
    <SafeAreaView className="flex-1 bg-white">
      {/* Header — proto: title + add button only */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-8">
        <Text className="text-xl font-bold text-textPrimary">Мои заявки</Text>
        <Pressable
          className="flex-row items-center gap-1 rounded-xl bg-brandPrimary px-3 py-2"
          onPress={goToCreate}
        >
          <Feather name="plus" size={16} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Новая</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-1 px-4 pb-3">
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className={`h-10 flex-1 items-center justify-center rounded-xl border ${
              tab === t.key
                ? 'border-brandPrimary bg-brandPrimary'
                : 'border-border bg-white'
            }`}
          >
            <Text
              className={`text-xs ${
                tab === t.key ? 'font-semibold text-white' : 'font-medium text-textMuted'
              }`}
            >
              {t.label}{!loading ? ` (${t.count})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <LoadingState />
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, gap: 12 }}
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
        <Pressable
          className="absolute bottom-4 right-4 h-14 w-14 items-center justify-center rounded-full bg-brandPrimary"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 }}
          onPress={goToCreate}
        >
          <Feather name="plus" size={24} color={Colors.white} />
        </Pressable>
      )}
    </SafeAreaView>
  );
}
