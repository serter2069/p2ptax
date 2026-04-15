import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestItem {
  id: string;
  description: string;
  city: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
  client: { id: string; email: string };
  _count: { responses: number };
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Открыт', color: Colors.statusSuccess, bg: Colors.statusBg.success },
  CLOSED: { label: 'Закрыт', color: Colors.textMuted, bg: Colors.statusBg.neutral },
  CANCELLED: { label: 'Отменён', color: Colors.statusError, bg: Colors.statusBg.error },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
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
      {/* Page header skeleton */}
      <View className="gap-1">
        <SkeletonBlock width="40%" height={22} />
        <SkeletonBlock width="55%" height={14} />
      </View>
      {/* Stats skeleton */}
      <View className="flex-row gap-2">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} className="flex-1 items-center gap-[2px] rounded-[14px] border border-[#BAE6FD] bg-white p-2">
            <SkeletonBlock width={40} height={20} />
            <SkeletonBlock width={56} height={12} />
          </View>
        ))}
      </View>
      {/* Filter chips skeleton */}
      <View className="flex-row flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} width={70 + i * 10} height={32} radius={9999} />
        ))}
      </View>
      {/* Row skeletons */}
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} width="100%" height={60} radius={14} />
      ))}
      <View className="items-center pt-3">
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Request Row (matches prototype RequestRow)
// ---------------------------------------------------------------------------

