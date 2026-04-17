import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import RequestCard from "@/components/RequestCard";
import EmptyState from "@/components/EmptyState";
import { api } from "@/lib/api";

interface DashboardStats {
  requestsUsed: number;
  requestsLimit: number;
  unreadMessages: number;
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
}

export default function ClientDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, requestsRes] = await Promise.all([
        api<DashboardStats>("/api/dashboard/stats"),
        api<{ items: RequestItem[] }>("/api/requests/my?limit=3"),
      ]);
      setStats(statsRes);
      setRequests(requestsRes.items);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const atLimit = stats ? stats.requestsUsed >= stats.requestsLimit : false;
  const progressPercent = stats
    ? Math.min(100, (stats.requestsUsed / stats.requestsLimit) * 100)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderHome
        notificationCount={stats?.unreadMessages || 0}
        onSettingsPress={() => router.push("/settings/client" as never)}
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <ResponsiveContainer>
          {loading ? (
            <View className="flex-1 items-center justify-center py-16">
              <ActivityIndicator size="large" color="#1e3a8a" />
            </View>
          ) : (
            <View className="py-4">
              {/* Stats card */}
              <View className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                <Text className="text-base font-semibold text-slate-900 mb-2">
                  {stats?.requestsUsed ?? 0} из {stats?.requestsLimit ?? 5} заявок использовано
                </Text>
                <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${atLimit ? "bg-red-600" : "bg-blue-900"}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
                {atLimit && (
                  <Text className="text-xs text-red-600 mt-2">
                    Лимит заявок исчерпан
                  </Text>
                )}
              </View>

              {/* Create request button */}
              <Pressable
                onPress={() => router.push("/requests/new" as never)}
                disabled={atLimit}
                className={`rounded-xl py-3 items-center mb-6 ${
                  atLimit ? "bg-slate-300" : "bg-blue-900"
                }`}
              >
                <Text className="text-white font-semibold text-base">
                  Создать заявку
                </Text>
              </Pressable>

              {/* My requests section */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-slate-900">
                  Мои заявки
                </Text>
                {requests.length > 0 && (
                  <Pressable onPress={() => router.push("/(client-tabs)/requests" as never)}>
                    <Text className="text-sm text-blue-900 font-medium">
                      Все заявки
                    </Text>
                  </Pressable>
                )}
              </View>

              {requests.length === 0 ? (
                <EmptyState
                  icon="file-text-o"
                  title="Заявок пока нет"
                  subtitle="Создайте первую заявку, чтобы найти специалиста"
                  actionLabel="Создать заявку"
                  onAction={() => router.push("/requests/new" as never)}
                />
              ) : (
                requests.map((item) => (
                  <RequestCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    description={item.description}
                    status={item.status}
                    city={item.city}
                    fns={item.fns}
                    threadsCount={item.threadsCount}
                    onPress={(id) =>
                      router.push(`/requests/${id}/detail` as never)
                    }
                  />
                ))
              )}
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
