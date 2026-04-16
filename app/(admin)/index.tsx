import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/Colors';
import { admin } from '../../lib/api/endpoints';
import { Header } from '../../components/Header';
import { Button, Card, Container, Heading, Screen, Text } from '../../components/ui';

function StatCard({ label, value, color, trend, icon }: { label: string; value: string | number; color: string; trend?: string; icon: string }) {
  return (
    <Card variant="outlined" padding="md" style={{ width: '48%', gap: Spacing.xs }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color + '15',
      }}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text variant="caption">{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: Typography.fontWeight.bold, color, fontFamily: Typography.fontFamily.bold }}>
        {value}
      </Text>
      {trend ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Feather name="trending-up" size={12} color={Colors.statusSuccess} />
          <Text variant="caption" style={{ color: Colors.statusSuccess }}>{trend}</Text>
        </View>
      ) : null}
    </Card>
  );
}

interface WeeklyBucket {
  date: string;
  signups: number;
  newSpecialists: number;
  newRequests: number;
  newResponses: number;
}

const DOW_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function WeeklyChart({ title, data }: { title: string; data: WeeklyBucket[] }) {
  // Total activity per day (signups + requests + responses)
  const totals = data.map((b) => b.signups + b.newRequests + b.newResponses);
  const max = Math.max(1, ...totals);
  const labels = data.map((b) => {
    const d = new Date(b.date + 'T00:00:00');
    return DOW_RU[d.getDay()];
  });
  const allZero = totals.every((t) => t === 0);

  return (
    <Card variant="outlined" padding="lg" style={{ gap: Spacing.md }}>
      <Heading level={4}>{title}</Heading>
      {allZero ? (
        <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
          <Text variant="caption">Нет активности за последние 7 дней</Text>
        </View>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, height: 100 }}>
            {totals.map((t, i) => {
              const h = Math.max(4, Math.round((t / max) * 100));
              const isLast = i === totals.length - 1;
              return (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: BorderRadius.sm,
                    height: h,
                    backgroundColor: isLast ? Colors.brandPrimary : Colors.bgSecondary,
                  }}
                />
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {labels.map((d, i) => (
              <Text key={i} variant="caption" align="center" style={{ flex: 1 }}>{d}</Text>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'только что';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ч назад`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} дн назад`;
}

function activityIconFor(type: string): string {
  if (type.startsWith('user.signup')) return 'user-plus';
  if (type === 'user.specialist_signup' || type === 'specialist.profile_created') return 'briefcase';
  if (type === 'request.created') return 'file-text';
  if (type === 'user.blocked') return 'shield-off';
  if (type === 'review.created') return 'star';
  return 'activity';
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AdminStats {
  totalUsers?: number;
  totalSpecialists?: number;
  totalRequests?: number;
  openComplaints?: number;
  [key: string]: unknown;
}

interface ActivityRow {
  type: string;
  actorName: string;
  targetName: string;
  action: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// STATE: DEFAULT (populated with stats)
// ---------------------------------------------------------------------------

function DefaultDashboard({
  st,
  weekly,
  activities,
}: {
  st: AdminStats;
  weekly: WeeklyBucket[];
  activities: ActivityRow[];
}) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
      <Container>
        <View style={{ gap: Spacing.lg }}>
          <View style={{ gap: Spacing.xs }}>
            <Heading level={2}>Панель администратора</Heading>
            <Text variant="caption">Обзор платформы</Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            <StatCard label="Всего пользователей" value={st.totalUsers ?? '—'} color={Colors.textPrimary} icon="users" />
            <StatCard label="Специалистов" value={st.totalSpecialists ?? '—'} color={Colors.brandPrimary} icon="briefcase" />
            <StatCard label="Всего заявок" value={st.totalRequests ?? '—'} color={Colors.textPrimary} icon="file-text" />
            <StatCard label="Открытые жалобы" value={st.openComplaints ?? '—'} color={Colors.statusWarning} icon="alert-triangle" />
          </View>

          <WeeklyChart title="Активность за неделю" data={weekly} />

          <View style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Heading level={3}>Последние действия</Heading>
              <View style={{
                backgroundColor: Colors.brandPrimary,
                minWidth: 22,
                height: 22,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 5,
              }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.white, fontWeight: Typography.fontWeight.bold, fontFamily: Typography.fontFamily.bold }}>
                  {activities.length}
                </Text>
              </View>
            </View>
            {activities.length === 0 ? (
              <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
                <Text variant="caption">Пока нет активности</Text>
              </View>
            ) : (
              activities.map((item, i) => {
                const detailText = item.targetName
                  ? `${item.actorName} — ${item.targetName}`
                  : item.actorName;
                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      gap: Spacing.md,
                      alignItems: 'center',
                      paddingVertical: Spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.bgSecondary,
                    }}
                  >
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: Colors.brandPrimary + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Feather name={activityIconFor(item.type) as any} size={16} color={Colors.brandPrimary} />
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text weight="semibold" numberOfLines={1}>
                        {item.action}: <Text>{detailText}</Text>
                      </Text>
                      <Text variant="caption">{formatRelativeTime(item.createdAt)}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={Colors.textMuted} />
                  </View>
                );
              })
            )}
          </View>
        </View>
      </Container>
    </ScrollView>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [weekly, setWeekly] = useState<WeeklyBucket[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([admin.getStats(), admin.getWeeklyStats(), admin.getActivity(20)])
      .then(([statsRes, weeklyRes, activityRes]) => {
        setStats(((statsRes as any).data ?? statsRes) as AdminStats);
        setWeekly((((weeklyRes as any).data ?? weeklyRes) as WeeklyBucket[]) ?? []);
        setActivities((((activityRes as any).data ?? activityRes) as ActivityRow[]) ?? []);
      })
      .catch((e) => {
        setError(e?.message ?? 'Ошибка загрузки');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  return (
    <Screen bg={Colors.white}>
      <Header variant="auth" />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md }}>
          <ActivityIndicator color={Colors.brandPrimary} />
          <Text variant="caption">Загрузка...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md }}>
          <Feather name="alert-circle" size={32} color={Colors.statusError} />
          <Text align="center" style={{ color: Colors.statusError }}>{error}</Text>
          <Button onPress={load}>Повторить</Button>
        </View>
      ) : (
        <DefaultDashboard st={stats ?? {}} weekly={weekly} activities={activities} />
      )}
    </Screen>
  );
}