function RequestRow({ item, selected, onSelect }: {
  item: RequestItem; selected?: boolean; onSelect?: () => void;
}) {
  const st = STATUS_MAP[item.status] || STATUS_MAP.OPEN;
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center gap-2 rounded-[14px] border bg-white px-2 py-3 ${
        selected ? 'border-brandPrimary bg-bgSecondary' : 'border-[#BAE6FD]'
      }`}
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}
    >
      <View className="flex-1">
        <Text className="text-[15px] font-medium text-textPrimary" numberOfLines={1}>
          {item.description}
        </Text>
        <View className="mt-1 flex-row items-center gap-1">
          <Feather name="user" size={11} color={Colors.textMuted} />
          <Text className="text-[13px] text-textMuted">{item.client.email}</Text>
          <Text className="text-[11px] text-[#BAE6FD]">{'·'}</Text>
          <Feather name="map-pin" size={11} color={Colors.textMuted} />
          <Text className="text-[13px] text-textMuted">{item.city}</Text>
          <Text className="text-[11px] text-[#BAE6FD]">{'·'}</Text>
          <Feather name="calendar" size={11} color={Colors.textMuted} />
          <Text className="text-[13px] text-textMuted">{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <View className="items-end gap-1">
        <View className="rounded-full px-2 py-[2px]" style={{ backgroundColor: st.bg }}>
          <Text className="text-[11px] font-semibold" style={{ color: st.color }}>{st.label}</Text>
        </View>
        {item._count.responses > 0 && (
          <View className="flex-row items-center gap-[3px]">
            <Feather name="message-circle" size={11} color={Colors.textMuted} />
            <Text className="text-[11px] text-textMuted">{item._count.responses}</Text>
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type FilterKey = 'all' | 'OPEN' | 'CLOSED' | 'CANCELLED';

export default function AdminRequests() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ items: RequestItem[]; total: number }>('/admin/requests');
      setRequests(data.items);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleRefresh = () => { setRefreshing(true); fetchRequests(true); };

  // Counters
  const openCount = requests.filter((r) => r.status === 'OPEN').length;
  const closedCount = requests.filter((r) => r.status === 'CLOSED').length;
  const cancelledCount = requests.filter((r) => r.status === 'CANCELLED').length;

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: `Все (${requests.length})` },
    { key: 'OPEN', label: 'Открытые' },
    { key: 'CLOSED', label: 'Закрытые' },
    { key: 'CANCELLED', label: 'Отменённые' },
  ];

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header title="Все запросы" showBack />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        {loading && !refreshing ? (
          <LoadingState />
        ) : error ? (
          <View className="flex-1 items-center justify-center gap-3 p-4">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-full" style={{ backgroundColor: Colors.statusBg.error }}>
              <Feather name="alert-triangle" size={36} color={Colors.statusError} />
            </View>
            <Text className="text-lg font-semibold text-textPrimary">Ошибка загрузки</Text>
            <Text className="max-w-[280px] text-center text-[15px] text-textMuted">{error}</Text>
            <Pressable
              className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-[12px] bg-brandPrimary px-6"
              onPress={() => fetchRequests()}
            >
              <Feather name="refresh-cw" size={16} color="#FFFFFF" />
              <Text className="text-[13px] font-semibold text-white">Попробовать снова</Text>
            </Pressable>
          </View>
        ) : requests.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-3 p-4">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-[#BAE6FD] bg-bgSurface">
              <Feather name="file-text" size={40} color={Colors.brandPrimary} />
            </View>
            <Text className="text-lg font-semibold text-textPrimary">Нет запросов</Text>
            <Text className="text-center text-[15px] text-textMuted">Заявки пользователей появятся здесь</Text>
          </View>
        ) : (
          <View className="w-full gap-3 p-4">
            {/* Page header */}
            <View className="gap-1">
              <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
              <Text className="text-[13px] text-textMuted">Управление заявками пользователей</Text>
            </View>

            {/* Stats row */}
            <View className="flex-row gap-2">
              <View className="flex-1 items-center gap-[2px] rounded-[14px] border border-[#BAE6FD] bg-white p-2">
                <Text className="text-[16px] font-bold" style={{ color: Colors.brandPrimary }}>{openCount}</Text>
                <Text className="text-[11px] text-textMuted">Открытых</Text>
              </View>
              <View className="flex-1 items-center gap-[2px] rounded-[14px] border border-[#BAE6FD] bg-white p-2">
                <Text className="text-[16px] font-bold" style={{ color: Colors.textMuted }}>{closedCount}</Text>
                <Text className="text-[11px] text-textMuted">Закрытых</Text>
              </View>
              <View className="flex-1 items-center gap-[2px] rounded-[14px] border border-[#BAE6FD] bg-white p-2">
                <Text className="text-[16px] font-bold" style={{ color: Colors.statusError }}>{cancelledCount}</Text>
                <Text className="text-[11px] text-textMuted">Отменённых</Text>
              </View>
              <View className="flex-1 items-center gap-[2px] rounded-[14px] border border-[#BAE6FD] bg-white p-2">
                <Text className="text-[16px] font-bold" style={{ color: Colors.statusSuccess }}>{requests.length}</Text>
                <Text className="text-[11px] text-textMuted">Всего</Text>
              </View>
            </View>

            {/* Filter chips */}
            <View className="flex-row flex-wrap gap-2">
              {filters.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  className={`rounded-full border px-3 py-2 ${
                    filter === f.key
                      ? 'border-brandPrimary bg-brandPrimary'
                      : 'border-[#BAE6FD]'
                  }`}
                >
                  <Text
                    className={`text-[13px] ${
                      filter === f.key ? 'font-semibold text-white' : 'text-textMuted'
                    }`}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* List header */}
            <View className="flex-row justify-between border-b border-[#BAE6FD] px-2 pb-1">
              <Text className="text-[11px] uppercase tracking-wide text-textMuted">Заявка</Text>
              <Text className="text-[11px] uppercase tracking-wide text-textMuted">Статус</Text>
            </View>

            {/* Request rows */}
            <View className="gap-2">
              {filtered.map((r) => (
                <RequestRow
                  key={r.id}
                  item={r}
                  selected={selectedId === r.id}
                  onSelect={() => setSelectedId(selectedId === r.id ? null : r.id)}
                />
              ))}
            </View>

            {/* Pagination */}
            <View className="flex-row items-center justify-between pt-2">
              <Text className="text-[13px] text-textMuted">
                1-{filtered.length} из {requests.length}
              </Text>
              <View className="flex-row gap-1">
                <View className="h-8 w-8 items-center justify-center rounded-[6px] border border-[#BAE6FD] opacity-40">
                  <Feather name="chevron-left" size={16} color={Colors.textMuted} />
                </View>
                <View className="h-8 w-8 items-center justify-center rounded-[6px] bg-brandPrimary">
                  <Text className="text-[13px] font-semibold text-white">1</Text>
                </View>
                <View className="h-8 w-8 items-center justify-center rounded-[6px] border border-[#BAE6FD]">
                  <Feather name="chevron-right" size={16} color={Colors.textPrimary} />
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
