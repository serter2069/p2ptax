import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { TriangleAlert, List } from "lucide-react-native";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";
import { colors, overlay } from "@/lib/theme";

interface Stats {
  threadsTotal: number;
  newMessages: number;
}

interface MatchingRequest {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  createdAt: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  service?: string;
  isMyRegion: boolean;
  hasThread: boolean;
  threadId: string | null;
  // legacy compat
  existingThreadId?: string | null;
}

interface DashboardData {
  isAvailable: boolean;
  activeThreads: number;
  matchingRequests: MatchingRequest[];
  stats: {
    threadsTotal: number;
    newMessages: number;
  };
}

export default function SpecialistDashboard() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [requests, setRequests] = useState<MatchingRequest[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(
    user?.isAvailable ?? true
  );
  const [availabilityToggling, setAvailabilityToggling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      // Try unified dashboard endpoint first
      try {
        const dashData = await apiGet<DashboardData>("/api/specialists/dashboard");
        setIsAvailable(dashData.isAvailable);
        setRequests(dashData.matchingRequests ?? []);
        setStats({
          threadsTotal: dashData.stats?.threadsTotal ?? dashData.activeThreads ?? 0,
          newMessages: dashData.stats?.newMessages ?? 0,
        });
        updateUser({ isAvailable: dashData.isAvailable });
        return;
      } catch {
        // Fallback to legacy separate endpoints
      }

      const [statsData, requestsData] = await Promise.all([
        apiGet<Stats>("/api/specialist/stats"),
        apiGet<{ items: MatchingRequest[] }>("/api/specialist/requests"),
      ]);
      setStats(statsData);
      setRequests(requestsData.items ?? []);
    } catch {
      setError(true);
    }
  }, [updateUser]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleToggleAvailability = useCallback(
    async (val: boolean) => {
      setIsAvailable(val);
      setAvailabilityToggling(true);
      try {
        await apiPatch("/api/specialists/availability", { isAvailable: val });
        updateUser({ isAvailable: val });
      } catch {
        // Revert on error
        setIsAvailable(!val);
      } finally {
        setAvailabilityToggling(false);
      }
    },
    [updateUser]
  );

  const firstName = user?.firstName ?? "специалист";

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
        <HeaderHome
          notificationCount={0}
          onSettingsPress={() => router.push("/settings/specialist" as never)}
        />
        <ResponsiveContainer>
          <View className="py-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} className="bg-white rounded-xl overflow-hidden border border-border">
                <LoadingState variant="skeleton" lines={3} />
              </View>
            ))}
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
        <HeaderHome
          onSettingsPress={() => router.push("/settings/specialist" as never)}
        />
        <ErrorState
          message="Не удалось загрузить заявки"
          onRetry={() => {
            setLoading(true);
            fetchData().finally(() => setLoading(false));
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <HeaderHome
        notificationCount={stats?.newMessages ?? 0}
        onSettingsPress={() => router.push("/settings/specialist" as never)}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <ResponsiveContainer>
          <View className="py-4">
            {/* Hero banner */}
            <View className="rounded-2xl px-5 py-5 mb-4" style={{ backgroundColor: colors.accent }}>
              <Text className="text-xl font-bold text-white mb-0.5">Здравствуйте, {firstName}!</Text>
              <Text className="text-sm" style={{ color: overlay.white75 }}>Панель специалиста по налогам</Text>
              <View className="flex-row mt-4 gap-3">
                <View className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: overlay.white15 }}>
                  <Text className="text-xs" style={{ color: overlay.white70 }}>Диалогов</Text>
                  <Text className="text-xl font-bold text-white">{stats?.threadsTotal ?? 0}</Text>
                </View>
                <View className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: overlay.white15 }}>
                  <Text className="text-xs" style={{ color: overlay.white70 }}>Новых сообщений</Text>
                  <Text className="text-xl font-bold text-white">{stats?.newMessages ?? 0}</Text>
                </View>
              </View>
            </View>

            {/* Availability toggle */}
            <View
              className="bg-white border border-border rounded-xl p-4 mb-4 flex-row items-center justify-between"
              style={{ borderLeftWidth: 3, borderLeftColor: colors.primary, shadowColor: colors.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 }}
            >
              <View className="flex-1 mr-3">
                <Text className="text-sm font-semibold text-text-base">
                  Принимаю заявки
                </Text>
                <Text className="text-xs text-text-mute mt-0.5">
                  {isAvailable
                    ? "Клиенты видят вас в каталоге"
                    : "Вы не принимаете новые заявки"}
                </Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                disabled={availabilityToggling}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            {/* Standby banner */}
            {!isAvailable && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Перейти в настройки"
                onPress={() => router.push("/settings/specialist" as never)}
                className="bg-warning-soft border border-warning rounded-xl p-4 mb-4 min-h-[44px]"
              >
                <View className="flex-row items-start">
                  <TriangleAlert
                    size={16}
                    color={colors.warning}
                    style={{ marginTop: 2 }}
                  />
                  <View className="flex-1 ml-2">
                    <Text className="text-sm font-semibold text-warning">
                      Вы не принимаете заявки
                    </Text>
                    <Text className="text-xs text-warning mt-0.5">
                      Клиенты не видят ваш профиль в каталоге. Включите приём заявок выше.
                    </Text>
                  </View>
                  <Text className="text-xs text-warning underline ml-2">
                    Настройки
                  </Text>
                </View>
              </Pressable>
            )}

            {/* Section header */}
            <View className="flex-row items-center justify-between border-b border-border pb-2 mb-3">
              <Text className="text-base font-semibold text-text-base">
                Подходящие заявки
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Мои обращения"
                onPress={() => router.push("/(specialist-tabs)/threads" as never)}
                className="min-h-[44px] justify-center px-1"
              >
                <Text className="text-sm text-accent font-medium">
                  Мои обращения
                </Text>
              </Pressable>
            </View>

            {/* Request list or empty */}
            {requests.length === 0 ? (
              <EmptyState
                icon={List}
                title="Нет подходящих заявок"
                subtitle="Расширьте рабочую область, чтобы видеть больше заявок из других городов и инспекций"
                actionLabel="Расширить рабочую область"
                onAction={() => router.push("/settings/specialist" as never)}
              />
            ) : (
              requests.map((item) => (
                <RequestCard
                  key={item.id}
                  item={item}
                  onWrite={() => router.push(`/requests/${item.id}/write` as never)}
                  onOpenThread={() => {
                    const tid = item.threadId ?? item.existingThreadId ?? null;
                    if (tid) router.push(`/threads/${tid}` as never);
                  }}
                  onPress={() => router.push(`/requests/${item.id}` as never)}
                />
              ))
            )}

            <View className="h-8" />
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({
  item,
  onWrite,
  onOpenThread,
  onPress,
}: {
  item: MatchingRequest;
  onWrite: () => void;
  onOpenThread: () => void;
  onPress: () => void;
}) {
  const hasThread = item.hasThread || !!(item.existingThreadId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={onPress}
      className="bg-white border border-border rounded-xl p-4 mb-3 min-h-[44px]"
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
        shadowColor: '#0b1424',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      })}
    >
      {/* Title + status */}
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-base font-semibold text-text-base flex-1 mr-2"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      {/* Chips */}
      <View className="flex-row flex-wrap gap-1.5 mb-2">
        <View className="bg-surface2 px-2 py-0.5 rounded-full">
          <Text className="text-xs text-text-mute">{item.city.name}</Text>
        </View>
        <View className="bg-surface2 px-2 py-0.5 rounded-full">
          <Text className="text-xs text-text-mute">{item.fns.name}</Text>
        </View>
        {item.service ? (
          <View className="bg-accent-soft px-2 py-0.5 rounded-full">
            <Text className="text-xs text-accent">{item.service}</Text>
          </View>
        ) : null}
        {!item.isMyRegion ? (
          <View className="bg-surface2 px-2 py-0.5 rounded-full">
            <Text className="text-xs text-text-mute">Не ваш регион</Text>
          </View>
        ) : null}
      </View>

      {/* Description */}
      <Text className="text-sm text-text-mute mb-3" numberOfLines={2}>
        {item.description}
      </Text>

      {/* Action */}
      {hasThread ? (
        <View className="flex-row items-center justify-between">
          <View className="bg-success-soft border border-success px-3 py-1 rounded-full">
            <Text className="text-xs text-success font-medium">
              Вы уже откликнулись
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Открыть чат"
            onPress={(e) => {
              e.stopPropagation?.();
              onOpenThread();
            }}
            className="bg-accent rounded-xl px-4 py-2"
          >
            <Text className="text-white text-sm font-semibold">Открыть чат</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Написать клиенту"
          onPress={(e) => {
            e.stopPropagation?.();
            onWrite();
          }}
          className="bg-accent rounded-xl py-2.5 items-center"
        >
          <Text className="text-white text-sm font-semibold">Написать клиенту</Text>
        </Pressable>
      )}
    </Pressable>
  );
}
