/**
 * SpecialistFeed — unified feed component for both /specialists and /saved-specialists.
 *
 * mode='all'       — public catalog: fetches all specialists with isPublicProfile=true,
 *                    supports URL-param-driven filters, infinite pagination.
 * mode='favorites' — saved list: fetches only specialists saved by the current user,
 *                    same filter UX, no pagination (backend returns full saved list).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { api, apiGet, apiPost, apiDelete } from "@/lib/api";
import { useCities } from "@/lib/hooks/useCities";
import { useServices } from "@/lib/hooks/useServices";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { colors } from "@/lib/theme";
import { AlertCircle, Bookmark, Search, UserX } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import CatalogSkeleton from "@/components/specialists/CatalogSkeleton";
import SpecialistFilter from "@/components/specialists/SpecialistFilter";
import SpecialistsGrid from "@/components/specialists/SpecialistsGrid";
import LandingHeader from "@/components/landing/LandingHeader";
import PageTitle from "@/components/layout/PageTitle";
import { CityFnsValue, FnsCascadeOption } from "@/components/filters/CityFnsCascade";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceOption {
  id: string;
  name: string;
}

interface FnsGroup {
  fnsId: string;
  fnsName: string;
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

export interface SpecialistItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  specialistFns?: FnsGroup[];
  description?: string | null;
}

interface SpecialistsResponse {
  items: SpecialistItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface FnsResponse {
  offices: {
    id: string;
    name: string;
    code: string;
    cityId: string;
    address?: string | null;
    city?: { id: string; name: string };
  }[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SpecialistFeedProps {
  /** 'all' = public catalog; 'favorites' = current user's saved list */
  mode: "all" | "favorites";
  title?: string;
  subtitle?: string;
}

const PAGE_SIZE = 12;
const EMPTY_FILTER: CityFnsValue = { cities: [], fns: [], fnsServices: {} };

// ─── Component ───────────────────────────────────────────────────────────────

