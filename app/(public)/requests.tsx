import React, { useState, useCallback, useEffect } from 'react';
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
import Head from 'expo-router/head';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';
import { requests as requestsApi, ifns as ifnsApi } from '../../lib/api/endpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublicRequest {
  id: string;
  title: string;
  description: string;
  city: string;
  ifnsId: string | null;
  ifnsName: string | null;
  serviceType: string | null;
  category: string | null;
  status: string;
  createdAt: string;
  _count?: { responses: number };
}

interface CityOption {
  city: string;
}

interface IfnsOption {
  id: string;
  name: string;
  code: string;
  city: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pluralRequests(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} активная заявка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} активных заявки`;
  return `${n} активных заявок`;
}

function pluralResponses(n: number): string {
  if (n === 0) return '0 откликов';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} отклик`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} отклика`;
  return `${n} откликов`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const SERVICE_LABELS: Record<string, string> = {
  'Выездная проверка': 'Выездная проверка',
  'Камеральная проверка': 'Камеральная проверка',
  'Отдел оперативного контроля': 'Оперативный контроль',
};

function getServiceLabel(serviceType: string | null, category: string | null): string {
  const raw = serviceType || category;
  if (!raw) return 'Не знаю';
  return SERVICE_LABELS[raw] || raw;
}

// ---------------------------------------------------------------------------
// City/FNS Cascading Picker
// ---------------------------------------------------------------------------

function CityFnsPicker({
  cities,
  fnsList,
  city,
  selectedIfnsId,
  onCityChange,
  onIfnsChange,
  loadingFns,
}: {
  cities: string[];
  fnsList: IfnsOption[];
  city: string;
  selectedIfnsId: string;
  onCityChange: (v: string) => void;
  onIfnsChange: (v: string) => void;
  loadingFns: boolean;
}) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | null>(null);

  const selectedFns = fnsList.find((f) => f.id === selectedIfnsId);
  const summary = city
    ? selectedFns
      ? `${city} / ${selectedFns.name}`
      : city
    : '';

  return (
    <View style={{ gap: 8 }}>
      {/* Main picker button */}
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View
          style={[
            s.pickerBtn,
            openLevel ? s.pickerBtnActive : null,
          ]}
        >
          <Feather name="map-pin" size={16} color={Colors.textMuted} />
          <Text
            style={[s.pickerBtnText, !summary && s.pickerBtnPlaceholder]}
            numberOfLines={1}
          >
            {summary || 'Город и ФНС'}
          </Text>
          <Feather
            name={openLevel ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textMuted}
          />
        </View>
      </Pressable>

      {/* Cascading panel */}
      {openLevel && (
        <View style={s.cascadePanel}>
          {/* Tabs */}
          <View style={s.cascadeTabs}>
            <Pressable
              style={[s.cascadeTab, openLevel === 'city' && s.cascadeTabActive]}
              onPress={() => setOpenLevel('city')}
            >
              <Text
                style={[
                  s.cascadeTabText,
                  openLevel === 'city' && s.cascadeTabTextActive,
                ]}
              >
                {city || 'Город'}
              </Text>
            </Pressable>
            <Pressable
              style={[s.cascadeTab, openLevel === 'fns' && s.cascadeTabActive]}
              onPress={() => city && setOpenLevel('fns')}
              disabled={!city}
            >
              <Text
                style={[
                  s.cascadeTabText,
                  openLevel === 'fns' && s.cascadeTabTextActive,
                  !city && { opacity: 0.4 },
                ]}
              >
                {selectedFns ? selectedFns.name : 'ФНС'}
              </Text>
            </Pressable>
          </View>

          {/* Options */}
          <View style={{ maxHeight: 200 }}>
            {openLevel === 'city' && (
              <>
                <Pressable
                  style={s.cascadeOption}
                  onPress={() => { onCityChange(''); setOpenLevel(null); }}
                >
                  <Text style={[s.cascadeOptionText, { color: Colors.textMuted }]}>Все города</Text>
                </Pressable>
                {cities.map((c) => (
                  <Pressable
                    key={c}
                    style={s.cascadeOption}
                    onPress={() => {
                      onCityChange(c);
                      setOpenLevel('fns');
                    }}
                  >
                    <Text
                      style={[
                        s.cascadeOptionText,
                        city === c && { fontWeight: '600', color: Colors.brandPrimary },
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
            {openLevel === 'fns' && (
              loadingFns ? (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={Colors.brandPrimary} />
                </View>
              ) : (
                <>
                  <Pressable
                    style={s.cascadeOption}
                    onPress={() => { onIfnsChange(''); setOpenLevel(null); }}
                  >
                    <Text style={[s.cascadeOptionText, { color: Colors.textMuted }]}>Все ФНС</Text>
                  </Pressable>
                  {fnsList.map((f) => {
                    const isSelected = selectedIfnsId === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        style={s.cascadeOption}
                        onPress={() => { onIfnsChange(f.id); setOpenLevel(null); }}
                      >
                        <Text
                          style={[
                            s.cascadeOptionText,
                            isSelected && { fontWeight: '600', color: Colors.brandPrimary },
                          ]}
                        >
                          {f.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </>
              )
            )}
          </View>
        </View>
      )}

      {/* Selected chips */}
      {(city || selectedIfnsId) && (
        <View style={s.chipRow}>
          {city ? (
            <Pressable
              style={s.chip}
              onPress={() => onCityChange('')}
            >
              <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
              <Text style={s.chipText}>{city}</Text>
              <Feather name="x" size={12} color={Colors.brandPrimary} />
            </Pressable>
          ) : null}
          {selectedFns ? (
            <Pressable
              style={s.chip}
              onPress={() => onIfnsChange('')}
            >
              <Feather name="home" size={11} color={Colors.brandPrimary} />
              <Text style={s.chipText}>{selectedFns.name}</Text>
              <Feather name="x" size={12} color={Colors.brandPrimary} />
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Request Card
// ---------------------------------------------------------------------------

function RequestFeedCard({
  item,
  onPress,
}: {
  item: PublicRequest;
  onPress: () => void;
}) {
  const responseCount = item._count?.responses ?? 0;
  const serviceLabel = getServiceLabel(item.serviceType, item.category);

  return (
    <Pressable style={s.card} onPress={onPress}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      </View>

      <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>

      {/* Tags */}
      <View style={s.tagRow}>
        {item.city ? (
          <View style={s.tag}>
            <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
            <Text style={s.tagText}>{item.city}</Text>
          </View>
        ) : null}
        {item.ifnsName ? (
          <View style={s.tag}>
            <Feather name="home" size={11} color={Colors.brandPrimary} />
            <Text style={s.tagText} numberOfLines={1}>{item.ifnsName}</Text>
          </View>
        ) : null}
        <View style={s.tag}>
          <Feather name="briefcase" size={11} color={Colors.brandPrimary} />
          <Text style={s.tagText}>{serviceLabel}</Text>
        </View>
      </View>

      {/* Footer: date + responses */}
      <View style={s.cardFooter}>
        <View style={s.dateRow}>
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text style={s.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={s.responseRow}>
          <Feather
            name="message-circle"
            size={12}
            color={responseCount > 0 ? Colors.brandPrimary : Colors.textMuted}
          />
          <Text
            style={responseCount > 0 ? s.responseCountActive : s.responseCount}
          >
            {pluralResponses(responseCount)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyIconWrap}>
        <Feather name="inbox" size={36} color={Colors.textMuted} />
      </View>
      <Text style={s.emptyTitle}>Нет заявок</Text>
      <Text style={s.emptySubtitle}>
        {hasFilters
          ? 'Попробуйте изменить параметры фильтров'
          : 'Пока нет активных заявок'}
      </Text>
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
      <Text style={s.emptySubtitle}>Не удалось загрузить заявки</Text>
      <Pressable style={s.retryBtn} onPress={onRetry}>
        <Feather name="refresh-cw" size={16} color={Colors.white} />
        <Text style={s.retryBtnText}>Попробовать снова</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function PublicRequestsScreen() {
  const router = useRouter();

  // Data
  const [items, setItems] = useState<PublicRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [filterCity, setFilterCity] = useState('');
  const [filterIfnsId, setFilterIfnsId] = useState('');

  // Cities + FNS options
  const [cities, setCities] = useState<string[]>([]);
  const [fnsList, setFnsList] = useState<IfnsOption[]>([]);
  const [loadingFns, setLoadingFns] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  // Fetch cities on mount
  useEffect(() => {
    ifnsApi.getCities().then((res: { data: CityOption[] | string[] }) => {
      const data = res.data;
      const cityNames = data.map((c: CityOption | string) =>
        typeof c === 'string' ? c : c.city,
      );
      setCities(cityNames);
    }).catch(() => {
      // Silently fail — filter just won't have city options
    });
  }, []);

  // Fetch FNS when city changes
  useEffect(() => {
    if (!filterCity) {
      setFnsList([]);
      setFilterIfnsId('');
      return;
    }
    setLoadingFns(true);
    ifnsApi.getIfns({ city: filterCity }).then((res: { data: IfnsOption[] | { data: IfnsOption[] } }) => {
      const data = res.data;
      setFnsList(Array.isArray(data) ? data : data.data ?? []);
    }).catch(() => {
      setFnsList([]);
    }).finally(() => {
      setLoadingFns(false);
    });
  }, [filterCity]);

  // Fetch requests
  const fetchRequests = useCallback(async (opts: { refresh?: boolean; nextPage?: number } = {}) => {
    const { refresh, nextPage } = opts;
    const targetPage = nextPage ?? 1;

    try {
      if (refresh) setRefreshing(true);
      else if (nextPage) setLoadingMore(true);
      else setLoading(true);
      setError(false);

      const params: Record<string, unknown> = { page: targetPage };
      if (filterCity) params.city = filterCity;
      if (filterIfnsId) params.ifnsId = filterIfnsId;

      const res = await requestsApi.getPublicFeed(params);
      const body = res.data as {
        items: PublicRequest[];
        total: number;
        page: number;
        hasMore: boolean;
      };

      if (nextPage && nextPage > 1) {
        setItems((prev) => [...prev, ...body.items]);
      } else {
        setItems(body.items);
      }
      setTotal(body.total);
      setPage(body.page);
      setHasMore(body.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filterCity, filterIfnsId]);

  // Initial load + re-fetch on filter change
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCityChange = (v: string) => {
    setFilterCity(v);
    setFilterIfnsId('');
  };

  const handleIfnsChange = (v: string) => {
    setFilterIfnsId(v);
  };

  const handleRefresh = () => fetchRequests({ refresh: true });

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchRequests({ nextPage: page + 1 });
  };

  const goToDetail = (id: string) => {
    router.push(`/request/${id}` as never);
  };

  const hasFilters = !!(filterCity || filterIfnsId);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderHeader = () => (
    <View style={{ gap: Spacing.lg }}>
      <Head>
        <title>Заявки — Налоговик</title>
        <meta name="description" content="Активные заявки на налоговые услуги. Найдите клиента и предложите свои услуги." />
        <meta property="og:title" content="Заявки — Налоговик" />
        <meta property="og:description" content="Активные заявки на налоговые услуги. Найдите клиента и предложите свои услуги." />
        <meta property="og:type" content="website" />
      </Head>
      {/* Title */}
      <View>
        <Text style={s.pageTitle}>Заявки</Text>
        <Text style={s.pageSubtitle}>{pluralRequests(total)}</Text>
      </View>

      {/* Filters */}
      <View style={s.filtersCard}>
        <View style={s.filtersHeader}>
          <Feather name="sliders" size={14} color={Colors.brandPrimary} />
          <Text style={s.filtersTitle}>Фильтры</Text>
          {hasFilters && (
            <Pressable
              style={s.resetBtn}
              onPress={() => { setFilterCity(''); setFilterIfnsId(''); }}
            >
              <Feather name="x" size={14} color={Colors.textMuted} />
              <Text style={s.resetBtnText}>Сбросить</Text>
            </Pressable>
          )}
        </View>
        <CityFnsPicker
          cities={cities}
          fnsList={fnsList}
          city={filterCity}
          selectedIfnsId={filterIfnsId}
          onCityChange={handleCityChange}
          onIfnsChange={handleIfnsChange}
          loadingFns={loadingFns}
        />
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={s.container}>
        {renderHeader()}
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.container}>
        {renderHeader()}
        <ErrorState onRetry={() => fetchRequests()} />
      </View>
    );
  }

  return (
    <FlatList
      style={s.container}
      contentContainerStyle={s.listContent}
      data={items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <RequestFeedCard item={item} onPress={() => goToDetail(item.id)} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      ListEmptyComponent={<EmptyState hasFilters={hasFilters} />}
      ListFooterComponent={
        loadingMore ? (
          <View style={{ paddingVertical: Spacing.lg }}>
            <ActivityIndicator size="small" color={Colors.brandPrimary} />
          </View>
        ) : null
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.brandPrimary}
        />
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  listContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },

  // Header
  pageTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Filters card
  filtersCard: {
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.bgSecondary,
    padding: Spacing.lg,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filtersTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetBtnText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Picker
  pickerBtn: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
  },
  pickerBtnActive: {
    borderColor: Colors.brandPrimary,
  },
  pickerBtnText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  pickerBtnPlaceholder: {
    color: Colors.textMuted,
  },

  // Cascade panel
  cascadePanel: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cascadeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  cascadeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cascadeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.brandPrimary,
  },
  cascadeTabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
  },
  cascadeTabTextActive: {
    color: Colors.brandPrimary,
  },
  cascadeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  cascadeOptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
  },

  // Card
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  cardDesc: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responseCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  responseCountActive: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },

  // Error
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
});
