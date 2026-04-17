import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/api";

interface Stats {
  threadsTotal: number;
  newMessages: number;
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
  isMyRegion: boolean;
  existingThreadId: string | null;
}

export default function SpecialistDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, requestsData] = await Promise.all([
        apiGet<Stats>("/api/specialist/stats"),
        apiGet<{ items: RequestItem[] }>("/api/specialist/requests"),
      ]);
      setStats(statsData);
      setRequests(requestsData.items);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <HeaderHome onSettingsPress={() => router.push("/settings/specialist" as never)} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderHome onSettingsPress={() => router.push("/settings/specialist" as never)} />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ResponsiveContainer>
          {/* Unavailable warning */}
          {user && !user.isAvailable && (
            <Pressable
              accessibilityLabel="Включить приём заявок"
              onPress={() => router.push("/settings/specialist" as never)}
              className="bg-amber-50 border border-amber-300 rounded-xl p-4 mt-4"
            >
              <View className="flex-row items-center">
                <FontAwesome name="exclamation-triangle" size={16} color="#b45309" />
                <Text className="text-sm text-amber-700 font-medium ml-2 flex-1">
                  Вы в режиме ожидания
                </Text>
                <Text className="text-xs text-amber-700 underline">Настройки</Text>
              </View>
            </Pressable>
          )}

          {/* Stats */}
          {stats && (
            <View className="flex-row gap-3 mt-4">
              <View className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <Text className="text-2xl font-bold text-slate-900">
                  {stats.threadsTotal}
                </Text>
                <Text className="text-xs text-slate-400 mt-1">Всего диалогов</Text>
              </View>
              <View className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <Text className="text-2xl font-bold text-blue-900">
                  {stats.newMessages}
                </Text>
                <Text className="text-xs text-slate-400 mt-1">Новых сообщений</Text>
              </View>
            </View>
          )}

          {/* Matching requests */}
          <Text className="text-lg font-semibold text-slate-900 mt-6 mb-3">
            Подходящие заявки
          </Text>

          {requests.length === 0 ? (
            <EmptyState
              icon="list-alt"
              title="Пока нет подходящих заявок"
              subtitle="Новые заявки появятся здесь"
            />
          ) : (
            requests.map((r) => (
              <SpecialistRequestCard
                key={r.id}
                item={r}
                onWrite={() => router.push(`/requests/${r.id}/write` as never)}
                onOpenThread={() =>
                  r.existingThreadId
                    ? router.push(`/threads/${r.existingThreadId}` as never)
                    : undefined
                }
              />
            ))
          )}

          <View className="h-8" />
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

function SpecialistRequestCard({
  item,
  onWrite,
  onOpenThread,
}: {
  item: RequestItem;
  onWrite: () => void;
  onOpenThread: () => void;
}) {
  return (
    <View className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-slate-900 flex-1 mr-2" numberOfLines={1}>
          {item.title}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      <View className="flex-row flex-wrap gap-1.5 mb-2">
        <View className="bg-slate-50 px-2 py-0.5 rounded">
          <Text className="text-xs text-slate-400">{item.city.name}</Text>
        </View>
        <View className="bg-slate-50 px-2 py-0.5 rounded">
          <Text className="text-xs text-slate-400">{item.fns.name}</Text>
        </View>
      </View>

      <Text className="text-sm text-slate-400 mb-3" numberOfLines={2}>
        {item.description}
      </Text>

      {!item.isMyRegion && (
        <View className="bg-slate-100 px-2 py-1 rounded-full self-start mb-3">
          <Text className="text-xs text-slate-400">Не ваш регион</Text>
        </View>
      )}

      {item.existingThreadId ? (
        <View className="flex-row items-center justify-between">
          <View className="bg-emerald-50 px-2 py-1 rounded-full">
            <Text className="text-xs text-emerald-600 font-medium">Вы уже писали</Text>
          </View>
          <Pressable
            accessibilityLabel="Открыть чат"
            onPress={onOpenThread}
            className="bg-blue-900 rounded-xl px-4 py-2"
          >
            <Text className="text-white text-sm font-semibold">Открыть чат</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityLabel="Написать клиенту"
          onPress={onWrite}
          className="bg-amber-700 rounded-xl py-3 items-center"
        >
          <Text className="text-white text-sm font-semibold">Написать</Text>
        </Pressable>
      )}
    </View>
  );
}
