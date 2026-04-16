import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { admin } from '../../lib/api/endpoints';
import { Header } from '../../components/Header';

function SkeletonBlock({ width, height, radius }: { width: string | number; height: number; radius?: number }) {
  return (
    <View style={[s.skeleton, { width: width as any, height, borderRadius: radius || BorderRadius.md }]} />
  );
}

function StatCard({ label, value, color, trend, icon }: { label: string; value: string | number; color: string; trend?: string; icon: string }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      {trend && (
        <View style={s.trendRow}>
          <Feather name="trending-up" size={12} color={Colors.statusSuccess} />
          <Text style={s.statTrend}>{trend}</Text>
        </View>
      )}
    </View>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <View style={s.chartCard}>
      <Text style={s.chartTitle}>{title}</Text>
      <View style={s.chartArea}>
        <View style={s.chartBars}>
          {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
            <View key={i} style={[s.chartBar, { height: h, backgroundColor: i === 6 ? Colors.brandPrimary : Colors.bgSecondary }]} />
          ))}
        </View>
        <View style={s.chartLabels}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
            <Text key={d} style={s.chartLabel}>{d}</Text>
          ))}
        </View>
      </View>
    </View>
  );
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

// ---------------------------------------------------------------------------
// STATE: DEFAULT (populated with stats)
// ---------------------------------------------------------------------------

function DefaultDashboard({ st }: { st: AdminStats }) {
  const activities = [
    { icon: 'user-plus', action: 'Регистрация', detail: 'Новый пользователь', time: '5 мин назад' },
    { icon: 'file-text', action: 'Заявка', detail: 'Новая заявка в системе', time: '12 мин назад' },
    { icon: 'shield', action: 'Модерация', detail: 'Специалист ожидает проверки', time: '30 мин назад' },
    { icon: 'star', action: 'Отзыв', detail: 'Новый отзыв', time: '1 час назад' },
    { icon: 'alert-triangle', action: 'Жалоба', detail: 'Новая жалоба на специалиста', time: '2 часа назад' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.container}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Панель администратора</Text>
        <Text style={s.pageSubtitle}>Обзор платформы</Text>
      </View>

      <View style={s.statsGrid}>
        <StatCard label="Всего пользователей" value={st.totalUsers ?? '—'} color={Colors.textPrimary} icon="users" />
        <StatCard label="Специалистов" value={st.totalSpecialists ?? '—'} color={Colors.brandPrimary} icon="briefcase" />
        <StatCard label="Всего заявок" value={st.totalRequests ?? '—'} color={Colors.textPrimary} icon="file-text" />
        <StatCard label="Открытые жалобы" value={st.openComplaints ?? '—'} color={Colors.statusWarning} icon="alert-triangle" />
      </View>

      <ChartPlaceholder title="Активность за неделю" />

      <View style={s.recentSection}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Последние действия</Text>
          <View style={s.sectionBadge}>
            <Text style={s.sectionBadgeText}>{activities.length}</Text>
          </View>
        </View>
        {activities.map((item, i) => (
          <View key={i} style={s.activityRow}>
            <View style={s.activityIconWrap}>
              <Feather name={item.icon as any} size={16} color={Colors.brandPrimary} />
            </View>
            <View style={s.activityContent}>
              <Text style={s.activityAction}>{item.action}: <Text style={s.activityDetail}>{item.detail}</Text></Text>
              <Text style={s.activityTime}>{item.time}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.textMuted} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    admin.getStats()
      .then((res) => {
        setStats((res as any).data ?? res);
      })
      .catch((e) => {
        setError(e.message ?? 'Ошибка загрузки');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="auth" />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md }}>
          <ActivityIndicator color={Colors.brandPrimary} />
          <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted }}>Загрузка...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md }}>
          <Feather name="alert-circle" size={32} color={Colors.statusError} />
          <Text style={{ fontSize: Typography.fontSize.base, color: Colors.statusError, textAlign: 'center' }}>{error}</Text>
          <Pressable
            onPress={load}
            style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn }}
          >
            <Text style={{ color: Colors.white, fontWeight: Typography.fontWeight.semibold }}>Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <DefaultDashboard st={stats ?? {}} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },

  pageHeader: { gap: Spacing.xs },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  pageSubtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    width: '48%', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs, ...Shadows.sm,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  statValue: { fontSize: 22, fontWeight: Typography.fontWeight.bold },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statTrend: { fontSize: Typography.fontSize.xs, color: Colors.statusSuccess },

  chartCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, ...Shadows.sm,
  },
  chartTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  chartArea: { gap: Spacing.sm },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, height: 100 },
  chartBar: { flex: 1, borderRadius: BorderRadius.sm },
  chartLabels: { flexDirection: 'row', gap: Spacing.sm },
  chartLabel: { flex: 1, fontSize: Typography.fontSize.xs, color: Colors.textMuted, textAlign: 'center' },

  recentSection: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  sectionBadge: {
    backgroundColor: Colors.brandPrimary, minWidth: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  sectionBadgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, color: Colors.white },

  activityRow: {
    flexDirection: 'row', gap: Spacing.md, alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary,
  },
  activityIconWrap: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.brandPrimary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  activityContent: { flex: 1, gap: 1 },
  activityAction: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  activityDetail: { fontWeight: Typography.fontWeight.regular, color: Colors.textSecondary },
  activityTime: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  // Loading
  skeleton: { backgroundColor: Colors.bgSurface, opacity: 0.7 },
  loadingText: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
});
