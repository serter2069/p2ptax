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
import { useRouter, useSegments } from "expo-router";
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

interface ServiceOption {
  id: string;
  name: string;
}

interface RequestUser {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  memberSince: number;
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
  hasFiles: boolean;
  user: RequestUser;
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
  const segments = useSegments();

  // Only redirect away when the user is actually on this screen (active tab).
  // Without the segment guard this effect fires for background tab instances
  // (e.g. while user is on /settings toggling specialist mode off), causing an
  // unwanted redirect to /(tabs). The tab is href:null so non-specialists
  // never land here intentionally, but the component is still mounted by the
  // Tabs navigator.
  const isOnThisScreen =
    segments[0] === "(tabs)" && segments[1] === "public-requests";

  useEffect(() => {
    if (!authLoading && isAuthenticated && !isSpecialistUser && isOnThisScreen) {
      nav.replaceRoutes.tabs();
    }
  }, [authLoading, isAuthenticated, isSpecialistUser, isOnThisScreen]);

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Multi-select filter state
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [selectedFnsIds, setSelectedFnsIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Specialist's own coverage (resolved on mount once auth is ready).
  const [profileLoading, setProfileLoading] = useState(true);
  const [specialistFnsServices, setSpecialistFnsServices] = useState<FnsServiceItem[]>([]);
  const hasFnsCoverage = specialistFnsServices.length > 0;

  // True while the active filter contains specialist's own FNS IDs
  const myFnsIds = specialistFnsServices.map((fs) => fs.fns.id);
  const isPrefiltered = myFnsIds.length > 0 &&
    selectedFnsIds.length === myFnsIds.length &&
    myFnsIds.every((id) => selectedFnsIds.includes(id));

  const fetchRequests = useCallback(
    async (pageNum: number, append = false) => {
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", "20");
        if (selectedCityIds.length > 0) params.set("city_id", selectedCityIds[0]);
        if (selectedFnsIds.length > 0) params.set("fns_id", selectedFnsIds[0]);

        const res = await api<RequestsResponse>(`/api/requests/public?${params}`, { noAuth: true });

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
    [selectedCityIds, selectedFnsIds]
  );

  // Load services once.
  useEffect(() => {
    async function init() {
      try {
        const servicesRes = await api<{ items: ServiceOption[] }>("/api/services", { noAuth: true });
        setServices(servicesRes.items);
      } catch (e) {
        console.error("Init error:", e);
      }
    }
    init();
  }, []);

  // Load specialist profile once auth is ready.
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
          setSelectedFnsIds([fnsServices[0].fns.id]);
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

  // Fetch after profile resolution.
  useEffect(() => {
    if (profileLoading) return;
    setLoading(true);
    fetchRequests(1).finally(() => setLoading(false));
  }, [profileLoading, selectedCityIds, selectedFnsIds, fetchRequests]);

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

  const handleReset = useCallback(() => {
    setSelectedCityIds([]);
    setSelectedFnsIds([]);
    setSelectedServiceIds([]);
  }, []);

  const handleFnsToggle = useCallback(() => {
    if (isPrefiltered) {
      setSelectedFnsIds([]);
      setSelectedCityIds([]);
      setSelectedServiceIds([]);
    } else if (myFnsIds.length > 0) {
      setSelectedFnsIds([myFnsIds[0]]);
    }
  }, [isPrefiltered, myFnsIds]);

  if (!ready || !isSpecialistUser || profileLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <LoadingState />
      </SafeAreaView>
    );
  }

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
        {/* Hero */}
        <View className="rounded-2xl px-5 py-5 mb-4 mt-2" style={{ backgroundColor: colors.accent }}>
          <Text className="text-xl font-bold text-white mb-0.5">Заявки</Text>
          <Text className="text-sm" style={{ color: overlay.white90 }}>
            Находите клиентов по своей специализации
          </Text>
          {total > 0 && (
            <Text className="text-sm font-semibold text-white mt-2">
              {total} {pluralizeRu(total, ["заявка", "заявки", "заявок"])} доступно
            </Text>
          )}
        </View>

        <FilterPanel
          selectedCityIds={selectedCityIds}
          onCityIdsChange={setSelectedCityIds}
          selectedFnsIds={selectedFnsIds}
          onFnsIdsChange={setSelectedFnsIds}
          services={services}
          selectedServiceIds={selectedServiceIds}
          onServiceIdsChange={setSelectedServiceIds}
          onReset={handleReset}
          fnsToggle={{
            isPrefiltered,
            onToggle: handleFnsToggle,
          }}
        />

        <View className="mt-3">
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
              onAction={handleReset}
            />
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              contentContainerClassName={isDesktop ? "pb-8" : "pb-4"}
              renderItem={({ item }) => (
                <RequestCard
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  status={item.status}
                  city={item.city}
                  fns={item.fns}
                  threadsCount={item.threadsCount}
                  hasFiles={item.hasFiles}
                  user={item.user}
                  createdAt={item.createdAt}
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
        </View>
      </DesktopScreen>
    </SafeAreaView>
  );
}
