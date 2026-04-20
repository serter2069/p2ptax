import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import FilterBar from "@/components/FilterBar";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import RequestCard from "@/components/RequestCard";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";

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
  const router = useRouter();

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

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const loadingMoreRef = useRef(false);
  const isFirstMount = useRef(true);

  const fetchRequests = useCallback(
    async (pageNum: number, append = false) => {
      try {
        let path = `/api/requests/public?page=${pageNum}&limit=${LIMIT}`;
        if (selectedCityId) path += `&city_id=${selectedCityId}`;

        const res = await api<RequestsResponse>(path, { noAuth: true });

        if (append) {
          setRequests((prev) => [...prev, ...res.items]);
        } else {
          setRequests(res.items);
        }
        setHasMore(res.hasMore);
        setPage(pageNum);
        setError(null);
      } catch {
        setError("Не удалось загрузить заявки");
      }
    },
    [selectedCityId]
  );

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
        await fetchRequests(1);
        setInitLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [selectedCityId, fetchRequests]);

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

  const handleServiceToggle = useCallback((id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedCityId(null);
    setSelectedServiceIds([]);
  }, []);

  const handleRequestPress = useCallback(
    (id: string) => {
      router.push(`/requests/${id}` as never);
    },
    [router]
  );

  const hasFilters = selectedCityId !== null || selectedServiceIds.length > 0;

  // Skeleton on initial load
  if (initLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <HeaderBack title="Заявки" />
        <View className="flex-1 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} className="mx-4 mb-3 bg-white rounded-2xl overflow-hidden border border-slate-100">
              <LoadingState variant="skeleton" lines={4} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <HeaderBack title="Заявки" />

      {/* Filter bar */}
      <View className="bg-white border-b border-slate-100">
        <FilterBar
          cities={cities}
          selectedCityId={selectedCityId}
          onCityChange={setSelectedCityId}
          services={services}
          selectedServiceIds={selectedServiceIds}
          onServiceToggle={handleServiceToggle}
        />
      </View>

      <View className="flex-1">
        {error ? (
          <ErrorState
            message="Не удалось загрузить заявки. Проверьте соединение с интернетом и попробуйте снова."
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
            icon="inbox"
            title="Заявок не найдено"
            subtitle="Попробуйте изменить фильтры или сбросить их"
            actionLabel={hasFilters ? "Сбросить фильтры" : undefined}
            onAction={hasFilters ? handleResetFilters : undefined}
          />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
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
                  <Text className="text-sm font-medium text-blue-900">
                    Загрузить ещё
                  </Text>
                </Pressable>
              ) : (
                <View className="py-4 items-center">
                  <Text className="text-xs text-slate-400">
                    Все заявки загружены
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
