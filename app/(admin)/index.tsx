import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { MOCK_ADMIN_STATS } from '../../constants/protoMockData';

function StatCard({ label, value, color, trend }: { label: string; value: string | number; color: string; trend?: string }) {
  return (
    <View
      className="rounded-lg border border-border bg-bgCard p-3"
      style={{ width: '48%', gap: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
    >
      <Text className="text-xs text-textMuted">{label}</Text>
      <Text className="font-bold" style={{ fontSize: 22, color }}>{value}</Text>
      {trend && <Text className="text-xs text-statusSuccess">{trend}</Text>}
    </View>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <View className="gap-3 rounded-lg border border-border bg-bgCard p-4">
      <Text className="text-sm font-semibold text-textPrimary">{title}</Text>
      <View className="gap-2">
        <View className="flex-row items-end gap-2" style={{ height: 100 }}>
          {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
            <View
              key={i}
              className="flex-1 rounded"
              style={{ height: h, backgroundColor: i === 6 ? Colors.brandPrimary : Colors.bgSecondary }}
            />
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
  return (
    <View className="flex-1">
      <Header variant="auth" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-xl font-bold text-textPrimary">Панель администратора</Text>

        <View className="flex-row flex-wrap gap-2">
          <StatCard label="Всего пользователей" value={st.totalUsers} color={Colors.textPrimary} trend="+23 сегодня" />
          <StatCard label="Специалистов" value={st.totalSpecialists} color={Colors.brandPrimary} />
          <StatCard label="Всего заявок" value={st.totalRequests} color={Colors.textPrimary} trend="+15 сегодня" />
          <StatCard label="Активные заявки" value={st.activeRequests} color={Colors.statusSuccess} />
          <StatCard label="На модерации" value={st.pendingModeration} color={Colors.statusWarning} />
          <StatCard label="Средний рейтинг" value={st.avgRating} color={Colors.brandPrimary} />
        </View>

        <View className="items-center gap-1 rounded-lg bg-textPrimary p-4">
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Общий доход</Text>
          <Text className="font-bold text-white" style={{ fontSize: 28 }}>{st.revenue}</Text>
        </View>

        <Image source={{ uri: 'https://picsum.photos/seed/admin-promo/600/80' }} style={{ width: '100%', height: 80, borderRadius: 10 }} resizeMode="cover" />

        <ChartPlaceholder title="Регистрации за неделю" />
        <ChartPlaceholder title="Заявки за неделю" />

        <View className="gap-3">
          <Text className="text-base font-semibold text-textPrimary">Последние действия</Text>
          {[
            { action: 'Регистрация', detail: 'Новый пользователь: Сергей К.', time: '5 мин назад' },
            { action: 'Заявка', detail: 'Новая заявка: Декларация 3-НДФЛ', time: '12 мин назад' },
            { action: 'Модерация', detail: 'Специалист ожидает проверки', time: '30 мин назад' },
            { action: 'Отзыв', detail: 'Новый отзыв от Елены В.', time: '1 час назад' },
          ].map((item, i) => (
            <View key={i} className="flex-row gap-3" style={{ alignItems: 'flex-start' }}>
              <View className="mt-1.5 h-2 w-2 rounded-full bg-brandPrimary" />
              <View className="flex-1" style={{ gap: 1 }}>
                <Text className="text-sm text-textPrimary">
                  <Text className="font-semibold">{item.action}: </Text>
                  <Text className="text-textSecondary">{item.detail}</Text>
                </Text>
                <Text className="text-xs text-textMuted">{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
