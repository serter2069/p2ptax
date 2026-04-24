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
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react-native";
import HeaderHome from "@/components/HeaderHome";
import DesktopScreen from "@/components/layout/DesktopScreen";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import {
  DashboardHero,
  CaseTimeline,
  PriorityFeed,
  type TimelineStage,
  type PriorityItem,
  type HeroStat,
} from "@/components/dashboard";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, overlay, spacing, textStyle, AVATAR_COLORS } from "@/lib/theme";

interface DashboardStats {
  requestsUsed: number;
  requestsLimit: number;
  unreadMessages: number;
}

interface ClientDashboardExtra {
  activeRequests: number;
  responsesToday: number;
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

interface ThreadMini {
  id: string;
  lastMessageAt?: string | null;
  specialist?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  request?: { id: string; title: string };
}

function buildTimelineStages(
  req: RequestItem | undefined,
  threadsCount: number
): TimelineStage[] {
  const hasThreads = threadsCount > 0;
  const status = req?.status;
  const isClosed = status === "CLOSED";

  return [
    {
      key: "created",
      label: "Создана",
      status: "done",
      date: req?.createdAt
        ? new Date(req.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
          })
        : undefined,
    },
    {
      key: "responding",
      label: "Отклики",
      status: hasThreads ? "done" : "current",
      meta: hasThreads
        ? `${threadsCount} ${threadsCount === 1 ? "отклик" : threadsCount < 5 ? "отклика" : "откликов"}`
        : "ждём специалистов",
    },
    {
      key: "dialog",
      label: "Диалог",
      status: hasThreads ? (isClosed ? "done" : "current") : "pending",
      meta: hasThreads && !isClosed ? "в процессе" : undefined,
    },
    {
      key: "documents",
      label: "Документы",
      status: isClosed ? "done" : "pending",
    },
    {
      key: "resolved",
      label: "Решено",
      status: isClosed ? "done" : "pending",
    },
  ];
}

