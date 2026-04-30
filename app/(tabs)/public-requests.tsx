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
import { useTypedRouter } from "@/lib/navigation";
import DesktopScreen from "@/components/layout/DesktopScreen";
import RequestCard from "@/components/RequestCard";
import FilterPanel from "@/components/public-requests/FilterPanel";
import { TriangleAlert, FileText } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { pluralizeRu } from "@/lib/ru";
import { colors, overlay, BREAKPOINT } from "@/lib/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";

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

interface FnsServiceItem {
  fns: { id: string; name: string; code: string };
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

interface SpecialistProfileResponse {
  id: string;
  fnsServices: FnsServiceItem[];
}

export default function SpecialistPublicRequests() {
  const router = useRouter()
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const { ready, isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const { isSpecialistUser } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && !isSpecialistUser) {
      nav.replaceRoutes.tabs();
    }
  }, [authLoading, isAuthenticated, isSpecialistUser]);

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
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);

  // Specialist's own coverage (resolved on mount once auth is ready).
  const [profileLoading, setProfileLoading] = useState(true);
  const [specialistFnsServices, setSpecialistFnsServices] = useState<FnsServiceItem[]>([]);
  const hasFnsCoverage = specialistFnsServices.length > 0;
  // True while the active filter equals "match my FNS" (default for specialists).
  const isPrefiltered = !!selectedFnsId && hasFnsCoverage &&
    specialistFnsServices.some((fs) => fs.fns.id === selectedFnsId);

  const fetchRequests = useCallback(
    async (pageNum: number, append = false) => {
      try {
        let path = `/api/requests/public?page=${pageNum}&limit=20`;
        if (selectedCityId) path += `&city_id=${selectedCityId}`;
        if (selectedFnsId) path += `&fns_id=${selectedFnsId}`;
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
    [selectedCityId, selectedFnsId, selectedServiceId]
  );

  // Load the catalog (cities + services) once.
  useEffect(() => {
    async function init() {
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
    }
    init();
  }, []);

  // Load specialist profile once auth is ready, then default the filter to
  // their first FNS so the very first feed call is already pre-filtered.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (!isSpecialistUser) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api<SpecialistProfileResponse>("/api/specialist/profile");
        if (cancelled) return;
        const fnsServices = res.fnsServices ?? [];
        setSpecialistFnsServices(fnsServices);
        if (fnsServices.length > 0) {
          setSelectedFnsId(fnsServices[0].fns.id);
        }
      } catch (e) {
        console.error("specialist profile error:", e);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, isSpecialistUser]);

  // Run the feed call after profile resolution so the initial request already
  // carries the specialist's first fns_id (avoids a flash of "all requests").
  useEffect(() => {
    if (profileLoading) return;
    setLoading(true);
    fetchRequests(1).finally(() => setLoading(false));
  }, [profileLoading, selectedCityId, selectedFnsId, selectedServiceId, fetchRequests]);

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
      nav.any(`/requests/${id}/detail`);
    },
    [router]
  );

  const handleServiceToggle = useCallback((id: string) => {
    setSelectedServiceId((prev) => (prev === id ? null : id));
  }, []);

  if (!ready || !isSpecialistUser || profileLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  // Specialist hasn't picked any FNS coverage yet — push them to onboarding.
  if (!hasFnsCoverage) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <DesktopScreen>
          <EmptyState
            icon={FileText}
            title="Заявки появятся после настройки профиля"
            subtitle="Завершите профиль чтобы видеть подходящие заявки"
            actionLabel="Завершить профиль"
            onAction={() => nav.any("/onboarding/work-area?from=public-requests")}
          />
        </DesktopScreen>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <DesktopScreen>
        {/* Accent hero */}
        <View className="rounded-2xl px-5 py-5 mb-4 mt-2" style={{ backgroundColor: colors.accent }}>
          <Text className="text-xl font-bold text-white mb-0.5">Заявки</Text>
          <Text className="text-sm" style={{ color: overlay.white90 }}>Находите клиентов по своей специализации</Text>
          {total > 0 && (
            <Text className="text-sm font-semibold text-white mt-2">
              {total} {pluralizeRu(total, ["заявка", "заявки", "заявок"])} доступно
            </Text>
          )}
        </View>

        <FilterPanel
          cities={cities}
          selectedCityId={selectedCityId}
          onCityChange={setSelectedCityId}
          fnsOffices={specialistFnsServices.map((fs) => ({
            id: fs.fns.id,
            name: fs.fns.name,
          }))}
          selectedFnsId={selectedFnsId}
          onFnsChange={setSelectedFnsId}
          services={services}
          selectedServiceId={selectedServiceId}
          onServiceToggle={handleServiceToggle}
          fnsToggle={{
            isPrefiltered,
            onToggle: () => {
              if (isPrefiltered) {
                setSelectedFnsId(null);
                setSelectedCityId(null);
                setSelectedServiceId(null);
              } else if (specialistFnsServices.length > 0) {
                setSelectedFnsId(specialistFnsServices[0].fns.id);
              }
            },
          }}
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
              setSelectedFnsId(null);
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
      </DesktopScreen>
    </SafeAreaView>
  );
}
