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
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { LandingHeader } from '../../components/LandingHeader';
import { Stars } from '../../components/Stars';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { FNS_OFFICES, FNSOffice } from '../../constants/FNS';

function shortFnsLabel(office: FNSOffice): string {
  const match = office.name.match(/№\s*(\d+)/);
  return match ? `ИФНС №${match[1]} · ${office.city}` : office.city;
}

interface SpecialistItem {
  id: string;
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

  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchText, setSearchText] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedFns, setSelectedFns] = useState<FNSOffice[]>([]);
  const [fnsSearch, setFnsSearch] = useState('');
  const [sort, setSort] = useState('rating');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const selectedFnsCodes = new Set(selectedFns.map((o) => o.code));
  const fnsTerms = fnsSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const fnsDropdownResults = fnsTerms.length > 0
    ? FNS_OFFICES.filter((o) => {
        if (selectedFnsCodes.has(o.code)) return false;
        const text = `${o.name} ${o.city}`.toLowerCase();
        return fnsTerms.every((t) => text.includes(t));
      }).slice(0, 8)
    : [];

  const fnsFilterParam = selectedFns.map((o) => o.name).join(',');

  const fetchSpecialists = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (fnsFilterParam) params.set('fns', fnsFilterParam);
      if (sort) params.set('sort', sort);
      if (searchDebounced.trim()) params.set('search', searchDebounced.trim());

      const query = params.toString();
      const data = await api.get<SpecialistItem[]>(
        `/specialists${query ? `?${query}` : ''}`,
      );
      setSpecialists(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось загрузить список специалистов.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fnsFilterParam, sort, searchDebounced]);

  useEffect(() => {
    fetchSpecialists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fnsFilterParam, sort, searchDebounced]);

  function handleRefresh() {
    setRefreshing(true);
    fetchSpecialists(true);
  }

  function formatExperience(years: number): string {
    if (years === 1) return '1 год опыта';
    if (years >= 2 && years <= 4) return `${years} года опыта`;
    return `${years} лет опыта`;
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
      <LandingHeader />
      <Header title="Каталог специалистов" />

      <FlatList
        key={numColumns}
        data={specialists}
        keyExtractor={(item) => item.id}
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
            {/* Search input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Найти специалиста или услугу..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* ИФНС filter — autocomplete search + selected chips */}
            <View style={styles.fnsSection}>
              <Text style={styles.filterLabel}>Налоговая инспекция (ИФНС)</Text>
              <View style={styles.fnsSearchWrap}>
                <TextInput
                  style={styles.fnsSearchInput}
                  value={fnsSearch}
                  onChangeText={setFnsSearch}
                  placeholder="Поиск по номеру или городу..."
                  placeholderTextColor={Colors.textMuted}
                  autoCorrect={false}
                />
                {fnsDropdownResults.length > 0 && (
                  <View style={styles.fnsDropdown}>
                    {fnsDropdownResults.map((office) => (
                      <TouchableOpacity
                        key={office.code}
                        onPress={() => {
                          setSelectedFns((prev) => [...prev, office]);
                          setFnsSearch('');
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
                        {shortFnsLabel(office)}
                      </Text>
                      <Text style={styles.fnsChipRemove}>×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Specialization filter chips */}
            <View>
              <Text style={styles.filterLabel}>Специализация</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {SPECIALIZATION_FILTERS.map((spec) => {
                  const isActive = searchDebounced === spec.value && !searchText && spec.value !== '';
                  return (
                    <TouchableOpacity
                      key={spec.value || '__all_spec__'}
                      onPress={() => {
                        if (spec.value === '') {
                          setSearchText('');
                        } else {
                          setSearchText(spec.value);
                        }
                      }}
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

            {/* Sort tabs */}
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSort(opt.value)}
                  style={[
                    styles.sortTab,
                    sort === opt.value && styles.sortTabActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sortTabText,
                      sort === opt.value && styles.sortTabTextActive,
                    ]}
                  >
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
              icon="!"
              title="Ошибка загрузки"
              subtitle={error}
              ctaLabel="Повторить"
              onCtaPress={() => fetchSpecialists()}
            />
          ) : (
            <EmptyState
              icon="?"
              title="Специалистов не найдено"
              subtitle="Попробуйте изменить фильтры"
            />
          )
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
  searchContainer: {
    width: '100%',
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
  fnsSection: {
    gap: Spacing.sm,
    zIndex: 10,
  },
  fnsSearchWrap: {
    position: 'relative',
    zIndex: 20,
  },
  fnsSearchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  fnsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
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
    gap: Spacing.sm,
  },
  sortTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  sortTabActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  sortTabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  sortTabTextActive: {
    color: '#FFFFFF',
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
    borderColor: '#C0D0EA',
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
    color: '#0F2447',
  },
  specialization: {
    fontSize: Typography.fontSize.sm,
    color: '#4A6B88',
    marginTop: 1,
  },
  cityText: {
    fontSize: Typography.fontSize.xs,
    color: '#4A6B88',
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
    color: '#4A6B88',
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
    borderColor: '#1A5BA8',
    backgroundColor: 'transparent',
  },
  detailsBtnText: {
    fontSize: Typography.fontSize.sm,
    color: '#1A5BA8',
    fontWeight: Typography.fontWeight.medium,
  },
  fnsSection: {
    gap: Spacing.sm,
  },
  fnsSearchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgCard,
  },
  fnsCityLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  loadingBox: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
});
