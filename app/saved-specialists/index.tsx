import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTypedRouter } from "@/lib/navigation";
import SpecialistsGrid from "@/components/specialists/SpecialistsGrid";
import EmptyState from "@/components/ui/EmptyState";
import { Bookmark } from "lucide-react-native";
import { apiGet, apiDelete, apiPost } from "@/lib/api";
import { colors } from "@/lib/theme";

interface SpecialistItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  description?: string | null;
}

export default function SavedSpecialistsScreen() {
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWide = width >= 1024;
  const gridCols = isWide ? 3 : isDesktop ? 2 : 1;

  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setError] = useState<string | null>(null);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await apiGet<{ items: SpecialistItem[] }>(
        "/api/saved-specialists/full"
      );
      setSpecialists(res.items);
      setSavedIds(new Set(res.items.map((s) => s.id)));
      setError(null);
    } catch (e) {
      setError("Не удалось загрузить список");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSaved().finally(() => setLoading(false));
  }, [fetchSaved]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSaved();
    setRefreshing(false);
  }, [fetchSaved]);

  const handleBookmarkToggle = useCallback(
    async (id: string) => {
      const isSaved = savedIds.has(id);
      // Optimistic update
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      if (isSaved) {
        setSpecialists((prev) => prev.filter((s) => s.id !== id));
      }

      try {
        if (isSaved) {
          await apiDelete(`/api/saved-specialists/${id}`);
        } else {
          await apiPost(`/api/saved-specialists/${id}`, {});
        }
      } catch {
        // Revert on error
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (isSaved) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
        await fetchSaved();
      }
    },
    [savedIds, fetchSaved]
  );

  const handleSpecialistPress = useCallback(
    (id: string) => {
      nav.any(`/specialists/${id}`);
    },
    [nav]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface2 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <View
        style={{
          width: "100%",
          maxWidth: isWide ? 1200 : isDesktop ? 900 : undefined,
          alignSelf: "center",
          paddingHorizontal: gridCols > 1 ? (isWide ? 32 : 16) : 16,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Text className="text-xl font-bold text-text-base">Мои специалисты</Text>
      </View>

      {specialists.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Нет сохранённых специалистов"
          subtitle="Добавляйте специалистов в избранное на странице поиска"
          actionLabel="Найти специалиста"
          onAction={() => nav.any("/specialists")}
        />
      ) : (
        <SpecialistsGrid
          specialists={specialists}
          gridCols={gridCols}
          isDesktop={isDesktop}
          isWide={isWide}
          refreshing={refreshing}
          loadingMore={false}
          bookmarkedIds={savedIds}
          onRefresh={handleRefresh}
          onLoadMore={() => {}}
          onPress={handleSpecialistPress}
          onBookmark={handleBookmarkToggle}
        />
      )}
    </SafeAreaView>
  );
}
