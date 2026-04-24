import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderHome from "@/components/HeaderHome";
import DesktopScreen from "@/components/layout/DesktopScreen";
import RequestCard from "@/components/RequestCard";
import { FileText, MessageSquare, Plus } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, overlay, shadowColor, textStyle } from "@/lib/theme";

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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
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
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
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
        <DesktopScreen>
          {/* Hero greeting — accent banner */}
          <View
            className="rounded-2xl px-5 py-5 mb-4 mt-4"
            style={{ backgroundColor: colors.accent }}
          >
            <Text style={{ ...textStyle.h3, color: "#ffffff", marginBottom: 2 }}>
              {user?.firstName ? `Здравствуйте, ${user.firstName}!` : "Здравствуйте!"}
            </Text>
            <Text style={{ ...textStyle.small, color: overlay.white75 }}>
              Ваш личный кабинет налогоплательщика
            </Text>

            {/* Stats row */}
            <View className="flex-row mt-4 gap-3">
              <View
                className="flex-1 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: overlay.white15 }}
              >
                <Text className="text-xs" style={{ color: overlay.white70 }}>
                  Заявок
                </Text>
                <Text className="text-xl font-bold text-white">
                  {stats?.requestsUsed ?? 0}
                  <Text className="text-sm font-normal" style={{ color: overlay.white70 }}>
                    /{stats?.requestsLimit ?? 5}
                  </Text>
                </Text>
              </View>
              <View
                className="flex-1 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: overlay.white15 }}
              >
                <Text className="text-xs" style={{ color: overlay.white70 }}>
                  Сообщений
                </Text>
                <Text className="text-xl font-bold text-white">
                  {stats?.unreadMessages ?? 0}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: overlay.white20 }}>
              <View
                className="h-full rounded-full bg-white"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            {atLimit && (
              <Text className="text-xs mt-1.5" style={{ color: overlay.white80 }}>
                Лимит заявок исчерпан
              </Text>
            )}
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
              {/* Unread messages alert */}
              {(stats?.unreadMessages ?? 0) > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Непрочитанные сообщения"
                  onPress={() => router.push("/(client-tabs)/messages" as never)}
                  className="bg-warning-soft border border-warning rounded-xl px-4 mb-4 flex-row items-center justify-between"
                  style={{ minHeight: 52 }}
                >
                  <View className="flex-row items-center gap-2 flex-1">
                    <MessageSquare size={16} color={colors.warning} />
                    <Text className="text-sm font-medium text-warning flex-1">
                      Непрочитанных: {stats?.unreadMessages}
                    </Text>
                  </View>
                  <Text className="text-xs text-warning font-semibold">Открыть →</Text>
                </Pressable>
              )}

              {/* Create request CTA */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={atLimit ? "Лимит заявок исчерпан" : "Создать заявку"}
                onPress={() => !atLimit && router.push("/requests/new" as never)}
                disabled={atLimit}
                className={`rounded-2xl px-4 mb-6 flex-row items-center justify-between ${atLimit ? "bg-surface2 border border-border" : "bg-accent"}`}
                style={{ minHeight: 56 }}
              >
                <View className="flex-1">
                  <Text
                    className={`font-semibold text-base ${atLimit ? "text-text-mute" : "text-white"}`}
                  >
                    {atLimit ? "Лимит заявок исчерпан" : "Создать заявку"}
                  </Text>
                  {!atLimit && (
                    <Text className="text-sm mt-0.5" style={{ color: overlay.white75 }}>
                      Специалисты откликнутся сами
                    </Text>
                  )}
                </View>
                {!atLimit && (
                  <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: overlay.white20 }}>
                    <Plus size={18} color={colors.surface} />
                  </View>
                )}
              </Pressable>

              {/* My requests section */}
              <View className="flex-row items-center justify-between mb-3">
                <Text style={{ ...textStyle.h4, color: colors.text }}>
                  Мои заявки
                </Text>
                {requests.length > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Смотреть все заявки"
                    onPress={() => router.push("/(client-tabs)/requests" as never)}
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <Text className="text-sm text-accent font-medium">
                      Смотреть все
                    </Text>
                  </Pressable>
                )}
              </View>

              {requests.length === 0 ? (
                <EmptyState
                  icon={FileText}
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
        </DesktopScreen>
      </ScrollView>
    </SafeAreaView>
  );
}
