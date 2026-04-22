import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import SpecialistCard from "@/components/SpecialistCard";
import FilterBar from "@/components/FilterBar";
import { AlertCircle, UserX, ChevronLeft, Search } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";

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
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

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
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasFilters =
    selectedCityId !== null ||
    selectedFnsId !== null ||
    selectedServiceIds.length > 0;

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const fnsOffices = selectedCity?.fnsOffices || [];

  const resetFilters = useCallback(() => {
    setSelectedCityId(null);
    setSelectedFnsId(null);
    setSelectedServiceIds([]);
  }, []);

  const fetchSpecialists = useCallback(
    async (pageNum: number, append = false, q?: string) => {
      try {
        const searchQ = q ?? search;
        let path = `/api/specialists?page=${pageNum}&limit=20`;
        if (selectedCityId) path += `&city_id=${selectedCityId}`;
        if (selectedFnsId) path += `&fns_id=${selectedFnsId}`;
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
    [selectedCityId, selectedFnsId, selectedServiceIds, search]
  );

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
      await fetchSpecialists(1);
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch on filter change
  useEffect(() => {
    setLoading(true);
    fetchSpecialists(1).finally(() => setLoading(false));
  }, [selectedCityId, selectedFnsId, selectedServiceIds, fetchSpecialists]);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setLoading(true);
      fetchSpecialists(1, false, search).finally(() => setLoading(false));
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCityChange = useCallback((id: string | null) => {
    setSelectedCityId(id);
    setSelectedFnsId(null);
  }, []);

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
      router.push(`/specialists/${id}` as never);
    },
    [router]
  );

  if (loading && specialists.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* Page header */}
        <View className="bg-white px-4 pt-4 pb-2">
          <Pressable onPress={() => router.back()} className="min-h-[44px] justify-center mb-2 self-start">
            <ChevronLeft size={16} color="#2256c2" />
          </Pressable>
          <Text className="font-extrabold text-3xl" style={{ color: "#0f172a" }}>Каталог специалистов</Text>
        </View>
        <View className="py-4 px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} className="mb-3 bg-white rounded-2xl overflow-hidden border border-slate-100">
              <LoadingState variant="skeleton" lines={4} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error && specialists.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-white px-4 pt-4 pb-2">
          <Pressable onPress={() => router.back()} className="min-h-[44px] justify-center mb-2 self-start">
            <ChevronLeft size={16} color="#2256c2" />
          </Pressable>
          <Text className="font-extrabold text-3xl" style={{ color: "#0f172a" }}>Каталог специалистов</Text>
        </View>
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
    <SafeAreaView className="flex-1 bg-white">
      {/* Page header */}
      <View className="bg-white px-4 pt-4 pb-2">
        <Pressable onPress={() => router.back()} className="min-h-[44px] justify-center mb-2 self-start">
          <ChevronLeft size={16} color="#2256c2" />
        </Pressable>
        <Text className="font-extrabold text-3xl" style={{ color: "#0f172a" }}>Каталог специалистов</Text>
        <Text className="text-sm mt-1 mb-3" style={{ color: "#64748B" }}>
          Практики с опытом в вашей ИФНС. Выбирайте по инспекции, городу и типу проверки.
        </Text>
      </View>

      {/* Search bar */}
      <View className="flex-row items-center bg-white border border-border rounded-xl mx-4 mb-3 px-4 min-h-[48px]">
        <Search size={14} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по имени, роли, ФНС..."
          placeholderTextColor="#94a3b8"
          style={{ flex: 1, fontSize: 15, color: "#0f172a", height: 48 }}
        />
        {total > 0 && (
          <Text className="text-sm" style={{ color: "#64748B" }}>{total} специалистов</Text>
        )}
      </View>

      {/* FilterBar */}
      <FilterBar
        cities={cities}
        selectedCityId={selectedCityId}
        onCityChange={handleCityChange}
        services={services}
        selectedServiceIds={selectedServiceIds}
        onServiceToggle={handleServiceToggle}
        fnsOffices={fnsOffices.map((f) => ({ id: f.id, name: f.name }))}
        selectedFnsId={selectedFnsId}
        onFnsChange={setSelectedFnsId}
      />

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
          key={isDesktop ? "grid-2" : "grid-1"}
          data={specialists}
          keyExtractor={(item) => item.id}
          numColumns={isDesktop ? 2 : 1}
          columnWrapperStyle={isDesktop ? { gap: 12, paddingHorizontal: 16 } : undefined}
          contentContainerStyle={{
            paddingHorizontal: isDesktop ? 0 : 16,
            paddingBottom: 32,
            paddingTop: 8,
            maxWidth: isDesktop ? 900 : undefined,
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: "100%" as const,
          }}
          renderItem={({ item }) => (
            <View style={isDesktop ? { flex: 1 } : undefined}>
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
              <ActivityIndicator size="small" color="#2256c2" style={{ paddingVertical: 16 }} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
