import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTypedRouter } from "@/lib/navigation";
import DesktopScreen from "@/components/layout/DesktopScreen";
import CityFnsCascade from "@/components/filters/CityFnsCascade";
import { Inbox, ChevronLeft } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import RequestCard from "@/components/RequestCard";
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

interface RequestItem {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  createdAt: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  threadsCount: number;
}

interface RequestsResponse {
  items: RequestItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const LIMIT = 20;

export default function PublicRequestsFeed() {
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;

  const [cities, setCities] = useState<CityOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const [initLoading, setInitLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const loadingMoreRef = useRef(false);
  const isFirstMount = useRef(true);

  const fetchRequests = useCallback(
    async (pageNum: number, append = false) => {
      try {
        let path = `/api/requests/public?page=${pageNum}&limit=${LIMIT}`;
        if (selectedCityId) path += `&city_id=${selectedCityId}`;
        if (selectedFnsId) path += `&fns_id=${selectedFnsId}`;

        const res = await api<RequestsResponse>(path, { noAuth: true });

        if (append) {
          setRequests((prev) => [...prev, ...res.items]);
        } else {
          setRequests(res.items);
        }
        setHasMore(res.hasMore);
        setTotal(res.total);
        setPage(pageNum);
        setError(null);
      } catch {
        setError("Не удалось загрузить запросы");
      }
    },
    [selectedCityId, selectedFnsId]
  );

  const fetchRequestsRef = useRef(fetchRequests);
  fetchRequestsRef.current = fetchRequests;

  // Initial load: fetch cities, services, and first page of requests
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setInitLoading(true);
      setError(null);
      try {
        const [citiesRes, servicesRes] = await Promise.all([
          api<{ items: CityOption[] }>("/api/cities", { noAuth: true }),
          api<{ items: ServiceOption[] }>("/api/services", { noAuth: true }),
        ]);
        if (!cancelled) {
          setCities(citiesRes.items);
          setServices(servicesRes.items);
        }
      } catch {
        // Non-fatal: filters will just be empty
      }
      if (!cancelled) {
        await fetchRequestsRef.current(1);
        setInitLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-fetch when city filter changes (skip on first mount since init handles it)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setListLoading(true);
    setPage(1);
    fetchRequests(1).finally(() => setListLoading(false));
  }, [selectedCityId, selectedFnsId, fetchRequests]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests(1);
    setRefreshing(false);
  }, [fetchRequests]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    await fetchRequests(page + 1, true);
    setLoadingMore(false);
    loadingMoreRef.current = false;
  }, [hasMore, page, fetchRequests]);

  const handleServiceChange = useCallback((id: string | null) => {
    setSelectedServiceId(id);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedCityId(null);
    setSelectedFnsId(null);
    setSelectedServiceId(null);
  }, []);

  const handleCascadeChange = useCallback(
    (v: { cities: string[]; fns: string[] }) => {
      setSelectedCityId(v.cities[0] ?? null);
      setSelectedFnsId(v.fns[0] ?? null);
    },
    []
  );

  const handleRequestPress = useCallback(
    (id: string) => {
      nav.dynamic.requestDetail(id);
    },
    [nav]
  );

  const hasFilters =
    selectedCityId !== null ||
    selectedFnsId !== null ||
    selectedServiceId !== null;

  // Skeleton on initial load
  if (initLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <View className="flex-1 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} className="mx-4 mb-3 bg-white rounded-2xl overflow-hidden border border-border">
              <LoadingState variant="skeleton" lines={4} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      {/* Accent hero */}
      <View className="bg-accent px-4 py-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          onPress={() => nav.back()}
          className="flex-row items-center mb-2"
        >
          <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
          <Text style={{ ...textStyle.small, color: overlay.white90, marginLeft: 2 }}>Назад</Text>
        </Pressable>
        <Text style={{ ...textStyle.h3, color: colors.white, marginBottom: 2 }}>Открытые запросы</Text>
        <Text style={{ ...textStyle.small, color: overlay.white90 }}>Задайте вопрос — получите предложения от специалистов</Text>
        {total > 0 && (
          <Text className="text-sm font-semibold text-white mt-2">{total} активных запросов</Text>
        )}
      </View>

      {/* Filter bar: city → FNS cascade + services chips */}
      <View className="bg-white border-b border-border py-2">
        <CityFnsCascade
          mode="single"
          value={{
            cities: selectedCityId ? [selectedCityId] : [],
            fns: selectedFnsId ? [selectedFnsId] : [],
          }}
          onChange={handleCascadeChange}
          citiesSource={cities.map((c) => ({ id: c.id, name: c.name }))}
          services={services}
          selectedServiceId={selectedServiceId}
          onServiceChange={handleServiceChange}
        />
      </View>

      <View className="flex-1">
        {error ? (
          <ErrorState
            message="Не удалось загрузить запросы. Проверьте соединение с интернетом и попробуйте снова."
            onRetry={() => {
              setError(null);
              setListLoading(true);
              fetchRequests(1).finally(() => setListLoading(false));
            }}
          />
        ) : listLoading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Запросов не найдено"
            subtitle="Попробуйте изменить фильтры или сбросить их"
            actionLabel={hasFilters ? "Сбросить фильтры" : undefined}
            onAction={hasFilters ? handleResetFilters : undefined}
          />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: isDesktop ? 24 : 16,
              paddingTop: 12,
              paddingBottom: 24,
              maxWidth: isDesktop ? 720 : undefined,
              alignSelf: isDesktop ? "center" as const : undefined,
              width: "100%" as const,
            }}
            renderItem={({ item }) => (
              <RequestCard
                id={item.id}
                title={item.title}
                description={item.description}
                status={item.status}
                city={item.city}
                fns={item.fns}
                threadsCount={item.threadsCount}
                onPress={handleRequestPress}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : hasMore ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Загрузить ещё"
                  onPress={handleLoadMore}
                  className="py-4 items-center"
                >
                  <Text className="text-sm font-medium text-accent">
                    Загрузить ещё
                  </Text>
                </Pressable>
              ) : (
                <View className="py-4 items-center">
                  <Text className="text-xs text-text-mute">
                    Все запросы загружены
                  </Text>
                </View>
              )
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
