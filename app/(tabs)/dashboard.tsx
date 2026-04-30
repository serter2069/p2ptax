import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Switch,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTypedRouter } from "@/lib/navigation";
import { FileText, Inbox, Clock } from "lucide-react-native";
import DesktopScreen from "@/components/layout/DesktopScreen";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { DashboardGrid, type FeedItem } from "@/components/dashboard";
import ClientEmptyState from "@/components/dashboard/sections/ClientEmptyState";
import SpecialistEmptyState from "@/components/dashboard/sections/SpecialistEmptyState";
import ClientKPIRow from "@/components/dashboard/sections/ClientKPIRow";
import SpecialistKPIRow from "@/components/dashboard/sections/SpecialistKPIRow";
import ClientSidebar from "@/components/dashboard/sections/ClientSidebar";
import SpecialistSidebar from "@/components/dashboard/sections/SpecialistSidebar";
import MyRequestsWidget from "@/components/dashboard/sections/MyRequestsWidget";
import SpecialistMatchedWidget from "@/components/dashboard/sections/SpecialistMatchedWidget";
import { api, apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { colors, spacing, BREAKPOINT } from "@/lib/theme";
import type {
  DashboardStats,
  ClientDashboardExtra,
  SpecialistExtra,
  RequestItem,
  MatchingRequest,
  SpecialistDashboardData,
} from "@/components/dashboard/sections/types";

/**
 * Unified User Dashboard. Renders KPIs, feeds, sidebar — split into
 * components/dashboard/sections/* for both client and specialist roles.
 * ADMIN users are handled separately by (admin-tabs) and never reach here.
 */

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
  const nav = useTypedRouter();
  const { ready } = useRequireAuth();
  const { user, isSpecialistUser, updateUser } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;

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
        onPress: () => nav.dynamic.requestDetail(r.id),
      })),
    [requests, nav]
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
            nav.dynamic.thread(existing);
          } else {
            nav.dynamic.requestWrite(r.id);
          }
        },
      })),
    [matched, nav]
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
              {!isSpecialistUser && requests.length === 0 ? (
                <ClientEmptyState onCreate={() => nav.routes.requestsNew()} />
              ) : null}

              {isSpecialistUser && (specialistExtra?.activeThreads ?? 0) === 0 ? (
                <SpecialistEmptyState
                  onBrowse={() => nav.routes.tabsPublicRequests()}
                />
              ) : null}

              {isSpecialistUser ? (
                <SpecialistKPIRow
                  matchedToday={matchedToday.length}
                  activeThreads={activeThreads}
                  threadsToday={threadsToday}
                  threadsLeft={threadsLeft}
                  weekCount={weekCount}
                  threadLimitPerDay={THREAD_LIMIT_PER_DAY}
                />
              ) : (
                <ClientKPIRow
                  clientExtra={clientExtra}
                  stats={stats}
                  activeRequestsCount={activeRequests.length}
                  onPressRequests={() => nav.routes.tabsRequests()}
                  onPressMessages={() => nav.routes.tabsMessages()}
                />
              )}

              {/* Main + sidebar: 8 / 4 */}
              <DashboardGrid>
                <DashboardGrid.Col span={8} tabletSpan={2}>
                  <View style={{ gap: 16 }}>
                    <MyRequestsWidget
                      clientFeedItems={clientFeedItems}
                      activeRequests={activeRequests}
                      onAllRequests={() => nav.routes.tabsRequests()}
                      onCreateRequest={() => nav.routes.requestsNew()}
                    />

                    {isSpecialistUser ? (
                      <SpecialistMatchedWidget
                        specialistFeedItems={specialistFeedItems}
                        matchedCount={matched.length}
                        onAllPublic={() => nav.routes.tabsPublicRequests()}
                      />
                    ) : null}
                  </View>
                </DashboardGrid.Col>

                <DashboardGrid.Col span={4} tabletSpan={2}>
                  {isSpecialistUser ? (
                    <SpecialistSidebar
                      atLimit={atLimit}
                      onCreateRequest={() => nav.routes.requestsNew()}
                      onPublicRequests={() => nav.routes.tabsPublicRequests()}
                    />
                  ) : (
                    <ClientSidebar
                      atLimit={atLimit}
                      onCreateRequest={() => nav.routes.requestsNew()}
                      tips={TIPS}
                    />
                  )}
                </DashboardGrid.Col>
              </DashboardGrid>
            </View>
          )}
        </DesktopScreen>
      </ScrollView>
    </SafeAreaView>
  );
}