export default function ClientDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [extra, setExtra] = useState<ClientDashboardExtra | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [threads, setThreads] = useState<ThreadMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(false);
      const [statsRes, requestsRes] = await Promise.all([
        api<DashboardStats>("/api/dashboard/stats"),
        api<{ items: RequestItem[] }>("/api/requests/my?limit=5"),
      ]);
      setStats(statsRes);
      setRequests(requestsRes.items);

      // Optional endpoints — degrade gracefully
      try {
        const ex = await api<ClientDashboardExtra>(
          "/api/stats/client-dashboard"
        );
        setExtra(ex);
      } catch {
        setExtra(null);
      }

      try {
        const th = await api<{ items: ThreadMini[] }>("/api/threads");
        setThreads(th.items ?? []);
      } catch {
        setThreads([]);
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
  const greeting = firstName
    ? `Здравствуйте, ${firstName}!`
    : "Здравствуйте!";

  const activeRequests = requests.filter((r) =>
    r.status === "ACTIVE" || r.status === "CLOSING_SOON"
  );
  const latestActive = activeRequests[0];

  const subtitle = useMemo(() => {
    if (activeRequests.length === 0) {
      return "Создайте первую заявку — специалисты откликнутся сами.";
    }
    if (activeRequests.length === 1) {
      return "У вас 1 активная заявка в работе.";
    }
    return `У вас ${activeRequests.length} активные заявки в работе.`;
  }, [activeRequests.length]);

  const heroStats: HeroStat[] = useMemo(
    () => [
      {
        label: "Активных заявок",
        value: extra?.activeRequests ?? activeRequests.length,
        color: "primary",
      },
      {
        label: "Откликов сегодня",
        value: extra?.responsesToday ?? 0,
        trend: (extra?.responsesToday ?? 0) > 0 ? "up" : "flat",
        trendValue:
          (extra?.responsesToday ?? 0) > 0 ? "последние 24 часа" : "пока нет",
      },
      {
        label: "Ждут ответа",
        value: extra?.awaitingReplies ?? 0,
        color: (extra?.awaitingReplies ?? 0) > 0 ? "warning" : "muted",
      },
      {
        label: "Специалистов в работе",
        value: extra?.specialistsWorkingWithYou ?? threads.length,
      },
    ],
    [extra, activeRequests.length, threads.length]
  );

  const priorityItems: PriorityItem[] = useMemo(() => {
    const items: PriorityItem[] = [];

    if ((stats?.unreadMessages ?? 0) > 0) {
      items.push({
        id: "unread-messages",
        icon: MessageSquare,
        title: `Непрочитанных сообщений: ${stats!.unreadMessages}`,
        meta: "Откройте диалог, чтобы не пропустить",
        urgency: "high",
        action: {
          label: "Открыть",
          onPress: () => router.push("/(client-tabs)/messages" as never),
        },
      });
    }

    for (const r of activeRequests.slice(0, 3)) {
      if (r.status === "CLOSING_SOON") {
        items.push({
          id: `closing-${r.id}`,
          icon: Clock,
          title: `Заявка закрывается: ${r.title}`,
          meta: `${r.city.name} · ${r.fns.name}`,
          urgency: "medium",
          action: {
            label: "Открыть",
            onPress: () => router.push(`/requests/${r.id}/detail` as never),
          },
        });
      } else if (r.threadsCount === 0) {
        items.push({
          id: `no-resp-${r.id}`,
          icon: AlertCircle,
          title: `Пока нет откликов: ${r.title}`,
          meta: `${r.city.name} · ожидайте до 24 часов`,
          urgency: "low",
        });
      } else {
        items.push({
          id: `active-${r.id}`,
          icon: FileText,
          title: r.title,
          meta: `${r.city.name} · ${r.threadsCount} ${r.threadsCount === 1 ? "отклик" : "откликов"}`,
          urgency: "low",
          action: {
            label: "Открыть",
            onPress: () => router.push(`/requests/${r.id}/detail` as never),
          },
        });
      }
    }

    return items;
  }, [stats, activeRequests, router]);

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
            <View style={{ paddingVertical: spacing.lg, gap: spacing.lg }}>
              {/* 1. Dashboard Hero */}
              <DashboardHero
                greeting={greeting}
                subtitle={subtitle}
                primaryStats={heroStats}
              />

              {/* 2. Primary CTA (contextual) */}
              {!atLimit && activeRequests.length === 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Создать первую заявку"
                  onPress={() => router.push("/requests/new" as never)}
                  style={{
                    backgroundColor: colors.accent,
                    borderRadius: 16,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 64,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                      Создайте первую заявку
                    </Text>
                    <Text style={{ color: overlay.white75, fontSize: 13, marginTop: 2 }}>
                      Специалисты откликнутся сами в течение 24 часов
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: overlay.white20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={20} color="#fff" />
                  </View>
                </Pressable>
              ) : null}

              {/* 3. Case timeline (active case) */}
              {latestActive ? (
                <CaseTimeline
                  caseTitle={`${latestActive.title} · ${latestActive.fns.name}`}
                  stages={buildTimelineStages(latestActive, latestActive.threadsCount)}
                  nextAction={
                    latestActive.threadsCount > 0
                      ? {
                          label:
                            (stats?.unreadMessages ?? 0) > 0
                              ? "Прочитайте новые сообщения"
                              : "Продолжите диалог со специалистом",
                          description:
                            (stats?.unreadMessages ?? 0) > 0
                              ? `Непрочитанных: ${stats?.unreadMessages}`
                              : "Обсудите документы и следующие шаги",
                          cta: {
                            label: "Открыть заявку",
                            onPress: () =>
                              router.push(
                                `/requests/${latestActive.id}/detail` as never
                              ),
                          },
                        }
                      : {
                          label: "Ожидайте откликов",
                          description:
                            "Специалисты из вашего города увидят заявку и напишут",
                          cta: {
                            label: "Открыть заявку",
                            onPress: () =>
                              router.push(
                                `/requests/${latestActive.id}/detail` as never
                              ),
                          },
                        }
                  }
                  headerAction={
                    !atLimit ? (
                      <Pressable
                        onPress={() => router.push("/requests/new" as never)}
                        accessibilityRole="button"
                        accessibilityLabel="Новая заявка"
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: colors.accentSoft,
                        }}
                      >
                        <Plus size={14} color={colors.accent} />
                        <Text
                          style={{
                            color: colors.accent,
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          Новая заявка
                        </Text>
                      </Pressable>
                    ) : null
                  }
                />
              ) : null}

              {/* 4. Priority feed */}
              {priorityItems.length > 0 ? (
                <PriorityFeed
                  title="Приоритеты"
                  items={priorityItems}
                  emptyMessage="Все задачи решены. Отдохните!"
                />
              ) : null}

              {/* 5. Specialists working with you */}
              {threads.length > 0 ? (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.md,
                  }}
                >
                  <Text
                    style={{
                      ...textStyle.h4,
                      color: colors.text,
                      marginBottom: spacing.md,
                    }}
                  >
                    С вами работают
                  </Text>
                  <View style={{ gap: spacing.sm }}>
                    {threads.slice(0, 3).map((t, i) => {
                      const name =
                        [t.specialist?.firstName, t.specialist?.lastName]
                          .filter(Boolean)
                          .join(" ") || "Специалист";
                      return (
                        <Pressable
                          key={t.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Открыть диалог с ${name}`}
                          onPress={() =>
                            router.push(`/threads/${t.id}` as never)
                          }
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.md,
                            paddingVertical: spacing.sm,
                            paddingHorizontal: spacing.sm,
                            borderRadius: 10,
                          }}
                        >
                          <Avatar
                            name={name}
                            size="sm"
                            tint={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                ...textStyle.bodyBold,
                                color: colors.text,
                              }}
                              numberOfLines={1}
                            >
                              {name}
                            </Text>
                            <Text
                              style={{
                                ...textStyle.small,
                                color: colors.textSecondary,
                              }}
                              numberOfLines={1}
                            >
                              {t.request?.title ?? "Диалог"}
                            </Text>
                          </View>
                          <CheckCircle2 size={16} color={colors.success} />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {activeRequests.length === 0 && !atLimit ? (
                <EmptyState
                  icon={FileText}
                  title="У вас пока нет заявок"
                  subtitle="Создайте первую — специалисты из вашего города откликнутся"
                  actionLabel="Создать заявку"
                  onAction={() => router.push("/requests/new" as never)}
                />
              ) : null}
            </View>
          )}
        </DesktopScreen>
      </ScrollView>
    </SafeAreaView>
  );
}
