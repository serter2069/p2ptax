import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import RequestCard from "@/components/RequestCard";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(false);
      const [statsRes, requestsRes] = await Promise.all([
        api<DashboardStats>("/api/dashboard/stats"),
        api<{ items: RequestItem[] }>("/api/requests/my?limit=3"),
      ]);
      setStats(statsRes);
      setRequests(requestsRes.items);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
      setError(true);
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
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <HeaderHome
        notificationCount={stats?.unreadMessages ?? 0}
        onSettingsPress={() => router.push("/settings/client" as never)}
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <ResponsiveContainer>
          {/* Welcome header */}
          <View className="pt-4 pb-2">
            <Text className="text-2xl font-bold text-slate-900">
              Здравствуйте, {user?.firstName ?? ""}!
            </Text>
          </View>

          {loading ? (
            <LoadingState variant="skeleton" lines={5} />
          ) : error ? (
            <ErrorState
              message="Не удалось загрузить данные"
              onRetry={() => {
                setLoading(true);
                fetchData().finally(() => setLoading(false));
              }}
            />
          ) : (
            <View className="pb-6">
              {/* Stats card */}
              <View className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                <Text className="text-sm text-slate-500 mb-1">
                  Заявок использовано
                </Text>
                <Text className="text-xl font-bold text-slate-900 mb-3">
                  {stats?.requestsUsed ?? 0} из {stats?.requestsLimit ?? 5}
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

              {/* Unread messages badge */}
              {(stats?.unreadMessages ?? 0) > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Непрочитанные сообщения"
                  onPress={() => router.push("/(client-tabs)/messages" as never)}
                  className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex-row items-center justify-between"
                >
                  <Text className="text-sm font-medium text-amber-700">
                    Непрочитанных сообщений: {stats?.unreadMessages}
                  </Text>
                  <Text className="text-xs text-amber-600">Открыть →</Text>
                </Pressable>
              )}

              {/* Create request CTA */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={atLimit ? "Лимит заявок исчерпан" : "Создать заявку"}
                onPress={() => !atLimit && router.push("/requests/new" as never)}
                disabled={atLimit}
                className={`rounded-xl p-4 mb-6 ${atLimit ? "bg-slate-100 border border-slate-200" : "bg-blue-900"}`}
              >
                <Text
                  className={`font-semibold text-base ${atLimit ? "text-slate-400" : "text-white"}`}
                >
                  {atLimit ? "Лимит заявок исчерпан" : "Создать заявку"}
                </Text>
                {!atLimit && (
                  <Text className="text-sm text-blue-200 mt-0.5">
                    Опишите проблему — специалисты откликнутся сами
                  </Text>
                )}
              </Pressable>

              {/* My requests section */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-slate-900">
                  Мои заявки
                </Text>
                {requests.length > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Смотреть все заявки"
                    onPress={() => router.push("/(client-tabs)/requests" as never)}
                  >
                    <Text className="text-sm text-blue-900 font-medium">
                      Смотреть все
                    </Text>
                  </Pressable>
                )}
              </View>

              {requests.length === 0 ? (
                <EmptyState
                  icon="file-text-o"
                  title="У вас пока нет заявок"
                  subtitle="Создайте первую заявку — специалисты из вашего города увидят её и предложат помощь"
                  actionLabel="Создать первую заявку"
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
