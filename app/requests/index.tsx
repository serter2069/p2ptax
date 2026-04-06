import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { LandingHeader } from '../../components/LandingHeader';
import { Button } from '../../components/Button';
import { useBreakpoints } from '../../hooks/useBreakpoints';

const CATEGORY_FILTERS = [
  { label: 'Все', value: '' },
  { label: 'НДФЛ', value: 'НДФЛ' },
  { label: 'НДС', value: 'НДС' },
  { label: 'Споры', value: 'Споры' },
  { label: 'Декларации', value: 'Декларации' },
  { label: 'Оптимизация', value: 'Оптимизация' },
  { label: 'Вычеты', value: 'Вычеты' },
  { label: 'Аудит', value: 'Аудит' },
];

const BUDGET_FILTERS = [
  { label: 'Любой', value: 0 },
  { label: 'до 5 000 ₽', value: 5000 },
  { label: 'до 10 000 ₽', value: 10000 },
  { label: 'до 50 000 ₽', value: 50000 },
];

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

interface RequestItem {
  id: string;
  description: string;
  city: string;
  budget?: number | null;
  category?: string | null;
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
}

export default function RequestsFeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile, numColumns } = useBreakpoints();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxBudget, setMaxBudget] = useState(0);
  const [activeOnly, setActiveOnly] = useState(true);

  const fetchFeed = useCallback(
    async (opts: { pageNum?: number; replace?: boolean; isRefresh?: boolean } = {}) => {
      const { pageNum = 1, replace = true, isRefresh = false } = opts;

      if (replace && !isRefresh) setLoading(true);
      if (!replace) setLoadingMore(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (cityFilter.trim()) params.set('city', cityFilter.trim());
        // #1801: Pass category and maxBudget to API for server-side filtering
        if (selectedCategory) params.set('category', selectedCategory);
        if (maxBudget > 0) params.set('maxBudget', String(maxBudget));
        params.set('page', String(pageNum));
        const data = await api.get<FeedResponse>(`/requests?${params.toString()}`);

        if (replace || isRefresh) {
          setItems(data.items);
        } else {
          setItems((prev) => [...prev, ...data.items]);
        }
        setTotal(data.total);
        setPage(data.page);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Не удалось загрузить запросы.');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [cityFilter, selectedCategory, maxBudget],
  );

  // Debounce city filter; reset page on any filter change
  useEffect(() => {
    const timer = setTimeout(() => fetchFeed({ replace: true }), cityFilter ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchFeed, cityFilter]);

  // Immediately refetch when category or budget changes
  useEffect(() => {
    fetchFeed({ replace: true });
  }, [selectedCategory, maxBudget]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRefresh() {
    setRefreshing(true);
    fetchFeed({ replace: true, isRefresh: true });
  }

  function handleLoadMore() {
    if (loadingMore || items.length >= total) return;
    fetchFeed({ pageNum: page + 1, replace: false });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderItem({ item }: { item: RequestItem }) {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/requests/${item.id}` as any)}
        activeOpacity={0.8}
        style={isMobile ? styles.cardWrapperMobile : styles.cardWrapperGrid}
      >
        <Card padding={Spacing.lg}>
          {/* City + date row */}
          <View style={styles.metaRow}>
            <View style={styles.cityChip}>
              <Text style={styles.cityText}>{item.city}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={4}>
            {item.description}
          </Text>

          {/* Budget + Category */}
          {(item.budget != null || item.category) ? (
            <View style={styles.tagsRow}>
              {item.category ? (
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              ) : null}
              {item.budget != null ? (
                <Text style={styles.budgetText}>{item.budget.toLocaleString('ru-RU')} ₽</Text>
              ) : null}
            </View>
          ) : null}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.responsesText}>
              Откликов: {item._count.responses}
            </Text>
            <View style={styles.statusChip}>
              <Text style={[styles.statusText, item.status !== 'OPEN' && styles.statusClosed]}>
                {item.status === 'OPEN' ? 'Открыт' : item.status === 'CLOSED' ? 'Закрыт' : item.status}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  // Client-side filter: activeOnly toggle (API returns OPEN only; toggle shows all when disabled)
  const filteredItems = useMemo(() => {
    if (activeOnly) return items.filter((item) => item.status === 'OPEN');
    return items;
  }, [items, activeOnly]);

  const hasMore = items.length < total;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Лента запросов — Налоговик' }} />
      <Head>
        <title>Лента запросов — Налоговик</title>
        <meta name="description" content="Открытые запросы на налоговые, юридические и бухгалтерские услуги. Найдите специалиста в вашем городе." />
        <meta property="og:title" content="Лента запросов — Налоговик" />
        <meta property="og:description" content="Открытые запросы на налоговые, юридические и бухгалтерские услуги. Найдите специалиста в вашем городе." />
        <meta property="og:url" content={`${APP_URL}/requests`} />
      </Head>
      <LandingHeader />
      <Header title="Лента запросов" />

      {/* key={numColumns} forces FlatList remount when columns change on resize */}
      <FlatList
        key={numColumns}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={numColumns}
        contentContainerStyle={[
          styles.listContent,
          !isMobile && styles.listContentWide,
        ]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
        ListHeaderComponent={
          <View style={[styles.filtersBox, !isMobile && styles.filtersBoxWide]}>
            <Input
              label="Город"
              value={cityFilter}
              onChangeText={setCityFilter}
              placeholder="Например, Москва"
              autoCapitalize="words"
            />

            {/* Category filter chips */}
            <View>
              <Text style={styles.filterLabel}>Категория</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {CATEGORY_FILTERS.map((cat) => {
                  const isActive = cat.value === selectedCategory;
                  return (
                    <TouchableOpacity
                      key={cat.value || '__all_cat__'}
                      onPress={() => setSelectedCategory(cat.value)}
                      style={[styles.chip, isActive && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Budget filter chips */}
            <View>
              <Text style={styles.filterLabel}>Бюджет</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {BUDGET_FILTERS.map((b) => {
                  const isActive = b.value === maxBudget;
                  return (
                    <TouchableOpacity
                      key={b.value}
                      onPress={() => setMaxBudget(b.value)}
                      style={[styles.chip, isActive && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Active/All toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setActiveOnly(true)}
                style={[styles.toggleBtn, activeOnly && styles.toggleBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, activeOnly && styles.toggleTextActive]}>
                  Активные
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveOnly(false)}
                style={[styles.toggleBtn, !activeOnly && styles.toggleBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, !activeOnly && styles.toggleTextActive]}>
                  Все
                </Text>
              </TouchableOpacity>
            </View>

            {filteredItems.length > 0 && (
              <Text style={styles.totalText}>
                Найдено {filteredItems.length} запросов
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.brandPrimary} />
            </View>
          ) : error ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Ошибка загрузки"
              subtitle={error}
              ctaLabel="Повторить"
              onCtaPress={() => fetchFeed()}
            />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="Запросов пока нет"
              subtitle={
                cityFilter
                  ? `Нет открытых запросов в городе "${cityFilter}"`
                  : 'Нет открытых запросов. Проверьте позже.'
              }
            />
          )
        }
        ListFooterComponent={
          <>
            {hasMore ? (
              <View style={[styles.loadMoreBox, !isMobile && styles.loadMoreBoxWide]}>
                <Button
                  onPress={handleLoadMore}
                  variant="secondary"
                  loading={loadingMore}
                  disabled={loadingMore}
                  style={styles.loadMoreBtn}
                >
                  Загрузить ещё
                </Button>
              </View>
            ) : null}
            {!user && items.length > 0 && (
              <View style={styles.ctaBanner}>
                <Text style={styles.ctaBannerText}>
                  Вы специалист? Зарегистрируйтесь и получайте заказы
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/email?role=SPECIALIST' as any)}
                  activeOpacity={0.8}
                  style={styles.ctaBannerBtn}
                >
                  <Text style={styles.ctaBannerBtnText}>Стать специалистом</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  // Mobile: centered, single column
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  // Wide: stretch to fill, grid takes over
  listContentWide: {
    alignItems: 'stretch',
  },
  columnWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  filtersBox: {
    width: '100%',
    maxWidth: 430,
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  filtersBoxWide: {
    maxWidth: 600,
  },
  totalText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  toggleBtnActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  toggleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  // Mobile: centered single column, maxWidth 430
  cardWrapperMobile: {
    width: '100%',
    maxWidth: 430,
    marginBottom: Spacing.md,
  },
  // Grid: flex 1 fills column, gutter from columnWrapper
  cardWrapperGrid: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cityChip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  responsesText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  statusChip: {
    backgroundColor: Colors.statusBg.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },
  statusClosed: {
    color: Colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryChip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  budgetText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  loadingBox: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
  loadMoreBox: {
    width: '100%',
    maxWidth: 430,
    paddingTop: Spacing.md,
  },
  loadMoreBoxWide: {
    maxWidth: 300,
  },
  loadMoreBtn: {
    width: '100%',
  },
  ctaBanner: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#EBF3FB',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  ctaBannerText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaBannerBtn: {
    backgroundColor: Colors.brandPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  ctaBannerBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});
