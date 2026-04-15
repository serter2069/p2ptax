import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { Colors } from '../../constants/Colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RequestItem {
  id: string;
  title?: string;
  description: string;
  city: string;
  budget?: number | null;
  category?: string | null;
  serviceType?: string | null;
  ifnsId?: string | null;
  ifnsName?: string | null;
  status: string;
  createdAt: string;
  client: { id: string; name?: string; createdAt?: string };
  _count: { responses: number };
}

interface FeedResponse {
  items: RequestItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface CityItem {
  id: string;
  name: string;
}

interface FnsItem {
  id: string;
  name: string;
  code: string;
  cityId: string;
  city?: { id: string; name: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function pluralSpecialists(n: number): string {
  if (n === 0) return '0 специалистов написали';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} специалист написал`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} специалиста написали`;
  return `${n} специалистов написали`;
}

function getMemberYear(dateStr?: string): number {
  if (!dateStr) return new Date().getFullYear();
  return new Date(dateStr).getFullYear();
}

function getAuthorInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  return parts[0];
}

// ---------------------------------------------------------------------------
// CityFnsPicker — cascading City -> FNS picker (real API)
// ---------------------------------------------------------------------------
function CityFnsPicker({
  city,
  cityId,
  selectedFnsIds,
  selectedFnsNames,
  cities,
  fnsList,
  onCityChange,
  onFnsToggle,
  onRemoveFns,
}: {
  city: string;
  cityId: string;
  selectedFnsIds: string[];
  selectedFnsNames: Record<string, string>;
  cities: CityItem[];
  fnsList: FnsItem[];
  onCityChange: (id: string, name: string) => void;
  onFnsToggle: (id: string, name: string) => void;
  onRemoveFns: (id: string) => void;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | null>(null);

  const summary = city
    ? selectedFnsIds.length > 0
      ? `${city} / ${selectedFnsIds.length} ФНС`
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
              <Text className={`text-xs font-semibold ${openLevel === 'fns' ? 'text-brandPrimary' : selectedFnsIds.length > 0 ? 'text-textPrimary' : 'text-textMuted'}`}>
                {selectedFnsIds.length > 0 ? `ФНС (${selectedFnsIds.length})` : 'ФНС'}
              </Text>
            </Pressable>
          </View>

          {/* Options */}
          <ScrollView style={{ maxHeight: 200 }}>
            {openLevel === 'city' && (
              <>
                <Pressable
                  className="border-b border-bgSecondary px-3 py-2.5"
                  onPress={() => { onCityChange('', ''); setOpenLevel(null); }}
                >
                  <Text className="text-sm text-textMuted">Все города</Text>
                </Pressable>
                {cities.map((c) => (
                  <Pressable
                    key={c.id}
                    className="border-b border-bgSecondary px-3 py-2.5"
                    onPress={() => { onCityChange(c.id, c.name); setOpenLevel('fns'); }}
                  >
                    <Text className={`text-sm ${cityId === c.id ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{c.name}</Text>
                  </Pressable>
                ))}
              </>
            )}
            {openLevel === 'fns' && fnsList.map((f) => {
              const isSelected = selectedFnsIds.includes(f.id);
              return (
                <Pressable
                  key={f.id}
                  className="flex-row items-center gap-2 border-b border-bgSecondary px-3 py-2.5"
                  onPress={() => onFnsToggle(f.id, f.name)}
                >
                  <View className={isSelected
                    ? 'h-5 w-5 items-center justify-center rounded border border-brandPrimary bg-brandPrimary'
                    : 'h-5 w-5 rounded border border-borderLight bg-white'
                  }>
                    {isSelected && <Feather name="check" size={12} color="#fff" />}
                  </View>
                  <Text className={`text-sm ${isSelected ? 'font-semibold text-brandPrimary' : 'text-textPrimary'}`}>{f.name}</Text>
                </Pressable>
              );
            })}
            {openLevel === 'fns' && fnsList.length === 0 && (
              <View className="px-3 py-4">
                <Text className="text-sm text-textMuted">Нет ФНС для выбранного города</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Selected FNS chips */}
      {selectedFnsIds.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {selectedFnsIds.map((fnsId) => (
            <Pressable key={fnsId} onPress={() => onRemoveFns(fnsId)} className="flex-row items-center gap-1 rounded-full bg-brandPrimary/10 px-2.5 py-1">
              <Text className="text-xs font-medium text-brandPrimary">{selectedFnsNames[fnsId] || fnsId}</Text>
              <Feather name="x" size={12} color={Colors.brandPrimary} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// RequestFeedCard — matches prototype layout
// ---------------------------------------------------------------------------
function RequestFeedCard({
  title,
  description,
  city,
  fns,
  service,
  date,
  author,
  memberSince,
  messageCount,
  onMessage,
  onDetails,
}: {
  title: string;
  description: string;
  city: string;
  fns: string;
  service: string;
  date: string;
  author: string;
  memberSince: number;
  messageCount: number;
  onMessage: () => void;
  onDetails: () => void;
}) {
  return (
    <View
      className="gap-2 rounded-xl border border-borderLight bg-white p-4"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>{title}</Text>
        <Text className="text-xs text-textMuted">{date}</Text>
      </View>
      <Text className="text-sm leading-5 text-textSecondary" numberOfLines={2}>{description}</Text>
      <View className="flex-row flex-wrap gap-2">
        <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
          <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
          <Text className="text-xs font-medium text-brandPrimary">{city}</Text>
        </View>
        {fns ? (
          <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
            <Feather name="home" size={11} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary">{fns}</Text>
          </View>
        ) : null}
        {service ? (
          <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
            <Feather name="briefcase" size={11} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary">{service}</Text>
          </View>
        ) : null}
      </View>
      {/* Author + date row */}
      <View className="mt-1 flex-row items-center justify-between border-t border-borderLight pt-2">
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-bgSecondary">
            <Feather name="user" size={14} color={Colors.textMuted} />
          </View>
          <View>
            <Text className="text-sm font-medium text-textPrimary">{author}</Text>
            <Text className="text-xs text-textMuted">на сайте с {memberSince} г.</Text>
          </View>
        </View>
      </View>
      {/* Response count */}
      <View className="flex-row items-center gap-1.5">
        <Feather name="message-circle" size={12} color={messageCount > 0 ? Colors.brandPrimary : Colors.textMuted} />
        <Text className={messageCount > 0 ? 'text-xs font-semibold text-brandPrimary' : 'text-xs text-textMuted'}>
          {pluralSpecialists(messageCount)}
        </Text>
      </View>
      {/* Action buttons */}
      <View className="mt-1 flex-row gap-2">
        <Pressable onPress={onMessage} className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary">
          <Feather name="send" size={14} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Написать по заявке</Text>
        </Pressable>
        <Pressable onPress={onDetails} className="h-10 flex-row items-center justify-center gap-1.5 rounded-lg border border-borderLight px-4">
          <Feather name="eye" size={14} color={Colors.textPrimary} />
          <Text className="text-sm font-medium text-textPrimary">Подробнее</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Feed Component
// ---------------------------------------------------------------------------
export default function SpecialistFeedTab() {
  const router = useRouter();

  // Feed data
  const [items, setItems] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filter state
  const [filterCityId, setFilterCityId] = useState('');
  const [filterCityName, setFilterCityName] = useState('');
  const [selectedFnsIds, setSelectedFnsIds] = useState<string[]>([]);
  const [selectedFnsNames, setSelectedFnsNames] = useState<Record<string, string>>({});

  // City/FNS data from API
  const [cities, setCities] = useState<CityItem[]>([]);
  const [fnsList, setFnsList] = useState<FnsItem[]>([]);

  // Load cities on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<CityItem[]>('/ifns/cities');
        setCities(data);
      } catch {
        // not critical
      }
    })();
  }, []);

  // Load FNS when city changes
  useEffect(() => {
    if (!filterCityId) {
      setFnsList([]);
      return;
    }
    (async () => {
      try {
        const data = await api.get<FnsItem[]>(`/ifns?city_id=${filterCityId}`);
        setFnsList(data);
      } catch {
        setFnsList([]);
      }
    })();
  }, [filterCityId]);

  // Fetch feed
  const fetchFeed = useCallback(
    async (opts: { pageNum?: number; replace?: boolean; isRefresh?: boolean } = {}) => {
      const { pageNum = 1, replace = true, isRefresh = false } = opts;

      if (replace && !isRefresh) setLoading(true);
      if (!replace) setLoadingMore(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (filterCityName) params.set('city', filterCityName);
        if (selectedFnsIds.length > 0) {
          params.set('ifns_ids', selectedFnsIds.join(','));
        }
        params.set('page', String(pageNum));

        const data = await api.get<FeedResponse>(`/requests?${params.toString()}`);

        if (replace || isRefresh) {
          setItems(data.items);
        } else {
          setItems((prev) => [...prev, ...data.items]);
        }
        setTotal(data.total);
        setPage(data.page);
        setHasMore(data.hasMore);
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
    [filterCityName, selectedFnsIds],
  );

  // Refetch on filter change
  useEffect(() => {
    fetchFeed({ replace: true });
  }, [fetchFeed]);

  function handleRefresh() {
    setRefreshing(true);
    fetchFeed({ replace: true, isRefresh: true });
  }

  function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    fetchFeed({ pageNum: page + 1, replace: false });
  }

  // Filter handlers
  function handleCityChange(id: string, name: string) {
    setFilterCityId(id);
    setFilterCityName(name);
    setSelectedFnsIds([]);
    setSelectedFnsNames({});
  }

  function handleFnsToggle(id: string, name: string) {
    setSelectedFnsIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
    setSelectedFnsNames((prev) => {
      const next = { ...prev };
      if (prev[id]) {
        delete next[id];
      } else {
        next[id] = name;
      }
      return next;
    });
  }

  function handleRemoveFns(id: string) {
    setSelectedFnsIds((prev) => prev.filter((f) => f !== id));
    setSelectedFnsNames((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const hasFilters = !!(filterCityId || selectedFnsIds.length > 0);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  function renderCard({ item }: { item: RequestItem }) {
    const serviceLabel = item.serviceType || item.category || '';

    return (
      <View className="mb-3">
        <RequestFeedCard
          title={item.title || item.description.slice(0, 60)}
          description={item.description}
          city={item.city}
          fns={item.ifnsName || ''}
          service={serviceLabel}
          date={formatDate(item.createdAt)}
          author={getAuthorInitials(item.client?.name)}
          memberSince={getMemberYear(item.client?.createdAt)}
          messageCount={item._count.responses}
          onMessage={() => router.push(`/requests/${item.id}?respond=1` as any)}
          onDetails={() => router.push(`/requests/${item.id}` as any)}
        />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View className="gap-4 pb-4">
            {/* Header */}
            <View>
              <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
              <Text className="mt-0.5 text-sm text-textMuted">{total} активных заявок</Text>
            </View>

            {/* Unified City/FNS filter */}
            <View className="gap-3 rounded-xl border border-borderLight bg-bgSecondary p-4">
              <View className="flex-row items-center gap-2">
                <Feather name="sliders" size={14} color={Colors.brandPrimary} />
                <Text className="text-sm font-semibold text-textPrimary">Фильтры</Text>
                {hasFilters && (
                  <Pressable
                    onPress={() => { handleCityChange('', ''); }}
                    className="ml-auto flex-row items-center gap-1"
                  >
                    <Feather name="x" size={14} color={Colors.textMuted} />
                    <Text className="text-xs text-textMuted">Сбросить</Text>
                  </Pressable>
                )}
              </View>

              <CityFnsPicker
                city={filterCityName}
                cityId={filterCityId}
                selectedFnsIds={selectedFnsIds}
                selectedFnsNames={selectedFnsNames}
                cities={cities}
                fnsList={fnsList}
                onCityChange={handleCityChange}
                onFnsToggle={handleFnsToggle}
                onRemoveFns={handleRemoveFns}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center pt-10">
              <ActivityIndicator size="large" color={Colors.brandPrimary} />
            </View>
          ) : error ? (
            <View className="items-center gap-3 py-10">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
                <Feather name="alert-circle" size={32} color={Colors.textMuted} />
              </View>
              <Text className="text-lg font-semibold text-textPrimary">Ошибка загрузки</Text>
              <Text className="max-w-[260px] text-center text-sm text-textMuted">{error}</Text>
              <Pressable onPress={() => fetchFeed()} className="mt-2 rounded-lg border border-brandPrimary px-4 py-2">
                <Text className="text-sm font-semibold text-brandPrimary">Повторить</Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center gap-3 py-10">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
                <Feather name="inbox" size={32} color={Colors.textMuted} />
              </View>
              <Text className="text-lg font-semibold text-textPrimary">Нет заявок</Text>
              <Text className="max-w-[260px] text-center text-sm text-textMuted">
                Попробуйте изменить параметры фильтров
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color={Colors.brandPrimary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
