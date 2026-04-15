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
import { useAuth } from '../../stores/authStore';
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

type TabKey = 'new' | 'inProgress' | 'completed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatBudget(budget?: number | null): string {
  if (budget == null) return '';
  return `${budget.toLocaleString('ru-RU')} \u20BD`;
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
      ? `${city} / ${selectedFnsIds.length} \u0424\u041D\u0421`
      : city
    : '';

  return (
    <View className="gap-2">
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View className={`h-11 flex-row items-center gap-2 rounded-lg border px-3 ${openLevel ? 'border-brandPrimary' : 'border-borderLight'} bg-white`}>
          <Feather name="map-pin" size={16} color={Colors.textMuted} />
          <Text className={`flex-1 text-sm ${summary ? 'text-textPrimary' : 'text-textMuted'}`}>
            {summary || '\u0413\u043E\u0440\u043E\u0434 \u0438 \u0424\u041D\u0421'}
          </Text>
          <Feather name={openLevel ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
        </View>
      </Pressable>

      {openLevel && (
        <View className="overflow-hidden rounded-lg border border-borderLight bg-white shadow-sm">
          <View className="flex-row border-b border-bgSecondary">
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'city' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => setOpenLevel('city')}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'city' ? 'text-brandPrimary' : city ? 'text-textPrimary' : 'text-textMuted'}`}>
                {city || '\u0413\u043E\u0440\u043E\u0434'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2.5 ${openLevel === 'fns' ? 'border-b-2 border-brandPrimary' : ''}`}
              onPress={() => city && setOpenLevel('fns')}
              disabled={!city}
            >
              <Text className={`text-xs font-semibold ${openLevel === 'fns' ? 'text-brandPrimary' : selectedFnsIds.length > 0 ? 'text-textPrimary' : 'text-textMuted'}`}>
                {selectedFnsIds.length > 0 ? `\u0424\u041D\u0421 (${selectedFnsIds.length})` : '\u0424\u041D\u0421'}
              </Text>
            </Pressable>
          </View>

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
// RequestCard — proto-matching card with "Откликнуться" button
// ---------------------------------------------------------------------------
function RequestCard({
  item,
  onRespond,
}: {
  item: RequestItem;
  onRespond: () => void;
}) {
  const title = item.title || item.description.slice(0, 60);
  const service = item.serviceType || item.category || '';
  const budget = formatBudget(item.budget);

  return (
    <View
      className="gap-2 rounded-xl border border-borderLight bg-white p-4"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}
    >
      <Text className="text-base font-semibold text-textPrimary" numberOfLines={2}>{title}</Text>
      <View className="flex-row items-center gap-1">
        <Text className="text-xs text-textMuted">{item.city}</Text>
        {service ? (
          <>
            <Text className="text-xs text-borderLight">{'\u00B7'}</Text>
            <Text className="text-xs text-textMuted">{service}</Text>
          </>
        ) : null}
      </View>
      <View className="flex-row items-center justify-between">
        {budget ? (
          <Text className="text-sm font-semibold text-brandPrimary">{budget}</Text>
        ) : (
          <View />
        )}
        <Text className="text-xs text-textMuted">{formatDate(item.createdAt)}</Text>
      </View>
      <Pressable
        className="mt-1 h-10 items-center justify-center rounded-lg bg-brandPrimary"
        onPress={onRespond}
      >
        <Text className="text-sm font-semibold text-white">Откликнуться</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Feed Component — Specialist Dashboard (proto: SpecialistDashboardStates)
// ---------------------------------------------------------------------------
export default function SpecialistFeedTab() {
  const router = useRouter();
  const { user } = useAuth();

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

  // Tab state (proto: Новые / В работе / Завершены)
  const [activeTab, setActiveTab] = useState<TabKey>('new');

  // Filter state
  const [filterCityId, setFilterCityId] = useState('');
  const [filterCityName, setFilterCityName] = useState('');
  const [selectedFnsIds, setSelectedFnsIds] = useState<string[]>([]);
  const [selectedFnsNames, setSelectedFnsNames] = useState<Record<string, string>>({});

  // City/FNS data from API
  const [cities, setCities] = useState<CityItem[]>([]);
  const [fnsList, setFnsList] = useState<FnsItem[]>([]);

  // Derived counts per tab
  const newItems = items.filter((r) => r.status === 'NEW' || r.status === 'OPEN' || r.status === 'ACTIVE');
  const inProgressItems = items.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'CLOSING_SOON');
  const completedItems = items.filter((r) => r.status === 'COMPLETED' || r.status === 'CLOSED' || r.status === 'CANCELLED');

  const visibleItems = activeTab === 'new' ? newItems : activeTab === 'inProgress' ? inProgressItems : completedItems;

  const userName = user?.username || user?.email?.split('@')[0] || '';

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
        params.set('pageSize', '50'); // fetch more to allow client-side tab filtering

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
    return (
      <View className="mb-3">
        <RequestCard
          item={item}
          onRespond={() => router.push(`/specialist/respond/${item.id}` as any)}
        />
      </View>
    );
  }

  const TAB_CONFIG: { key: TabKey; label: string; count: number; color: string }[] = [
    { key: 'new', label: 'Новые', count: newItems.length, color: Colors.brandPrimary },
    { key: 'inProgress', label: 'В работе', count: inProgressItems.length, color: Colors.statusWarning },
    { key: 'completed', label: 'Завершены', count: completedItems.length, color: Colors.statusSuccess },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={visibleItems}
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
            {/* Greeting — proto: "Добрый день, {name}!" */}
            <Text className="text-xl font-bold text-textPrimary">
              {getGreeting()}{userName ? `, ${userName}` : ''}!
            </Text>

            {/* Promo banner placeholder */}
            <View className="h-[88px] items-center justify-center rounded-xl bg-bgSecondary">
              <Text className="text-sm text-textMuted">Промо-баннер</Text>
            </View>

            {/* Stat cards — proto: 3 cards (Новые / В работе / Завершены) */}
            <View className="flex-row gap-2">
              {TAB_CONFIG.map((t) => (
                <Pressable
                  key={t.key}
                  className="flex-1 items-center rounded-xl border border-borderLight bg-white p-3"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 }}
                  onPress={() => setActiveTab(t.key)}
                >
                  <Text className="text-[22px] font-bold" style={{ color: t.color }}>{t.count}</Text>
                  <Text className="mt-0.5 text-xs text-textMuted">{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Tab buttons — proto: Новые / В работе / Завершены */}
            <View className="flex-row gap-2">
              {TAB_CONFIG.map((t) => (
                <Pressable
                  key={t.key}
                  className={`h-9 flex-1 items-center justify-center rounded-lg border ${
                    activeTab === t.key
                      ? 'border-brandPrimary bg-brandPrimary'
                      : 'border-borderLight bg-white'
                  }`}
                  onPress={() => setActiveTab(t.key)}
                >
                  <Text
                    className={`text-xs font-medium ${
                      activeTab === t.key ? 'font-semibold text-white' : 'text-textMuted'
                    }`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Filters */}
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
              <Feather name="inbox" size={48} color={Colors.textMuted} />
              <Text className="text-lg font-bold text-textPrimary">Пока нет заявок</Text>
              <Text className="max-w-[260px] text-center text-sm leading-5 text-textMuted">
                Новые заявки от клиентов появятся здесь. Убедитесь, что ваш профиль заполнен, чтобы получать больше заявок.
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
