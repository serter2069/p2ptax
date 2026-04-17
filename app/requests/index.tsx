import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import RequestCard from "@/components/RequestCard";
import FilterBar from "@/components/FilterBar";
import EmptyState from "@/components/EmptyState";
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

export default function PublicRequestsFeed() {
  const router = useRouter();

  const [cities, setCities] = useState<CityOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const fetchRequests = useCallback(
    async (pageNum: number, append = false) => {
      try {
        let path = `/api/requests/public?page=${pageNum}&limit=20`;
        if (selectedCityId) path += `&city_id=${selectedCityId}`;

        const res = await api<RequestsResponse>(path, { noAuth: true });

        if (append) {
          setRequests((prev) => [...prev, ...res.items]);
        } else {
          setRequests(res.items);
        }
        setHasMore(res.hasMore);
        setPage(pageNum);
      } catch (e) {
        console.error("Fetch requests error:", e);
      }
    },
    [selectedCityId]
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

  // Refetch when filters change
  useEffect(() => {
    setLoading(true);
    fetchRequests(1).finally(() => setLoading(false));
  }, [selectedCityId, fetchRequests]);

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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Заявки" />
      <ResponsiveContainer>
        <FilterBar
          cities={cities}
          selectedCityId={selectedCityId}
          onCityChange={setSelectedCityId}
        />
        {loading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator size="large" color="#1e3a5f" />
          </View>
        ) : requests.length === 0 ? (
          <EmptyState
            icon="file-text-o"
            title="Заявок не найдено"
            subtitle="Попробуйте изменить фильтры"
          />
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-0 pb-4 pt-2"
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
                <ActivityIndicator size="small" color="#1e3a5f" className="py-4" />
              ) : null
            }
          />
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
