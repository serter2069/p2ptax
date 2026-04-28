import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTypedRouter } from "@/lib/navigation";
import SpecialistCard from "@/components/SpecialistCard";
import SpecialistSearchBar, {
  CityOpt,
  FnsOpt,
} from "@/components/filters/SpecialistSearchBar";
import { AlertCircle, UserX } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { colors, textStyle } from "@/lib/theme";

interface ServiceOption {
  id: string;
  name: string;
}

interface SpecialistItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  specialistFns?: {
    fnsId: string;
    fnsName: string;
    city: { id: string; name: string };
    services: { id: string; name: string }[];
  }[];
  description?: string | null;
}

interface SpecialistsResponse {
  items: SpecialistItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface CitiesResponse {
  items: { id: string; name: string; slug: string; officesCount: number }[];
}

interface FnsResponse {
  offices: {
    id: string;
    name: string;
    code: string;
    cityId: string;
    address?: string | null;
    city?: { id: string; name: string };
  }[];
}

export default function SpecialistsCatalog() {
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWide = width >= 1024;
  const gridCols = isWide ? 3 : isDesktop ? 2 : 1;
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const [cities, setCities] = useState<CityOpt[]>([]);
  const [fnsAll, setFnsAll] = useState<FnsOpt[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const hasFilters =
    selectedCityId !== null ||
    selectedFnsId !== null ||
    selectedServiceIds.length > 0;

  const resetFilters = useCallback(() => {
    setSelectedCityId(null);
    setSelectedFnsId(null);
    setSelectedServiceIds([]);
  }, []);

  const fetchSpecialists = useCallback(
    async (pageNum: number, append = false) => {
      try {
        let path = `/api/specialists?page=${pageNum}&limit=20`;
        if (selectedCityId) path += `&city_ids=${selectedCityId}`;
        if (selectedFnsId) path += `&fns_ids=${selectedFnsId}`;
        if (selectedServiceIds.length > 0)
          path += `&services=${selectedServiceIds.join(",")}`;

        const res = await api<SpecialistsResponse>(path, { noAuth: true });

        if (append) {
          setSpecialists((prev) => [...prev, ...res.items]);
        } else {
          setSpecialists(res.items);
        }
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(pageNum);
        setError(null);
      } catch (e) {
        setError("Не удалось загрузить список");
      }
    },
    [selectedCityId, selectedFnsId, selectedServiceIds]
  );

  const fetchSpecialistsRef = useRef(fetchSpecialists);
  fetchSpecialistsRef.current = fetchSpecialists;

  // Initial load: cities, services, then all FNS in one batch (for typeahead).
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      try {
        const [citiesRes, servicesRes] = await Promise.all([
          api<CitiesResponse>("/api/cities", { noAuth: true }),
          api<{ items: ServiceOption[] }>("/api/services", { noAuth: true }),
        ]);
        if (cancelled) return;
        setCities(citiesRes.items.map((c) => ({ id: c.id, name: c.name })));
        setServices(servicesRes.items);

        // Load all FNS for typeahead — one request keyed by all city ids.
        if (citiesRes.items.length > 0) {
          const ids = citiesRes.items.map((c) => c.id).join(",");
          try {
            const fnsRes = await api<FnsResponse>(
              `/api/fns?city_ids=${ids}`,
              { noAuth: true }
            );
            if (cancelled) return;
            setFnsAll(
              fnsRes.offices.map((f) => ({
                id: f.id,
                name: f.name,
                code: f.code,
                cityId: f.cityId,
                cityName: f.city?.name,
              }))
            );
          } catch {
            /* typeahead degrades gracefully — empty FNS list */
          }
        }
      } catch (e) {
        // ignore — page still renders without filters
      }
      await fetchSpecialistsRef.current(1);
      if (!cancelled) setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refetch on filter change
  useEffect(() => {
    setLoading(true);
    fetchSpecialists(1).finally(() => setLoading(false));
  }, [selectedCityId, selectedFnsId, selectedServiceIds, fetchSpecialists]);

  const handlePickCity = useCallback((cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedFnsId(null);
  }, []);

  const handlePickFns = useCallback((fns: FnsOpt) => {
    setSelectedCityId(fns.cityId);
    setSelectedFnsId(fns.id);
  }, []);

  const handleClearLocation = useCallback(() => {
    setSelectedCityId(null);
    setSelectedFnsId(null);
  }, []);

  const handleServiceToggle = useCallback((id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const handleClearServices = useCallback(() => {
    setSelectedServiceIds([]);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSpecialists(1);
    setRefreshing(false);
  }, [fetchSpecialists]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchSpecialists(page + 1, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, page, fetchSpecialists]);

  const handleSpecialistPress = useCallback(
    (id: string) => {
      nav.any(`/specialists/${id}`);
    },
    [nav]
  );

  const handleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const headerCount = useMemo(() => {
    if (loading) return null;
    return total > 0 ? total : specialists.length;
  }, [loading, total, specialists.length]);

  if (loading && specialists.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        {!isDesktop && (
          <Text className="text-xl font-bold text-text-base mx-4 mt-4 mb-2">
            Специалисты
          </Text>
        )}
        <View className="py-4 px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              className="mb-3 bg-white rounded-2xl overflow-hidden border border-border"
            >
              <LoadingState variant="skeleton" lines={4} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error && specialists.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        {!isDesktop && (
          <Text className="text-xl font-bold text-text-base mx-4 mt-4 mb-2">
            Специалисты
          </Text>
        )}
        <EmptyState
          icon={AlertCircle}
          title="Не удалось загрузить список"
          subtitle="Проверьте соединение с интернетом и попробуйте снова"
          actionLabel="Повторить"
          onAction={() => {
            setLoading(true);
            fetchSpecialists(1).finally(() => setLoading(false));
          }}
        />
      </SafeAreaView>
    );
  }

  const allServicesActive = selectedServiceIds.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      {/* Compact header — Row 1: title + count */}
      <View
        className={`flex-row items-center justify-between px-4 ${
          isDesktop ? "pt-4" : "pt-2"
        } pb-1`}
      >
        <Text
          style={
            isDesktop
              ? { ...textStyle.h3, color: colors.text }
              : { ...textStyle.h4, color: colors.text }
          }
        >
          Специалисты
        </Text>
        {headerCount !== null && headerCount > 0 && (
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            {headerCount} специалистов
          </Text>
        )}
      </View>

      {/* Row 2: typeahead search bar */}
      <View className="px-4 pt-2" style={{ zIndex: 20 }}>
        <SpecialistSearchBar
          cities={cities}
          fnsAll={fnsAll}
          selectedCityId={selectedCityId}
          selectedFnsId={selectedFnsId}
          onPickCity={handlePickCity}
          onPickFns={handlePickFns}
          onClear={handleClearLocation}
        />
      </View>

      {/* Row 3: compact service chips */}
      {services.length > 0 && (
        <View className="pt-2 pb-2" style={{ zIndex: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              paddingHorizontal: 16,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Не знаю — все услуги"
              onPress={handleClearServices}
              className={`px-3 h-8 items-center justify-center rounded-full border ${
                allServicesActive
                  ? "bg-accent border-accent"
                  : "bg-white border-border"
              }`}
            >
              <Text
                className={`text-xs ${
                  allServicesActive ? "text-white font-medium" : "text-text-base"
                }`}
              >
                Не знаю
              </Text>
            </Pressable>
            {services.map((s) => {
              const active = selectedServiceIds.includes(s.id);
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityLabel={s.name}
                  onPress={() => handleServiceToggle(s.id)}
                  className={`px-3 h-8 items-center justify-center rounded-full border ${
                    active ? "bg-accent border-accent" : "bg-white border-border"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      active ? "text-white font-medium" : "text-text-base"
                    }`}
                  >
                    {s.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Specialist list */}
      {specialists.length === 0 && !loading ? (
        <EmptyState
          icon={UserX}
          title="Специалистов не найдено"
          subtitle="Попробуйте изменить фильтры или выбрать другой город"
          actionLabel={hasFilters ? "Сбросить фильтры" : undefined}
          onAction={hasFilters ? resetFilters : undefined}
        />
      ) : (
        <FlatList
          key={`grid-${gridCols}`}
          data={specialists}
          keyExtractor={(item) => item.id}
          numColumns={gridCols}
          columnWrapperStyle={
            gridCols > 1
              ? { gap: 16, paddingHorizontal: isWide ? 32 : 16 }
              : undefined
          }
          contentContainerStyle={{
            paddingHorizontal: gridCols > 1 ? 0 : 16,
            paddingBottom: 48,
            paddingTop: 8,
            maxWidth: isWide ? 1200 : isDesktop ? 900 : undefined,
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: "100%" as const,
          }}
          renderItem={({ item }) => (
            <View style={gridCols > 1 ? { flex: 1 } : undefined}>
              <SpecialistCard
                id={item.id}
                firstName={item.firstName}
                lastName={item.lastName}
                avatarUrl={item.avatarUrl}
                createdAt={item.createdAt}
                services={item.services}
                cities={item.cities}
                specialistFns={item.specialistFns}
                description={item.description}
                onPress={handleSpecialistPress}
                onBookmark={handleBookmark}
                bookmarked={bookmarkedIds.has(item.id)}
                variant="vertical"
              />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
