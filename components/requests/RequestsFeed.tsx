/**
 * RequestsFeed — unified feed for request catalog and personal list.
 *
 * mode='catalog' — public bourse: all active requests, CityFnsCascade typeahead filter, pagination.
 * mode='mine'    — own requests: fetches /api/requests/my, all items shown, closed items muted.
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
import CityFnsCascade, {
  CityFnsValue,
  FnsCascadeOption,
} from "@/components/filters/CityFnsCascade";
import { Inbox, FileText } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import RequestCard from "@/components/RequestCard";
import PageTitle from "@/components/layout/PageTitle";
import { api } from "@/lib/api";
import { useCities } from "@/lib/hooks/useCities";
import { useServices } from "@/lib/hooks/useServices";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { colors, BREAKPOINT } from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface FnsApiOffice {
  id: string;
  name: string;
  code: string;
  cityId: string;
  city?: { name: string };
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
const EMPTY_FILTER: CityFnsValue = { cities: [], fns: [], fnsServices: {} };

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

  // Auth guard: mine requires auth (redirect with returnTo); catalog is public (#P0)
  const { isAuthenticated: isAuth, isLoading: authLoading } = useAuthGuard({
    allowAnonymous: mode !== "mine",
    returnTo: mode === "mine" ? "/(tabs)/my-requests" : undefined,
  });

  // Filter source data (catalog only)
  const { cities: citiesHook } = useCities();
  const { services: servicesHook } = useServices();
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>([]);

  // Unified filter state for typeahead
  const [filterValue, setFilterValue] = useState<CityFnsValue>(EMPTY_FILTER);
  const selectedCityId = filterValue.cities[0] ?? null;
  const selectedFnsId = filterValue.fns[0] ?? null;

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

  // Mine: show-archived toggle (default: show all including closed)
  const [showArchiveOnly, setShowArchiveOnly] = useState(false);

  const loadingMoreRef = useRef(false);
  const isFirstMount = useRef(true);

  // ── Sync cities from hook ──
  useEffect(() => {
    if (citiesHook.length > 0) setCities(citiesHook.map((c) => ({ id: c.id, name: c.name })));
  }, [citiesHook]);

  // ── Load all FNS for typeahead once cities are available (catalog only) ──
  useEffect(() => {
    if (mode !== "catalog" || cities.length === 0) return;
    let cancelled = false;
    const ids = cities.map((c) => c.id).join(",");
    api<{ offices: FnsApiOffice[] }>(`/api/fns?city_ids=${ids}`, { noAuth: true })
      .then((res) => {
        if (cancelled) return;
        setFnsAll(
          res.offices.map((f) => ({
            id: f.id,
            name: f.name,
            code: f.code,
            cityId: f.cityId,
            cityName: f.city?.name,
          }))
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [mode, cities]);

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
    // Don't fetch personal requests while auth is resolving or when anon (guard redirects)
    if (mode === "mine" && (authLoading || !isAuth)) return;

    let cancelled = false;

    async function init() {
      setInitLoading(true);
      setError(null);

      if (mode === "catalog") {
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
  }, [mode, fetchMine, isAuth, authLoading]);

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
    setFilterValue(EMPTY_FILTER);
  }, []);

  const handleRequestPress = useCallback(
    (id: string) => nav.dynamic.requestDetail(id),
    [nav]
  );

  const hasFilters = selectedCityId !== null || selectedFnsId !== null;

  // ── Mine: client-side filter (archive toggle) ──
  const displayedRequests =
    mode === "mine"
      ? showArchiveOnly
        ? requests.filter((r) => r.status === "CLOSED")
        : requests
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
            title={showArchiveOnly ? "Закрытых запросов нет" : "Запросов нет"}
            subtitle={
              showArchiveOnly
                ? "Закрытые запросы появятся здесь"
                : "Создайте первый запрос — специалисты из вашего города увидят его и предложат помощь"
            }
            actionLabel={!showArchiveOnly ? "Создать запрос" : undefined}
            onAction={!showArchiveOnly ? () => nav.routes.requestsNew() : undefined}
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
          // House rule: content/list/feed pages cap at 960 with 24 padding (CLAUDE.md).
          maxWidth: isDesktop ? 960 : undefined,
          alignSelf: isDesktop ? ("center" as const) : undefined,
          width: "100%" as const,
        }}
        renderItem={({ item }) => (
          <RequestCard
            id={item.id}
            title={item.title}
            description={item.description}
            status={item.status}
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

      {/* Catalog: typeahead CityFnsCascade filter — no pt-* needed,
          PageTitle already provides the 16px gap (#1716). pb-3 stays to keep
          the white chrome strip separated from the list below. */}
      {mode === "catalog" && (
        <View className="bg-white border-b border-border px-4 pb-3" style={{ zIndex: 100 }}>
          <CityFnsCascade
            mode="typeahead"
            value={filterValue}
            onChange={setFilterValue}
            citiesSource={cities}
            fnsSource={fnsAll}
            services={servicesHook}
          />
        </View>
      )}

      {/* Mine: create button + archive toggle — no pt-* needed, PageTitle's
          pb-4 already provides the 16px gap. Keep pb-3 for separation. */}
      {mode === "mine" && (
        <View className="px-4 pb-3" style={{ flexDirection: isDesktop ? "row" : "column", alignItems: isDesktop ? "center" : "stretch", gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Создать запрос"
            onPress={() => nav.routes.requestsNew()}
            style={{
              backgroundColor: colors.primary,
              minHeight: 40,
              minWidth: isDesktop ? 200 : undefined,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 12,
              paddingHorizontal: 20,
              alignSelf: isDesktop ? "flex-start" : "stretch",
            }}
          >
            <Text numberOfLines={1} className="text-white font-semibold text-sm">+ Создать запрос</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showArchiveOnly ? "Показать все" : "Показать архив"}
            onPress={() => setShowArchiveOnly((v) => !v)}
            style={{
              minHeight: 40,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: showArchiveOnly ? colors.surface2 : "transparent",
              alignSelf: isDesktop ? "flex-start" : "stretch",
            }}
          >
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: "500" }}>
              {showArchiveOnly ? "Все запросы" : "Архив"}
            </Text>
          </Pressable>
        </View>
      )}

      <View className="flex-1">{renderContent()}</View>
    </SafeAreaView>
  );
}
