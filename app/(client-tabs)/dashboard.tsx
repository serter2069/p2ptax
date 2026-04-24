import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  MessageSquare,
  FileText,
  Inbox,
  Plus,
  Lightbulb,
  ClipboardList,
} from "lucide-react-native";
import HeaderHome from "@/components/HeaderHome";
import DesktopScreen from "@/components/layout/DesktopScreen";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import StatusBadge from "@/components/StatusBadge";
import {
  DashboardGrid,
  KpiCard,
  DashboardWidget,
  FeedList,
  type FeedItem,
} from "@/components/dashboard";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, spacing } from "@/lib/theme";

interface DashboardStats {
  requestsUsed: number;
  requestsLimit: number;
  unreadMessages: number;
}

interface ClientDashboardExtra {
  activeRequests: number;
  threadsToday: number;
  awaitingReplies: number;
  specialistsWorkingWithYou: number;
  weeklyNewRequests: number;
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

const TIPS: { title: string; text: string }[] = [
  {
    title: "Укажите ФНС",
    text: "Специалисты ищут заявки по своим инспекциям — без ФНС вас не увидят.",
  },
  {
    title: "Опишите ситуацию",
    text: "Чем точнее суть, тем быстрее вам напишут профильные эксперты.",
  },
  {
    title: "Будьте на связи",
    text: "Первые сообщения приходят в течение 24 часов — отвечайте быстро.",
  },
];

export default function ClientDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [extra, setExtra] = useState<ClientDashboardExtra | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(false);
      const [statsRes, requestsRes] = await Promise.all([
        api<DashboardStats>("/api/dashboard/stats"),
        api<{ items: RequestItem[] }>("/api/requests/my?limit=8"),
      ]);
      setStats(statsRes);
      setRequests(requestsRes.items);

      try {
        const ex = await api<ClientDashboardExtra>(
          "/api/stats/client-dashboard"
        );
        setExtra(ex);
      } catch {
        setExtra(null);
      }
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
  const firstName = user?.firstName ?? "";
  const activeRequests = requests.filter(
    (r) => r.status === "ACTIVE" || r.status === "CLOSING_SOON"
  );

