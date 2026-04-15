import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { MOCK_ADMIN_STATS } from '../../constants/protoMockData';

function StatCard({ label, value, color, trend, icon }: { label: string; value: string | number; color: string; trend?: string; icon: string }) {
  return (
    <View className="w-[48%] gap-1 rounded-xl border border-borderLight bg-white p-3 shadow-sm">
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: color + '15' }}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text className="text-sm text-textMuted">{label}</Text>
      <Text className="text-[22px] font-bold" style={{ color }}>{value}</Text>
      {trend && (
        <View className="flex-row items-center gap-1">
          <Feather name="trending-up" size={12} color={Colors.statusSuccess} />
          <Text className="text-xs text-statusSuccess">{trend}</Text>
        </View>
      )}
    </View>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <View className="gap-3 rounded-xl border border-borderLight bg-white p-4 shadow-sm">
      <Text className="text-base font-semibold text-textPrimary">{title}</Text>
      <View className="gap-2">
        <View className="h-[100px] flex-row items-end gap-2">
          {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
            <View key={i} className={`flex-1 rounded-sm ${i === 6 ? 'bg-brandPrimary' : 'bg-bgSecondary'}`} style={{ height: h }} />
          ))}
        </View>
        <View className="flex-row gap-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
            <Text key={d} className="flex-1 text-center text-xs text-textMuted">{d}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function AdminDashboardPage() {
  const st = MOCK_ADMIN_STATS;

  const activities = [
    { icon: 'user-plus', action: 'Регистрация', detail: 'Новый пользователь: Сергей К.', time: '5 мин назад' },
    { icon: 'file-text', action: 'Заявка', detail: 'Новая заявка: Декларация 3-НДФЛ', time: '12 мин назад' },
    { icon: 'shield', action: 'Модерация', detail: 'Специалист ожидает проверки', time: '30 мин назад' },
    { icon: 'star', action: 'Отзыв', detail: 'Новый отзыв от Елены В.', time: '1 час назад' },
    { icon: 'alert-triangle', action: 'Жалоба', detail: 'Жалоба на специалиста Козлова Д.', time: '2 часа назад' },
  ];

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="gap-1">
        <Text className="text-xl font-bold text-textPrimary">Панель администратора</Text>
        <Text className="text-sm text-textMuted">Обзор за сегодня</Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <StatCard label="Всего пользователей" value={st.totalUsers} color={Colors.textPrimary} trend="+23 сегодня" icon="users" />
        <StatCard label="Специалистов" value={st.totalSpecialists} color={Colors.brandPrimary} icon="briefcase" />
        <StatCard label="Всего заявок" value={st.totalRequests} color={Colors.textPrimary} trend="+15 сегодня" icon="file-text" />
        <StatCard label="Активные заявки" value={st.activeRequests} color={Colors.statusSuccess} icon="check-circle" />
        <StatCard label="На модерации" value={st.pendingModeration} color={Colors.statusWarning} icon="clock" />
        <StatCard label="Средний рейтинг" value={st.avgRating} color={Colors.brandPrimary} icon="star" />
      </View>

      <View className="items-center gap-1 rounded-xl bg-textPrimary p-4 shadow-md">
        <Feather name="dollar-sign" size={24} color="rgba(255,255,255,0.7)" />
        <Text className="text-base text-white/70">Общий доход</Text>
        <Text className="text-[28px] font-bold text-white">{st.revenue}</Text>
        <View className="mt-1 flex-row items-center gap-1">
          <Feather name="trending-up" size={14} color="rgba(255,255,255,0.8)" />
          <Text className="text-xs text-white/60">+12% к прошлому месяцу</Text>
        </View>
      </View>

      <ChartPlaceholder title="Регистрации за неделю" />
      <ChartPlaceholder title="Заявки за неделю" />

      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-semibold text-textPrimary">Последние действия</Text>
          <View className="h-[22px] min-w-[22px] items-center justify-center rounded-full bg-brandPrimary px-1">
            <Text className="text-xs font-bold text-white">{activities.length}</Text>
          </View>
        </View>
        {activities.map((item, i) => (
          <View key={i} className="flex-row items-center gap-3 border-b border-bgSecondary py-2">
            <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: Colors.brandPrimary + '15' }}>
              <Feather name={item.icon as any} size={16} color={Colors.brandPrimary} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold text-textPrimary">
                {item.action}: <Text className="font-normal text-textSecondary">{item.detail}</Text>
              </Text>
              <Text className="text-sm text-textMuted">{item.time}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.textMuted} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
