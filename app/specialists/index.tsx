import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import SpecialistCard from "@/components/SpecialistCard";
import FilterBar from "@/components/FilterBar";
import CityFnsCascade from "@/components/filters/CityFnsCascade";
import { AlertCircle, UserX, Search } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { colors, textStyle, BREAKPOINT } from "@/lib/theme";

interface CityOption {
  id: string;
  name: string;
  fnsOffices: { id: string; name: string; code: string }[];
}

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
  description?: string | null;
}

interface SpecialistsResponse {
  items: SpecialistItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export default function SpecialistsCatalog() {
  const router = useRouter()
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWide = width >= 1024;
  const gridCols = isWide ? 3 : isDesktop ? 2 : 1;
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const [cities, setCities] = useState<CityOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [selectedFnsIds, setSelectedFnsIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasFilters =
    selectedCityIds.length > 0 ||
    selectedFnsIds.length > 0 ||
    selectedServiceIds.length > 0;

  const resetFilters = useCallback(() => {
    setSelectedCityIds([]);
    setSelectedFnsIds([]);
    setSelectedServiceIds([]);
  }, []);

  const fetchSpecialists = useCallback(
    async (pageNum: number, append = false, q?: string) => {
      try {
        const searchQ = q ?? search;
        let path = `/api/specialists?page=${pageNum}&limit=20`;
        if (selectedCityIds.length > 0)
          path += `&city_ids=${selectedCityIds.join(",")}`;
        if (selectedFnsIds.length > 0)
          path += `&fns_ids=${selectedFnsIds.join(",")}`;
        if (selectedServiceIds.length > 0)
          path += `&services=${selectedServiceIds.join(",")}`;
        if (searchQ.trim()) path += `&q=${encodeURIComponent(searchQ.trim())}`;

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
    [selectedCityIds, selectedFnsIds, selectedServiceIds, search]
  );

  const fetchSpecialistsRef = useRef(fetchSpecialists);
  fetchSpecialistsRef.current = fetchSpecialists;

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [citiesRes, servicesRes] = await Promise.all([
          api<{ items: CityOption[] }>("/api/cities", { noAuth: true }),
          api<{ items: ServiceOption[] }>("/api/services", { noAuth: true }),
        ]);
        setCities(citiesRes.items);
        setServices(servicesRes.items);
      } catch (e) {
      }
      await fetchSpecialistsRef.current(1);
      setLoading(false);
    }
    init();
  }, []);

  // Refetch on filter change
  useEffect(() => {
    setLoading(true);
    fetchSpecialists(1).finally(() => setLoading(false));
  }, [selectedCityIds, selectedFnsIds, selectedServiceIds, fetchSpecialists]);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setLoading(true);
      fetchSpecialistsRef.current(1, false, search).finally(() => setLoading(false));
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  const handleCascadeChange = useCallback(
    (v: { cities: string[]; fns: string[] }) => {
      setSelectedCityIds(v.cities);
      setSelectedFnsIds(v.fns);
    },
    []
  );

  const handleServiceToggle = useCallback((id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
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
    [router]
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

  if (loading && specialists.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        {!isDesktop && (
          <Text className="text-xl font-bold text-text-base mx-4 mt-4 mb-2">Специалисты</Text>
        )}
        <View className="py-4 px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} className="mb-3 bg-white rounded-2xl overflow-hidden border border-border">
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
          <Text className="text-xl font-bold text-text-base mx-4 mt-4 mb-2">Специалисты</Text>
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

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      {/* Compact header — mobile only (desktop uses sidebar nav) */}
      {!isDesktop && (
        <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
          <Text className="text-xl font-bold" style={{ color: colors.text }}>Специалисты</Text>
          {specialists.length > 0 && (
            <Text className="text-sm" style={{ color: colors.textMuted }}>{specialists.length} специалистов</Text>
          )}
        </View>
      )}
      {isDesktop && (
        <View className="flex-row items-center justify-between px-4 pt-4 pb-1">
          <Text style={{ ...textStyle.h2, color: colors.text }}>Специалисты</Text>
          {total > 0 && (
            <Text className="text-sm" style={{ color: colors.textMuted }}>{total} специалистов</Text>
          )}
        </View>
      )}

      {/* Search bar */}
      <View className="flex-row items-center bg-white border border-border rounded-xl mx-4 mt-3 mb-2 px-4 h-12">
        <Search size={14} color={colors.placeholder} style={{ marginRight: 8 }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по имени, роли, ФНС..."
          placeholderTextColor={colors.placeholder}
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.text,
            height: 48,
            backgroundColor: "transparent",
            ...(Platform.OS === "web" ? {
              borderWidth: 0,
              outlineStyle: "none" as never,
              outlineWidth: 0,
              appearance: "none" as never,
              borderRadius: 8,
              paddingHorizontal: 8,
            } : {}),
          }}
        />
      </View>

      {/* City → FNS cascade + services chips */}
      <View className="bg-white border-b border-border py-2">
        <CityFnsCascade
          mode="multi"
          value={{ cities: selectedCityIds, fns: selectedFnsIds }}
          onChange={handleCascadeChange}
          citiesSource={cities.map((c) => ({ id: c.id, name: c.name }))}
        />
        <FilterBar
          cities={[]}
          selectedCityId={null}
          onCityChange={() => {}}
          services={services}
          selectedServiceIds={selectedServiceIds}
          onServiceToggle={handleServiceToggle}
        />
      </View>

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
          columnWrapperStyle={gridCols > 1 ? { gap: 16, paddingHorizontal: isWide ? 32 : 16 } : undefined}
          contentContainerStyle={{
            paddingHorizontal: gridCols > 1 ? 0 : 16,
            paddingBottom: 48,
            paddingTop: 16,
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
              <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 16 }} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
