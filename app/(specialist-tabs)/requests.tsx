import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import RequestCard from "@/components/RequestCard";
import FilterBar from "@/components/FilterBar";
import { TriangleAlert, FileText } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { colors, overlay } from "@/lib/theme";

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

export default function SpecialistPublicRequests() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [cities, setCities] = useState<CityOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const fetchRequests = useCallback(
    async (pageNum: number, append = false) => {
      try {
        let path = `/api/requests/public?page=${pageNum}&limit=20`;
        if (selectedCityId) path += `&city_id=${selectedCityId}`;
        if (selectedServiceId) path += `&service_id=${selectedServiceId}`;

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
      } catch (e) {
        console.error("Fetch requests error:", e);
        if (!append) setError("Не удалось загрузить заявки");
      }
    },
    [selectedCityId, selectedServiceId]
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
      await fetchRequests(1);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRequests(1).finally(() => setLoading(false));
  }, [selectedCityId, selectedServiceId, fetchRequests]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests(1);
    setRefreshing(false);
  }, [fetchRequests]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchRequests(page + 1, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, page, fetchRequests]);

  const handleRequestPress = useCallback(
    (id: string) => {
      router.push(`/requests/${id}` as never);
    },
    [router]
  );

  const handleServiceToggle = useCallback((id: string) => {
    setSelectedServiceId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderHome />
      <ResponsiveContainer>
        {/* Accent hero */}
        <View className="rounded-2xl px-5 py-5 mb-4 mt-2" style={{ backgroundColor: colors.accent }}>
          <Text className="text-xl font-bold text-white mb-0.5">Публичные заявки</Text>
          <Text className="text-sm" style={{ color: overlay.white75 }}>Находите клиентов по своей специализации</Text>
          {total > 0 && (
            <Text className="text-sm font-semibold text-white mt-2">{total} заявок доступно</Text>
          )}
        </View>

        <FilterBar
          cities={cities}
          selectedCityId={selectedCityId}
          onCityChange={setSelectedCityId}
          services={services}
          selectedServiceIds={selectedServiceId ? [selectedServiceId] : []}
          onServiceToggle={handleServiceToggle}
        />

        {loading ? (
          <View className="py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} className="mb-3 bg-white rounded-2xl overflow-hidden border border-border">
                <LoadingState variant="skeleton" lines={4} />
              </View>
            ))}
          </View>
        ) : error ? (
          <EmptyState
            icon={TriangleAlert}
            title="Ошибка загрузки"
            subtitle={error}
            actionLabel="Повторить"
            onAction={() => {
              setLoading(true);
              fetchRequests(1).finally(() => setLoading(false));
            }}
          />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Заявок не найдено"
            subtitle="Попробуйте изменить фильтры"
            actionLabel="Сбросить фильтры"
            onAction={() => {
              setSelectedCityId(null);
              setSelectedServiceId(null);
            }}
          />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerClassName={isDesktop ? "pb-8 pt-2" : "pb-4 pt-2"}
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
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color={colors.primary} className="py-4" />
              ) : null
            }
          />
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
