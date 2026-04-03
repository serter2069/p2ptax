import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';
import { api, ApiError } from '../../lib/api';
import { formatExperience, shortFnsLabel as formatFnsLabel } from '../../lib/format';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { LandingHeader } from '../../components/LandingHeader';
import { Stars } from '../../components/Stars';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { FNS_OFFICES, FNSOffice } from '../../constants/FNS';


interface SpecialistItem {
  nick: string;
  displayName: string | null;
  avatarUrl: string | null;
  experience: number | null;
  cities: string[];
  services: string[];
  badges: string[];
  promoted: boolean;
  promotionTier: number;
  activity: { responseCount: number; avgRating: number | null; reviewCount: number };
}

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: 'По рейтингу', value: 'rating' },
  { label: 'По новизне', value: 'newest' },
  { label: 'По опыту', value: 'experience' },
  { label: 'По откликам', value: 'responses' },
];

const SPECIALIZATION_FILTERS = [
  { label: 'Все', value: '' },
  { label: 'Декларации', value: 'Декларации' },
  { label: 'Споры с ФНС', value: 'Споры' },
  { label: 'Оптимизация', value: 'Оптимизация' },
  { label: 'Вычеты', value: 'Вычеты' },
  { label: 'Регистрация бизнеса', value: 'Регистрация' },
  { label: 'НДС', value: 'НДС' },
  { label: 'Аудит', value: 'Аудит' },
];