export default function SpecialistFeed({ mode, title, subtitle }: SpecialistFeedProps) {
  const nav = useTypedRouter();
  // allowAnonymous=true for 'all' (no redirect); false for 'favorites' (redirect with returnTo #P2)
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard({
    allowAnonymous: mode !== "favorites",
    returnTo: mode === "favorites" ? "/saved-specialists" : undefined,
  });
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWide = width >= 1024;

  // URL params — only used in 'all' mode for shareable filtered catalog
  const urlParams = useLocalSearchParams<{
    city?: string;
    fns?: string;
  }>();

  // ── Filter source data ──
  const { cities: citiesData } = useCities();
  const { services: servicesData } = useServices();
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  // ── Unified filter state ──
  const [filterValue, setFilterValue] = useState<CityFnsValue>(() => ({
    cities: mode === "all" && urlParams.city ? [urlParams.city] : [],
    fns: mode === "all" && urlParams.fns ? [urlParams.fns] : [],
    fnsServices: {},
  }));

  // Derive individual filter ids for API calls (backward compat)
  const selectedCityId = filterValue.cities[0] ?? null;
  const selectedFnsId = filterValue.fns[0] ?? null;
  const fnsServicesParam = filterValue.fnsServices ?? {};

  // ── List state ──
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination — only meaningful for 'all' mode
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const hasFilters =
    filterValue.cities.length > 0 ||
    filterValue.fns.length > 0;

  // ── Sync cities/services from global hooks ──
  useEffect(() => {
    if (citiesData.length > 0) setCities(citiesData.map((c) => ({ id: c.id, name: c.name })));
  }, [citiesData]);

  useEffect(() => {
    if (servicesData.length > 0) setServices(servicesData);
  }, [servicesData]);

  // ── Load FNS for typeahead once cities are available ──
  useEffect(() => {
    if (mode === "favorites" && !isAuthenticated) return;
    if (cities.length === 0) return;
    let cancelled = false;
    const ids = cities.map((c) => c.id).join(",");
    const fetchFns = mode === "all"
      ? api<FnsResponse>(`/api/fns?city_ids=${ids}`, { noAuth: true })
      : apiGet<FnsResponse>(`/api/fns?city_ids=${ids}`);
    fetchFns
      .then((fnsRes) => {
        if (cancelled) return;
        setFnsAll(
          fnsRes.offices.map((f) => ({
            id: f.id,
            name: f.name,
            code: f.code,
            cityId: f.cityId,
            cityName: f.city?.name,
          }))
        );
      })
      .catch(() => { /* typeahead degrades gracefully */ });
    return () => { cancelled = true; };
  }, [mode, isAuthenticated, cities]);

  // ── Load saved bookmark IDs (for 'all' mode — show filled icon on saved items) ──
  useEffect(() => {
    if (mode !== "all" || !isAuthenticated) return;
    apiGet<{ items: SpecialistItem[] }>("/api/specialists?savedOnly=true&page=1&limit=200")
      .then((r) => setBookmarkedIds(new Set(r.items.map((s) => s.id))))
      .catch(() => {});
  }, [mode, isAuthenticated]);

  // ── Data fetch ──
  const fetchAll = useCallback(
    async (pageNum: number, append = false) => {
      try {
        let path = `/api/specialists?page=${pageNum}&limit=${PAGE_SIZE}`;
        if (selectedCityId) path += `&city_ids=${selectedCityId}`;
        if (selectedFnsId) path += `&fns_ids=${selectedFnsId}`;

        // #1658: per-FNS services filter
        const fnsServiceKeys = Object.keys(fnsServicesParam);
        if (fnsServiceKeys.length > 0) {
          path += `&fnsServices=${encodeURIComponent(JSON.stringify(fnsServicesParam))}`;
        }

        const res = await api<SpecialistsResponse>(path, { noAuth: true });

        setSpecialists((prev) => (append ? [...prev, ...res.items] : res.items));
        setHasMore(res.hasMore);
        setPage(pageNum);
        setError(null);
      } catch {
        setError("Не удалось загрузить список");
      }
    },
    [selectedCityId, selectedFnsId, fnsServicesParam]
  );

  const fetchFavorites = useCallback(async () => {
    try {
      const parts: string[] = ["savedOnly=true", "page=1", "limit=200"];
      if (selectedCityId) parts.push(`city_ids=${selectedCityId}`);
      if (selectedFnsId) parts.push(`fns_ids=${selectedFnsId}`);

      // #1658: per-FNS services filter
      const fnsServiceKeys = Object.keys(fnsServicesParam);
      if (fnsServiceKeys.length > 0) {
        parts.push(`fnsServices=${encodeURIComponent(JSON.stringify(fnsServicesParam))}`);
      }

      const res = await apiGet<{ items: SpecialistItem[] }>(
        `/api/specialists?${parts.join("&")}`
      );
      setSpecialists(res.items);
      // All items on favorites page are by definition bookmarked
      setBookmarkedIds(new Set(res.items.map((i) => i.id)));
      setError(null);
    } catch {
      setSpecialists([]);
      setError("Не удалось загрузить список");
    }
  }, [selectedCityId, selectedFnsId, fnsServicesParam]);

  const fetchAllRef = useRef(fetchAll);
  fetchAllRef.current = fetchAll;

  // Trigger on mount and filter change
  useEffect(() => {
    if (mode === "favorites" && !isAuthenticated) return;
    setLoading(true);
    const fetch = mode === "all" ? fetchAll(1) : fetchFavorites();
    fetch.finally(() => setLoading(false));
  }, [
    mode,
    isAuthenticated,
    selectedCityId,
    selectedFnsId,
    fnsServicesParam,
    fetchAll,
    fetchFavorites,
  ]);

  // ── Filter handler ──
  const handleFilterChange = useCallback(
    (v: CityFnsValue) => {
      setFilterValue(v);
      if (mode === "all") {
        router.setParams({
          city: v.cities[0] ?? undefined,
          fns: v.fns[0] ?? undefined,
        });
      }
    },
    [mode]
  );

  const resetFilters = useCallback(() => {
    handleFilterChange(EMPTY_FILTER);
  }, [handleFilterChange]);

  // ── Pagination / refresh ──
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (mode === "all") {
      await fetchAll(1);
    } else {
      await fetchFavorites();
    }
    setRefreshing(false);
  }, [mode, fetchAll, fetchFavorites]);

  const handleLoadMore = useCallback(async () => {
    if (mode !== "all" || loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchAll(page + 1, true);
    setLoadingMore(false);
  }, [mode, loadingMore, hasMore, page, fetchAll]);

  // ── Navigation ──
  const handleSpecialistPress = useCallback(
    (id: string) => nav.dynamic.specialist(id),
    [nav]
  );

  const handleWrite = useCallback(
    async (specialistId: string) => {
      if (!isAuthenticated) {
        nav.routes.login();
        return;
      }
      try {
        const res = await apiPost<{ threadId: string; created: boolean }>(
          "/api/threads/direct",
          { specialistId }
        );
        nav.any(`/threads/${res.threadId}`);
      } catch {
        nav.dynamic.specialist(specialistId);
      }
    },
    [nav, isAuthenticated]
  );

  // ── Bookmark toggle ──
  const handleBookmark = useCallback(
    async (id: string) => {
      if (!isAuthenticated) {
        nav.routes.login();
        return;
      }

      if (mode === "favorites") {
        // Remove from favorites list immediately
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setSpecialists((prev) => prev.filter((s) => s.id !== id));
        try {
          await apiDelete(`/api/saved-specialists/${id}`);
        } catch {
          // Revert on error
          setBookmarkedIds((prev) => new Set(prev).add(id));
          try {
            await apiPost(`/api/saved-specialists/${id}`, {});
          } catch {
            /* best-effort */
          }
        }
      } else {
        const isSaved = bookmarkedIds.has(id);
        // Optimistic update
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (isSaved) next.delete(id);
          else next.add(id);
          return next;
        });
        try {
          if (isSaved) {
            await apiDelete(`/api/saved-specialists/${id}`);
          } else {
            await apiPost(`/api/saved-specialists/${id}`, {});
          }
        } catch {
          // Revert on error
          setBookmarkedIds((prev) => {
            const next = new Set(prev);
            if (isSaved) next.add(id);
            else next.delete(id);
            return next;
          });
        }
      }
    },
    [mode, isAuthenticated, bookmarkedIds, nav]
  );

  // ── Scroll-aware filter visibility ──
  const [filterVisible, setFilterVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const last = lastScrollYRef.current;
      if (y < 40) {
        if (!filterVisible) setFilterVisible(true);
      } else if (y > last + 10) {
        if (filterVisible) setFilterVisible(false);
      } else if (y < last - 10) {
        if (!filterVisible) setFilterVisible(true);
      }
      lastScrollYRef.current = y;
    },
    [filterVisible]
  );

  // ── Render: loading spinner for favorites auth check ──
  if (mode === "favorites" && (authLoading || (loading && !refreshing))) {
    return (
      <SafeAreaView className="flex-1 bg-surface2 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // ── Render: error / empty states ──
  const renderContent = () => {
    if (mode === "all" && loading && specialists.length === 0) {
      return <CatalogSkeleton count={5} />;
    }

    if (error && specialists.length === 0) {
      return (
        <EmptyState
          icon={AlertCircle}
          title="Не удалось загрузить список"
          subtitle="Проверьте соединение с интернетом и попробуйте снова"
          actionLabel="Повторить"
          onAction={() => {
            setLoading(true);
            const fetch = mode === "all" ? fetchAll(1) : fetchFavorites();
            fetch.finally(() => setLoading(false));
          }}
        />
      );
    }

    if (specialists.length === 0 && !loading) {
      if (mode === "favorites") {
        return hasFilters ? (
          <EmptyState
            icon={Bookmark}
            title="Ничего не найдено"
            subtitle="Попробуйте сбросить фильтры или изменить запрос"
            actionLabel="Сбросить фильтры"
            onAction={resetFilters}
          />
        ) : (
          <EmptyState
            icon={Bookmark}
            title="Вы ещё не добавили специалистов в избранное"
            subtitle="Сохраняйте специалистов с страницы поиска, чтобы быстро возвращаться к ним позже"
            actionLabel="Найти специалиста"
            onAction={() => nav.routes.specialists()}
          />
        );
      }

      // mode === 'all'
      return hasFilters ? (
        <EmptyState
          icon={UserX}
          title="По выбранным фильтрам никого не нашли"
          subtitle="Попробуйте расширить поиск или сбросить фильтры."
          actionLabel="Сбросить фильтры"
          onAction={resetFilters}
        />
      ) : (
        <EmptyState
          icon={Search}
          title="Пока нет специалистов"
          subtitle="Загляните позже — каталог пополняется."
          actionLabel="Обновить"
          onAction={() => {
            setLoading(true);
            fetchAll(1).finally(() => setLoading(false));
          }}
        />
      );
    }

    return (
      <SpecialistsGrid
        specialists={specialists}
        gridCols={1}
        isDesktop={isDesktop}
        isWide={isWide}
        refreshing={refreshing}
        loadingMore={loadingMore}
        bookmarkedIds={bookmarkedIds}
        activeFnsId={selectedFnsId}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        onPress={handleSpecialistPress}
        onBookmark={handleBookmark}
        onWrite={handleWrite}
        onScroll={handleScroll}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      {/* Landing header for unauthenticated users on the public catalog */}
      {mode === "all" && !isAuthenticated && (
        <LandingHeader
          isDesktop={isDesktop}
          onHome={() => nav.routes.home()}
          onCatalog={() => nav.routes.specialists()}
          onLogin={() => nav.routes.login()}
          onCreateRequest={() => nav.routes.requestsNew()}
          isAuthenticated={false}
        />
      )}

      {/* Page header — PageTitle owns the 16px gap to the search bar (#1716).
          CatalogHeader was previously rendered here only to show a count
          which is always null at this call-site; it added an extra pt-2/pb-1
          that made /specialists' search bar sit lower than /requests'. */}
      {title && <PageTitle title={title} subtitle={subtitle} />}
      {mode === "favorites" && hasFilters && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 4, alignItems: "flex-end" }}>
          <Pressable
            accessibilityRole="button"
            onPress={resetFilters}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text
              style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}
            >
              Сбросить
            </Text>
          </Pressable>
        </View>
      )}

      {/* Cascade filter — hides on scroll-down, reveals on scroll-up */}
      <View style={{ display: filterVisible ? "flex" : "none" }}>
        <SpecialistFilter
          cities={cities}
          fnsAll={fnsAll}
          services={services}
          value={filterValue}
          onChange={handleFilterChange}
        />
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}
