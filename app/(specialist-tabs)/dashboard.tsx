import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";
import { colors } from "@/lib/theme";

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
      <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
        <HeaderHome
          notificationCount={0}
          onSettingsPress={() => router.push("/settings/specialist" as never)}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
        <HeaderHome
          onSettingsPress={() => router.push("/settings/specialist" as never)}
        />
        <View className="flex-1 items-center justify-center px-8">
          <FontAwesome name="exclamation-circle" size={48} color={colors.placeholder} />
          <Text className="text-lg font-semibold text-slate-900 mt-4 text-center">
            Не удалось загрузить заявки
          </Text>
          <Text className="text-sm text-slate-500 mt-2 text-center">
            Проверьте соединение с интернетом и попробуйте снова
          </Text>
          <View className="mt-6">
            <Button
              label="Повторить"
              onPress={() => {
                setLoading(true);
                fetchData().finally(() => setLoading(false));
              }}
              fullWidth={false}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <HeaderHome
        notificationCount={stats?.newMessages ?? 0}
        onSettingsPress={() => router.push("/settings/specialist" as never)}
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <ResponsiveContainer>
          <View className="py-4">
            {/* Welcome header */}
            <Text className="text-2xl font-bold text-slate-900 mb-4">
              Здравствуйте, {firstName}!
            </Text>

            {/* Availability toggle */}
            <View className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-semibold text-slate-900">
                  Принимаю заявки
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
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
                accessibilityLabel="Перейти в настройки"
                onPress={() => router.push("/settings/specialist" as never)}
                className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4"
              >
                <View className="flex-row items-start">
                  <FontAwesome
                    name="exclamation-triangle"
                    size={16}
                    color={colors.accent}
                    style={{ marginTop: 2 }}
                  />
                  <View className="flex-1 ml-2">
                    <Text className="text-sm font-semibold text-amber-700">
                      Вы не принимаете заявки
                    </Text>
                    <Text className="text-xs text-amber-600 mt-0.5">
                      Клиенты не видят ваш профиль в каталоге. Включите приём заявок выше.
                    </Text>
                  </View>
                  <Text className="text-xs text-amber-700 underline ml-2">
                    Настройки
                  </Text>
                </View>
              </Pressable>
            )}

            {/* Stats row */}
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-white border border-slate-200 rounded-xl p-4">
                <Text className="text-2xl font-bold text-slate-900">
                  {stats?.threadsTotal ?? 0}
                </Text>
                <Text className="text-xs text-slate-500 mt-1">Всего диалогов</Text>
              </View>
              <View className="flex-1 bg-white border border-slate-200 rounded-xl p-4">
                <Text className="text-2xl font-bold text-blue-900">
                  {stats?.newMessages ?? 0}
                </Text>
                <Text className="text-xs text-slate-500 mt-1">Новых сообщений</Text>
              </View>
            </View>

            {/* Section header */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-slate-900">
                Подходящие заявки
              </Text>
              <Pressable
                accessibilityLabel="Мои обращения"
                onPress={() => router.push("/(specialist-tabs)/threads" as never)}
              >
                <Text className="text-sm text-blue-900 font-medium">
                  Мои обращения
                </Text>
              </Pressable>
            </View>

            {/* Request list or empty */}
            {requests.length === 0 ? (
              <EmptyState
                icon="list-alt"
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
      accessibilityLabel={item.title}
      onPress={onPress}
      className="bg-white border border-slate-200 rounded-xl p-4 mb-3"
      style={({ pressed }) => pressed ? { opacity: 0.92 } : undefined}
    >
      {/* Title + status */}
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-base font-semibold text-slate-900 flex-1 mr-2"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      {/* Chips */}
      <View className="flex-row flex-wrap gap-1.5 mb-2">
        <View className="bg-slate-100 px-2 py-0.5 rounded-full">
          <Text className="text-xs text-slate-500">{item.city.name}</Text>
        </View>
        <View className="bg-slate-100 px-2 py-0.5 rounded-full">
          <Text className="text-xs text-slate-500">{item.fns.name}</Text>
        </View>
        {item.service ? (
          <View className="bg-blue-50 px-2 py-0.5 rounded-full">
            <Text className="text-xs text-blue-700">{item.service}</Text>
          </View>
        ) : null}
        {!item.isMyRegion ? (
          <View className="bg-slate-100 px-2 py-0.5 rounded-full">
            <Text className="text-xs text-slate-400">Не ваш регион</Text>
          </View>
        ) : null}
      </View>

      {/* Description */}
      <Text className="text-sm text-slate-500 mb-3" numberOfLines={2}>
        {item.description}
      </Text>

      {/* Action */}
      {hasThread ? (
        <View className="flex-row items-center justify-between">
          <View className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <Text className="text-xs text-emerald-700 font-medium">
              Вы уже откликнулись
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Открыть чат"
            onPress={(e) => {
              e.stopPropagation?.();
              onOpenThread();
            }}
            className="bg-blue-900 rounded-xl px-4 py-2"
          >
            <Text className="text-white text-sm font-semibold">Открыть чат</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityLabel="Написать клиенту"
          onPress={(e) => {
            e.stopPropagation?.();
            onWrite();
          }}
          className="bg-amber-700 rounded-xl py-2.5 items-center"
        >
          <Text className="text-white text-sm font-semibold">Написать клиенту</Text>
        </Pressable>
      )}
    </Pressable>
  );
}
