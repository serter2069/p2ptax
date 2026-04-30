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
import { useTypedRouter } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/ui/EmptyState";
import { Bookmark } from "lucide-react-native";
import { apiGet, apiDelete, apiPost } from "@/lib/api";
import { colors } from "@/lib/theme";
import SpecialistFilter from "@/components/specialists/SpecialistFilter";
import SpecialistsGrid from "@/components/specialists/SpecialistsGrid";
import { CityOpt, FnsOpt } from "@/components/filters/SpecialistSearchBar";

interface FnsGroup {
  fnsId: string;
  fnsName: string;
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

interface SpecialistItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  cities: { id: string; name: string }[];
  services: { id: string; name: string }[];
  specialistFns?: FnsGroup[];
  description?: string | null;
}

interface CityListResp {
  items: { id: string; name: string; slug: string }[];
}
interface FnsListResp {
  offices: {
    id: string;
    name: string;
    code: string;
    cityId: string;
    city?: { id: string; name: string };
  }[];
}
interface ServiceListResp {
  items: { id: string; name: string }[];
}

export default function SavedSpecialistsScreen() {
  const nav = useTypedRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWide = width >= 1024;

  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state — same shape as /specialists for shared filter component.
  const [cities, setCities] = useState<CityOpt[]>([]);
  const [fnsAll, setFnsAll] = useState<FnsOpt[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedFnsId, setSelectedFnsId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const hasAnyFilter =
    selectedCityId !== null ||
    selectedFnsId !== null ||
    selectedServiceIds.length > 0;

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      nav.replaceRoutes.login();
    }
  }, [authLoading, isAuthenticated, nav]);

  // Load filter source lists.
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const [c, s] = await Promise.all([
          apiGet<CityListResp>("/api/cities"),
          apiGet<ServiceListResp>("/api/services"),
        ]);
        setCities(c.items.map((it) => ({ id: it.id, name: it.name })));
        setServices(s.items);

        if (c.items.length > 0) {
          const ids = c.items.map((it) => it.id).join(",");
          try {
            const f = await apiGet<FnsListResp>(`/api/fns?city_ids=${ids}`);
            setFnsAll(
              f.offices.map((o) => ({
                id: o.id,
                name: o.name,
                code: o.code,
                cityId: o.cityId,
                cityName: o.city?.name,
              }))
            );
          } catch {
            /* typeahead degrades gracefully */
          }
        }
      } catch {
        // soft fail — filters degrade gracefully
      }
    })();
  }, [isAuthenticated]);

  const fetchSaved = useCallback(async () => {
    try {
      const parts: string[] = [];
      if (selectedCityId) parts.push(`cityId=${selectedCityId}`);
      if (selectedFnsId) parts.push(`fnsId=${selectedFnsId}`);
      if (selectedServiceIds.length === 1)
        parts.push(`serviceId=${selectedServiceIds[0]}`);
      const qs = parts.length ? `?${parts.join("&")}` : "";
      const res = await apiGet<{ items: SpecialistItem[] }>(
        `/api/saved-specialists/full${qs}`
      );
      setSpecialists(res.items);
      // Saved page implies all items are bookmarked
      setBookmarkedIds(new Set(res.items.map((i) => i.id)));
    } catch {
      setSpecialists([]);
    }
  }, [selectedCityId, selectedFnsId, selectedServiceIds]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetchSaved().finally(() => setLoading(false));
  }, [isAuthenticated, fetchSaved]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSaved();
    setRefreshing(false);
  }, [fetchSaved]);

  const handleProfile = useCallback(
    (id: string) => nav.dynamic.specialist(id),
    [nav]
  );

  const handlePickCity = useCallback((cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedFnsId(null);
  }, []);

  const handlePickFns = useCallback((fns: FnsOpt) => {
    setSelectedCityId(fns.cityId);
    setSelectedFnsId(fns.id);
  }, []);

  const handleClearLocation = useCallback(() => {
    setSelectedCityId(null);
    setSelectedFnsId(null);
  }, []);

  const handleToggleService = useCallback((id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const handleClearServices = useCallback(() => {
    setSelectedServiceIds([]);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedCityId(null);
    setSelectedFnsId(null);
    setSelectedServiceIds([]);
  }, []);

  // Bookmark toggle: removing from saved removes from this list.
  const handleBookmark = useCallback(async (id: string) => {
    const wasSaved = true; // by definition all items here are saved
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
      if (wasSaved) {
        setBookmarkedIds((prev) => new Set(prev).add(id));
        try {
          await apiPost(`/api/saved-specialists/${id}`, {});
        } catch {
          /* best-effort */
        }
      }
    }
  }, []);

  // Scroll-aware filter visibility (mirrors /specialists).
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

  if (authLoading || (loading && !refreshing)) {
    return (
      <SafeAreaView className="flex-1 bg-surface2 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      {/* Header */}
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 4,
          width: "100%",
          maxWidth: isDesktop ? 1100 : undefined,
          alignSelf: "center",
        }}
      >
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Мои специалисты
        </Text>
        {hasAnyFilter && (
          <Pressable
            accessibilityRole="button"
            onPress={handleResetFilters}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Сбросить
            </Text>
          </Pressable>
        )}
      </View>

      {/* Shared cascade filter (hides on scroll-down) */}
      <View style={{ display: filterVisible ? "flex" : "none" }}>
        <SpecialistFilter
          cities={cities}
          fnsAll={fnsAll}
          services={services}
          selectedCityId={selectedCityId}
          selectedFnsId={selectedFnsId}
          selectedServiceIds={selectedServiceIds}
          onPickCity={handlePickCity}
          onPickFns={handlePickFns}
          onClearLocation={handleClearLocation}
          onToggleService={handleToggleService}
          onClearServices={handleClearServices}
        />
      </View>

      {/* Saved list */}
      {specialists.length === 0 ? (
        hasAnyFilter ? (
          <EmptyState
            icon={Bookmark}
            title="Ничего не найдено"
            subtitle="Попробуйте сбросить фильтры или изменить запрос"
            actionLabel="Сбросить фильтры"
            onAction={handleResetFilters}
          />
        ) : (
          <EmptyState
            icon={Bookmark}
            title="Вы ещё не добавили специалистов в избранное"
            subtitle="Сохраняйте специалистов с страницы поиска, чтобы быстро возвращаться к ним позже"
            actionLabel="Найти специалиста"
            onAction={() => nav.routes.specialists()}
          />
        )
      ) : (
        <SpecialistsGrid
          specialists={specialists}
          gridCols={1}
          isDesktop={isDesktop}
          isWide={isWide}
          refreshing={refreshing}
          loadingMore={false}
          bookmarkedIds={bookmarkedIds}
          activeFnsId={selectedFnsId}
          onRefresh={handleRefresh}
          onLoadMore={() => {}}
          onPress={handleProfile}
          onBookmark={handleBookmark}
          onScroll={handleScroll}
        />
      )}
    </SafeAreaView>
  );
}
