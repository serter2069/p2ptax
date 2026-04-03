import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';

interface Stats {
  totalUsers: number;
  totalSpecialists: number;
  activePromotions: number;
  revenueThisMonth: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  onPress?: () => void;
}

function StatCard({ label, value, sub, onPress }: StatCardProps) {
  const inner = (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.statCardWrap}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={styles.statCardWrap}>{inner}</View>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await api.get<Stats>('/admin/stats');
      setStats(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleRefresh = () => { setRefreshing(true); fetchStats(true); };

  const navItems = [
    { label: 'Пользователи', route: '/(admin)/users' as const, icon: 'U' },
    { label: 'Модерация', route: '/(admin)/moderation' as const, icon: 'M' },
    { label: 'Продвижения', route: '/(admin)/promotions' as const, icon: 'P' },
    { label: 'Запросы', route: '/(admin)/requests' as const, icon: 'R' },
    { label: 'Отзывы', route: '/(admin)/reviews' as const, icon: 'О' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Админ-панель" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>Статистика</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : stats ? (
            <View style={styles.statsGrid}>
              <StatCard label="Пользователей" value={stats.totalUsers} onPress={() => router.push('/(admin)/users')} />
              <StatCard label="Исполнителей" value={stats.totalSpecialists} onPress={() => router.push('/(admin)/moderation')} />
              <StatCard label="Активных продвижений" value={stats.activePromotions} onPress={() => router.push('/(admin)/promotions')} />
              <StatCard label="Продвижений за месяц" value={stats.revenueThisMonth} sub="(оплат этого месяца)" />
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Разделы</Text>
          <View style={styles.navList}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.navItem}
                onPress={() => router.push(item.route)}
                activeOpacity={0.75}
              >
                <View style={styles.navIcon}>
                  <Text style={styles.navIconText}>{item.icon}</Text>
                </View>
                <Text style={styles.navLabel}>{item.label}</Text>
                <Text style={styles.navArrow}>{'>'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
  },
  loader: {
    marginVertical: Spacing['2xl'],
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCardWrap: {
    width: '47%',
  },
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    ...Shadows.sm,
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textAccent,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  statSub: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  navList: {
    gap: Spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  navIconText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textAccent,
  },
  navLabel: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  navArrow: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
  },
});
