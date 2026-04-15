import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../stores/authStore';
import { api, ApiError } from '../../lib/api';
import { threads } from '../../lib/api/endpoints';
import { Colors } from '../../constants/Colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RequestItem {
  id: string;
  description: string;
  title?: string;
  city: string;
  category: string | null;
  service?: string;
  fnsName?: string;
  status: string;
  createdAt: string;
  client: { id: string; username?: string; firstName?: string };
  _count: { responses: number };
}

interface FeedResponse {
  items: RequestItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface SpecialistProfile {
  cities: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getAuthorName(client: RequestItem['client']): string {
  if (client.firstName) return client.firstName;
  if (client.username) return client.username;
  return 'Клиент';
}

function getRequestTitle(r: RequestItem): string {
  if (r.title) return r.title;
  if (r.description) return r.description.slice(0, 80);
  return 'Заявка';
}

// ---------------------------------------------------------------------------
// Request Card (matches prototype)
// ---------------------------------------------------------------------------
function RequestCard({
  r,
  onMessage,
  onDetails,
}: {
  r: RequestItem;
  onMessage: () => void;
  onDetails: () => void;
}) {
  return (
    <View className="gap-2 rounded-xl border border-borderLight bg-white p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>
          {getRequestTitle(r)}
        </Text>
        <Text className="text-xs text-textMuted">{formatDate(r.createdAt)}</Text>
      </View>

      <Text className="text-sm leading-5 text-textSecondary" numberOfLines={2}>
        {r.description}
      </Text>

      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <View className="flex-row items-center gap-1">
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{r.city}</Text>
        </View>
        {r.fnsName && (
          <View className="flex-row items-center gap-1">
            <Feather name="home" size={12} color={Colors.textMuted} />
            <Text className="text-xs text-textMuted">{r.fnsName}</Text>
          </View>
        )}
        {(r.service || r.category) && (
          <View className="flex-row items-center gap-1">
            <Feather name="briefcase" size={12} color={Colors.textMuted} />
            <Text className="text-xs text-textMuted">{r.service || r.category}</Text>
          </View>
        )}
        <View className="flex-row items-center gap-1">
          <Feather name="user" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{getAuthorName(r.client)}</Text>
        </View>
      </View>

      <View className="mt-1 flex-row gap-2">
        <Pressable
          className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary"
          onPress={onMessage}
        >
          <Feather name="send" size={14} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Написать по заявке</Text>
        </Pressable>
        <Pressable
          className="h-10 flex-row items-center justify-center gap-1.5 rounded-lg border border-borderLight px-4"
          onPress={onDetails}
        >
          <Feather name="eye" size={14} color={Colors.textPrimary} />
          <Text className="text-sm font-medium text-textPrimary">Подробнее</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ onSettings }: { onSettings: () => void }) {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
      <View className="items-center gap-3 py-10">
        <View className="h-16 w-16 items-center justify-center rounded-full border border-borderLight bg-bgSecondary">
          <Feather name="inbox" size={32} color={Colors.brandPrimary} />
        </View>
        <Text className="text-lg font-semibold text-textPrimary">Новых заявок пока нет</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">
          Настройте город и ФНС в настройках, чтобы видеть больше заявок
        </Text>
        <Pressable
          className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-lg border border-brandPrimary px-6"
          onPress={onSettings}
        >
          <Feather name="settings" size={16} color={Colors.brandPrimary} />
          <Text className="text-sm font-semibold text-brandPrimary">Настройки</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function LoadingSkeleton() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="gap-1">
        <View className="h-6 w-24 rounded-md bg-bgSurface" />
        <View className="h-4 w-40 rounded-md bg-bgSurface" />
      </View>
      <View className="h-11 w-full rounded-xl bg-bgSurface" />
      {[1, 2, 3].map((i) => (
        <View key={i} className="gap-2 rounded-xl border border-borderLight p-4">
          <View className="h-4 w-4/5 rounded bg-bgSurface" />
          <View className="h-3 w-full rounded bg-bgSurface" />
          <View className="h-3 w-3/5 rounded bg-bgSurface" />
          <View className="h-10 w-full rounded-lg bg-bgSurface" />
        </View>
      ))}
      <View className="items-center pt-2">
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function SpecialistDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [requestsList, setRequestsList] = useState<RequestItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      // Check specialist profile and get cities
      let cities: string[] = [];
      try {
        const profile = await api.get<SpecialistProfile>('/specialists/me');
        cities = profile.cities || [];
        setHasProfile(true);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setHasProfile(false);
        } else {
          setHasProfile(false);
        }
      }

      if (cities.length === 0) {
        setRequestsList([]);
        setTotalCount(0);
        return;
      }

      // Fetch open requests for specialist's cities
      const results = await Promise.all(
        cities.map((city) =>
          api
            .get<FeedResponse>(`/requests?city=${encodeURIComponent(city)}&page=1`)
            .catch(() => ({ items: [], total: 0, page: 1, pageSize: 20 }) as FeedResponse),
        ),
      );

      // Merge and deduplicate
      const seen = new Set<string>();
      const allItems: RequestItem[] = [];
      let total = 0;
      for (const res of results) {
        total += res.total;
        for (const item of res.items) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            allItems.push(item);
          }
        }
      }

      // Sort by newest first
      allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRequestsList(allItems);
      setTotalCount(total);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось загрузить данные';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleRefresh() {
    setRefreshing(true);
    fetchData(true);
  }

  async function handleStartThread(request: RequestItem) {
    try {
      const res = await threads.startThread(request.client.id, request.id);
      const threadId = (res.data as { id: string }).id;
      router.push(`/chat/${threadId}`);
    } catch {
      // If thread already exists, navigate to messages
      router.push('/(dashboard)/messages');
    }
  }

  // Filter by search
  const filtered = search
    ? requestsList.filter(
        (r) =>
          getRequestTitle(r).toLowerCase().includes(search.toLowerCase()) ||
          (r.service || r.category || '').toLowerCase().includes(search.toLowerCase()) ||
          r.city.toLowerCase().includes(search.toLowerCase()),
      )
    : requestsList;

  // Loading
  if (loading) return <LoadingSkeleton />;

  // Empty — no profile or no requests
  if (hasProfile === false || (requestsList.length === 0 && !error)) {
    return <EmptyState onSettings={() => router.push('/(dashboard)/profile')} />;
  }

  // Error
  if (error && requestsList.length === 0) {
    return (
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 16, gap: 16, flex: 1, justifyContent: 'center', alignItems: 'center' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <Feather name="wifi-off" size={48} color={Colors.textMuted} />
        <Text className="text-lg font-semibold text-textPrimary">Ошибка загрузки</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">{error}</Text>
        <Pressable
          className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6"
          onPress={() => fetchData()}
        >
          <Text className="text-sm font-semibold text-white">Повторить</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Populated — requests feed with search
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
      }
    >
      {/* Header */}
      <View>
        <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
        <Text className="text-sm text-textMuted">{totalCount} заявок в вашем регионе</Text>
      </View>

      {/* Search */}
      <View className="flex-row items-center gap-2 rounded-xl border border-borderLight bg-white px-3">
        <Feather name="search" size={18} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по заявкам..."
          placeholderTextColor={Colors.textMuted}
          className="h-11 flex-1 text-base text-textPrimary"
          style={{ outlineStyle: 'none' } as any}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Results */}
      {filtered.length > 0 ? (
        <View className="gap-3">
          {filtered.map((r) => (
            <RequestCard
              key={r.id}
              r={r}
              onMessage={() => handleStartThread(r)}
              onDetails={() => router.push(`/request/${r.id}`)}
            />
          ))}
        </View>
      ) : (
        <View className="items-center gap-2 py-8">
          <Feather name="search" size={32} color={Colors.textMuted} />
          <Text className="text-sm text-textMuted">Ничего не найдено</Text>
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
