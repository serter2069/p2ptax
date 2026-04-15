import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { MOCK_REQUESTS } from '../../constants/protoMockData';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess },
  IN_PROGRESS: { label: 'В работе', color: Colors.statusWarning },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted },
  CANCELLED: { label: 'Отменена', color: Colors.statusError },
};

function RequestCard({ title, service, city, status, date, responses }: {
  title: string; service: string; city: string; status: string; date: string; responses: number;
}) {
  const st = STATUS_MAP[status] || STATUS_MAP.NEW;
  return (
    <View className="gap-2 rounded-lg border border-border bg-bgCard p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>{title}</Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: st.color + '20' }}>
          <Text className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-1">
        <Text className="text-xs text-textMuted">{service}</Text>
        <Text className="text-xs text-border">{'·'}</Text>
        <Text className="text-xs text-textMuted">{city}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-textMuted">{date}</Text>
        {responses > 0 && <Text className="text-xs font-medium text-statusSuccess">{responses} откликов</Text>}
      </View>
    </View>
  );
}

export default function MyRequestsPage() {
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const activeRequests = MOCK_REQUESTS.filter((r) => ['NEW', 'ACTIVE', 'IN_PROGRESS'].includes(r.status));
  const completedRequests = MOCK_REQUESTS.filter((r) => ['COMPLETED', 'CANCELLED'].includes(r.status));
  const visibleRequests = tab === 'active' ? activeRequests : completedRequests;

  return (
    <View className="flex-1">
      <Header variant="auth" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-textPrimary">Мои заявки</Text>
          <Pressable className="rounded-lg bg-brandPrimary px-3 py-2">
            <Text className="text-sm font-semibold text-white">+ Новая</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setTab('active')}
            className={`h-10 flex-1 items-center justify-center rounded-lg border ${tab === 'active' ? 'border-brandPrimary bg-brandPrimary' : 'border-border bg-bgCard'}`}
          >
            <Text className={`text-sm font-medium ${tab === 'active' ? 'font-semibold text-white' : 'text-textMuted'}`}>
              Активные ({activeRequests.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('completed')}
            className={`h-10 flex-1 items-center justify-center rounded-lg border ${tab === 'completed' ? 'border-brandPrimary bg-brandPrimary' : 'border-border bg-bgCard'}`}
          >
            <Text className={`text-sm font-medium ${tab === 'completed' ? 'font-semibold text-white' : 'text-textMuted'}`}>
              Завершённые ({completedRequests.length})
            </Text>
          </Pressable>
        </View>
        {visibleRequests.length === 0 ? (
          <View className="items-center gap-2 p-8">
            <Text className="text-lg font-semibold text-textPrimary">Нет заявок</Text>
            <Text className="text-center text-sm text-textMuted">В этой категории пока нет заявок</Text>
          </View>
        ) : (
          visibleRequests.map((r) => (
            <RequestCard
              key={r.id} title={r.title} service={r.service}
              city={r.city} status={r.status} date={r.createdAt} responses={r.responseCount}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
