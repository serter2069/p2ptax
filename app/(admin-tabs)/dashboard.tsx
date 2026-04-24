import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AlertOctagon,
  UserCheck,
  Clock,
  Users,
  TrendingUp,
  MessageCircle,
  UserPlus,
  ShieldCheck,
  Activity,
  Award,
} from "lucide-react-native";
import HeaderHome from "@/components/HeaderHome";
import DesktopScreen from "@/components/layout/DesktopScreen";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import {
  DashboardHero,
  StatsGrid,
  PriorityFeed,
  RecentWinsStrip,
  type HeroStat,
  type GridStat,
  type PriorityItem,
  type RecentWin,
} from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL, api } from "@/lib/api";
import { colors, spacing, textStyle } from "@/lib/theme";

interface Stats {
  activeRequests: number;
  newUsersWeek: number;
  newUsersMonth: number;
  threadsWeek: number;
  threadsMonth: number;
  conversion: number;
  topCities: { name: string; count: number }[];
  topSpecialists: { name: string; count: number }[];
}

interface AdminExtra {
  activeRequests: number;
  openComplaints: number;
  satisfaction: number;
  onlineSpecialists: number;
  totalClients: number;
  totalSpecialists: number;
  newUsersWeek: number;
  pendingVerifications: number;
  threadsMonth: number;
  threadsWeek: number;
  resolvedCases: number;
  slaResponseHours: number;
  newMessagesDay: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [extra, setExtra] = useState<AdminExtra | null>(null);
  const [wins, setWins] = useState<RecentWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setError(false);
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      setStats(await res.json());

      try {
        const ex = await api<AdminExtra>("/api/stats/admin-dashboard");
        setExtra(ex);
      } catch {
        setExtra(null);
      }

