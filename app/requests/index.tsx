import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { LandingHeader } from '../../components/LandingHeader';
import { Button } from '../../components/Button';
import { useBreakpoints } from '../../hooks/useBreakpoints';

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
  const { isMobile, numColumns } = useBreakpoints();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const fetchFeed = useCallback(
    async (opts: { pageNum?: number; replace?: boolean; isRefresh?: boolean } = {}) => {
      const { pageNum = 1, replace = true, isRefresh = false } = opts;

      if (replace && !isRefresh) setLoading(true);
      if (!replace) setLoadingMore(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (cityFilter.trim()) params.set('city', cityFilter.trim());
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
    [cityFilter],
  );

  // Debounce city filter
  useEffect(() => {
    const timer = setTimeout(() => fetchFeed({ replace: true }), cityFilter ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchFeed, cityFilter]);

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
      <View style={isMobile ? styles.cardWrapperMobile : styles.cardWrapperGrid}>
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
      </View>
    );
  }

  const hasMore = items.length < total;

  return (
    <SafeAreaView style={styles.safe}>
      <LandingHeader />
      <Header title="Лента запросов" />

      {/* key={numColumns} forces FlatList remount when columns change on resize */}
      <FlatList
        key={numColumns}
        data={items}
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
              placeholder="Например, Тбилиси"
              autoCapitalize="words"
            />
            {total > 0 && (
              <Text style={styles.totalText}>
                Найдено запросов: {total}
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
          hasMore ? (
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
          ) : null
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
});
