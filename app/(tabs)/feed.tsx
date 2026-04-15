import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { useBreakpoints } from '../../hooks/useBreakpoints';

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

interface SpecialistProfile {
  id: string;
  cities: string[];
  fnsOffices: string[];
  services: string[];
  specialistFns?: { fnsId: string; fns: { id: string; name: string; code: string } }[];
}

// ---------------------------------------------------------------------------
// Service type filter options
// ---------------------------------------------------------------------------
const SERVICE_FILTERS = [
  { label: 'Все', value: '' },
  { label: 'Выездная проверка', value: 'Выездная проверка' },
  { label: 'Камеральная проверка', value: 'Камеральная проверка' },
  { label: 'Оперативный контроль', value: 'Отдел оперативного контроля' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

function isNew(iso: string): boolean {
  return new Date().getTime() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;
}

const SERVICE_COLORS: Record<string, { bg: string; text: string }> = {
  'Выездная проверка': { bg: '#fde8e8', text: '#B91C1C' },
  'Камеральная проверка': { bg: '#fef3cd', text: '#92400e' },
  'Отдел оперативного контроля': { bg: '#fde8e8', text: '#B91C1C' },
};

const DEFAULT_SERVICE_COLOR = { bg: Colors.bgSecondary, text: Colors.brandPrimary };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SpecialistFeedTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile } = useBreakpoints();

  // Specialist profile data
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);

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

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedService, setSelectedService] = useState('');

  // Stats
  const [newToday, setNewToday] = useState(0);
  const [myResponsesCount, setMyResponsesCount] = useState(0);

  // Load specialist profile
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<SpecialistProfile>('/specialists/me');
        setProfile(data);
      } catch {
        // not critical — feed still works
      }
    })();
  }, []);

  // Load my responses count
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<any[]>('/requests/my-responses');
        const active = data.filter((r: any) => r.status === 'sent' || r.status === 'accepted');
        setMyResponsesCount(active.length);
      } catch {
        // not critical
      }
    })();
  }, []);

  // Fetch feed
  const fetchFeed = useCallback(
    async (opts: { pageNum?: number; replace?: boolean; isRefresh?: boolean } = {}) => {
      const { pageNum = 1, replace = true, isRefresh = false } = opts;

      if (replace && !isRefresh) setLoading(true);
      if (!replace) setLoadingMore(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (selectedCity) params.set('city', selectedCity);
        if (selectedService) params.set('category', selectedService);
        params.set('page', String(pageNum));

        const data = await api.get<FeedResponse>(`/requests?${params.toString()}`);

        if (replace || isRefresh) {
          setItems(data.items);
          // Count new today from first page
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          setNewToday(data.items.filter((i) => new Date(i.createdAt) >= todayStart).length);
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
    [selectedCity, selectedService],
  );

  // Debounce search / city filter
  useEffect(() => {
    const timer = setTimeout(() => fetchFeed({ replace: true }), selectedCity ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchFeed, selectedCity]);

  useEffect(() => {
    fetchFeed({ replace: true });
  }, [selectedService]);

  function handleRefresh() {
    setRefreshing(true);
    fetchFeed({ replace: true, isRefresh: true });
  }

  function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    fetchFeed({ pageNum: page + 1, replace: false });
  }

  // Client-side search filter
  const filtered = search
    ? items.filter(
        (i) =>
          (i.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
          i.description.toLowerCase().includes(search.toLowerCase()) ||
          i.city.toLowerCase().includes(search.toLowerCase()) ||
          (i.ifnsName ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (i.category ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  function getServiceColor(cat: string) {
    return SERVICE_COLORS[cat] || DEFAULT_SERVICE_COLOR;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  function renderCard({ item }: { item: RequestItem }) {
    const itemIsNew = isNew(item.createdAt);
    const serviceLabel = item.serviceType || item.category;
    const serviceColor = serviceLabel ? getServiceColor(serviceLabel) : null;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/requests/${item.id}` as any)}
        activeOpacity={0.8}
        style={styles.cardWrapper}
      >
        <Card padding={Spacing.lg} variant="elevated">
          {/* Top row: badges + date */}
          <View style={styles.topRow}>
            <View style={styles.badgesRow}>
              {itemIsNew && (
                <View style={styles.newBadge}>
                  <View style={styles.newDot} />
                  <Text style={styles.newBadgeText}>новая</Text>
                </View>
              )}
              {item._count.responses >= 3 && (
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>горячая</Text>
                </View>
              )}
            </View>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>

          {/* Title */}
          {item.title ? (
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          ) : null}

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Tags: city, FNS, service */}
          <View style={styles.tagsRow}>
            <View style={styles.cityChip}>
              <Feather name="map-pin" size={10} color={Colors.textSecondary} />
              <Text style={styles.cityText}>{item.city}</Text>
            </View>
            {item.ifnsName ? (
              <View style={styles.fnsBadge}>
                <Feather name="home" size={10} color={Colors.statusInfo} />
                <Text style={styles.fnsBadgeText} numberOfLines={1}>
                  {item.ifnsName}
                </Text>
              </View>
            ) : null}
            {serviceLabel && serviceColor ? (
              <View style={[styles.serviceBadge, { backgroundColor: serviceColor.bg }]}>
                <Text style={[styles.serviceBadgeText, { color: serviceColor.text }]}>
                  {serviceLabel}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Footer: responses + budget */}
          <View style={styles.cardFooter}>
            <View style={styles.responsesChip}>
              <Feather name="message-circle" size={12} color={Colors.textMuted} />
              <Text style={styles.responsesText}>
                {item._count.responses}{' '}
                {item._count.responses === 1
                  ? 'отклик'
                  : item._count.responses < 5
                    ? 'отклика'
                    : 'откликов'}
              </Text>
            </View>
            {item.budget != null && (
              <Text style={styles.budgetText}>
                {item.budget.toLocaleString('ru-RU')} {'\u20BD'}
              </Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, !isMobile && styles.listContentWide]}
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
          <View style={[styles.headerBox, !isMobile && styles.headerBoxWide]}>
            {/* Title */}
            <View style={styles.titleRow}>
              <Text style={styles.pageTitle}>Заявки клиентов</Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>В регионе</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{newToday}</Text>
                <Text style={styles.statLabel}>Новых сегодня</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{myResponsesCount}</Text>
                <Text style={styles.statLabel}>Мои отклики</Text>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color={Colors.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Поиск по заявкам..."
                placeholderTextColor={Colors.textMuted}
                style={styles.searchInput}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
                  <Feather name="x" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* City filter (from specialist profile) */}
            {profile && profile.cities.length > 0 && (
              <View>
                <Text style={styles.filterLabel}>Город</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedCity('')}
                    style={[styles.chip, !selectedCity && styles.chipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, !selectedCity && styles.chipTextActive]}>
                      Все
                    </Text>
                  </TouchableOpacity>
                  {profile.cities.map((city) => {
                    const active = selectedCity === city;
                    return (
                      <TouchableOpacity
                        key={city}
                        onPress={() => setSelectedCity(city)}
                        style={[styles.chip, active && styles.chipActive]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {city}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Service type filter */}
            <View>
              <Text style={styles.filterLabel}>Тип услуги</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {SERVICE_FILTERS.map((s) => {
                  const active = s.value === selectedService;
                  return (
                    <TouchableOpacity
                      key={s.value || '__all__'}
                      onPress={() => setSelectedService(s.value)}
                      style={[styles.chip, active && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
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
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Feather name="inbox" size={32} color={Colors.brandPrimary} />
              </View>
              <Text style={styles.emptyTitle}>Новых заявок пока нет</Text>
              <Text style={styles.emptySubtitle}>
                {selectedCity || selectedService
                  ? 'Попробуйте сбросить фильтры или расширить зону обслуживания'
                  : 'Настройте город и ФНС в настройках, чтобы видеть больше заявок'}
              </Text>
              {(selectedCity || selectedService) && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCity('');
                    setSelectedService('');
                    setSearch('');
                  }}
                  style={styles.resetBtn}
                  activeOpacity={0.7}
                >
                  <Feather name="refresh-cw" size={14} color={Colors.brandPrimary} />
                  <Text style={styles.resetBtnText}>Сбросить фильтры</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator size="small" color={Colors.brandPrimary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  listContentWide: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 700,
  },

  // Header
  headerBox: {
    gap: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerBoxWide: {
    maxWidth: 700,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pageTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },

  // Filters
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  chipTextActive: {
    color: Colors.white,
  },

  // Card
  cardWrapper: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  newBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: '#22c55e',
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hotBadge: {
    backgroundColor: '#fef3cd',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  hotBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: '#92400e',
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  fnsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.statusBg.info,
    maxWidth: 200,
  },
  fnsBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusInfo,
    fontWeight: Typography.fontWeight.medium,
  },
  serviceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  serviceBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  responsesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responsesText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  budgetText: {
    fontSize: Typography.fontSize.base,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.bold,
  },

  // Loading
  loadingBox: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
  footerLoading: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },

  // Empty
  emptyBox: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing['4xl'],
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    maxWidth: 280,
    lineHeight: 20,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
  },
  resetBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },
});