      try {
        const w = await api<{ items: RecentWin[] }>(
          "/api/stats/recent-wins?limit=6"
        );
        setWins(w.items ?? []);
      } catch {
        setWins([]);
      }
    } catch {
      setError(true);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    fetchStats().finally(() => setLoading(false));
  }, [fetchStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  const heroStats: HeroStat[] = useMemo(
    () => [
      {
        label: "Активных дел",
        value: extra?.activeRequests ?? stats?.activeRequests ?? 0,
        color: "primary",
      },
      {
        label: "Open жалоб",
        value: extra?.openComplaints ?? 0,
        color: (extra?.openComplaints ?? 0) > 0 ? "warning" : "muted",
      },
      {
        label: "Satisfaction",
        value: `${extra?.satisfaction ?? 0}%`,
        color: "success",
      },
      {
        label: "Специалистов online",
        value: extra?.onlineSpecialists ?? 0,
      },
    ],
    [extra, stats]
  );

  const gridStats: GridStat[] = useMemo(
    () => [
      {
        label: "Клиентов всего",
        value: extra?.totalClients ?? 0,
        icon: Users,
        color: "primary",
      },
      {
        label: "Специалистов всего",
        value: extra?.totalSpecialists ?? 0,
        icon: Award,
        color: "primary",
      },
      {
        label: "Новых (неделя)",
        value: extra?.newUsersWeek ?? stats?.newUsersWeek ?? 0,
        icon: UserPlus,
        trend: "up",
        trendValue: "7 дней",
      },
      {
        label: "Ждут верификации",
        value: extra?.pendingVerifications ?? 0,
        icon: ShieldCheck,
        color: (extra?.pendingVerifications ?? 0) > 0 ? "warning" : "muted",
      },
      {
        label: "Диалогов (месяц)",
        value: extra?.threadsMonth ?? stats?.threadsMonth ?? 0,
        icon: MessageCircle,
      },
      {
        label: "Диалогов (неделя)",
        value: extra?.threadsWeek ?? stats?.threadsWeek ?? 0,
        icon: Activity,
        trend: "up",
      },
      {
        label: "Решённых дел",
        value: extra?.resolvedCases ?? 0,
        icon: TrendingUp,
        color: "success",
      },
      {
        label: "SLA ответа (ч)",
        value: extra?.slaResponseHours ?? 0,
        icon: Clock,
        color:
          (extra?.slaResponseHours ?? 0) > 4
            ? "warning"
            : (extra?.slaResponseHours ?? 0) > 12
              ? "danger"
              : "success",
      },
    ],
    [extra, stats]
  );

  const priorityItems: PriorityItem[] = useMemo(() => {
    const items: PriorityItem[] = [];
    if ((extra?.openComplaints ?? 0) > 0) {
      items.push({
        id: "complaints",
        icon: AlertOctagon,
        title: `${extra?.openComplaints} жалоб на модерации`,
        meta: "Требует реакции администратора",
        urgency: "high",
        action: {
          label: "Открыть",
          onPress: () =>
            router.push("/(admin-tabs)/complaints" as never),
        },
      });
    }
    if ((extra?.pendingVerifications ?? 0) > 0) {
      items.push({
        id: "verify",
        icon: UserCheck,
        title: `${extra?.pendingVerifications} специалистов ждут верификации`,
        meta: "Проверьте профили и активируйте",
        urgency: "medium",
        action: {
          label: "Проверить",
          onPress: () => router.push("/(admin-tabs)/moderation" as never),
        },
      });
    }
    if (extra?.slaResponseHours !== undefined && extra.slaResponseHours > 4) {
      items.push({
        id: "sla",
        icon: Clock,
        title: `SLA response time: ${extra.slaResponseHours}h`,
        meta: "Время ответа специалистов выше целевого",
        urgency: extra.slaResponseHours > 12 ? "high" : "medium",
      });
    }
    if ((extra?.newMessagesDay ?? 0) > 0) {
      items.push({
        id: "activity",
        icon: Activity,
        title: `${extra?.newMessagesDay} новых сообщений сегодня`,
        meta: "Платформа активна",
        urgency: "low",
      });
    }
    if (items.length === 0) {
      items.push({
        id: "all-good",
        icon: ShieldCheck,
        title: "Всё в порядке",
        meta: "Жалоб нет, верификаций нет, SLA в норме",
        urgency: "low",
      });
    }
    return items;
  }, [extra, router]);

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <HeaderHome
        onSettingsPress={() => router.push("/admin/settings" as never)}
      />
      {loading ? (
        <ScrollView className="flex-1">
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
        </ScrollView>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <ErrorState
            message="Не удалось загрузить статистику"
            onRetry={fetchStats}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          <DesktopScreen>
            <View style={{ paddingVertical: spacing.lg, gap: spacing.lg }}>
              <DashboardHero
                greeting="Обзор платформы"
                subtitle="Ключевые метрики и события в режиме реального времени"
                primaryStats={heroStats}
              />

              <StatsGrid title="Детальная статистика" stats={gridStats} />

              <PriorityFeed
                title="Требует внимания"
                items={priorityItems}
                emptyMessage="Нет задач"
              />

              {wins.length > 0 ? (
                <RecentWinsStrip
                  title="Последние победы специалистов"
                  subtitle="Социальное доказательство для лендинга"
                  items={wins}
                />
              ) : null}

              {/* Top cities + specialists side-by-side */}
              {stats && (stats.topCities.length > 0 || stats.topSpecialists.length > 0) ? (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: spacing.md,
                  }}
                >
                  <View style={{ flexBasis: "48%", flexGrow: 1, minWidth: 280 }}>
                    <RankList
                      title="Топ городов"
                      items={stats.topCities}
                    />
                  </View>
                  <View style={{ flexBasis: "48%", flexGrow: 1, minWidth: 280 }}>
                    <RankList
                      title="Топ специалистов"
                      items={stats.topSpecialists}
                    />
                  </View>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Управление пользователями"
                onPress={() => router.push("/(admin-tabs)/users" as never)}
                style={{
                  backgroundColor: colors.accentSoft,
                  borderRadius: 14,
                  padding: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    ...textStyle.bodyBold,
                    color: colors.accentSoftInk,
                  }}
                >
                  Управление пользователями
                </Text>
                <Text style={{ color: colors.accent, fontWeight: "600" }}>
                  Открыть →
                </Text>
              </Pressable>
            </View>
          </DesktopScreen>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function RankList({
  title,
  items,
}: {
  title: string;
  items: { name: string; count: number }[];
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <Text style={{ ...textStyle.h4, color: colors.text, marginBottom: spacing.md }}>
        {title}
      </Text>
      {items.length === 0 ? (
        <Text style={{ ...textStyle.small, color: colors.textSecondary }}>
          Нет данных
        </Text>
      ) : (
        items.map((item, i) => (
          <View
            key={`${item.name}-${i}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
              borderBottomWidth: i === items.length - 1 ? 0 : 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                gap: 8,
              }}
            >
              <Text
                style={{
                  ...textStyle.small,
                  color: colors.textMuted,
                  width: 20,
                }}
              >
                {i + 1}.
              </Text>
              <Text
                style={{ ...textStyle.body, color: colors.text, flex: 1 }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </View>
            <Text
              style={{
                ...textStyle.bodyBold,
                color: colors.accent,
              }}
            >
              {item.count}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
