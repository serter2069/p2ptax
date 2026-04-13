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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { LandingHeader } from '../../components/LandingHeader';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/Button';
import { useBreakpoints } from '../../hooks/useBreakpoints';

const CATEGORY_FILTERS = [
  { label: 'Все', value: '' },
  { label: 'Выездная проверка', value: 'Выездная проверка' },
  { label: 'Камеральная проверка', value: 'Камеральная проверка' },
  { label: 'Отдел оперативного контроля', value: 'Отдел оперативного контроля' },
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
  { label: 'до 5 000 \u20BD', value: 5000 },
  { label: 'до 10 000 \u20BD', value: 10000 },
  { label: 'до 50 000 \u20BD', value: 50000 },
];

// Color mapping for category badges on cards
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Выездная проверка': { bg: '#fde8e8', text: '#B91C1C' },
  'Камеральная проверка': { bg: '#fef3cd', text: '#92400e' },
  'Отдел оперативного контроля': { bg: '#fde8e8', text: '#B91C1C' },
  'НДФЛ': { bg: '#e0ecf8', text: '#1A5BA8' },
  'НДС': { bg: '#e0ecf8', text: '#1A5BA8' },
  'Споры': { bg: '#fef3cd', text: '#92400e' },
  'Декларации': { bg: '#e6f4ed', text: '#1A7848' },
  'Оптимизация': { bg: '#e6f4ed', text: '#1A7848' },
  'Вычеты': { bg: '#dce8f5', text: '#2E74CC' },
  'Аудит': { bg: '#dce8f5', text: '#2E74CC' },
};

const DEFAULT_CATEGORY_COLOR = { bg: Colors.bgSecondary, text: Colors.brandPrimary };

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

interface IfnsItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  address: string | null;
  searchAliases: string | null;
  city: { id: string; name: string; slug: string; region: string | null };
}

