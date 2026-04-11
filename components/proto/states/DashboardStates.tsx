import React from 'react';
import { View, Text, Image, ActivityIndicator, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { ProtoHeader, ProtoTabBar } from '../NavComponents';

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function RequestRow({ title, status, date, statusColor, onPress }: { title: string; status: string; date: string; statusColor: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      <View style={s.rowLeft}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        <Text style={s.rowDate}>{date}</Text>
      </View>
      <View style={[s.badge, { backgroundColor: statusColor + '20' }]}>
        <Text style={[s.badgeText, { color: statusColor }]}>{status}</Text>
      </View>
    </Pressable>
  );
}

function EmptyDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.greeting}>Добрый день, Елена!</Text>
        <Text style={s.subGreeting}>Добро пожаловать в Налоговик</Text>
      </View>
      <View style={s.emptyBlock}>
        <Feather name="file-text" size={48} color={Colors.textMuted} />
        <Text style={s.emptyTitle}>Пока нет заявок</Text>
        <Text style={s.emptyText}>Создайте первую заявку, чтобы найти налогового специалиста</Text>
        <Pressable style={s.btn}><Text style={s.btnText}>Создать заявку</Text></Pressable>
      </View>
    </View>
  );
}

function WithDataDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.greeting}>Добрый день, Елена!</Text>
      </View>
      <Image source={{ uri: 'https://picsum.photos/seed/promo-banner/800/200' }} style={{ width: '100%', height: 100, borderRadius: 10 }} resizeMode="cover" />
      <View style={s.statsRow}>
        <StatCard label="Активные" value="3" color={Colors.brandPrimary} />
        <StatCard label="Отклики" value="8" color={Colors.statusSuccess} />
        <StatCard label="Завершены" value="12" color={Colors.textMuted} />
      </View>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Активные заявки</Text>
        <View style={s.list}>
          <RequestRow title="Декларация 3-НДФЛ за 2025" status="Новая" date="08.04.2026" statusColor={Colors.brandPrimary} />
          <RequestRow title="Регистрация ИП на УСН" status="3 отклика" date="07.04.2026" statusColor={Colors.statusSuccess} />
          <RequestRow title="Оптимизация налогов ООО" status="В работе" date="05.04.2026" statusColor={Colors.statusWarning} />
        </View>
      </View>
    </View>
  );
}

function LoadingDashboard() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.greeting}>Добрый день!</Text>
      </View>
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
        <Text style={s.loadingText}>Загрузка данных...</Text>
      </View>
    </View>
  );
}

export function DashboardStates() {
  return (
    <>
      <StateSection title="EMPTY">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <EmptyDashboard />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="WITH_DATA">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <WithDataDashboard />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="LOADING">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <LoadingDashboard />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  header: { gap: Spacing.xs, paddingTop: Spacing.sm },
  greeting: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subGreeting: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
  },
  statValue: { fontSize: 24, fontWeight: Typography.fontWeight.bold },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  list: { gap: Spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgCard, padding: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  rowLeft: { flex: 1, marginRight: Spacing.sm },
  rowTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  rowDate: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  emptyBlock: { alignItems: 'center', padding: Spacing['3xl'], gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  emptyText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  btn: {
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'], marginTop: Spacing.sm,
  },
  btnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  loadingWrap: { alignItems: 'center', padding: Spacing['4xl'], gap: Spacing.md },
  loadingText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
});
