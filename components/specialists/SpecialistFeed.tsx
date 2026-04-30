/**
 * SpecialistFeed — unified feed for /specialists catalog.
 * Supports typeahead city/FNS selection + per-FNS service filter (#1645, #1658).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, apiGet, apiPost, apiDelete } from "@/lib/api";
import { AlertCircle, Search, UserX } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import CatalogHeader from "@/components/specialists/CatalogHeader";
import CatalogSkeleton from "@/components/specialists/CatalogSkeleton";
import SpecialistFilter from "@/components/specialists/SpecialistFilter";
import SpecialistsGrid from "@/components/specialists/SpecialistsGrid";
import { FnsCascadeOption, TypeaheadValue } from "@/components/filters/CityFnsCascade";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceOption {
  id: string;
  name: string;
}

export interface SpecialistItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  specialistFns?: {
    fnsId: string;
    fnsName: string;
    city: { id: string; name: string };
    services: { id: string; name: string }[];
  }[];
  description?: string | null;
}

interface SpecialistsResponse {
  items: SpecialistItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface CitiesResponse {
  items: { id: string; name: string; slug: string; officesCount?: number }[];
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

const PAGE_SIZE = 12;

const EMPTY_TYPEAHEAD: TypeaheadValue = { cityId: null, fnsId: null, fnsServices: {} };

// ─── Component ───────────────────────────────────────────────────────────────

export default function SpecialistFeed() {
  const nav = useTypedRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWide = width >= 1024;
  const gridCols = isWide ? 3 : isDesktop ? 2 : 1;

  const urlParams = useLocalSearchParams<{
    city?: string;
    fns?: string;
    services?: string;
  }>();

  // ── Filter source data ──
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  // ── Typeahead filter state (replaces selectedCityId/selectedFnsId/selectedServiceIds) ──
  const [filterVal, setFilterVal] = useState<TypeaheadValue>(() => {
    const cityId = urlParams.city || null;
    const fnsId = urlParams.fns || null;
    const serviceIds = urlParams.services ? urlParams.services.split(",").filter(Boolean) : [];
    // Reconstruct fnsServices from URL if fnsId present
    const fnsServices: Record<string, string[]> =
      fnsId && serviceIds.length > 0 ? { [fnsId]: serviceIds } : {};
    return { cityId, fnsId, fnsServices };
  });

  // ── List state ──
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const hasFilters =
    filterVal.cityId !== null ||
    filterVal.fnsId !== null ||
    Object.keys(filterVal.fnsServices).length > 0;

  // ── Load filter source lists ──
  useEffect(() => {
    let cancelled = false;
    async function loadFilterData() {
      try {
        const [citiesRes, servicesRes] = await Promise.all([
          api<CitiesResponse>("/api/cities", { noAuth: true }),
          api<{ items: ServiceOption[] }>("/api/services", { noAuth: true }),
        ]);
        if (cancelled) return;
        setCities(citiesRes.items.map((c) => ({ id: c.id, name: c.name })));
        setServices(servicesRes.items);

        if (citiesRes.items.length > 0) {
          const ids = citiesRes.items.map((c) => c.id).join(",");
          try {
            const fnsRes = await api<FnsResponse>(`/api/fns?city_ids=${ids}`, {
              noAuth: true,
            });
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
          } catch {
            /* typeahead degrades gracefully */
          }
        }
      } catch {
        /* soft fail */
      }
    }
    loadFilterData();
    return () => { cancelled = true; };
  }, []);

  // ── Load bookmark IDs ──
  useEffect(() => {
    if (!isAuthenticated) return;
    apiGet<{ ids: string[] }>("/api/saved-specialists")
      .then((r) => setBookmarkedIds(new Set(r.ids)))
      .catch(() => {});
  }, [isAuthenticated]);

  // ── Data fetch ──
  const fetchSpecialists = useCallback(
    async (pageNum: number, append = false) => {
      try {
        let path = `/api/specialists?page=${pageNum}&limit=${PAGE_SIZE}`;
        if (filterVal.cityId) path += `&city_ids=${filterVal.cityId}`;
        if (filterVal.fnsId) path += `&fns_ids=${filterVal.fnsId}`;

        // Per-FNS service filter: send as fnsServices=<JSON>
        const fnsServicesKeys = Object.keys(filterVal.fnsServices);
        if (fnsServicesKeys.length > 0) {
          path += `&fnsServices=${encodeURIComponent(
            JSON.stringify(filterVal.fnsServices)
          )}`;
        }

        const res = await api<SpecialistsResponse>(path, { noAuth: true });
        setSpecialists((prev) => (append ? [...prev, ...res.items] : res.items));
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(pageNum);
        setError(null);
      } catch {
        setError("Не удалось загрузить список");
      }
    },
    [filterVal]
  );

  const fetchRef = useRef(fetchSpecialists);
  fetchRef.current = fetchSpecialists;

  useEffect(() => {
    setLoading(true);
    fetchSpecialists(1).finally(() => setLoading(false));
  }, [filterVal, fetchSpecialists]);

  // ── Filter handler ──
  const handleFilterChange = useCallback(
    (v: TypeaheadValue) => {
      setFilterVal(v);
      // Sync URL params
      router.setParams({
        city: v.cityId ?? undefined,
        fns: v.fnsId ?? undefined,
        services:
          v.fnsId && v.fnsServices[v.fnsId]?.length
            ? v.fnsServices[v.fnsId].join(",")
            : undefined,
      });
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilterVal(EMPTY_TYPEAHEAD);
    router.setParams({ city: undefined, fns: undefined, services: undefined });
  }, []);

  // ── Pagination / refresh ──
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

  // ── Navigation ──
  const handleSpecialistPress = useCallback(
    (id: string) => nav.any(`/specialists/${id}`),
    [nav]
  );

  // ── Bookmark toggle ──
  const handleBookmark = useCallback(
    async (id: string) => {
      if (!isAuthenticated) { nav.any("/login"); return; }
      const isSaved = bookmarkedIds.has(id);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(id); else next.add(id);
        return next;
      });
      try {
        if (isSaved) await apiDelete(`/api/saved-specialists/${id}`);
        else await apiPost(`/api/saved-specialists/${id}`, {});
      } catch {
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (isSaved) next.add(id); else next.delete(id);
          return next;
        });
      }
    },
    [isAuthenticated, bookmarkedIds, nav]
  );

  // ── Render ──
  const renderContent = () => {
    if (loading && specialists.length === 0) return <CatalogSkeleton count={5} />;

    if (error && specialists.length === 0) {
      return (
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
      );
    }

    if (specialists.length === 0 && !loading) {
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
            fetchSpecialists(1).finally(() => setLoading(false));
          }}
        />
      );
    }

    return (
      <SpecialistsGrid
        specialists={specialists}
        gridCols={gridCols}
        isDesktop={isDesktop}
        isWide={isWide}
        refreshing={refreshing}
        loadingMore={loadingMore}
        bookmarkedIds={bookmarkedIds}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        onPress={handleSpecialistPress}
        onBookmark={handleBookmark}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <CatalogHeader isDesktop={isDesktop} count={loading ? null : total || specialists.length} />

      <View>
        <SpecialistFilter
          cities={cities}
          fnsAll={fnsAll}
          services={services}
          typeaheadValue={filterVal}
          onTypeaheadChange={handleFilterChange}
        />
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}