export default function SpecialistsCatalogScreen() {
  const router = useRouter();
  const { isMobile, numColumns, contentMaxWidth } = useBreakpoints();

  const [items, setItems] = useState<SpecialistItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchText, setSearchText] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFns, setSelectedFns] = useState<FNSOffice[]>([]);
  const [sort, setSort] = useState('rating');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const selectedFnsCodes = new Set(selectedFns.map((o) => o.code));
  // Use same searchText to suggest FNS offices in dropdown
  const fnsTerms = searchText.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const fnsDropdownResults = fnsTerms.length > 0
    ? FNS_OFFICES.filter((o) => {
        if (selectedFnsCodes.has(o.code)) return false;
        const text = `${o.name} ${o.city}`.toLowerCase();
        return fnsTerms.every((t) => text.includes(t));
      }).slice(0, 6)
    : [];

  const fnsFilterParam = selectedFns.map((o) => o.name).join(',');

  const PAGE_SIZE = 9;

  const fetchSpecialists = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const params = new URLSearchParams();
      if (fnsFilterParam) params.set('fns', fnsFilterParam);
      if (sort) params.set('sort', sort);
      if (searchDebounced.trim()) params.set('search', searchDebounced.trim());
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('page', String(pageNum));
      params.set('limit', String(PAGE_SIZE));

      const data = await api.get<{ items: SpecialistItem[]; total: number; page: number; pages: number }>(
        `/specialists?${params.toString()}`,
      );
      setItems((prev) => append ? [...prev, ...data.items] : data.items);
      setPage(pageNum);
      setHasMore(pageNum < data.pages);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось загрузить список специалистов.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [fnsFilterParam, sort, searchDebounced, selectedCategory]);

  useEffect(() => {
    fetchSpecialists(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fnsFilterParam, sort, searchDebounced, selectedCategory]);

  function handleRefresh() {
    setRefreshing(true);
    fetchSpecialists(1, false);
  }

  function handleLoadMore() {
    if (!loadingMore && hasMore) {
      fetchSpecialists(page + 1, true);
    }
  }

  const specialists = items;

  function renderSpecialist({ item }: { item: SpecialistItem }) {
    const isVerified = item.badges.includes('verified');
    const displayName = item.displayName || `@${item.nick}`;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/specialists/${item.nick}`)}
        activeOpacity={0.8}
        style={isMobile ? styles.cardWrapperMobile : styles.cardWrapperGrid}
      >
        <View style={styles.card}>
          {/* Top row: avatar + name/spec/city */}
          <View style={styles.cardHeader}>
            <Avatar name={displayName} imageUri={item.avatarUrl || undefined} size="lg" />
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName} numberOfLines={1}>
                  {displayName}
                </Text>
                {isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>Проверен</Text>
                  </View>
                )}
              </View>
              {item.services.length > 0 && (
                <Text style={styles.specialization} numberOfLines={1}>
                  {item.services[0]}
                </Text>
              )}
              {item.cities.length > 0 && (
                <Text style={styles.cityText} numberOfLines={1}>
                  {item.cities.join(', ')}
                </Text>
              )}
            </View>
          </View>

          {/* Rating + Experience on one line */}
          <View style={styles.metaRow}>
            <Stars
              rating={item.activity.avgRating}
              reviewCount={item.activity.reviewCount}
              size="sm"
              showEmpty={false}
            />
            {item.experience != null && (
              <Text style={styles.experienceText}>
                {formatExperience(item.experience)}
              </Text>
            )}
          </View>

          {/* Services chips */}
          {item.services.length > 1 && (
            <View style={styles.servicesRow}>
              {item.services.slice(1, 4).map((svc, idx) => (
                <Text key={idx} style={styles.serviceChip} numberOfLines={1}>
                  {svc}
                </Text>
              ))}
              {item.services.length > 4 && (
                <Text style={styles.serviceMore}>
                  +{item.services.length - 4}
                </Text>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <TouchableOpacity
              onPress={() => router.push(`/specialists/${item.nick}`)}
              style={styles.detailsBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.detailsBtnText}>Подробнее</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const filtersMaxWidth = isMobile ? 430 : (contentMaxWidth as number);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Каталог специалистов — Налоговик' }} />
      <Head>
        <title>Каталог специалистов — Налоговик</title>
        <meta name="description" content="Каталог проверенных налоговых консультантов и юристов. Выберите специалиста по городу, категории и рейтингу." />
        <meta property="og:title" content="Каталог специалистов — Налоговик" />
        <meta property="og:description" content="Каталог проверенных налоговых консультантов и юристов. Выберите специалиста по городу, категории и рейтингу." />
        <meta property="og:url" content={`${APP_URL}/specialists`} />
      </Head>
      <LandingHeader />
      <Header title="Каталог специалистов" />

      <FlatList
        key={numColumns}
        data={specialists}
        keyExtractor={(item) => item.nick}
        renderItem={renderSpecialist}
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
          <View style={[styles.filters, { maxWidth: filtersMaxWidth }]}>
            {/* Unified search — finds specialists, ИФНС offices, or services */}
            <View style={styles.searchSection}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Найти специалиста, ИФНС или услугу..."
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
              />
              {fnsDropdownResults.length > 0 && (
                <View style={styles.fnsDropdown}>
                  <Text style={styles.fnsDropdownHeader}>Инспекции ФНС</Text>
                  {fnsDropdownResults.map((office) => (
                    <TouchableOpacity
                      key={office.code}
                      onPress={() => {
                        setSelectedFns((prev) => [...prev, office]);
                        setSearchText('');
                      }}
                      style={styles.fnsDropdownItem}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.fnsDropdownName} numberOfLines={2}>
                        {office.name}
                      </Text>
                      <Text style={styles.fnsDropdownCity}>{office.city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Selected ИФНС chips */}
            {selectedFns.length > 0 && (
              <View style={styles.fnsChipsRow}>
                {selectedFns.map((office) => (
                  <TouchableOpacity
                    key={office.code}
                    onPress={() =>
                      setSelectedFns((prev) => prev.filter((o) => o.code !== office.code))
                    }
                    style={styles.fnsChip}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fnsChipText} numberOfLines={1}>
                      {formatFnsLabel(office.name, office.city)}
                    </Text>
                    <Text style={styles.fnsChipRemove}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Specialization filter chips */}
            <View>
              <Text style={styles.filterLabel}>Специализация</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {SPECIALIZATION_FILTERS.map((spec) => {
                  const isActive = spec.value === selectedCategory;
                  return (
                    <TouchableOpacity
                      key={spec.value || '__all_spec__'}
                      onPress={() => setSelectedCategory(spec.value)}
                      style={[styles.chip, isActive && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {spec.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Sort */}
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Сортировка:</Text>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSort(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortOption, sort === opt.value && styles.sortOptionActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
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
              onCtaPress={() => fetchSpecialists(1, false)}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="Специалистов не найдено"
              subtitle="Попробуйте изменить фильтры"
            />
          )
        }
        ListFooterComponent={
          hasMore && specialists.length > 0 ? (
            <View style={styles.loadMoreBox}>
              {loadingMore ? (
                <ActivityIndicator size="small" color={Colors.brandPrimary} />
              ) : (
                <Button
                  onPress={handleLoadMore}
                  variant="secondary"
                  style={styles.loadMoreBtn}
                >
                  Загрузить ещё
                </Button>
              )}
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
  filters: {
    width: '100%',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
  },
  searchSection: {
    position: 'relative',
    zIndex: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  fnsDropdown: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
  },
  fnsDropdownHeader: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fnsDropdownItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  fnsDropdownName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  fnsDropdownCity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    marginTop: 2,
  },
  fnsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  fnsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.statusBg.accent,
  },
  fnsChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textAccent,
    fontWeight: Typography.fontWeight.medium,
    maxWidth: 160,
  },
  fnsChipRemove: {
    fontSize: 14,
    color: Colors.textAccent,
    lineHeight: 16,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sortLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  sortOption: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  sortOptionActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Card styles
  cardWrapperMobile: {
    width: '100%',
    maxWidth: 430,
    marginBottom: Spacing.sm,
  },
  cardWrapperGrid: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  displayName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  specialization: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  cityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  experienceText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5ED',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.sm,
  },
  verifiedText: {
    fontSize: 10,
    color: '#1A7848',
    fontWeight: Typography.fontWeight.medium,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacing.sm,
  },
  serviceChip: {
    fontSize: 11,
    color: '#4A6B88',
    backgroundColor: '#F0F4FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  serviceMore: {
    fontSize: 11,
    color: '#4A6B88',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  cardFooter: {
    marginTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  detailsBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    backgroundColor: 'transparent',
  },
  detailsBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
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
  loadingBox: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
  loadMoreBox: {
    width: '100%',
    maxWidth: 430,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    alignSelf: 'center',
  },
  loadMoreBtn: {
    width: '100%',
  },
});
