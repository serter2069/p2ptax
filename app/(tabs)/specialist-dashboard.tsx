import React, { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { MOCK_REQUESTS } from '../../constants/protoMockData';

function RequestCard({ title, city, service, date }: {
  title: string; city: string; service: string; date: string;
}) {
  return (
    <View className="gap-2 rounded-lg border border-border bg-bgCard p-4">
      <Text className="text-base font-semibold text-textPrimary" numberOfLines={2}>{title}</Text>
      <View className="flex-row items-center gap-1">
        <Text className="text-xs text-textMuted">{city}</Text>
        <Text className="text-xs text-border">{'·'}</Text>
        <Text className="text-xs text-textMuted">{service}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-textMuted">{date}</Text>
      </View>
      <Pressable className="mt-1 h-10 items-center justify-center rounded-lg bg-brandPrimary">
        <Text className="text-sm font-semibold text-white">Откликнуться</Text>
      </Pressable>
    </View>
  );
}

export default function SpecialistDashboardPage() {
  const [tab, setTab] = useState<'new' | 'inProgress' | 'completed'>('new');

  const newRequests = MOCK_REQUESTS.filter(r => r.status === 'NEW' || r.status === 'ACTIVE');
  const inProgressRequests = MOCK_REQUESTS.filter(r => r.status === 'IN_PROGRESS');
  const completedRequests = MOCK_REQUESTS.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');
  const visibleRequests = tab === 'new' ? newRequests : tab === 'inProgress' ? inProgressRequests : completedRequests;

  return (
    <View className="flex-1">
      <Header variant="auth" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text className="text-xl font-bold text-textPrimary">Добрый день, Алексей!</Text>
        <Image source={{ uri: 'https://picsum.photos/seed/spec-promo/800/176' }} style={{ width: '100%', height: 88, borderRadius: 10 }} resizeMode="cover" />
        <View className="flex-row gap-2">
          <Pressable onPress={() => setTab('new')} className="flex-1 items-center rounded-lg border border-border bg-bgCard p-3" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Text className="font-bold text-brandPrimary" style={{ fontSize: 22 }}>{newRequests.length}</Text>
            <Text className="text-xs text-textMuted" style={{ marginTop: 2 }}>Новые</Text>
          </Pressable>
          <Pressable onPress={() => setTab('inProgress')} className="flex-1 items-center rounded-lg border border-border bg-bgCard p-3" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Text className="font-bold text-statusWarning" style={{ fontSize: 22 }}>{inProgressRequests.length}</Text>
            <Text className="text-xs text-textMuted" style={{ marginTop: 2 }}>В работе</Text>
          </Pressable>
          <Pressable onPress={() => setTab('completed')} className="flex-1 items-center rounded-lg border border-border bg-bgCard p-3" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Text className="font-bold text-statusSuccess" style={{ fontSize: 22 }}>{completedRequests.length}</Text>
            <Text className="text-xs text-textMuted" style={{ marginTop: 2 }}>Завершены</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-2">
          {(['new', 'inProgress', 'completed'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`h-9 flex-1 items-center justify-center rounded-lg border ${tab === t ? 'border-brandPrimary bg-brandPrimary' : 'border-border bg-bgCard'}`}
            >
              <Text className={`text-xs font-medium ${tab === t ? 'font-semibold text-white' : 'text-textMuted'}`}>
                {t === 'new' ? 'Новые' : t === 'inProgress' ? 'В работе' : 'Завершены'}
              </Text>
            </Pressable>
          ))}
        </View>
        {visibleRequests.length === 0 ? (
          <View className="items-center gap-2 p-6">
            <Text className="text-base font-semibold text-textPrimary">Нет заявок в этой категории</Text>
          </View>
        ) : (
          visibleRequests.map((r) => (
            <RequestCard key={r.id} title={r.title} city={r.city} service={r.service} date={r.createdAt} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
