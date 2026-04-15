import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { api, ApiError } from '../../lib/api';
import { useCities, useFnsSearch, FnsOfficeItem, CityItem } from '../../hooks/useFnsData';
import { Avatar } from '../../components/Avatar';
import { LandingHeader } from '../../components/LandingHeader';
import { Footer } from '../../components/Footer';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://p2ptax.smartlaunchhub.com';
const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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
  activity: { responseCount: number; avgRating: number | null; reviewCount: number };
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2);
}

function pluralize(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs >= 11 && abs <= 19) return 'специалистов';
  if (last === 1) return 'специалист';
  if (last >= 2 && last <= 4) return 'специалиста';
  return 'специалистов';
}

function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather key={i} name="star" size={13} color={i <= Math.round(rating) ? '#D97706' : '#BAE6FD'} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dropdown
// ---------------------------------------------------------------------------
function DropdownSelect({ label, icon, value, options, onSelect, placeholder, disabled }: {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  value: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="flex-1 gap-1" style={{ zIndex: 10 }}>
      <Text className="text-xs font-semibold text-slate-500 uppercase">{label}</Text>
      <Pressable
        className={`h-11 bg-white border rounded-lg px-3 flex-row items-center gap-2 ${
          open ? 'border-sky-600' : 'border-sky-200'
        } ${disabled ? 'opacity-50' : ''}`}
        onPress={() => !disabled && setOpen(!open)}
      >
        <Feather name={icon} size={14} color={value ? '#0284C7' : '#94A3B8'} />
        <Text className={`flex-1 text-sm ${value ? 'text-slate-900' : 'text-slate-400'}`} numberOfLines={1}>
          {value ? options.find(o => o.value === value)?.label || value : placeholder}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color="#94A3B8" />
      </Pressable>
      {open && (
        <View className="bg-white border border-sky-200 rounded-xl mt-1 max-h-48 shadow-sm" style={{ position: 'absolute', top: 52, left: 0, right: 0, zIndex: 100 }}>
          <ScrollView style={{ maxHeight: 192 }} nestedScrollEnabled>
            <Pressable className="px-3 py-2" onPress={() => { onSelect(''); setOpen(false); }}>
              <Text className={`text-sm ${!value ? 'text-sky-600 font-semibold' : 'text-slate-900'}`}>Все</Text>
            </Pressable>
            {options.map((opt) => (
              <Pressable key={opt.value} className="px-3 py-2" onPress={() => { onSelect(opt.value); setOpen(false); }}>
                <Text className={`text-sm ${value === opt.value ? 'text-sky-600 font-semibold' : 'text-slate-900'}`}>{opt.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Specialist Card
// ---------------------------------------------------------------------------
const TIER_BADGE_CONFIG: Record<number, { bg: string; border: string; color: string; label: string }> = {
  3: { bg: '#FFF7ED', border: '#F59E0B', color: '#D97706', label: 'TOP' },
  2: { bg: '#F3F0FF', border: '#8B5CF6', color: '#7C3AED', label: 'Featured' },
  1: { bg: '#EFF6FF', border: '#3B82F6', color: '#2563EB', label: 'PRO' },
};

function SpecialistCard({ specialist, onPress }: {
  specialist: SpecialistItem;
  onPress: () => void;
}) {
  const displayName = specialist.displayName || `@${specialist.nick}`;
  const isVerified = specialist.badges.includes('verified');
  const tierCfg = specialist.promoted ? TIER_BADGE_CONFIG[specialist.promotionTier] : null;

  return (
    <Pressable
      onPress={onPress}
      className={`bg-white rounded-xl p-4 gap-3 ${specialist.promoted ? 'border-2' : 'border border-sky-100'}`}
      style={{
        minWidth: 280,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: specialist.promoted ? 0.1 : 0.06,
        shadowRadius: specialist.promoted ? 4 : 2,
        elevation: specialist.promoted ? 4 : 2,
        ...(tierCfg ? { borderColor: tierCfg.border } : {}),
      }}
    >
      {/* Promoted badge */}
      {specialist.promoted && tierCfg && (
        <View className="flex-row items-center gap-1 self-start px-2 py-0.5 rounded-full border" style={{ backgroundColor: tierCfg.bg, borderColor: tierCfg.border }}>
          <Feather name="zap" size={11} color={tierCfg.color} />
          <Text style={{ fontSize: 10, fontWeight: '600', color: tierCfg.color }}>{tierCfg.label}</Text>
        </View>
      )}
      {/* Header: avatar + info */}
      <View className="flex-row gap-3">
        <Avatar name={displayName} imageUri={specialist.avatarUrl || undefined} size="lg" />
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>{displayName}</Text>
            {isVerified && (
              <View className="flex-row items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-full">
                <Feather name="check-circle" size={10} color="#15803D" />
                <Text className="text-[10px] text-green-700 font-medium">Проверен</Text>
              </View>
            )}
          </View>
          {specialist.headline && (
            <Text className="text-sm text-slate-500" numberOfLines={2}>{specialist.headline}</Text>
          )}
          <View className="flex-row items-center gap-1">
            <Feather name="map-pin" size={12} color="#94A3B8" />
            <Text className="text-sm text-slate-400" numberOfLines={1}>
              {specialist.cities.length > 0 ? specialist.cities.join(', ') : 'Не указано'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Stars rating={specialist.activity.avgRating} />
            {specialist.activity.avgRating !== null && (
              <Text className="text-sm font-bold text-slate-900">{specialist.activity.avgRating.toFixed(1)}</Text>
            )}
            {specialist.activity.reviewCount > 0 && (
              <Text className="text-xs text-slate-400">({specialist.activity.reviewCount})</Text>
            )}
          </View>
        </View>
      </View>

      {/* Member since */}
      {specialist.memberSince > 0 && (
        <View className="flex-row items-center gap-1">
          <Feather name="calendar" size={12} color="#94A3B8" />
          <Text className="text-xs text-slate-400">На сайте с {specialist.memberSince} г.</Text>
        </View>
      )}

      {/* Services chips */}
      {specialist.services.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5">
          {specialist.services.slice(0, 4).map((svc) => (
            <View key={svc} className="bg-sky-50 px-2 py-1 rounded-full">
              <Text className="text-xs font-medium text-sky-600">{svc}</Text>
            </View>
          ))}
          {specialist.services.length > 4 && (
            <View className="bg-slate-100 px-2 py-1 rounded-full">
              <Text className="text-xs font-medium text-slate-500">+{specialist.services.length - 4}</Text>
            </View>
          )}
        </View>
      )}

      {/* Button */}
      <Pressable className="h-10 rounded-xl items-center justify-center border border-sky-600 flex-row gap-1" onPress={onPress}>
        <Text className="text-sm font-medium text-sky-600">Подробнее</Text>
        <Feather name="chevron-right" size={16} color="#0284C7" />
      </Pressable>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <View className="bg-white rounded-xl p-4 border border-sky-100 gap-3" style={{ minWidth: 280 }}>
      <View className="flex-row gap-3">
        <View className="w-12 h-12 rounded-full bg-sky-50" />
        <View className="flex-1 gap-1.5">
          <View className="h-4 w-3/4 bg-sky-50 rounded" />
          <View className="h-3 w-1/2 bg-sky-50 rounded" />
          <View className="h-3 w-2/5 bg-sky-50 rounded" />
        </View>
      </View>
      <View className="h-3 w-4/5 bg-sky-50 rounded" />
      <View className="flex-row gap-1.5">
        <View className="h-6 w-24 bg-sky-50 rounded-full" />
        <View className="h-6 w-16 bg-sky-50 rounded-full" />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------
export default function CatalogScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = !isDesktop && width >= 768;
  const router = useRouter();

  // Data state
  const [items, setItems] = useState<SpecialistItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Filter state
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFns, setSelectedFns] = useState<FnsOfficeItem[]>([]);
  const [searchText, setSearchText] = useState('');

  // FNS search
  const [fnsQuery, setFnsQuery] = useState('');
  const { results: fnsSearchResults } = useFnsSearch(fnsQuery, 300);
  const fnsDropdown = fnsSearchResults
    .filter((o) => !selectedFns.some((s) => s.code === o.code))
    .slice(0, 8);

  // Cities & categories
  const { cities: apiCities } = useCities();
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    api.get<ServiceCategory[]>('/categories')
      .then(data => setServiceCategories(data))
      .catch(() => {});
  }, []);

  const cityOptions = useMemo(() =>
    apiCities.map(c => ({ label: c.name, value: c.name })),
    [apiCities],
  );

  const fnsFilterParam = selectedFns.map((o) => o.name).join(',');

  // Fetch specialists
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
      if (searchText.trim()) params.set('search', searchText.trim());
      params.set('page', String(pageNum));
      params.set('limit', String(PAGE_SIZE));

      const data = await api.get<{ items: SpecialistItem[]; total: number; page: number; pages: number }>(
        `/specialists?${params.toString()}`,
      );
      setItems((prev) => append ? [...prev, ...data.items] : data.items);
      setTotal(data.total);
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
    }
  }, [fnsFilterParam, selectedCategory, selectedCity, searchText]);

  // Refetch on filter change
  useEffect(() => {
    fetchSpecialists(1, false);
  }, [fnsFilterParam, selectedCategory, selectedCity]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSpecialists(1, false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchSpecialists(page + 1, true);
    }
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  const clearAllFilters = () => {
    setSelectedCity('');
    setSelectedCategory('');
    setSelectedFns([]);
    setSearchText('');
    setFnsQuery('');
  };

  const hasFilters = selectedCity || selectedCategory || selectedFns.length > 0 || searchText.trim();

  const gridCols = isDesktop ? 3 : isTablet ? 2 : 1;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ title: 'Каталог специалистов — Налоговик' }} />
      <Head>
        <title>Каталог специалистов — Налоговик</title>
        <meta name="description" content="Каталог проверенных налоговых консультантов и юристов. Выберите специалиста по городу, ИФНС и категории." />
        <meta property="og:title" content="Каталог специалистов — Налоговик" />
        <meta property="og:description" content="Каталог проверенных налоговых консультантов и юристов." />
        <meta property="og:url" content={`${APP_URL}/catalog`} />
        <meta property="og:type" content="website" />
      </Head>
      <LandingHeader />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="w-full max-w-5xl mx-auto px-4 py-5 gap-4" style={{ zIndex: 20 }}>
          {/* Header */}
          <View className="gap-0.5">
            <Text className="text-xl font-bold text-slate-900">Каталог специалистов</Text>
            <Text className="text-sm text-slate-400">
              {loading ? 'Загрузка...' : `${total} ${pluralize(total)} найдено`}
            </Text>
          </View>

          {/* Search */}
          <View className="flex-row items-center gap-2 bg-white border border-sky-200 rounded-lg px-3 h-11">
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              className="flex-1 text-sm text-slate-900"
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Поиск по имени, услугам..."
              placeholderTextColor="#94A3B8"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')}>
                <Feather name="x" size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Category chips */}
          {serviceCategories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
            >
              <Pressable
                className={`px-3 py-1.5 rounded-full border ${
                  selectedCategory === '' ? 'bg-sky-600 border-sky-600' : 'bg-white border-sky-200'
                }`}
                style={{ minHeight: 36, justifyContent: 'center' }}
                onPress={() => setSelectedCategory('')}
              >
                <Text className={`text-sm ${selectedCategory === '' ? 'text-white font-semibold' : 'text-slate-600'}`}>
                  Все
                </Text>
              </Pressable>
              {serviceCategories.map((cat) => {
                const isActive = cat.name === selectedCategory;
                return (
                  <Pressable
                    key={cat.id}
                    className={`px-3 py-1.5 rounded-full border ${
                      isActive ? 'bg-sky-600 border-sky-600' : 'bg-white border-sky-200'
                    }`}
                    style={{ minHeight: 36, justifyContent: 'center' }}
                    onPress={() => setSelectedCategory(isActive ? '' : cat.name)}
                  >
                    <Text className={`text-sm ${isActive ? 'text-white font-semibold' : 'text-slate-600'}`}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Filters row: City + FNS */}
          <View className={`gap-3 ${isDesktop ? 'flex-row' : ''}`} style={{ zIndex: 30 }}>
            <DropdownSelect
              label="Город"
              icon="map-pin"
              value={selectedCity}
              options={cityOptions}
              onSelect={handleCityChange}
              placeholder="Выберите город"
            />
            <View className="flex-1 gap-1" style={{ zIndex: 20 }}>
              <Text className="text-xs font-semibold text-slate-500 uppercase">ИФНС</Text>
              <View className="relative">
                <View className="h-11 bg-white border border-sky-200 rounded-lg px-3 flex-row items-center gap-2">
                  <Feather name="home" size={14} color={selectedFns.length > 0 ? '#0284C7' : '#94A3B8'} />
                  <TextInput
                    className="flex-1 text-sm text-slate-900"
                    value={fnsQuery}
                    onChangeText={setFnsQuery}
                    placeholder={selectedFns.length > 0 ? 'Добавить ещё...' : 'Поиск ИФНС...'}
                    placeholderTextColor="#94A3B8"
                    autoCorrect={false}
                  />
                </View>
                {fnsDropdown.length > 0 && (
                  <View
                    className="bg-white border border-sky-200 rounded-xl mt-1 shadow-sm"
                    style={{ position: 'absolute', top: 44, left: 0, right: 0, zIndex: 100, maxHeight: 200 }}
                  >
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {fnsDropdown.map((office) => (
                        <Pressable
                          key={office.code}
                          className="px-3 py-2 border-b border-sky-50"
                          onPress={() => {
                            setSelectedFns((prev) => [...prev, office]);
                            setFnsQuery('');
                          }}
                        >
                          <Text className="text-sm text-slate-900 font-medium" numberOfLines={2}>{office.name}</Text>
                          <Text className="text-xs text-sky-600 mt-0.5">{office.city.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Selected FNS chips */}
          {selectedFns.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5">
              {selectedFns.map((office) => (
                <Pressable
                  key={office.code}
                  className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-sky-50 border border-sky-600"
                  onPress={() => setSelectedFns((prev) => prev.filter((o) => o.code !== office.code))}
                >
                  <Text className="text-xs font-medium text-sky-600" numberOfLines={1} style={{ maxWidth: 160 }}>
                    {office.name}
                  </Text>
                  <Feather name="x" size={12} color="#0284C7" />
                </Pressable>
              ))}
            </View>
          )}

          {/* Active filters summary */}
          {hasFilters && (
            <View className="flex-row items-center gap-2">
              <Pressable onPress={clearAllFilters}>
                <Text className="text-xs font-medium text-red-600">Сбросить все фильтры</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Results */}
        <View className="w-full max-w-5xl mx-auto px-4 gap-3">
          {loading ? (
            // Loading skeletons
            <View className={`gap-3 ${gridCols > 1 ? 'flex-row flex-wrap' : ''}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={gridCols > 1 ? { flex: 1, minWidth: 280, maxWidth: `${100 / gridCols}%` } : undefined}>
                  <SkeletonCard />
                </View>
              ))}
            </View>
          ) : error ? (
            // Error state
            <View className="items-center py-10 gap-3">
              <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center">
                <Feather name="alert-circle" size={32} color="#DC2626" />
              </View>
              <Text className="text-lg font-semibold text-slate-900">Ошибка загрузки</Text>
              <Text className="text-sm text-slate-400 text-center max-w-xs">{error}</Text>
              <Pressable
                className="px-6 py-2 bg-sky-600 rounded-lg mt-2"
                onPress={() => fetchSpecialists(1, false)}
              >
                <Text className="text-sm font-medium text-white">Повторить</Text>
              </Pressable>
            </View>
          ) : items.length === 0 ? (
            // Empty state
            <View className="items-center py-10 gap-3">
              <View className="w-16 h-16 rounded-full bg-sky-50 items-center justify-center">
                <Feather name="search" size={32} color="#94A3B8" />
              </View>
              <Text className="text-lg font-semibold text-slate-900">Специалисты не найдены</Text>
              <Text className="text-sm text-slate-400 text-center max-w-xs">
                Попробуйте изменить параметры фильтрации
              </Text>
              {hasFilters && (
                <Pressable
                  className="px-6 py-2 border border-sky-600 rounded-lg mt-2"
                  onPress={clearAllFilters}
                >
                  <Text className="text-sm font-medium text-sky-600">Сбросить фильтры</Text>
                </Pressable>
              )}
            </View>
          ) : (
            // Results grid
            <>
              <View className={`gap-3 ${gridCols > 1 ? 'flex-row flex-wrap' : ''}`}>
                {items.map((sp) => (
                  <View
                    key={sp.nick}
                    style={gridCols > 1 ? { width: `${(100 / gridCols) - 1}%` } : undefined}
                  >
                    <SpecialistCard
                      specialist={sp}
                      onPress={() => router.push(`/specialists/${sp.nick}`)}
                    />
                  </View>
                ))}
              </View>

              {/* Load more */}
              {hasMore && (
                <View className="items-center py-4">
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#0284C7" />
                  ) : (
                    <Pressable
                      className="px-8 py-3 border border-sky-600 rounded-xl"
                      onPress={handleLoadMore}
                    >
                      <Text className="text-sm font-medium text-sky-600">Показать ещё</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        <View className="w-full max-w-5xl mx-auto px-4 mt-6">
          <Footer isWide={isDesktop} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
