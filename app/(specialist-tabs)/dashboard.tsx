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
  TriangleAlert,
  List,
  Inbox,
  Clock,
  Reply,
  CheckCircle2,
} from "lucide-react-native";
import HeaderHome from "@/components/HeaderHome";
import DesktopScreen from "@/components/layout/DesktopScreen";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import {
  DashboardHero,
  PriorityFeed,
  type HeroStat,
  type PriorityItem,
} from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";
import { colors, overlay, spacing, textStyle } from "@/lib/theme";

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
  hasThread: boolean;
  threadId: string | null;
  existingThreadId?: string | null;
}

interface DashboardData {
  isAvailable: boolean;
  activeThreads: number;
  matchingRequests: MatchingRequest[];
  stats: { threadsTotal: number; newMessages: number };
}

function formatRub(value: number): string {
  if (value >= 1_000_000) {
    const mln = value / 1_000_000;
    return `${mln.toFixed(mln >= 10 ? 0 : 1).replace(/\.0$/, "")}М ₽`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}К ₽`;
  }
  return `${value} ₽`;
}

export default function SpecialistDashboard() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [extra, setExtra] = useState<SpecialistExtra | null>(null);
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
  const greeting = `Здравствуйте, ${firstName}!`;

  const newLeads = requests.filter((r) => !r.hasThread && r.status !== "CLOSED");
  const subtitle = isAvailable
    ? newLeads.length === 0
      ? "Новых подходящих заявок пока нет. Вы в каталоге."
      : `${newLeads.length} новых заявок ждут вашего отклика.`
    : "Вы не принимаете заявки — включите, чтобы вернуться в каталог.";

  const heroStats: HeroStat[] = useMemo(
    () => [
      {
        label: "Новых заявок",
        value: extra?.newRequestsWeek ?? newLeads.length,
        color: "primary",
        trend: (extra?.newRequestsWeek ?? 0) > 0 ? "up" : "flat",
        trendValue:
          (extra?.newRequestsWeek ?? 0) > 0 ? "за неделю" : "за неделю",
      },
      {
        label: "Ждут ответа",
        value: extra?.awaitingMyReply ?? stats?.newMessages ?? 0,
        color:
          (extra?.awaitingMyReply ?? stats?.newMessages ?? 0) > 0
            ? "warning"
            : "muted",
      },
      {
        label: "Активных дел",
        value: extra?.activeThreads ?? stats?.threadsTotal ?? 0,
      },
      {
        label: "Оспорено за месяц",
        value: formatRub(extra?.disputedAmountMonth ?? 0),
        color: "success",
        trend: (extra?.disputedAmountMonth ?? 0) > 0 ? "up" : "flat",
      },
    ],
    [extra, stats, newLeads.length]
  );

  const priorityItems: PriorityItem[] = useMemo(() => {
    const items: PriorityItem[] = [];
    const toAnswer = requests.filter((r) => !r.hasThread).slice(0, 5);

    for (const r of toAnswer) {
      const urg =
        r.status === "CLOSING_SOON" ? "high" : r.isMyRegion ? "medium" : "low";
      items.push({
        id: `lead-${r.id}`,
        icon: r.status === "CLOSING_SOON" ? Clock : Inbox,
        title: r.title,
        meta: `${r.city.name} · ${r.fns.name}${r.service ? ` · ${r.service}` : ""}`,
        urgency: urg,
        action: {
          label: "Ответить",
          onPress: () => router.push(`/requests/${r.id}/write` as never),
        },
      });
    }

    return items;
  }, [requests, router]);

  const myActiveCases = requests.filter((r) => r.hasThread).slice(0, 4);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
        <HeaderHome
          notificationCount={0}
          onSettingsPress={() =>
            router.push("/settings/specialist" as never)
          }
        />
        <DesktopScreen>
          <View style={{ paddingVertical: spacing.lg, gap: spacing.md }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View
                key={i}
                className="bg-white rounded-xl overflow-hidden border border-border"
              >
                <LoadingState variant="skeleton" lines={3} />
              </View>
            ))}
          </View>
        </DesktopScreen>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
        <HeaderHome
          onSettingsPress={() =>
            router.push("/settings/specialist" as never)
          }
        />
        <View className="flex-1 items-center justify-center">
          <ErrorState
            message="Не удалось загрузить заявки"
            onRetry={() => {
              setLoading(true);
              fetchData().finally(() => setLoading(false));
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

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
        <DesktopScreen>
          <View style={{ paddingVertical: spacing.lg, gap: spacing.lg }}>
            {/* Hero */}
            <DashboardHero
              greeting={greeting}
              subtitle={subtitle}
              primaryStats={heroStats}
            />

            {/* Availability toggle */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                borderLeftWidth: 3,
                borderLeftColor: isAvailable ? colors.success : colors.warning,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...textStyle.bodyBold,
                    color: colors.text,
                  }}
                >
                  Принимаю заявки
                </Text>
                <Text
                  style={{
                    ...textStyle.small,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {isAvailable
                    ? "Клиенты видят вас в каталоге"
                    : "Вы скрыты из каталога — новые заявки не приходят"}
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

            {!isAvailable ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Перейти в настройки"
                onPress={() =>
                  router.push("/settings/specialist" as never)
                }
                style={{
                  backgroundColor: colors.yellowSoft,
                  borderRadius: 14,
                  padding: spacing.md,
                  flexDirection: "row",
                  gap: spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.warning,
                }}
              >
                <TriangleAlert
                  size={18}
                  color={colors.warning}
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...textStyle.bodyBold,
                      color: colors.warning,
                    }}
                  >
                    Вы не принимаете заявки
                  </Text>
                  <Text
                    style={{
                      ...textStyle.small,
                      color: colors.warning,
                      marginTop: 2,
                    }}
                  >
                    Включите переключатель выше, чтобы вернуться в каталог.
                  </Text>
                </View>
              </Pressable>
            ) : null}

            {/* Priority — what to answer today */}
            {priorityItems.length > 0 ? (
              <PriorityFeed
                title="Что нужно ответить сегодня"
                items={priorityItems}
                emptyMessage="Все заявки уже обработаны!"
                headerAction={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Все заявки"
                    onPress={() =>
                      router.push("/(specialist-tabs)/requests" as never)
                    }
                  >
                    <Text
                      style={{
                        color: colors.accent,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      Все →
                    </Text>
                  </Pressable>
                }
              />
            ) : null}

            {/* Active cases — threads where I've engaged */}
            {myActiveCases.length > 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: spacing.md,
                  }}
                >
                  <Text
                    style={{
                      ...textStyle.h4,
                      color: colors.text,
                    }}
                  >
                    Ваши активные дела
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Все обращения"
                    onPress={() =>
                      router.push("/(specialist-tabs)/threads" as never)
                    }
                  >
                    <Text
                      style={{
                        color: colors.accent,
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      Все →
                    </Text>
                  </Pressable>
                </View>
                <View style={{ gap: spacing.sm }}>
                  {myActiveCases.map((c) => (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Открыть ${c.title}`}
                      onPress={() => {
                        const tid =
                          c.threadId ?? c.existingThreadId ?? null;
                        if (tid) router.push(`/threads/${tid}` as never);
                        else router.push(`/requests/${c.id}` as never);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.md,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.sm,
                        borderRadius: 10,
                        backgroundColor: colors.surface2,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: colors.greenSoft,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircle2 size={18} color={colors.success} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            ...textStyle.bodyBold,
                            color: colors.text,
                          }}
                          numberOfLines={1}
                        >
                          {c.title}
                        </Text>
                        <Text
                          style={{
                            ...textStyle.small,
                            color: colors.textSecondary,
                          }}
                          numberOfLines={1}
                        >
                          {c.city.name} · {c.fns.name}
                        </Text>
                      </View>
                      <StatusBadge status={c.status} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Empty state */}
            {requests.length === 0 ? (
              <EmptyState
                icon={List}
                title="Нет подходящих заявок"
                subtitle="Расширьте рабочую область, чтобы видеть больше заявок"
                actionLabel="Настройки"
                onAction={() =>
                  router.push("/settings/specialist" as never)
                }
              />
            ) : null}
          </View>
        </DesktopScreen>
      </ScrollView>
    </SafeAreaView>
  );
}
