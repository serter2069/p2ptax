import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { MOCK_ADMIN_STATS } from '../../../constants/protoMockData';

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

export function AdminDashboardStates() {
  const st = MOCK_ADMIN_STATS;

  const activities = [
    { icon: 'user-plus', action: 'Регистрация', detail: 'Новый пользователь: Сергей К.', time: '5 мин назад' },
    { icon: 'file-text', action: 'Заявка', detail: 'Новая заявка: Декларация 3-НДФЛ', time: '12 мин назад' },
    { icon: 'shield', action: 'Модерация', detail: 'Специалист ожидает проверки', time: '30 мин назад' },
    { icon: 'star', action: 'Отзыв', detail: 'Новый отзыв от Елены В.', time: '1 час назад' },
  ];

  return (
    <StateSection title="STATS">
      <View style={s.container}>
        <Text style={s.pageTitle}>Панель администратора</Text>

        <View style={s.statsGrid}>
          <StatCard label="Всего пользователей" value={st.totalUsers} color={Colors.textPrimary} trend="+23 сегодня" icon="users" />
          <StatCard label="Специалистов" value={st.totalSpecialists} color={Colors.brandPrimary} icon="briefcase" />
          <StatCard label="Всего заявок" value={st.totalRequests} color={Colors.textPrimary} trend="+15 сегодня" icon="file-text" />
          <StatCard label="Активные заявки" value={st.activeRequests} color={Colors.statusSuccess} icon="check-circle" />
          <StatCard label="На модерации" value={st.pendingModeration} color={Colors.statusWarning} icon="clock" />
          <StatCard label="Средний рейтинг" value={st.avgRating} color={Colors.brandPrimary} icon="star" />
        </View>

        <View style={s.revenue}>
          <Feather name="dollar-sign" size={24} color="rgba(255,255,255,0.7)" />
          <Text style={s.revenueLabel}>Общий доход</Text>
          <Text style={s.revenueValue}>{st.revenue}</Text>
        </View>

        <ChartPlaceholder title="Регистрации за неделю" />
        <ChartPlaceholder title="Заявки за неделю" />

        <View style={s.recentSection}>
          <Text style={s.sectionTitle}>Последние действия</Text>
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
      </View>
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  pageTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
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
  revenue: {
    backgroundColor: Colors.textPrimary, borderRadius: BorderRadius.card, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs,
    ...Shadows.md,
  },
  revenueLabel: { fontSize: Typography.fontSize.base, color: 'rgba(255,255,255,0.7)' },
  revenueValue: { fontSize: 28, fontWeight: Typography.fontWeight.bold, color: Colors.white },
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
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  activityRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  activityIconWrap: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.brandPrimary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  activityContent: { flex: 1, gap: 1 },
  activityAction: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  activityDetail: { fontWeight: Typography.fontWeight.regular, color: Colors.textSecondary },
  activityTime: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
});