  const feedItems: FeedItem[] = useMemo(
    () =>
      requests.map((r) => ({
        id: r.id,
        title: r.title,
        meta: `${r.city.name} · ${r.fns.name}`,
        rightValue:
          r.threadsCount > 0
            ? `${r.threadsCount} ${r.threadsCount === 1 ? "диалог" : r.threadsCount < 5 ? "диалога" : "диалогов"}`
            : undefined,
        icon: FileText,
        iconTone:
          r.status === "CLOSING_SOON"
            ? "warning"
            : r.status === "CLOSED"
              ? "muted"
              : "primary",
        onPress: () => router.push(`/requests/${r.id}/detail` as never),
      })),
    [requests, router]
  );

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
        <DesktopScreen
          title={firstName ? `Здравствуйте, ${firstName}!` : "Главная"}
          subtitle="Ваш рабочий стол: заявки, диалоги, сообщения"
        >
          {loading ? (
            <View style={{ paddingVertical: spacing.lg, gap: spacing.md }}>
              <LoadingState variant="skeleton" lines={5} />
            </View>
          ) : error ? (
            <ErrorState
              message="Не удалось загрузить данные"
              onRetry={() => {
                setLoading(true);
                fetchData().finally(() => setLoading(false));
              }}
            />
          ) : (
            <View style={{ gap: 24 }}>
              {/* Top KPI row: 3 KPIs */}
              <DashboardGrid>
                <DashboardGrid.Col span={4} tabletSpan={1}>
                  <KpiCard
                    label="Активных заявок"
                    value={extra?.activeRequests ?? activeRequests.length}
                    hint={`из ${stats?.requestsLimit ?? 5} доступных`}
                    icon={FileText}
                    tone="primary"
                    onPress={() => router.push("/(client-tabs)/requests" as never)}
                  />
                </DashboardGrid.Col>
                <DashboardGrid.Col span={4} tabletSpan={1}>
                  <KpiCard
                    label="Непрочитанных сообщений"
                    value={stats?.unreadMessages ?? 0}
                    icon={MessageSquare}
                    tone={(stats?.unreadMessages ?? 0) > 0 ? "warning" : "muted"}
                    onPress={() => router.push("/(client-tabs)/messages" as never)}
                  />
                </DashboardGrid.Col>
                <DashboardGrid.Col span={4} tabletSpan={2}>
                  <KpiCard
                    label="Новых диалогов сегодня"
                    value={extra?.threadsToday ?? 0}
                    icon={Inbox}
                    tone={(extra?.threadsToday ?? 0) > 0 ? "success" : "muted"}
                    trend={
                      (extra?.threadsToday ?? 0) > 0 ? "up" : "flat"
                    }
                  />
                </DashboardGrid.Col>
              </DashboardGrid>

              {/* Main + sidebar: 8 / 4 */}
              <DashboardGrid>
                <DashboardGrid.Col span={8} tabletSpan={2}>
                  <DashboardWidget
                    title="Мои заявки"
                    subtitle={
                      feedItems.length > 0
                        ? `Всего ${feedItems.length}`
                        : "Пусто"
                    }
                    icon={ClipboardList}
                    actionLabel="Все →"
                    onActionPress={() =>
                      router.push("/(client-tabs)/requests" as never)
                    }
                    flush
                  >
                    <FeedList
                      items={feedItems}
                      limit={6}
                      emptyText="У вас пока нет заявок. Создайте первую."
                    />
                    {activeRequests.length > 0 ? (
                      <View
                        className="flex-row flex-wrap items-center gap-2"
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderTopWidth: 1,
                          borderTopColor: colors.border,
                        }}
                      >
                        {activeRequests.slice(0, 3).map((r) => (
                          <StatusBadge key={r.id} status={r.status} />
                        ))}
                        <Text className="text-text-dim" style={{ fontSize: 12 }}>
                          {activeRequests.length} активных
                        </Text>
                      </View>
                    ) : null}
                  </DashboardWidget>
                </DashboardGrid.Col>

                <DashboardGrid.Col span={4} tabletSpan={2}>
                  <View style={{ gap: 16 }}>
                    {/* Primary CTA */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Создать заявку"
                      onPress={() => router.push("/requests/new" as never)}
                      disabled={atLimit}
                      className={`rounded-2xl p-5 ${atLimit ? "bg-surface2 border border-border" : "bg-accent"}`}
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className={`rounded-xl items-center justify-center ${atLimit ? "bg-white" : "bg-white/20"}`}
                          style={{ width: 44, height: 44 }}
                        >
                          <Plus
                            size={22}
                            color={atLimit ? colors.textMuted : "#fff"}
                          />
                        </View>
                        <View className="flex-1 min-w-0">
                          <Text
                            className={`font-extrabold ${atLimit ? "text-text-mute" : "text-white"}`}
                            style={{ fontSize: 16 }}
                          >
                            {atLimit ? "Лимит исчерпан" : "Создать заявку"}
                          </Text>
                          <Text
                            className={atLimit ? "text-text-dim" : "text-white/80"}
                            style={{ fontSize: 12, marginTop: 2 }}
                          >
                            {atLimit
                              ? "Закройте одну, чтобы создать новую"
                              : "Первые сообщения в течение 24 часов"}
                          </Text>
                        </View>
                      </View>
                    </Pressable>

                    {/* Tips widget */}
                    <DashboardWidget title="Советы" icon={Lightbulb}>
                      <View style={{ gap: 12 }}>
                        {TIPS.map((t) => (
                          <View key={t.title}>
                            <Text
                              className="text-text-base font-semibold"
                              style={{ fontSize: 13 }}
                            >
                              {t.title}
                            </Text>
                            <Text
                              className="text-text-mute mt-0.5"
                              style={{ fontSize: 12, lineHeight: 16 }}
                            >
                              {t.text}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </DashboardWidget>
                  </View>
                </DashboardGrid.Col>
              </DashboardGrid>
            </View>
          )}
        </DesktopScreen>
      </ScrollView>
    </SafeAreaView>
  );
}
