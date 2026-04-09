import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';
import { api, ApiError } from '../../lib/api';
import { formatExperience } from '../../lib/format';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { LandingHeader } from '../../components/LandingHeader';
import { Stars } from '../../components/Stars';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { FNS_OFFICES, FNSOffice } from '../../constants/FNS';

// Short display label for FNS office — used everywhere in UI
function fnsShortName(name: string): string {
  const match = name.match(/№\s*(\d+)/);
  return match ? `ИФНС №${match[1]}` : 'ИФНС';
}

// Unique sorted cities derived from FNS data
const ALL_CITIES = Array.from(new Set(FNS_OFFICES.map((o) => o.city))).sort((a, b) =>
  a.localeCompare(b, 'ru'),
);

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

  // Text search (name / service)
  const [searchText, setSearchText] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // City filter
  const [selectedCity, setSelectedCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // FNS filter (within selected city)
  const [selectedFns, setSelectedFns] = useState<FNSOffice[]>([]);
  const [fnsSearch, setFnsSearch] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('rating');

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchText), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  // City autocomplete results
  const cityResults = useMemo(() => {
    const q = cityInput.trim().toLowerCase();
    if (!q) return ALL_CITIES.slice(0, 8);
    return ALL_CITIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [cityInput]);

  // FNS offices for the selected city
  const cityFnsOffices = useMemo(
    () => (selectedCity ? FNS_OFFICES.filter((o) => o.city === selectedCity) : []),
    [selectedCity],
  );

  // FNS filtered by fnsSearch — matches full name OR short label (e.g. "№3", "межрайонная")
  const filteredCityFns = useMemo(() => {
    const q = fnsSearch.trim().toLowerCase();
    if (!q) return cityFnsOffices;
    return cityFnsOffices.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        fnsShortName(o.name).toLowerCase().includes(q),
    );
  }, [cityFnsOffices, fnsSearch]);

  const selectedFnsCodes = useMemo(() => new Set(selectedFns.map((o) => o.code)), [selectedFns]);
  const fnsFilterParam = selectedFns.map((o) => o.name).join(',');

  const PAGE_SIZE = 20;

  const fetchSpecialists = useCallback(
    async (pageNum: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        // FNS selected → use fns filter (city implied); only city → use city param
        if (fnsFilterParam) {
          params.set('fns', fnsFilterParam);
        } else if (selectedCity) {
          params.set('city', selectedCity);
        }
        if (sort) params.set('sort', sort);
        if (searchDebounced.trim()) params.set('search', searchDebounced.trim());
        if (selectedCategory) params.set('category', selectedCategory);
        params.set('page', String(pageNum));
        params.set('limit', String(PAGE_SIZE));

        const data = await api.get<{
          items: SpecialistItem[];
          total: number;
          page: number;
          pages: number;
        }>(`/specialists?${params.toString()}`);
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setPage(pageNum);
        setHasMore(pageNum < data.pages);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError('Не удалось загрузить список специалистов.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [fnsFilterParam, selectedCity, sort, searchDebounced, selectedCategory],
  );

  useEffect(() => {
    fetchSpecialists(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fnsFilterParam, selectedCity, sort, searchDebounced, selectedCategory]);

  function handleRefresh() {
    setRefreshing(true);
    fetchSpecialists(1, false);
  }

  function handleLoadMore() {
    if (!loadingMore && hasMore) fetchSpecialists(page + 1, true);
  }

  function selectCity(city: string) {
    setSelectedCity(city);
    setCityInput(city);
    setCityDropdownOpen(false);
    setSelectedFns([]);
    setFnsSearch('');
  }

  function clearCity() {
    setSelectedCity('');
    setCityInput('');
    setCityDropdownOpen(false);
    setSelectedFns([]);
    setFnsSearch('');
  }

  function toggleFns(office: FNSOffice) {
    if (selectedFnsCodes.has(office.code)) {
      setSelectedFns((prev) => prev.filter((o) => o.code !== office.code));
    } else {
      setSelectedFns((prev) => [...prev, office]);
    }
  }

  function renderSpecialist({ item }: { item: SpecialistItem }) {
    const isVerified = item.badges.includes('verified');
    const displayName = item.displayName || `@${item.nick}`;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/specialists/${item.nick}`)}
        activeOpacity={0.8}
        style={isMobile ? styles.cardWrapperMobile : styles.cardWrapperGrid}
      >
        <View style={[styles.card, isMobile && styles.cardMobile]}>
          <View style={styles.cardHeader}>
            <Avatar name={displayName} imageUri={item.avatarUrl || undefined} size="lg" />
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName} numberOfLines={1}>
                  {displayName}
                </Text>
                {isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#1A7848" />
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

          <View style={styles.metaRow}>
            <Stars
              rating={item.activity.avgRating}
              reviewCount={item.activity.reviewCount}
              size="sm"
              showEmpty={false}
            />
            {item.experience != null && (
              <Text style={styles.experienceText}>{formatExperience(item.experience)}</Text>
            )}
          </View>

          {item.services.length > 1 && (
            <View style={styles.servicesRow}>
              {item.services.slice(1, 4).map((svc, idx) => (
                <Text key={idx} style={styles.serviceChip} numberOfLines={1}>
                  {svc}
                </Text>
              ))}
              {item.services.length > 4 && (
                <Text style={styles.serviceMore}>+{item.services.length - 4}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  const filtersMaxWidth = isMobile ? 430 : (contentMaxWidth as number);

  const ListHeader = (
    <View style={[styles.filters, { maxWidth: filtersMaxWidth }]}>

      {/* 1. Text search */}
      <TextInput
        style={styles.searchInput}
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Поиск по имени или услуге..."
        placeholderTextColor={Colors.textMuted}
        autoCorrect={false}
      />

      {/* 2. City selector */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Город</Text>
        <View style={{ zIndex: 20 }}>
          {selectedCity ? (
            <View style={styles.selectedCityRow}>
              <View style={styles.selectedCityChip}>
                <Text style={styles.selectedCityText}>{selectedCity}</Text>
                <TouchableOpacity onPress={clearCity} hitSlop={8}>
                  <Text style={styles.chipRemoveWhite}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.cityInput}
                value={cityInput}
                onChangeText={(v) => { setCityInput(v); setCityDropdownOpen(true); }}
                onFocus={() => setCityDropdownOpen(true)}
                onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
                placeholder="Начните вводить город..."
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
                autoCapitalize="words"
              />
              {cityDropdownOpen && cityResults.length > 0 && (
                <View style={styles.cityDropdown}>
                  {cityResults.map((city) => (
                    <TouchableOpacity
                      key={city}
                      onPress={() => selectCity(city)}
                      style={styles.cityDropdownItem}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cityDropdownText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* 3. FNS selector — only when city is selected */}
      {selectedCity && cityFnsOffices.length > 0 && (
        <View style={styles.filterGroup}>
          <View style={styles.rowBetween}>
            <Text style={styles.filterLabel}>ИФНС — {selectedCity}</Text>
            {selectedFns.length > 0 && (
              <TouchableOpacity onPress={() => setSelectedFns([])}>
                <Text style={styles.clearLink}>Сбросить</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search within FNS list when there are many offices */}
          {cityFnsOffices.length > 5 && (
            <TextInput
              style={styles.fnsSearchInput}
              value={fnsSearch}
              onChangeText={setFnsSearch}
              placeholder="Номер или название инспекции..."
              placeholderTextColor={Colors.textMuted}
              autoCorrect={false}
            />
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fnsChipsScroll}
          >
            {filteredCityFns.map((office) => {
              const active = selectedFnsCodes.has(office.code);
              return (
                <TouchableOpacity
                  key={office.code}
                  onPress={() => toggleFns(office)}
                  style={[styles.fnsChip, active && styles.fnsChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.fnsChipText, active && styles.fnsChipTextActive]}>
                    {fnsShortName(office.name)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 4. Specialization chips */}
      <View style={styles.filterGroup}>
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
                key={spec.value || '__all__'}
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

      {/* 5. Sort */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Сортировка:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortOptions}
        >
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
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Каталог специалистов — Налоговик' }} />
      <Head>
        <title>Каталог специалистов — Налоговик</title>
        <meta
          name="description"
          content="Каталог проверенных налоговых консультантов и юристов. Выберите специалиста по городу, ИФНС, категории и рейтингу."
        />
        <meta property="og:title" content="Каталог специалистов — Налоговик" />
        <meta
          property="og:description"
          content="Каталог проверенных налоговых консультантов и юристов. Выберите специалиста по городу, ИФНС, категории и рейтингу."
        />
        <meta property="og:url" content={`${APP_URL}/specialists`} />
      </Head>
      <LandingHeader />
      <Header title="Каталог специалистов" />

      <FlatList
        key={numColumns}
        data={items}
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
        ListHeaderComponent={ListHeader}
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
          hasMore && items.length > 0 ? (
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
    gap: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  filterGroup: {
    gap: Spacing.sm,
  },
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  cityInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  cityDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    zIndex: 30,
    ...Shadows.md,
  },
  cityDropdownItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  cityDropdownText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  selectedCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  selectedCityText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
  },
  chipRemoveWhite: {
    fontSize: 18,
    color: Colors.white,
    lineHeight: 20,
    opacity: 0.8,
  },
  fnsSearchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  fnsChipsScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  fnsChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  fnsChipActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  fnsChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  fnsChipTextActive: {
    color: Colors.white,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
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
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sortLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sortOption: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  sortOptionActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
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
  cardMobile: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.brandPrimary,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
