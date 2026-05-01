/**
 * RequestsFeed — unified feed for request catalog and personal list.
 *
 * mode='catalog' — public bourse: all active requests, CityFnsCascade filter, pagination.
 * mode='mine'    — own requests: fetches /api/requests/my, active/closed tab, no pagination.
 */

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
import CityFnsCascade from "@/components/filters/CityFnsCascade";
import { Inbox, FileText } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import RequestCard from "@/components/RequestCard";
import PageTitle from "@/components/layout/PageTitle";
import { api } from "@/lib/api";
import { useCities } from "@/lib/hooks/useCities";
import { useServices } from "@/lib/hooks/useServices";
import { colors, BREAKPOINT } from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CityOption {
  id: string;
  name: string;
  fnsOffices?: { id: string; name: string; code: string }[];
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
  hasFiles?: boolean;
  filesCount?: number;
  user?: { firstName: string | null; lastName: string | null };
}

interface RequestsResponse {
  items: RequestItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RequestsFeedProps {
  /** 'catalog' = public bourse with filters; 'mine' = authenticated user's own requests */
  mode: "catalog" | "mine";
  title?: string;
  subtitle?: string;
  /** SafeAreaView edges (defaults to ['top']) */
  safeEdges?: ("top" | "bottom" | "left" | "right")[];
}

const LIMIT = 20;

// ─── Component ───────────────────────────────────────────────────────────────

export default function RequestsFeed({
  mode,
  title,
  subtitle,
  safeEdges = ["top"],
}: RequestsFeedProps) {
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;

  // Filter source data (catalog only)
  const { cities: citiesHook } = useCities();
  const { services: servicesHook } = useServices();
  const cities = citiesHook as CityOption[];
  const services = servicesHook as ServiceOption[];

  // List state
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination (catalog only)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Filter state (catalog only)
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Mine tab
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");

  const loadingMoreRef = useRef(false);
  const isFirstMount = useRef(true);

  // ── Catalog fetch ──
  const fetchCatalog = useCallback(
    async (pageNum: number, append = false) => {
      try {
        let path = `/api/requests/public?page=${pageNum}&limit=${LIMIT}`;
        if (selectedCityId) path += `&city_id=${selectedCityId}`;
        if (selectedFnsId) path += `&fns_id=${selectedFnsId}`;

        const res = await api<RequestsResponse>(path, { noAuth: true });
        setRequests((prev) => (append ? [...prev, ...res.items] : res.items));
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

  // ── Mine fetch ──
  const fetchMine = useCallback(async () => {
    try {
      const res = await api<{ items: RequestItem[] }>("/api/requests/my");
      setRequests(res.items);
      setError(null);
    } catch {
      setError("Не удалось загрузить заявки");
    }
  }, []);

  const fetchCatalogRef = useRef(fetchCatalog);
  fetchCatalogRef.current = fetchCatalog;

  // ── Initial load ──
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setInitLoading(true);
      setError(null);

      if (mode === "catalog") {
        // cities/services provided by useCities/useServices hooks (globally cached)
        if (!cancelled) await fetchCatalogRef.current(1);
      } else {
        if (!cancelled) await fetchMine();
      }

      if (!cancelled) setInitLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [mode, fetchMine]);

  // ── Re-fetch on filter change (catalog) — skip first mount ──
  useEffect(() => {
    if (mode !== "catalog") return;
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setListLoading(true);
    setPage(1);
    fetchCatalog(1).finally(() => setListLoading(false));
  }, [mode, selectedCityId, selectedFnsId, fetchCatalog]);

  // ── Handlers ──
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (mode === "catalog") await fetchCatalog(1);
    else await fetchMine();
    setRefreshing(false);
  }, [mode, fetchCatalog, fetchMine]);

  const handleLoadMore = useCallback(async () => {
    if (mode !== "catalog" || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    await fetchCatalog(page + 1, true);
    setLoadingMore(false);
    loadingMoreRef.current = false;
  }, [mode, hasMore, page, fetchCatalog]);

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

  const handleServiceChange = useCallback((id: string | null) => {
    setSelectedServiceId(id);
  }, []);

  const handleRequestPress = useCallback(
    (id: string) => nav.dynamic.requestDetail(id),
    [nav]
  );

  const hasFilters =
    selectedCityId !== null || selectedFnsId !== null || selectedServiceId !== null;

  // ── Mine: client-side tab filter ──
  const displayedRequests =
    mode === "mine"
      ? requests.filter((r) =>
          activeTab === "active"
            ? r.status === "ACTIVE" || r.status === "CLOSING_SOON"
            : r.status === "CLOSED"
        )
      : requests;

  // ── Skeleton on initial load ──
  if (initLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface2" edges={safeEdges}>
        {title && <PageTitle title={title} subtitle={subtitle} />}
        <View className="flex-1 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              className="mx-4 mb-3 bg-white rounded-2xl overflow-hidden border border-border"
            >
              <LoadingState variant="skeleton" lines={4} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ── Content ──
  const renderContent = () => {
    if (error) {
      return (
        <ErrorState
          message={
            mode === "catalog"
              ? "Не удалось загрузить запросы. Проверьте соединение с интернетом и попробуйте снова."
              : "Не удалось загрузить заявки. Проверьте соединение и попробуйте снова."
          }
          onRetry={() => {
            setError(null);
            if (mode === "catalog") {
              setListLoading(true);
              fetchCatalog(1).finally(() => setListLoading(false));
            } else {
              setInitLoading(true);
              fetchMine().finally(() => setInitLoading(false));
            }
          }}
        />
      );
    }

    if (listLoading) {
      return (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (displayedRequests.length === 0) {
      if (mode === "mine") {
        return (
          <EmptyState
            icon={FileText}
            title={activeTab === "active" ? "Активных запросов нет" : "Закрытых запросов нет"}
            subtitle={
              activeTab === "active"
                ? "Создайте первый запрос — специалисты из вашего города увидят его и предложат помощь"
                : "Закрытые запросы появятся здесь"
            }
            actionLabel={activeTab === "active" ? "Создать запрос" : undefined}
            onAction={
              activeTab === "active" ? () => nav.routes.requestsNew() : undefined
            }
          />
        );
      }
      return (
        <EmptyState
          icon={Inbox}
          title="Запросов не найдено"
          subtitle="Попробуйте изменить фильтры или сбросить их"
          actionLabel={hasFilters ? "Сбросить фильтры" : undefined}
          onAction={hasFilters ? handleResetFilters : undefined}
        />
      );
    }

    return (
      <FlatList
        data={displayedRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 24 : 16,
          paddingTop: 12,
          paddingBottom: 100,
          maxWidth: isDesktop ? 720 : undefined,
          alignSelf: isDesktop ? ("center" as const) : undefined,
          width: "100%" as const,
        }}
        renderItem={({ item }) => (
          <RequestCard
            id={item.id}
            title={item.title}
            description={item.description}
            fns={item.fns}
            createdAt={item.createdAt}
            hasFiles={item.hasFiles}
            filesCount={item.filesCount}
            user={item.user}
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
        onEndReached={mode === "catalog" ? handleLoadMore : undefined}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          mode === "catalog" ? (
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
                <Text className="text-sm font-medium text-accent">Загрузить ещё</Text>
              </Pressable>
            ) : (
              <View className="py-4 items-center">
                <Text className="text-xs text-text-mute">Все запросы загружены</Text>
              </View>
            )
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={safeEdges}>
      {/* Page header */}
      {title && <PageTitle title={title} subtitle={subtitle} />}

      {/* Catalog: total count + CityFnsCascade filter */}
      {mode === "catalog" && (
        <>
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
        </>
      )}

      {/* Mine: action button + active/closed tab switcher */}
      {mode === "mine" && (
        <View className="px-4 pt-2 pb-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Создать запрос"
            onPress={() => nav.routes.requestsNew()}
            style={{
              backgroundColor: colors.primary,
              minHeight: 40,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 12,
              paddingHorizontal: 16,
              alignSelf: isDesktop ? "flex-end" : "stretch",
              marginBottom: 12,
            }}
          >
            <Text className="text-white font-semibold text-sm">+ Создать запрос</Text>
          </Pressable>

          <View
            className="flex-row rounded-xl overflow-hidden border border-border"
            style={{ backgroundColor: colors.surface2 }}
          >
            {(["active", "closed"] as const).map((tab) => (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityLabel={tab === "active" ? "Активные запросы" : "Закрытые запросы"}
                onPress={() => setActiveTab(tab)}
                style={[
                  { flex: 1, paddingVertical: 10, alignItems: "center", minHeight: 40 },
                  activeTab === tab ? { backgroundColor: colors.primary } : undefined,
                ]}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: activeTab === tab ? "#fff" : colors.textSecondary,
                  }}
                >
                  {tab === "active" ? "Активные" : "Закрытые"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View className="flex-1">{renderContent()}</View>
    </SafeAreaView>
  );
}