interface RequestItem {
  id: string;
  title?: string;
  description: string;
  city: string;
  budget?: number | null;
  category?: string | null;
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

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <View style={styles.cardWrapperMobile}>
      <Card padding={Spacing.lg} variant="elevated">
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonBlock, { width: '40%', height: 14 }]} />
          <View style={[styles.skeletonBlock, { width: 60, height: 20, borderRadius: BorderRadius.full }]} />
        </View>
        <View style={[styles.skeletonBlock, { width: '90%', height: 14, marginTop: Spacing.sm }]} />
        <View style={[styles.skeletonBlock, { width: '75%', height: 14 }]} />
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonBlock, { width: 70, height: 20, borderRadius: BorderRadius.full }]} />
          <View style={[styles.skeletonBlock, { width: 80, height: 20, borderRadius: BorderRadius.full }]} />
        </View>
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonBlock, { width: 60, height: 12 }]} />
          <View style={[styles.skeletonBlock, { width: 50, height: 12 }]} />
        </View>
      </Card>
    </View>
  );
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
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'budget'>('date');

  // IFNS filter state
  const [ifnsQuery, setIfnsQuery] = useState('');
  const [ifnsResults, setIfnsResults] = useState<IfnsItem[]>([]);
  const [selectedIfns, setSelectedIfns] = useState<IfnsItem | null>(null);
  const [ifnsLoading, setIfnsLoading] = useState(false);
  const [showIfnsDropdown, setShowIfnsDropdown] = useState(false);

  // Respond modal state
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [respondMessage, setRespondMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function openRespondModal(id: string) {
    setRespondingId(id);
    setRespondMessage('');
    setModalVisible(true);
  }

  function closeRespondModal() {
    setModalVisible(false);
    setRespondingId(null);
    setRespondMessage('');
  }

  async function submitResponse() {
    if (!respondingId) return;
    const trimmed = respondMessage.trim();
    if (!trimmed) {
      if (Platform.OS === 'web') {
        alert('Введите сообщение для отклика');
      } else {
        Alert.alert('Ошибка', 'Введите сообщение для отклика');
      }
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/requests/${respondingId}/respond`, { message: trimmed });
      closeRespondModal();
      if (Platform.OS === 'web') {
        alert('Отклик отправлен! Клиент получит уведомление.');
      } else {
        Alert.alert('Отклик отправлен', 'Клиент получит уведомление.');
      }
      fetchFeed({ replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? 'Вы уже откликались на этот запрос.'
            : err.message
          : 'Ошибка при отправке отклика';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Ошибка', msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // IFNS search debounce
  useEffect(() => {
    if (!ifnsQuery.trim()) {
      setIfnsResults([]);
      setShowIfnsDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIfnsLoading(true);
      try {
        const data = await api.get<IfnsItem[]>(`/ifns/search?q=${encodeURIComponent(ifnsQuery.trim())}`);
        setIfnsResults(data);
        setShowIfnsDropdown(data.length > 0);
      } catch {
        setIfnsResults([]);
        setShowIfnsDropdown(false);
      } finally {
        setIfnsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [ifnsQuery]);

  const fetchFeed = useCallback(
    async (opts: { pageNum?: number; replace?: boolean; isRefresh?: boolean } = {}) => {
      const { pageNum = 1, replace = true, isRefresh = false } = opts;

      if (replace && !isRefresh) setLoading(true);
      if (!replace) setLoadingMore(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (cityFilter.trim()) params.set('city', cityFilter.trim());
        if (selectedCategory) params.set('category', selectedCategory);
        if (maxBudget > 0) params.set('maxBudget', String(maxBudget));
        if (selectedIfns) params.set('ifnsId', selectedIfns.id);
        params.set('page', String(pageNum));
        const endpoint = user ? '/requests' : '/requests/public';
        const data = await api.get<FeedResponse>(`${endpoint}?${params.toString()}`);

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
    [cityFilter, selectedCategory, maxBudget, selectedIfns],
  );

  // Debounce city filter; reset page on any filter change
  useEffect(() => {
    const timer = setTimeout(() => fetchFeed({ replace: true }), cityFilter ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchFeed, cityFilter]);

  // Immediately refetch when category, budget, or IFNS changes
  useEffect(() => {
    fetchFeed({ replace: true });
  }, [selectedCategory, maxBudget, selectedIfns]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'только что';
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  }

  function isNew(iso: string) {
    const diffMs = new Date().getTime() - new Date(iso).getTime();
    return diffMs < 24 * 60 * 60 * 1000; // less than 24h
  }

  function getCategoryColor(cat: string) {
    return CATEGORY_COLORS[cat] || DEFAULT_CATEGORY_COLOR;
  }

  function renderItem({ item }: { item: RequestItem }) {
    const catColor = item.category ? getCategoryColor(item.category) : null;
    const itemIsNew = isNew(item.createdAt);
    const isHot = item._count.responses >= 3 && item.status === 'OPEN';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/requests/${item.id}` as any)}
        activeOpacity={0.8}
        style={isMobile ? styles.cardWrapperMobile : styles.cardWrapperGrid}
      >
        <Card padding={Spacing.lg} variant="elevated">
          {/* Top row: badges + budget */}
          <View style={styles.topRow}>
            <View style={styles.badgesRow}>
              {itemIsNew && (
                <View style={styles.newBadge}>
                  <View style={styles.newDot} />
                  <Text style={styles.newBadgeText}>новый</Text>
                </View>
              )}
              {isHot && (
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>горячий</Text>
                </View>
              )}
            </View>
            {item.budget != null && (
              <Text style={styles.budgetProminent}>{item.budget.toLocaleString('ru-RU')} {'\u20BD'}</Text>
            )}
          </View>

          {/* City + date row */}
          <View style={styles.metaRow}>
            <View style={styles.cityChip}>
              <Text style={styles.cityText}>{item.city}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>

          {/* Title + Description */}
          {item.title ? (
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          ) : null}
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>

          {/* Category badge + IFNS */}
          <View style={styles.tagsRow}>
            {item.category && catColor ? (
              <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
                <Text style={[styles.categoryBadgeText, { color: catColor.text }]}>{item.category}</Text>
              </View>
            ) : null}
            {item.ifnsName ? (
              <View style={styles.ifnsBadge}>
                <Text style={styles.ifnsBadgeText} numberOfLines={1}>{item.ifnsName}</Text>
              </View>
            ) : null}
          </View>

          {/* Bottom row: responses + status */}
          <View style={styles.cardFooterRow}>
            <Text style={styles.responsesText}>
              {item._count.responses} {item._count.responses === 1 ? 'отклик' : item._count.responses < 5 ? 'отклика' : 'откликов'}
            </Text>
            <View style={[styles.statusChip, item.status !== 'OPEN' && styles.statusChipClosed]}>
              <Text style={[styles.statusText, item.status !== 'OPEN' && styles.statusClosed]}>
                {item.status === 'OPEN' ? 'Открыт' : item.status === 'CLOSED' ? 'Закрыт' : item.status}
              </Text>
            </View>
          </View>

          {/* Respond button for specialists */}
          {user && user.role === 'SPECIALIST' && item.status === 'OPEN' && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                openRespondModal(item.id);
              }}
              activeOpacity={0.8}
              style={styles.respondBtn}
            >
              <Text style={styles.respondBtnText}>Откликнуться</Text>
            </TouchableOpacity>
          )}
        </Card>
      </TouchableOpacity>
    );
  }

  // Client-side filter: activeOnly toggle
  const filteredItems = useMemo(() => {
    let result = activeOnly ? items.filter((item) => item.status === 'OPEN') : items;
    if (sortBy === 'budget') {
      result = [...result].sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0));
    }
    return result;
  }, [items, activeOnly, sortBy]);

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
            {/* Hero section */}
            <View style={styles.heroSection}>
              <View style={styles.heroTitleRow}>
                <Text style={styles.heroTitle}>Лента запросов</Text>
                {total > 0 && (
                  <View style={styles.totalBadge}>
                    <Text style={styles.totalBadgeText}>{total}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroSubtitle}>
                Опишите ситуацию — специалисты откликнутся. Бесплатно, без обязательств.
              </Text>
            </View>

            {/* Search bar + Sort */}
            <View style={styles.searchAndSort}>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>&#x1F50D;</Text>
                <TextInput
                  style={styles.searchInput}
                  value={cityFilter}
                  onChangeText={setCityFilter}
                  placeholder="Поиск по городу..."
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.sortRow}>
                <TouchableOpacity
                  onPress={() => setSortBy('date')}
                  style={[styles.sortBtn, sortBy === 'date' && styles.sortBtnActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortText, sortBy === 'date' && styles.sortTextActive]}>По дате</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortBy('budget')}
                  style={[styles.sortBtn, sortBy === 'budget' && styles.sortBtnActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortText, sortBy === 'budget' && styles.sortTextActive]}>По бюджету</Text>
                </TouchableOpacity>
              </View>
            </View>

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

            {/* Active/All + More filters toggle */}
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
              <TouchableOpacity
                onPress={() => setShowMoreFilters(!showMoreFilters)}
                style={[styles.toggleBtn, showMoreFilters && styles.toggleBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, showMoreFilters && styles.toggleTextActive]}>
                  Ещё фильтры
                </Text>
              </TouchableOpacity>
            </View>

            {/* Expanded filters: IFNS + Budget */}
            {showMoreFilters && (
              <View style={styles.expandedFilters}>
                {/* IFNS filter */}
                <View style={styles.ifnsFilterContainer}>
                  <Text style={styles.filterLabel}>ИФНС</Text>
                  {selectedIfns ? (
                    <View style={styles.ifnsSelected}>
                      <Text style={styles.ifnsSelectedText} numberOfLines={1}>{selectedIfns.name}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedIfns(null);
                          setIfnsQuery('');
                        }}
                        style={styles.ifnsClearBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.ifnsClearText}>x</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.ifnsInputWrapper}>
                      <TextInput
                        style={styles.ifnsInput}
                        value={ifnsQuery}
                        onChangeText={setIfnsQuery}
                        placeholder="Номер или название..."
                        placeholderTextColor={Colors.textMuted}
                        autoCorrect={false}
                      />
                      {ifnsLoading && (
                        <ActivityIndicator size="small" color={Colors.brandPrimary} style={styles.ifnsSpinner} />
                      )}
                      {showIfnsDropdown && ifnsResults.length > 0 && (
                        <View style={styles.ifnsDropdown}>
                          <ScrollView style={styles.ifnsDropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {ifnsResults.map((item) => (
                              <TouchableOpacity
                                key={item.id}
                                style={styles.ifnsDropdownItem}
                                onPress={() => {
                                  setSelectedIfns(item);
                                  setIfnsQuery('');
                                  setIfnsResults([]);
                                  setShowIfnsDropdown(false);
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.ifnsDropdownName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.ifnsDropdownCity}>{item.city.name}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}
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
              </View>
            )}

            {/* Specialist CTA (visible early for guests) */}
            {!user && (
              <View style={styles.miniCta}>
                <Text style={styles.miniCtaText}>
                  Вы специалист? Получайте заказы на платформе
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/email?role=SPECIALIST' as any)}
                  activeOpacity={0.8}
                  style={styles.miniCtaBtn}
                >
                  <Text style={styles.miniCtaBtnText}>Стать специалистом</Text>
                </TouchableOpacity>
              </View>
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
                  : 'Нет открытых запросов. Создайте свой первый запрос!'
              }
              ctaLabel="Создать запрос"
              onCtaPress={() => router.push('/(auth)/email?redirectTo=%2F(dashboard)%2Fmy-requests%2Fnew')}
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
            <Footer isWide={!isMobile} />
          </>
        }
      />

      {/* Respond modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRespondModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Ваш отклик</Text>
            <Text style={styles.modalHint}>Кратко опишите, как вы можете помочь</Text>
            <TextInput
              value={respondMessage}
              onChangeText={setRespondMessage}
              placeholder="Здравствуйте! Я специалист по..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={styles.messageInput}
              autoFocus
            />
            <Text style={styles.charCounter}>{respondMessage.length}/500</Text>
            <View style={styles.modalBtns}>
              <Button onPress={closeRespondModal} variant="ghost" style={styles.modalBtn}>
                Отмена
              </Button>
              <Button
                onPress={submitResponse}
                variant="primary"
                loading={submitting}
                disabled={submitting || !respondMessage.trim()}
                style={styles.modalBtn}
              >
                Отправить
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
  },
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
    gap: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  filtersBoxWide: {
    maxWidth: 600,
  },

  // Hero section
  heroSection: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  totalBadge: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    minWidth: 28,
    alignItems: 'center',
  },
  totalBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },

  // Search + sort
  searchAndSort: {
    gap: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
    ...Shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  sortBtnActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  sortText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  sortTextActive: {
    color: Colors.white,
  },

  // Filter labels
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },

  // Chips
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
    minHeight: 44,
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

  ifnsFilterContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 20,
  },
  ifnsInputWrapper: {
    position: 'relative',
  },
  ifnsInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
    minHeight: 40,
  },
  ifnsSpinner: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  ifnsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    zIndex: 30,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 36, 71, 0.12)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 10,
        }),
  },
  ifnsDropdownScroll: {
    maxHeight: 200,
  },
  ifnsDropdownItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  ifnsDropdownName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  ifnsDropdownCity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    marginTop: 2,
  },
  ifnsSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 40,
  },
  ifnsSelectedText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  ifnsClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ifnsClearText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 14,
  },

  // Toggle
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

  // Expanded filters
  expandedFilters: {
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  // Mini CTA for specialists
  miniCta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  miniCtaText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  miniCtaBtn: {
    backgroundColor: Colors.brandPrimary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    flexShrink: 0,
  },
  miniCtaBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Cards
  cardWrapperMobile: {
    width: '100%',
    maxWidth: 430,
    marginBottom: Spacing.md,
  },
  cardWrapperGrid: {
    flex: 1,
  },

  // New badge (no marginBottom — inside topRow)
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

  // Top row (badges + budget)
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
  budgetProminent: {
    fontSize: Typography.fontSize.lg,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.bold,
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
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
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
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  ifnsBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.statusBg.info,
    maxWidth: 200,
  },
  ifnsBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusInfo,
    fontWeight: Typography.fontWeight.medium,
  },
  cardFooterRow: {
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
  statusChipClosed: {
    backgroundColor: Colors.statusBg.error,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },
  statusClosed: {
    color: Colors.statusError,
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
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
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
    borderRadius: BorderRadius.lg,
  },
  ctaBannerBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  respondBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  respondBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    gap: Spacing.md,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  modalHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.xs,
  },
  messageInput: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: -Spacing.xs,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBtn: {
    flex: 1,
  },
});
