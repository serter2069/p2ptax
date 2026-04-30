import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTypedRouter } from "@/lib/navigation";
import { useLocalSearchParams, router } from "expo-router";
import CityFnsCascade, {
  CityFnsValue,
  FnsCascadeOption,
  ServiceOption,
} from "@/components/filters/CityFnsCascade";
import { AlertCircle, Search, UserX } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import CatalogHeader from "@/components/specialists/CatalogHeader";
import CatalogSkeleton from "@/components/specialists/CatalogSkeleton";
import SpecialistsGrid from "@/components/specialists/SpecialistsGrid";
import { api, apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface SpecialistItem {
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
  items: { id: string; name: string; slug: string; officesCount: number }[];
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

const EMPTY_FNS_VALUE: CityFnsValue = { cities: [], fns: [], fnsServices: {} };

export default function SpecialistsCatalog() {
  const nav = useTypedRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWide = width >= 1024;
  const gridCols = isWide ? 3 : isDesktop ? 2 : 1;
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // URL params for shareable filtered catalog
  const urlParams = useLocalSearchParams<{
    city?: string;
    fns?: string;
    services?: string;
  }>();

  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [fnsAll, setFnsAll] = useState<FnsCascadeOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Unified filter state via CityFnsValue
  const [filterValue, setFilterValue] = useState<CityFnsValue>(() => ({
    cities: urlParams.city ? [urlParams.city] : [],
    fns: urlParams.fns ? [urlParams.fns] : [],
    fnsServices: {},
  }));

  // Derive individual filter ids from unified state (backward compat with API params)
  const selectedCityId = filterValue.cities[0] ?? null;
  const selectedFnsId = filterValue.fns[0] ?? null;
  const fnsServicesParam = filterValue.fnsServices ?? {};

  const hasFilters =
    filterValue.cities.length > 0 ||
    filterValue.fns.length > 0;

  const resetFilters = useCallback(() => {
    setFilterValue(EMPTY_FNS_VALUE);
    router.setParams({
      city: undefined,
      fns: undefined,
      services: undefined,
    });
  }, []);

  const fetchSpecialists = useCallback(
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

        if (append) {
          setSpecialists((prev) => [...prev, ...res.items]);
        } else {
          setSpecialists(res.items);
        }
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(pageNum);
        setError(null);
      } catch {
        setError("Не удалось загрузить список");
      }
    },
    [selectedCityId, selectedFnsId, fnsServicesParam]
  );

  const fetchSpecialistsRef = useRef(fetchSpecialists);
  fetchSpecialistsRef.current = fetchSpecialists;

  // Load saved IDs for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return;
    apiGet<{ ids: string[] }>("/api/saved-specialists")
      .then((r) => setBookmarkedIds(new Set(r.ids)))
      .catch(() => {});
  }, [isAuthenticated]);

  // Initial load: cities, services, FNS list for typeahead.
  useEffect(() => {
    let cancelled = false;
    async function init() {
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
            const fnsRes = await api<FnsResponse>(
              `/api/fns?city_ids=${ids}`,
              { noAuth: true }
            );
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
            /* typeahead degrades gracefully — empty FNS list */
          }
        }
      } catch {
        // ignore — page still renders, fetchSpecialists below handles its own errors
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch specialists on mount and on filter change.
  useEffect(() => {
    setLoading(true);
    fetchSpecialists(1).finally(() => setLoading(false));
  }, [selectedCityId, selectedFnsId, fnsServicesParam, fetchSpecialists]);

  // Sync URL params when filter changes
  const handleFilterChange = useCallback((v: CityFnsValue) => {
    setFilterValue(v);
    router.setParams({
      city: v.cities[0] ?? undefined,
      fns: v.fns[0] ?? undefined,
    });
  }, []);

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

  const handleSpecialistPress = useCallback(
    (id: string) => {
      nav.any(`/specialists/${id}`);
    },
    [nav]
  );

  const handleBookmark = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      nav.any("/login");
      return;
    }
    const isSaved = bookmarkedIds.has(id);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    try {
      if (isSaved) {
        await apiDelete(`/api/saved-specialists/${id}`);
      } else {
        await apiPost(`/api/saved-specialists/${id}`, {});
      }
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    }
  }, [isAuthenticated, bookmarkedIds, nav]);

  const headerCount = useMemo(() => {
    if (loading) return null;
    return total > 0 ? total : specialists.length;
  }, [loading, total, specialists.length]);

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <CatalogHeader isDesktop={isDesktop} count={headerCount} />

      {/* Typeahead filter: city → FNS → per-FNS services */}
      <View className="px-4 pt-2" style={{ zIndex: 20 }}>
        <CityFnsCascade
          mode="typeahead"
          value={filterValue}
          onChange={handleFilterChange}
          citiesSource={cities}
          fnsSource={fnsAll}
          services={services}
        />
      </View>

      {/* Specialist list */}
      {loading && specialists.length === 0 ? (
        <CatalogSkeleton count={5} />
      ) : error && specialists.length === 0 ? (
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
      ) : specialists.length === 0 && !loading ? (
        hasFilters ? (
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
        )
      ) : (
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
      )}
    </SafeAreaView>
  );
}
