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
import { useTypedRouter } from "@/lib/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AlertOctagon,
  Users,
  FileCheck2,
  MessageCircle,
  Shield,
  Gauge,
  UserCheck,
  UserPlus,
} from "lucide-react-native";
import DesktopScreen from "@/components/layout/DesktopScreen";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ErrorState from "@/components/ui/ErrorState";
import {
  DashboardGrid,
  KpiCard,
  DashboardWidget,
  FeedList,
  type FeedItem,
} from "@/components/dashboard";
import { api } from "@/lib/api";
import { colors, BREAKPOINT } from "@/lib/theme";

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
  onlineSpecialists: number;
  totalClients: number;
  totalSpecialists: number;
  newUsersWeek: number;
  pendingVerifications: number;
  threadsMonth: number;
  threadsWeek: number;
  resolvedCases: number;
  slaReplyHours: number;
  newMessagesDay: number;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  // Iter11 PR 3 — specialist opt-in flag; admin dashboard uses it to
  // colour the feed rows (emerald for specialists, blue for plain USERs).
  isSpecialist?: boolean;
  createdAt: string;
  isBanned: boolean;
}

interface ComplaintReporter {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface ComplaintItem {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: ComplaintReporter;
  target: ComplaintReporter;
}

function formatUserName(u: {
  email: string;
  firstName: string | null;
  lastName: string | null;
}): string {
  const parts = [u.firstName, u.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : u.email;
}

function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const [stats, setStats] = useState<Stats | null>(null);
  const [extra, setExtra] = useState<AdminExtra | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    setError(false);
    try {
      const statsRes = await api<Stats>("/api/admin/stats");
      setStats(statsRes);

      try {
        const ex = await api<AdminExtra>("/api/stats/admin-dashboard");
        setExtra(ex);
      } catch {
        setExtra(null);
      }

      try {
        const recents = await api<{ items: AdminUser[] }>(
          "/api/admin/users?limit=5"
        );
        setRecentUsers(Array.isArray(recents?.items) ? recents.items : []);
      } catch {
        setRecentUsers([]);
      }

      try {
        const c = await api<{ items: ComplaintItem[]; total: number }>(
          "/api/admin/complaints?status=PENDING&limit=5"
        );
        setComplaints(Array.isArray(c?.items) ? c.items : []);
      } catch {
        setComplaints([]);
      }
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStats().finally(() => setLoading(false));
  }, [fetchStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  const totalUsers =
    (extra?.totalClients ?? 0) + (extra?.totalSpecialists ?? 0);

  const recentUsersItems: FeedItem[] = useMemo(
    () =>
      (recentUsers ?? []).map((u) => ({
        id: u.id,
        title: formatUserName(u),
        meta: `${u.role} · ${formatDateShort(u.createdAt)}`,
        rightValue: u.isBanned ? "BANNED" : undefined,
        icon: UserPlus,
        iconTone: u.isBanned ? "danger" : u.isSpecialist ? "success" : "primary",
        onPress: () => nav.routes.adminUsers(),
      })),
    [recentUsers, router]
  );

  const complaintsItems: FeedItem[] = useMemo(
    () =>
      (complaints ?? []).map((c) => ({
        id: c.id,
        title: c.reason.length > 60 ? `${c.reason.slice(0, 60)}…` : c.reason,
        meta: `от ${formatUserName(c.reporter)} · ${formatDateShort(c.createdAt)}`,
        icon: AlertOctagon,
        iconTone: "danger",
        onPress: () => nav.routes.adminComplaints(),
      })),
    [complaints, router]
  );

  return (
    <ErrorBoundary fallbackMessage="Не удалось загрузить панель">
      <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <DesktopScreen
          title="Панель администратора"
          subtitle="Ключевые метрики и события в реальном времени"
        >
          {error ? (
            <ErrorState
              message="Не удалось загрузить статистику"
              onRetry={() => {
                setLoading(true);
                fetchStats().finally(() => setLoading(false));
              }}
            />
          ) : (
            <View style={{ gap: isDesktop ? 32 : 24 }}>
              {/* Top KPIs: 4 — render immediately with sensible zeros so the
                  dashboard structure is visible during loading instead of a
                  bare skeleton. (iter11-b fix for admin dashboard 2/10 score.) */}
              <DashboardGrid>
                <DashboardGrid.Col span={3} tabletSpan={1}>
                  <KpiCard
                    label="Пользователей"
                    value={loading ? "—" : totalUsers}
                    hint={
                      loading
                        ? "клиентов · специалистов"
                        : `клиентов ${extra?.totalClients ?? 0} · специалистов ${extra?.totalSpecialists ?? 0}`
                    }
                    icon={Users}
                    tone="primary"
                    onPress={() => nav.routes.adminUsers()}
                  />
                </DashboardGrid.Col>
                <DashboardGrid.Col span={3} tabletSpan={1}>
                  <KpiCard
                    label="Активных заявок"
                    value={loading ? "—" : (extra?.activeRequests ?? stats?.activeRequests ?? 0)}
                    icon={FileCheck2}
                    tone="success"
                  />
                </DashboardGrid.Col>
                <DashboardGrid.Col span={3} tabletSpan={1}>
                  <KpiCard
                    label="Жалоб на модерации"
                    value={loading ? "—" : (extra?.openComplaints ?? 0)}
                    icon={AlertOctagon}
                    tone={
                      loading
                        ? "muted"
                        : (extra?.openComplaints ?? 0) > 0
                          ? "danger"
                          : "muted"
                    }
                    onPress={() =>
                      nav.routes.adminComplaints()
                    }
                  />
                </DashboardGrid.Col>
                <DashboardGrid.Col span={3} tabletSpan={1}>
                  <KpiCard
                    label="Превышений лимита"
                    value={loading ? "—" : (extra?.pendingVerifications ?? 0)}
                    hint="20 thread/день exceeds"
                    icon={Gauge}
                    tone={
                      loading
                        ? "muted"
                        : (extra?.pendingVerifications ?? 0) > 0
                          ? "warning"
                          : "muted"
                    }
                  />
                </DashboardGrid.Col>
              </DashboardGrid>

              {/* Main: recent signups (8) + sidebar alerts (4) */}
              <DashboardGrid>
                <DashboardGrid.Col span={8} tabletSpan={2}>
                  <DashboardWidget
                    title="Recent signups"
                    subtitle={`${recentUsers?.length ?? 0} последних`}
                    icon={UserCheck}
                    actionLabel="Все →"
                    onActionPress={() =>
                      nav.routes.adminUsers()
                    }
                    flush
                  >
                    {/* Pretty table with header row */}
                    <View
                      className="flex-row items-center"
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        backgroundColor: colors.surface2,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text
                        className="text-text-dim uppercase"
                        style={{ fontSize: 12, flex: 3, fontWeight: "700" }}
                      >
                        Пользователь
                      </Text>
                      <Text
                        className="text-text-dim uppercase"
                        style={{ fontSize: 12, flex: 1, fontWeight: "700" }}
                      >
                        Роль
                      </Text>
                      <Text
                        className="text-text-dim uppercase"
                        style={{ fontSize: 12, flex: 1, fontWeight: "700" }}
                      >
                        Дата
                      </Text>
                    </View>
                    <FeedList
                      items={recentUsersItems}
                      emptyText="Нет новых регистраций"
                    />
                  </DashboardWidget>
                </DashboardGrid.Col>

                <DashboardGrid.Col span={4} tabletSpan={2}>
                  <View style={{ gap: 16 }}>
                    <DashboardWidget
                      title="Требуют реакции"
                      subtitle="Топ жалоб для модерации"
                      icon={AlertOctagon}
                      accentBar={(complaints?.length ?? 0) > 0 ? "danger" : "success"}
                      actionLabel="Все →"
                      onActionPress={() =>
                        nav.routes.adminComplaints()
                      }
                      flush
                    >
                      <FeedList
                        items={complaintsItems}
                        emptyText="Жалоб нет. Всё спокойно."
                      />
                    </DashboardWidget>

                    <DashboardWidget
                      title="Активность"
                      icon={MessageCircle}
                    >
                      <View style={{ gap: 10 }}>
                        <Row
                          label="Диалогов (неделя)"
                          value={extra?.threadsWeek ?? stats?.threadsWeek ?? 0}
                        />
                        <Row
                          label="Диалогов (месяц)"
                          value={extra?.threadsMonth ?? stats?.threadsMonth ?? 0}
                        />
                        <Row
                          label="Новых юзеров (неделя)"
                          value={extra?.newUsersWeek ?? stats?.newUsersWeek ?? 0}
                        />
                        <Row
                          label="SLA ответа (ч)"
                          value={extra?.slaReplyHours ?? 0}
                          tone={
                            (extra?.slaReplyHours ?? 0) > 12
                              ? "danger"
                              : (extra?.slaReplyHours ?? 0) > 4
                                ? "warning"
                                : "success"
                          }
                        />
                      </View>
                    </DashboardWidget>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Модерация"
                      onPress={() =>
                        nav.routes.adminModeration()
                      }
                      className="rounded-2xl bg-accent p-5"
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className="rounded-xl items-center justify-center bg-white/20"
                          style={{ width: 44, height: 44 }}
                        >
                          <Shield size={22} color={colors.white} />
                        </View>
                        <View className="flex-1 min-w-0">
                          <Text
                            className="font-extrabold text-white"
                            style={{ fontSize: 16 }}
                          >
                            Модерация
                          </Text>
                          <Text
                            className="text-white/80 mt-0.5"
                            style={{ fontSize: 12 }}
                          >
                            Открыть очередь модерации
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
    </ErrorBoundary>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "danger" | "warning" | "success";
}) {
  const color =
    tone === "danger"
      ? colors.danger
      : tone === "warning"
        ? colors.warning
        : tone === "success"
          ? colors.success
          : colors.text;
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-text-mute" style={{ fontSize: 13 }}>
        {label}
      </Text>
      <Text
        className="font-bold"
        style={{ fontSize: 14, color }}
      >
        {value}
      </Text>
    </View>
  );
}
