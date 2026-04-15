import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Stats {
  totalUsers: number;
  totalSpecialists: number;
  activePromotions: number;
  revenueThisMonth: number;
  totalRequests?: number;
  pendingComplaints?: number;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatCard({
  icon,
  label,
  value,
  color,
  trend,
  onPress,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  trend?: string;
  onPress?: () => void;
}) {
  const inner = (
    <>
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: color + '15' }}
      >
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text className="text-sm text-textMuted">{label}</Text>
      <Text className="text-[22px] font-bold" style={{ color }}>
        {value}
      </Text>
      {trend && (
        <View className="flex-row items-center gap-1">
          <Feather name="trending-up" size={12} color={Colors.statusSuccess} />
          <Text className="text-xs text-statusSuccess">{trend}</Text>
        </View>
      )}
    </>
  );

  const cardClass = "gap-1 rounded-xl border border-borderLight bg-white p-3 shadow-sm";

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`w-[48%] ${cardClass}`}>
        {inner}
      </Pressable>
    );
  }

  return <View className={`w-[48%] ${cardClass}`}>{inner}</View>;
}

function RevenueCard({ value }: { value: number }) {
  return (
    <View
      className="items-center gap-1 rounded-xl p-4 shadow-md"
      style={{ backgroundColor: Colors.textPrimary }}
    >
      <Feather name="dollar-sign" size={24} color="rgba(255,255,255,0.7)" />
      <Text className="text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>
        Продвижений за месяц
      </Text>
      <Text className="text-[28px] font-bold text-white">{value}</Text>
      <View className="mt-1 flex-row items-center gap-1">
        <Feather name="trending-up" size={14} color="rgba(255,255,255,0.8)" />
        <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          +12% к прошлому месяцу
        </Text>
      </View>
    </View>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  const bars = [40, 65, 45, 80, 55, 70, 90];
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <View className="gap-3 rounded-xl border border-borderLight bg-white p-4 shadow-sm">
      <Text className="text-base font-semibold text-textPrimary">{title}</Text>
      <View className="gap-2">
        <View className="h-[100px] flex-row items-end gap-2">
          {bars.map((h, i) => (
            <View
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: h,
                backgroundColor: i === 6 ? Colors.brandPrimary : Colors.bgSecondary,
              }}
            />
          ))}
        </View>
        <View className="flex-row gap-2">
          {days.map((d) => (
            <Text key={d} className="flex-1 text-center text-xs text-textMuted">
              {d}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function NavItem({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-4 shadow-sm"
    >
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.brandPrimary + '15' }}
      >
        <Feather name={icon as any} size={16} color={Colors.brandPrimary} />
      </View>
      <Text className="flex-1 text-base font-medium text-textPrimary">{label}</Text>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function SkeletonBlock({ width, height }: { width: string | number; height: number }) {
  return (
    <View
      className="rounded-lg opacity-70"
      style={{ width: width as any, height, backgroundColor: Colors.bgSurface }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats(true);
  };

  const navItems = [
    { label: 'Пользователи', route: '/(admin)/users' as const, icon: 'users' },
    { label: 'Модерация', route: '/(admin)/moderation' as const, icon: 'shield' },
    { label: 'Продвижения', route: '/(admin)/promotions' as const, icon: 'trending-up' },
    { label: 'Запросы', route: '/(admin)/requests' as const, icon: 'file-text' },
    { label: 'Отзывы', route: '/(admin)/reviews' as const, icon: 'star' },
    { label: 'Категории услуг', route: '/(admin)/categories' as const, icon: 'grid' },
    { label: 'Жалобы', route: '/(admin)/complaints' as const, icon: 'alert-triangle' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bgPrimary">
      <Header title="Админ-панель" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        <View className="w-full max-w-screen-sm gap-4 px-5">
          {/* Page header */}
          <View className="gap-1">
            <Text className="text-xl font-bold text-textPrimary">
              Панель администратора
            </Text>
            <Text className="text-sm text-textMuted">Обзор за сегодня</Text>
          </View>

          {loading ? (
            /* Loading skeleton */
            <View className="gap-4">
              <View className="flex-row flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    className="w-[48%] items-center gap-2 rounded-xl border border-borderLight bg-white p-3"
                  >
                    <SkeletonBlock width={36} height={36} />
                    <SkeletonBlock width={56} height={12} />
                    <SkeletonBlock width={40} height={22} />
                  </View>
                ))}
              </View>
              <SkeletonBlock width="100%" height={80} />
              <SkeletonBlock width="100%" height={160} />
              <View className="items-center pt-3">
                <ActivityIndicator size="small" color={Colors.brandPrimary} />
                <Text className="mt-2 text-xs text-textMuted">
                  Загрузка статистики...
                </Text>
              </View>
            </View>
          ) : error ? (
            <Text className="py-4 text-center text-sm text-statusError">{error}</Text>
          ) : stats ? (
            <View className="gap-4">
              {/* Stats grid */}
              <View className="flex-row flex-wrap gap-2">
                <StatCard
                  icon="users"
                  label="Всего пользователей"
                  value={stats.totalUsers}
                  color={Colors.textPrimary}
                  onPress={() => router.push('/(admin)/users')}
                />
                <StatCard
                  icon="briefcase"
                  label="Специалистов"
                  value={stats.totalSpecialists}
                  color={Colors.brandPrimary}
                  onPress={() => router.push('/(admin)/moderation')}
                />
                {stats.totalRequests !== undefined && (
                  <StatCard
                    icon="file-text"
                    label="Всего заявок"
                    value={stats.totalRequests}
                    color={Colors.textPrimary}
                    onPress={() => router.push('/(admin)/requests')}
                  />
                )}
                <StatCard
                  icon="trending-up"
                  label="Активных продвижений"
                  value={stats.activePromotions}
                  color={Colors.statusSuccess}
                  onPress={() => router.push('/(admin)/promotions')}
                />
                {stats.pendingComplaints !== undefined && (
                  <StatCard
                    icon="clock"
                    label="Жалоб (новые)"
                    value={stats.pendingComplaints}
                    color={Colors.statusWarning}
                    onPress={() => router.push('/(admin)/complaints')}
                  />
                )}
                <StatCard
                  icon="star"
                  label="Средний рейтинг"
                  value="—"
                  color={Colors.brandPrimary}
                />
              </View>

              {/* Revenue banner */}
              <RevenueCard value={stats.revenueThisMonth} />

              {/* Chart placeholders */}
              <ChartPlaceholder title="Регистрации за неделю" />
              <ChartPlaceholder title="Заявки за неделю" />
            </View>
          ) : null}

          {/* Navigation sections */}
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-textPrimary">Разделы</Text>
              <View className="h-[22px] min-w-[22px] items-center justify-center rounded-full bg-brandPrimary px-1">
                <Text className="text-xs font-bold text-white">
                  {navItems.length}
                </Text>
              </View>
            </View>
            {navItems.map((item) => (
              <NavItem
                key={item.route}
                icon={item.icon}
                label={item.label}
                onPress={() => router.push(item.route)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
