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
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { LandingHeader } from '../../components/LandingHeader';
import { Footer } from '../../components/Footer';
import { Stars } from '../../components/Stars';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { useFnsSearch, useCities, FnsOfficeItem } from '../../hooks/useFnsData';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';

interface SpecialistItem {
  nick: string;
  displayName: string | null;
  avatarUrl: string | null;
  experience: number | null;
  headline: string | null;
  memberSince: number;
  cities: string[];
  services: string[];
  badges: string[];
  promoted: boolean;
  promotionTier: number;
  fnsDepartmentsData: Array<{ office: string; departments: string[] }> | null;
  activity: { responseCount: number; avgRating: number | null; reviewCount: number };
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  sortOrder: number;
}

export default function SpecialistsCatalogScreen() {
  const router = useRouter();
  const { isMobile, contentMaxWidth } = useBreakpoints();

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [items, setItems] = useState<SpecialistItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [selectedFns, setSelectedFns] = useState<FnsOfficeItem[]>([]);

  useEffect(() => {
    api.get<ServiceCategory[]>('/categories')
      .then(data => setServiceCategories(data))
      .catch(() => {});
  }, []);

  const { cities: apiCities } = useCities();
  const [fnsQuery, setFnsQuery] = useState('');
  const { results: fnsSearchResults } = useFnsSearch(fnsQuery, 300);

  // FNS dropdown: filter API search results to exclude already selected
  const fnsDropdown = fnsSearchResults
    .filter((o) => !selectedFns.some((s) => s.code === o.code))
    .slice(0, 8);

  const fnsFilterParam = selectedFns.map((o) => o.name).join(',');

  const PAGE_SIZE = 20;

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
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedCity) params.set('city', selectedCity);
      if (selectedSort) params.set('sort', selectedSort);
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
  }, [fnsFilterParam, selectedCategory]);

  useEffect(() => {
    fetchSpecialists(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fnsFilterParam, selectedCategory]);

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
        <View style={[styles.card, isMobile && styles.cardMobile]}>
          {/* Top row: avatar + name/headline/city */}
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
              {item.headline && (
                <Text style={styles.headline} numberOfLines={2}>
                  {item.headline}
                </Text>
              )}
              <Text style={styles.cityText} numberOfLines={1}>
                {item.cities.length > 0 ? item.cities.join(', ') : ''}
                {item.cities.length > 0 && item.memberSince ? ' \u00B7 ' : ''}
                {item.memberSince ? `на сайте с ${item.memberSince}` : ''}
              </Text>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.metaRow}>
            <Stars
              rating={item.activity.avgRating}
              reviewCount={item.activity.reviewCount}
              size="sm"
              showEmpty={false}
            />
          </View>

          {/* Services chips */}
          {item.services.length > 0 && (
            <View style={styles.servicesRow}>
              {item.services.slice(0, 4).map((svc, idx) => (
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
        data={specialists}
        keyExtractor={(item) => item.nick}
        renderItem={renderSpecialist}
        numColumns={isMobile ? 1 : 2}
        key={isMobile ? 'single' : 'double'}
        columnWrapperStyle={isMobile ? undefined : { gap: 16 }}
        contentContainerStyle={[
          styles.listContent,
          !isMobile && styles.listContentWide,
        ]}
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
            {/* Service category chips */}
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                <TouchableOpacity
                  onPress={() => setSelectedCategory('')}
                  style={[styles.chip, selectedCategory === '' && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedCategory === '' && styles.chipTextActive]}>
                    Все
                  </Text>
                </TouchableOpacity>
                {serviceCategories.map((cat) => {
                  const isActive = cat.name === selectedCategory;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.name)}
                      style={[styles.chip, isActive && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* FNS search */}
            <View style={styles.searchSection}>
              <TextInput
                style={styles.searchInput}
                value={fnsQuery}
                onChangeText={setFnsQuery}
                placeholder="Ваша ИФНС..."
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
              />
              {fnsDropdown.length > 0 && (
                <View style={styles.fnsDropdown}>
                  <Text style={styles.fnsDropdownHeader}>Инспекции ФНС</Text>
                  {fnsDropdown.map((office) => (
                    <TouchableOpacity
                      key={office.code}
                      onPress={() => {
                        setSelectedFns((prev) => [...prev, office]);
                        setFnsQuery('');
                      }}
                      style={styles.fnsDropdownItem}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.fnsDropdownName} numberOfLines={2}>
                        {office.name}
                      </Text>
                      <Text style={styles.fnsDropdownCity}>{office.city.name}</Text>
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
                      {office.name} ({office.city.name})
                    </Text>
                    <Text style={styles.fnsChipRemove}>x</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonContainer}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={[styles.card, styles.cardWrapperMobile, { overflow: 'hidden' }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.cardInfo}>
                      <View style={styles.skeletonLine} />
                      <View style={[styles.skeletonLine, { width: '60%' }]} />
                      <View style={[styles.skeletonLine, { width: '40%' }]} />
                    </View>
                  </View>
                  <View style={[styles.skeletonLine, { width: '80%', marginTop: Spacing.sm }]} />
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: Spacing.sm }}>
                    <View style={[styles.skeletonChip]} />
                    <View style={[styles.skeletonChip, { width: 60 }]} />
                  </View>
                </View>
              ))}
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
          <>
            {hasMore && specialists.length > 0 ? (
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
            ) : null}
            <Footer isWide={!isMobile} />
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
    paddingLeft: Spacing.xs,
  },
  searchSection: {
    position: 'relative',
    zIndex: 20,
    overflow: 'visible',
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
    width: '100%',
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
  // Card styles
  cardWrapperMobile: {
    width: '100%',
    maxWidth: 430,
    marginBottom: Spacing.sm,
  },
  cardWrapperGrid: {
    flex: 1,
    marginBottom: Spacing.sm,
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
  headline: {
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
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 10,
    color: '#1A7848',
    fontWeight: Typography.fontWeight.medium,
  },
  tenureBadge: {
    backgroundColor: '#EDF4FF',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.sm,
  },
  tenureBadgeText: {
    fontSize: 10,
    color: Colors.brandPrimary,
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
    paddingHorizontal: Spacing.xs,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
    borderWidth: 2,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  loadingBox: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
  skeletonContainer: {
    width: '100%',
    maxWidth: 430,
    gap: Spacing.sm,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgSecondary,
  },
  skeletonLine: {
    height: 12,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgSecondary,
    width: '100%',
    marginBottom: 4,
  },
  skeletonChip: {
    width: 80,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgSecondary,
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
