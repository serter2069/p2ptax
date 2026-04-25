import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Switch,
  useWindowDimensions,
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
  CalendarDays,
  List,
  Sparkles,
  TrendingUp,
  Clock,
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
import { api, apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { colors, spacing } from "@/lib/theme";

/**
 * Unified User Dashboard — iter11 UI layer (PR 2/3).
 *
 * Merges the legacy (client-tabs)/dashboard and (specialist-tabs)/dashboard
 * into a single screen. Always shows: MyRequests widget, unread messages,
 * primary CTA (create request) and tips. When {@link useAuth} reports
 * `isSpecialistUser=true` we additionally render: thread-limit gauge,
 * public-requests feed widget, availability toggle, and specialist KPIs.
 *
 * ADMIN users are handled separately by (admin-tabs) and never reach here.
 */

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

interface SpecialistExtra {
  newRequestsWeek: number;
  awaitingMyReply: number;
  activeThreads: number;
  disputedAmountMonth: number;
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

interface SpecialistDashboardData {
  isAvailable: boolean;
  activeThreads: number;
  matchingRequests: MatchingRequest[];
  stats: { threadsTotal: number; newMessages: number };
}

const THREAD_LIMIT_PER_DAY = 20;

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

export default function UserDashboard() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user, isSpecialistUser, updateUser } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  // Shared (client side of dashboard) state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clientExtra, setClientExtra] = useState<ClientDashboardExtra | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  // Specialist-only state
  const [specialistExtra, setSpecialistExtra] = useState<SpecialistExtra | null>(
    null
  );
  const [matchingRequests, setMatchingRequests] = useState<MatchingRequest[]>(
    []
  );
  const [threadsToday, setThreadsToday] = useState(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(
    user?.isAvailable ?? true
  );
  const [availabilityToggling, setAvailabilityToggling] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchClientData = useCallback(async () => {
    const [statsRes, requestsRes] = await Promise.all([
      api<DashboardStats>("/api/dashboard/stats"),
      api<{ items: RequestItem[] }>("/api/requests/my?limit=8"),
    ]);
    setStats(statsRes);
    setRequests(requestsRes.items);

    try {
      const ex = await api<ClientDashboardExtra>("/api/stats/client-dashboard");
      setClientExtra(ex);
    } catch {
      setClientExtra(null);
    }
  }, []);

  const fetchSpecialistData = useCallback(async () => {
    try {
      const dashData = await apiGet<SpecialistDashboardData>(
        "/api/specialists/dashboard"
      );
      setIsAvailable(dashData.isAvailable);
      setMatchingRequests(dashData.matchingRequests ?? []);
      updateUser({ isAvailable: dashData.isAvailable });
    } catch {
      // Specialist endpoint may 403 if profile not complete — ignore.
    }

    try {
      const ex = await apiGet<SpecialistExtra>(
        "/api/stats/specialist-dashboard"
      );
      setSpecialistExtra(ex);
    } catch {
      setSpecialistExtra(null);
    }

    try {
      const today = await apiGet<{ count: number }>(
        "/api/specialist/threads-today"
      );
      setThreadsToday(today.count);
    } catch {
      setThreadsToday(0);
    }
  }, [updateUser]);

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      await fetchClientData();
      if (isSpecialistUser) {
        await fetchSpecialistData();
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
      setError(true);
    }
  }, [fetchClientData, fetchSpecialistData, isSpecialistUser]);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [ready, fetchData]);

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

  const atLimit = stats ? stats.requestsUsed >= stats.requestsLimit : false;
  const firstName = user?.firstName ?? "";
  const activeRequests = requests.filter(
    (r) => r.status === "ACTIVE" || r.status === "CLOSING_SOON"
  );

  const clientFeedItems: FeedItem[] = useMemo(
    () =>
      requests.map((r) => ({
        id: r.id,
        title: r.title,
        meta: `${r.city.name} · ${r.fns.name}`,
        rightValue:
          r.threadsCount > 0
            ? `${r.threadsCount} ${
                r.threadsCount === 1
                  ? "диалог"
                  : r.threadsCount < 5
                    ? "диалога"
                    : "диалогов"
              }`
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

  const matched = matchingRequests.filter((r) => r.status !== "CLOSED");
  const newLeads = matched.filter((r) => !r.hasThread);
  const matchedToday = matched.filter((r) => {
    const dt = new Date(r.createdAt);
    const now = new Date();
    return dt.toDateString() === now.toDateString();
  });

  const activeThreads =
    specialistExtra?.activeThreads ?? stats?.unreadMessages ?? 0;
  const weekCount = specialistExtra?.newRequestsWeek ?? 0;
  const threadsLeft = Math.max(0, THREAD_LIMIT_PER_DAY - threadsToday);
  const progressPct = Math.min(
    100,
    Math.round((threadsToday / THREAD_LIMIT_PER_DAY) * 100)
  );

  const specialistFeedItems: FeedItem[] = useMemo(
    () =>
      matched.slice(0, 6).map((r) => ({
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

  const subtitle = isSpecialistUser
    ? isAvailable
      ? newLeads.length > 0
        ? `${newLeads.length} новых подходящих заявок`
        : "Ваш рабочий стол: заявки, диалоги, лиды"
      : "Вы скрыты из каталога — включите приём заявок"
    : "Ваш рабочий стол: заявки, диалоги, сообщения";

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <HeaderHome
        notificationCount={stats?.unreadMessages ?? 0}
        onSettingsPress={() => router.push("/settings" as never)}
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <DesktopScreen
          title={firstName ? `Здравствуйте, ${firstName}!` : "Главная"}
          subtitle={subtitle}
          headerActions={
            isSpecialistUser ? (
              <View className="flex-row items-center gap-2 bg-white border border-border rounded-full px-3 py-2">
                <Text className="text-text-mute text-xs">Принимаю заявки</Text>
                <View style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
                  <Switch
                    value={isAvailable}
                    onValueChange={handleToggleAvailability}
                    disabled={availabilityToggling}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </View>
              </View>
            ) : undefined
          }
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
            <View style={{ gap: isDesktop ? 32 : 24 }}>
              {/* KPI row — specialist gets 4 KPIs, client gets 3 */}
              {isSpecialistUser ? (
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
                      hint={
                        threadsLeft > 0 ? `осталось ${threadsLeft}` : "исчерпан"
                      }
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
              ) : (
                <DashboardGrid>
                  <DashboardGrid.Col span={4} tabletSpan={1}>
                    <KpiCard
                      label="Активных заявок"
                      value={
                        clientExtra?.activeRequests ?? activeRequests.length
                      }
                      hint={`из ${stats?.requestsLimit ?? 5} доступных`}
                      icon={FileText}
                      tone="primary"
                      onPress={() => router.push("/(tabs)/requests" as never)}
                    />
                  </DashboardGrid.Col>
                  <DashboardGrid.Col span={4} tabletSpan={1}>
                    <KpiCard
                      label="Непрочитанных сообщений"
                      value={stats?.unreadMessages ?? 0}
                      icon={MessageSquare}
                      tone={
                        (stats?.unreadMessages ?? 0) > 0 ? "warning" : "muted"
                      }
                      onPress={() => router.push("/(tabs)/messages" as never)}
                    />
                  </DashboardGrid.Col>
                  <DashboardGrid.Col span={4} tabletSpan={2}>
                    <KpiCard
                      label="Новых диалогов сегодня"
                      value={clientExtra?.threadsToday ?? 0}
                      icon={Inbox}
                      tone={
                        (clientExtra?.threadsToday ?? 0) > 0
                          ? "success"
                          : "muted"
                      }
                      trend={
                        (clientExtra?.threadsToday ?? 0) > 0 ? "up" : "flat"
                      }
                    />
                  </DashboardGrid.Col>
                </DashboardGrid>
              )}

              {/* Main + sidebar: 8 / 4 */}
              <DashboardGrid>
                <DashboardGrid.Col span={8} tabletSpan={2}>
                  <View style={{ gap: 16 }}>
                    {/* Always show "My requests" widget */}
                    <DashboardWidget
                      title="Мои заявки"
                      subtitle={
                        clientFeedItems.length > 0
                          ? `Всего ${clientFeedItems.length}`
                          : "Пусто"
                      }
                      icon={ClipboardList}
                      actionLabel="Все →"
                      onActionPress={() =>
                        router.push("/(tabs)/requests" as never)
                      }
                      flush
                    >
                      <FeedList
                        items={clientFeedItems}
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
                          <Text
                            className="text-text-dim"
                            style={{ fontSize: 12 }}
                          >
                            {activeRequests.length} активных
                          </Text>
                        </View>
                      ) : null}
                    </DashboardWidget>

                    {/* Specialist-only: public-requests feed */}
                    {isSpecialistUser ? (
                      <DashboardWidget
                        title="Подходящие публичные заявки"
                        subtitle={`Всего ${matched.length}`}
                        icon={Inbox}
                        actionLabel="Все →"
                        onActionPress={() =>
                          router.push("/(tabs)/public-requests" as never)
                        }
                        flush
                      >
                        <FeedList
                          items={specialistFeedItems}
                          limit={6}
                          emptyText="Подходящих заявок пока нет. Расширьте рабочую область."
                        />
                      </DashboardWidget>
                    ) : null}
                  </View>
                </DashboardGrid.Col>

                <DashboardGrid.Col span={4} tabletSpan={2}>
                  <View style={{ gap: 16 }}>
                    {/* Primary CTA — create request (always) */}
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
                            color={atLimit ? colors.textMuted : colors.white}
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
                            className={
                              atLimit ? "text-text-dim" : "text-white/80"
                            }
                            style={{ fontSize: 12, marginTop: 2 }}
                          >
                            {atLimit
                              ? "Закройте одну, чтобы создать новую"
                              : "Первые сообщения в течение 24 часов"}
                          </Text>
                        </View>
                      </View>
                    </Pressable>

                    {/* Specialist-only: thread-limit gauge */}
                    {isSpecialistUser ? (
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
                              <Text
                                className="text-text-dim font-normal"
                                style={{ fontSize: 16 }}
                              >
                                {` / ${THREAD_LIMIT_PER_DAY}`}
                              </Text>
                            </Text>
                            <Text
                              className="text-text-mute"
                              style={{ fontSize: 12 }}
                            >
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
                          <Text
                            className="text-text-mute"
                            style={{ fontSize: 12 }}
                          >
                            Лимит обновляется каждые сутки в 00:00.
                          </Text>
                        </View>
                      </DashboardWidget>
                    ) : null}

                    {/* Specialist-only: secondary CTA to full public catalog */}
                    {isSpecialistUser ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Все публичные заявки"
                        onPress={() =>
                          router.push("/(tabs)/public-requests" as never)
                        }
                        className="rounded-2xl bg-accent p-5"
                      >
                        <View className="flex-row items-center gap-3">
                          <View
                            className="rounded-xl items-center justify-center bg-white/20"
                            style={{ width: 44, height: 44 }}
                          >
                            <List size={22} color={colors.white} />
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
                    ) : null}

                    {/* Client-only: tips widget */}
                    {!isSpecialistUser ? (
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
                    ) : null}
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
