import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Colors } from '../../constants/Colors';
import { MOCK_CITIES, MOCK_FNS } from '../../constants/protoMockData';
import { Header } from '../../components/Header';
import { LandingHeader } from '../../components/LandingHeader';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/Button';
import { useBreakpoints } from '../../hooks/useBreakpoints';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestItem {
  id: string;
  title?: string;
  description: string;
  city: string;
  ifnsName?: string | null;
  serviceType?: string | null;
  status: string;
  createdAt: string;
  client: { id: string };
  _count: { responses: number };
}

interface FeedResponse {
  items: RequestItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pluralSpecialists(n: number): string {
  if (n === 0) return '0 специалистов написали';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} специалист написал`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} специалиста написали`;
  return `${n} специалистов написали`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'только что';
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Cascading City -> FNS picker
// ---------------------------------------------------------------------------

function CityFnsPicker({
  city, selectedFns, onCityChange, onFnsToggle, onRemoveFns,
}: {
  city: string; selectedFns: string[];
  onCityChange: (v: string) => void; onFnsToggle: (v: string) => void; onRemoveFns: (v: string) => void;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | null>(null);
  const fnsOptions = city ? (MOCK_FNS[city] || []) : [];

  const summary = city
    ? selectedFns.length > 0
      ? `${city} / ${selectedFns.length} ФНС`
      : city
    : '';

  return (
    <View className="gap-2">
      {/* Main picker button */}
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View className={`h-11 flex-row items-center gap-2 rounded-lg border px-3 ${openLevel ? 'border-brandPrimary' : 'border-borderLight'} bg-white`}>
          <Feather name="map-pin" size={16} color={Colors.textMuted} />
          <Text className={`flex-1 text-sm ${summary ? 'text-textPrimary' : 'text-textMuted'}`}>
            {summary || 'Город и ФНС'}
          </Text>
          <Feather name={openLevel ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
        </View>
      </Pressable>

      {/* Cascading panel */}
      {openLevel && (
        <View className="overflow-hidden rounded-lg border border-borderLight bg-white shadow-sm">
          {/* Tabs: City / FNS */}
          <View className="flex-row border-b border-bgSecondary">
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'city' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => setOpenLevel('city')}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'city' ? 'text-brandPrimary' : city ? 'text-textPrimary' : 'text-textMuted'}`}>
                {city || 'Город'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'fns' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => city && setOpenLevel('fns')}
              disabled={!city}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'fns' ? 'text-brandPrimary' : selectedFns.length > 0 ? 'text-textPrimary' : 'text-textMuted'}`}>
                {selectedFns.length > 0 ? `ФНС (${selectedFns.length})` : 'ФНС'}
              </Text>
            </Pressable>
          </View>

          {/* Options */}
          <View style={{ maxHeight: 200 }}>
            {openLevel === 'city' && (
              <>
                <Pressable
                  className="border-b border-bgSecondary px-3 py-2.5"
                  onPress={() => { onCityChange(''); setOpenLevel(null); }}
                >
                  <Text className="text-sm text-textMuted">Все города</Text>
                </Pressable>
                {MOCK_CITIES.map((c) => (
                  <Pressable
                    key={c}
                    className="border-b border-bgSecondary px-3 py-2.5"
                    onPress={() => { onCityChange(c); setOpenLevel('fns'); }}
                  >
                    <Text className={`text-sm ${city === c ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{c}</Text>
                  </Pressable>
                ))}
              </>
            )}
            {openLevel === 'fns' && fnsOptions.map((f) => {
              const isSelected = selectedFns.includes(f);
              return (
                <Pressable
                  key={f}
                  className="flex-row items-center gap-2 border-b border-bgSecondary px-3 py-2.5"
                  onPress={() => onFnsToggle(f)}
                >
                  <View className={isSelected
                    ? 'h-5 w-5 items-center justify-center rounded border border-brandPrimary bg-brandPrimary'
                    : 'h-5 w-5 rounded border border-borderLight bg-white'
                  }>
                    {isSelected && <Feather name="check" size={12} color="#fff" />}
                  </View>
                  <Text className={`text-sm ${isSelected ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{f}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Selected FNS chips */}
      {selectedFns.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {selectedFns.map((fns) => (
            <Pressable key={fns} onPress={() => onRemoveFns(fns)} className="flex-row items-center gap-1 rounded-full bg-brandPrimary/10 px-2.5 py-1">
              <Text className="text-xs font-medium text-brandPrimary">{fns}</Text>
              <Feather name="x" size={12} color={Colors.brandPrimary} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Request Card (matches proto RequestFeedCard)
// ---------------------------------------------------------------------------

function RequestFeedCard({ item, onPress }: { item: RequestItem; onPress: () => void }) {
  const service = item.serviceType || 'Не знаю';

  return (
    <Pressable
      onPress={onPress}
      className="gap-2 rounded-xl border border-borderLight bg-white p-4"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={1}>
          {item.title || item.description}
        </Text>
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>

      {item.title && (
        <Text className="text-sm leading-5 text-textSecondary" numberOfLines={2}>{item.description}</Text>
      )}

      {/* Tags: city, fns, service */}
      <View className="flex-row flex-wrap gap-2">
        <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
          <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
          <Text className="text-xs font-medium text-brandPrimary">{item.city}</Text>
        </View>
        {item.ifnsName && (
          <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
            <Feather name="home" size={11} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary" numberOfLines={1}>{item.ifnsName}</Text>
          </View>
        )}
        <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
          <Feather name="briefcase" size={11} color={Colors.brandPrimary} />
          <Text className="text-xs font-medium text-brandPrimary">{service}</Text>
        </View>
      </View>

      {/* Date row */}
      <View className="mt-1 flex-row items-center justify-between border-t border-borderLight pt-2">
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-bgSecondary">
            <Feather name="user" size={14} color={Colors.textMuted} />
          </View>
          <Text className="text-xs text-textMuted">{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      {/* Response count */}
      <View className="flex-row items-center gap-1.5">
        <Feather name="message-circle" size={12} color={item._count.responses > 0 ? Colors.brandPrimary : Colors.textMuted} />
        <Text className={item._count.responses > 0 ? 'text-xs font-semibold text-brandPrimary' : 'text-xs text-textMuted'}>
          {pluralSpecialists(item._count.responses)}
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function RequestsFeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile } = useBreakpoints();

  const [items, setItems] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filterCity, setFilterCity] = useState('');
  const [selectedFns, setSelectedFns] = useState<string[]>([]);

  const handleCityChange = (v: string) => {
    setFilterCity(v);
    setSelectedFns([]);
  };
  const handleFnsToggle = (v: string) => {
    setSelectedFns((prev) =>
      prev.includes(v) ? prev.filter((f) => f !== v) : [...prev, v],
    );
  };
  const handleRemoveFns = (v: string) => {
    setSelectedFns((prev) => prev.filter((f) => f !== v));
  };

  const hasFilters = !!(filterCity || selectedFns.length > 0);

  const fetchFeed = useCallback(
    async (opts: { pageNum?: number; replace?: boolean; isRefresh?: boolean } = {}) => {
      const { pageNum = 1, replace = true, isRefresh = false } = opts;

      if (replace && !isRefresh) setLoading(true);
      if (!replace) setLoadingMore(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (filterCity.trim()) params.set('city', filterCity.trim());
        params.set('page', String(pageNum));
        const endpoint = user ? '/requests' : '/requests/public';
        const data = await api.get<FeedResponse>(`${endpoint}?${params.toString()}`);

        let feedItems = data.items;
        // Client-side FNS filter (API has no multi-FNS filter)
        if (selectedFns.length > 0) {
          feedItems = feedItems.filter((r) => r.ifnsName && selectedFns.includes(r.ifnsName));
        }

        if (replace || isRefresh) {
          setItems(feedItems);
        } else {
          setItems((prev) => [...prev, ...feedItems]);
        }
        setTotal(data.total);
        setPage(data.page);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Не удалось загрузить заявки.');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [filterCity, selectedFns, user],
  );

  // Refetch on filter change
  useEffect(() => {
    const timer = setTimeout(() => fetchFeed({ replace: true }), filterCity ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchFeed]);

  function handleRefresh() {
    setRefreshing(true);
    fetchFeed({ replace: true, isRefresh: true });
  }

  function handleLoadMore() {
    if (loadingMore || items.length >= total) return;
    fetchFeed({ pageNum: page + 1, replace: false });
  }

  const hasMore = items.length < total;

  function renderItem({ item }: { item: RequestItem }) {
    return (
      <View className="w-full max-w-[430px] mb-3">
        <RequestFeedCard
          item={item}
          onPress={() => router.push(`/requests/${item.id}` as any)}
        />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Заявки — Налоговик' }} />
      <Head>
        <title>Заявки — Налоговик</title>
        <meta name="description" content="Открытые заявки на налоговые, юридические и бухгалтерские услуги." />
        <meta property="og:title" content="Заявки — Налоговик" />
        <meta property="og:description" content="Открытые заявки на налоговые, юридические и бухгалтерские услуги." />
        <meta property="og:url" content={`${APP_URL}/requests`} />
      </Head>
      <LandingHeader />
      <Header title="Заявки" />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
        ListHeaderComponent={
          <View className="w-full max-w-[430px] gap-4 pt-4 pb-4">
            {/* Header */}
            <View>
              <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
              <Text className="mt-0.5 text-sm text-textMuted">{total} активных заявок</Text>
            </View>

            {/* Filters */}
            <View className="gap-3 rounded-xl border border-borderLight bg-bgSecondary p-4">
              <View className="flex-row items-center gap-2">
                <Feather name="sliders" size={14} color={Colors.brandPrimary} />
                <Text className="text-sm font-semibold text-textPrimary">Фильтры</Text>
                {hasFilters && (
                  <Pressable
                    onPress={() => { setFilterCity(''); setSelectedFns([]); }}
                    className="ml-auto flex-row items-center gap-1"
                  >
                    <Feather name="x" size={14} color={Colors.textMuted} />
                    <Text className="text-xs text-textMuted">Сбросить</Text>
                  </Pressable>
                )}
              </View>

              <CityFnsPicker
                city={filterCity}
                selectedFns={selectedFns}
                onCityChange={handleCityChange}
                onFnsToggle={handleFnsToggle}
                onRemoveFns={handleRemoveFns}
              />
            </View>

            {/* Specialist CTA for guests */}
            {!user && (
              <Pressable
                onPress={() => router.push('/(auth)/email?role=SPECIALIST' as any)}
                className="flex-row items-center justify-between rounded-lg bg-bgSecondary p-3"
              >
                <Text className="flex-1 text-sm text-textSecondary">Вы специалист? Получайте заказы</Text>
                <Text className="text-sm font-semibold text-brandPrimary">Регистрация</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center pt-16">
              <ActivityIndicator size="large" color={Colors.brandPrimary} />
            </View>
          ) : error ? (
            <View className="items-center gap-3 py-10">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
                <Feather name="alert-circle" size={32} color={Colors.textMuted} />
              </View>
              <Text className="text-lg font-semibold text-textPrimary">Ошибка загрузки</Text>
              <Text className="max-w-[260px] text-center text-sm text-textMuted">{error}</Text>
              <Pressable onPress={() => fetchFeed()} className="mt-2 rounded-lg bg-brandPrimary px-4 py-2">
                <Text className="text-sm font-semibold text-white">Повторить</Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center gap-3 py-10">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
                <Feather name="inbox" size={32} color={Colors.textMuted} />
              </View>
              <Text className="text-lg font-semibold text-textPrimary">Нет заявок</Text>
              <Text className="max-w-[260px] text-center text-sm text-textMuted">
                {filterCity
                  ? `Нет открытых заявок в городе "${filterCity}"`
                  : 'Попробуйте изменить параметры фильтров'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <>
            {hasMore && !loading ? (
              <View className="w-full max-w-[430px] pt-3">
                <Button
                  onPress={handleLoadMore}
                  variant="secondary"
                  loading={loadingMore}
                  disabled={loadingMore}
                >
                  Загрузить ещё
                </Button>
              </View>
            ) : null}
            <Footer isWide={!isMobile} />
          </>
        }
      />
    </SafeAreaView>
  );
}
