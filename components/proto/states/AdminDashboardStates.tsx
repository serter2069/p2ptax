import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_ADMIN_STATS } from '../../../constants/protoMockData';
import { ProtoPlaceholderImage } from '../ProtoPlaceholderImage';

function StatCard({ label, value, color, trend }: { label: string; value: string | number; color: string; trend?: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      {trend && <Text style={s.statTrend}>{trend}</Text>}
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

export function AdminDashboardStates() {
  const st = MOCK_ADMIN_STATS;
  return (
    <StateSection title="STATS" maxWidth={800}>
      <View style={s.container}>
        <Text style={s.pageTitle}>Панель администратора</Text>

        <View style={s.statsGrid}>
          <StatCard label="Всего пользователей" value={st.totalUsers} color={Colors.textPrimary} trend="+23 сегодня" />
          <StatCard label="Специалистов" value={st.totalSpecialists} color={Colors.brandPrimary} />
          <StatCard label="Всего заявок" value={st.totalRequests} color={Colors.textPrimary} trend="+15 сегодня" />
          <StatCard label="Активные заявки" value={st.activeRequests} color={Colors.statusSuccess} />
          <StatCard label="На модерации" value={st.pendingModeration} color="#D97706" />
          <StatCard label="Средний рейтинг" value={st.avgRating} color={Colors.brandPrimary} />
        </View>

        <View style={s.revenue}>
          <Text style={s.revenueLabel}>Общий доход</Text>
          <Text style={s.revenueValue}>{st.revenue}</Text>
        </View>

        <ProtoPlaceholderImage type="banner" height={80} label="Admin promo / announcement" borderRadius={10} />

        <ChartPlaceholder title="Регистрации за неделю" />
        <ChartPlaceholder title="Заявки за неделю" />

        <View style={s.recentSection}>
          <Text style={s.sectionTitle}>Последние действия</Text>
          {[
            { action: 'Регистрация', detail: 'Новый пользователь: Сергей К.', time: '5 мин назад' },
            { action: 'Заявка', detail: 'Новая заявка: Декларация 3-НДФЛ', time: '12 мин назад' },
            { action: 'Модерация', detail: 'Специалист ожидает проверки', time: '30 мин назад' },
            { action: 'Отзыв', detail: 'Новый отзыв от Елены В.', time: '1 час назад' },
          ].map((item, i) => (
            <View key={i} style={s.activityRow}>
              <View style={s.activityDot} />
              <View style={s.activityContent}>
                <Text style={s.activityAction}>{item.action}: <Text style={s.activityDetail}>{item.detail}</Text></Text>
                <Text style={s.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    width: '48%', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 2, ...Shadows.sm,
  },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  statValue: { fontSize: 22, fontWeight: Typography.fontWeight.bold },
  statTrend: { fontSize: Typography.fontSize.xs, color: Colors.statusSuccess },
  revenue: {
    backgroundColor: '#0F2447', borderRadius: BorderRadius.md, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs,
  },
  revenueLabel: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  revenueValue: { fontSize: 28, fontWeight: Typography.fontWeight.bold, color: '#FFF' },
  chartCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  chartTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  chartArea: { gap: Spacing.sm },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, height: 100 },
  chartBar: { flex: 1, borderRadius: BorderRadius.sm },
  chartLabels: { flexDirection: 'row', gap: Spacing.sm },
  chartLabel: { flex: 1, fontSize: Typography.fontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  recentSection: { gap: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  activityRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandPrimary, marginTop: 6 },
  activityContent: { flex: 1, gap: 1 },
  activityAction: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  activityDetail: { fontWeight: Typography.fontWeight.regular, color: Colors.textSecondary },
  activityTime: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
});
