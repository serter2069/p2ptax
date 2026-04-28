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
import HeaderBack from "@/components/HeaderBack";
import { AlertCircle, UserX, Search } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { colors, overlay, textStyle, BREAKPOINT } from "@/lib/theme";

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
  const isDesktop = width >= BREAKPOINT;
  const isWide = width >= 1024;
  const gridCols = isWide ? 3 : isDesktop ? 2 : 1;

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
        console.error("Fetch specialists error:", e);
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
        console.error("Init error:", e);
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

  if (loading && specialists.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <HeaderBack title="Специалисты" />
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
        <HeaderBack title="Специалисты" />
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
      <HeaderBack title="Специалисты" />
      <View style={{ backgroundColor: colors.accent, width: "100%", alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: isWide ? 1200 : isDesktop ? 900 : undefined, paddingHorizontal: isWide ? 32 : 16, paddingTop: 20, paddingBottom: 20 }}>
        <Text style={{ ...(isWide ? textStyle.h1 : textStyle.h3), color: colors.white, marginBottom: 4 }}>Каталог специалистов</Text>
        <Text style={{ ...textStyle.small, color: overlay.white90 }}>Практики с опытом в вашей ИФНС. Выбирайте по инспекции, городу и типу проверки.</Text>
        <View className="flex-row mt-4 gap-3">
          <View className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: overlay.white15 }}>
            <Text className="text-xs" style={{ color: overlay.white90 }}>Специалистов</Text>
            <Text className="text-xl font-bold text-white">{total > 0 ? total : "..."}</Text>
          </View>
          <View className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: overlay.white15 }}>
            <Text className="text-xs" style={{ color: overlay.white90 }}>Готовы помочь</Text>
            <Text className="text-xl font-bold text-white">Сейчас</Text>
          </View>
        </View>
        </View>
      </View>

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
              borderRadius: 8,
              paddingHorizontal: 8,
              outlineStyle: "none" as never,
            } : {}),
          }}
        />
        {total > 0 && (
          <Text className="text-sm text-text-mute">{total} специалистов</Text>
        )}
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
                services={item.services}
                cities={item.cities}
                description={item.description}
                onPress={handleSpecialistPress}
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
