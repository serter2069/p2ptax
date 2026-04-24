import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Inbox,
  MessageSquare,
  TrendingUp,
  Clock,
  Sparkles,
  CalendarDays,
  List,
} from "lucide-react-native";
import HeaderHome from "@/components/HeaderHome";
import DesktopScreen from "@/components/layout/DesktopScreen";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import {
  DashboardGrid,
  KpiCard,
  DashboardWidget,
  FeedList,
  type FeedItem,
} from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";
import { colors } from "@/lib/theme";

interface Stats {
  threadsTotal: number;
  newMessages: number;
}

interface SpecialistExtra {
  newRequestsWeek: number;
  awaitingMyReply: number;
  activeThreads: number;
  disputedAmountMonth: number;
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
  hasThread?: boolean;
  threadId?: string | null;
  existingThreadId?: string | null;
}

interface DashboardData {
  isAvailable: boolean;
  activeThreads: number;
  matchingRequests: MatchingRequest[];
  stats: { threadsTotal: number; newMessages: number };
}

const THREAD_LIMIT_PER_DAY = 20;

export default function SpecialistDashboard() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [extra, setExtra] = useState<SpecialistExtra | null>(null);
  const [requests, setRequests] = useState<MatchingRequest[]>([]);
  const [threadsToday, setThreadsToday] = useState(0);
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
      try {
        const dashData = await apiGet<DashboardData>(
          "/api/specialists/dashboard"
        );
        setIsAvailable(dashData.isAvailable);
        setRequests(dashData.matchingRequests ?? []);
        setStats({
          threadsTotal:
            dashData.stats?.threadsTotal ?? dashData.activeThreads ?? 0,
          newMessages: dashData.stats?.newMessages ?? 0,
        });
        updateUser({ isAvailable: dashData.isAvailable });
      } catch {
        const [statsData, requestsData] = await Promise.all([
          apiGet<Stats>("/api/specialist/stats"),
          apiGet<{ items: MatchingRequest[] }>("/api/specialist/requests"),
        ]);
        setStats(statsData);
        setRequests(requestsData.items ?? []);
      }

      try {
        const ex = await apiGet<SpecialistExtra>(
          "/api/stats/specialist-dashboard"
        );
        setExtra(ex);
      } catch {
        setExtra(null);
      }

      try {
        const today = await apiGet<{ count: number }>(
          "/api/specialist/threads-today"
        );
        setThreadsToday(today.count);
      } catch {
        setThreadsToday(0);
      }
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
        setIsAvailable(!val);
      } finally {
        setAvailabilityToggling(false);
      }
    },
    [updateUser]
  );

  const firstName = user?.firstName ?? "специалист";
  const matched = requests.filter((r) => r.status !== "CLOSED");
  const newLeads = matched.filter((r) => !r.hasThread);
  const matchedToday = matched.filter((r) => {
    const dt = new Date(r.createdAt);
    const now = new Date();
    return dt.toDateString() === now.toDateString();
  });

  const activeThreads = extra?.activeThreads ?? stats?.threadsTotal ?? 0;
  const weekCount = extra?.newRequestsWeek ?? 0;
  const threadsLeft = Math.max(0, THREAD_LIMIT_PER_DAY - threadsToday);
  const progressPct = Math.min(
    100,
    Math.round((threadsToday / THREAD_LIMIT_PER_DAY) * 100)
  );

  const feedItems: FeedItem[] = useMemo(
    () =>
      matched.slice(0, 8).map((r) => ({
        id: r.id,
        title: r.title,
        meta: `${r.city.name} · ${r.fns.name}${r.service ? ` · ${r.service}` : ""}`,
        rightValue: r.isMyRegion ? "Моя зона" : undefined,
        icon: r.status === "CLOSING_SOON" ? Clock : Inbox,
        iconTone:
          r.status === "CLOSING_SOON"
            ? "warning"
            : r.isMyRegion
              ? "primary"
              : "muted",
        onPress: () => {
          const existing = r.existingThreadId ?? r.threadId;
          if (r.hasThread && existing) {
            router.push(`/threads/${existing}` as never);
          } else {
            router.push(`/requests/${r.id}/write` as never);
          }
        },
      })),
    [matched, router]
  );

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <HeaderHome
        notificationCount={stats?.newMessages ?? 0}
        onSettingsPress={() =>
          router.push("/settings/specialist" as never)
        }
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <DesktopScreen
          title={`Здравствуйте, ${firstName}!`}
          subtitle={
            isAvailable
              ? newLeads.length > 0
                ? `${newLeads.length} новых подходящих заявок`
                : "Вы в каталоге. Новых заявок пока нет."
              : "Вы скрыты из каталога — включите приём заявок"
          }
          headerActions={
            <View className="flex-row items-center gap-2 bg-white border border-border rounded-full px-3 py-2">
              <Text className="text-text-mute text-xs">
                Принимаю заявки
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                disabled={availabilityToggling}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          }
        >
          {loading ? (
            <View style={{ gap: 16 }}>
              <LoadingState variant="skeleton" lines={4} />
              <LoadingState variant="skeleton" lines={4} />
            </View>
          ) : error ? (
            <ErrorState
              message="Не удалось загрузить заявки"
              onRetry={() => {
                setLoading(true);
                fetchData().finally(() => setLoading(false));
              }}
            />
          ) : (
            <View style={{ gap: 24 }}>
              {/* KPI row: 4 */}
              <DashboardGrid>
                <DashboardGrid.Col span={3} tabletSpan={1}>
                  <KpiCard
                    label="Matched сегодня"
                    value={matchedToday.length}
                    icon={Sparkles}
                    tone="primary"
                  />
                </DashboardGrid.Col>
                <DashboardGrid.Col span={3} tabletSpan={1}>
                  <KpiCard
                    label="Активных диалогов"
                    value={activeThreads}
                    icon={MessageSquare}
                    tone={activeThreads > 0 ? "success" : "muted"}
                  />
                </DashboardGrid.Col>
                <DashboardGrid.Col span={3} tabletSpan={1}>
                  <KpiCard
                    label="Thread-лимит"
                    value={`${threadsToday}/${THREAD_LIMIT_PER_DAY}`}
                    hint={threadsLeft > 0 ? `осталось ${threadsLeft}` : "исчерпан"}
                    icon={CalendarDays}
                    tone={
                      threadsLeft === 0
                        ? "danger"
                        : threadsLeft <= 3
                          ? "warning"
                          : "muted"
                    }
                  />
                </DashboardGrid.Col>
                <DashboardGrid.Col span={3} tabletSpan={1}>
                  <KpiCard
                    label="Новых за неделю"
                    value={weekCount}
                    icon={TrendingUp}
                    tone={weekCount > 0 ? "success" : "muted"}
                    trend={weekCount > 0 ? "up" : "flat"}
                  />
                </DashboardGrid.Col>
              </DashboardGrid>

              {/* Main + sidebar */}
              <DashboardGrid>
                <DashboardGrid.Col span={8} tabletSpan={2}>
                  <DashboardWidget
                    title="Подходящие публичные заявки"
                    subtitle={`Всего ${matched.length}`}
                    icon={Inbox}
                    actionLabel="Все →"
                    onActionPress={() =>
                      router.push("/(specialist-tabs)/requests" as never)
                    }
                    flush
                  >
                    <FeedList
                      items={feedItems}
                      limit={8}
                      emptyText="Подходящих заявок пока нет. Расширьте рабочую область."
                    />
                  </DashboardWidget>
                </DashboardGrid.Col>

                <DashboardGrid.Col span={4} tabletSpan={2}>
                  <View style={{ gap: 16 }}>
                    {/* Thread-limit progress */}
                    <DashboardWidget
                      title="Thread-лимит сегодня"
                      icon={CalendarDays}
                      accentBar={
                        threadsLeft === 0
                          ? "danger"
                          : threadsLeft <= 3
                            ? "warning"
                            : "success"
                      }
                    >
                      <View style={{ gap: 12 }}>
                        <View className="flex-row items-baseline justify-between">
                          <Text
                            className="font-extrabold text-text-base"
                            style={{ fontSize: 28 }}
                          >
                            {threadsToday}
                            <Text className="text-text-dim font-normal" style={{ fontSize: 16 }}>
                              {` / ${THREAD_LIMIT_PER_DAY}`}
                            </Text>
                          </Text>
                          <Text className="text-text-mute" style={{ fontSize: 12 }}>
                            {threadsLeft > 0
                              ? `${threadsLeft} осталось`
                              : "исчерпан"}
                          </Text>
                        </View>
                        <View
                          className="w-full rounded-full overflow-hidden"
                          style={{
                            height: 8,
                            backgroundColor: colors.surface2,
                          }}
                        >
                          <View
                            style={{
                              width: `${progressPct}%`,
                              height: "100%",
                              backgroundColor:
                                threadsLeft === 0
                                  ? colors.danger
                                  : threadsLeft <= 3
                                    ? colors.warning
                                    : colors.success,
                            }}
                          />
                        </View>
                        <Text className="text-text-mute" style={{ fontSize: 12 }}>
                          Лимит обновляется каждые сутки в 00:00.
                        </Text>
                      </View>
                    </DashboardWidget>

                    {/* CTA */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Все публичные заявки"
                      onPress={() =>
                        router.push("/(specialist-tabs)/requests" as never)
                      }
                      className="rounded-2xl bg-accent p-5"
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className="rounded-xl items-center justify-center bg-white/20"
                          style={{ width: 44, height: 44 }}
                        >
                          <List size={22} color="#fff" />
                        </View>
                        <View className="flex-1 min-w-0">
                          <Text
                            className="font-extrabold text-white"
                            style={{ fontSize: 16 }}
                          >
                            Публичные заявки
                          </Text>
                          <Text
                            className="text-white/80 mt-0.5"
                            style={{ fontSize: 12 }}
                          >
                            Полный каталог с фильтрами
                          </Text>
                        </View>
                      </View>
                    </Pressable>
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
