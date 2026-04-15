import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { MOCK_REQUESTS } from '../../constants/protoMockData';
import { AppHeader } from '../../components/AppHeader';
import { BottomNav } from '../../components/BottomNav';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'Новая', color: Colors.brandPrimary, bg: Colors.statusBg.info },
  ACTIVE: { label: 'Активная', color: Colors.statusSuccess, bg: Colors.statusBg.success },
  IN_PROGRESS: { label: 'В работе', color: Colors.statusWarning, bg: Colors.statusBg.warning },
  COMPLETED: { label: 'Завершена', color: Colors.textMuted, bg: Colors.statusBg.neutral },
  CANCELLED: { label: 'Отменена', color: Colors.statusError, bg: Colors.statusBg.error },
};

export default function RequestsPage() {
  const [tab, setTab] = useState<'active' | 'completed' | 'all'>('active');
  const activeRequests = MOCK_REQUESTS.filter((r) => ['NEW', 'ACTIVE', 'IN_PROGRESS'].includes(r.status));
  const completedRequests = MOCK_REQUESTS.filter((r) => ['COMPLETED', 'CANCELLED'].includes(r.status));
  const allRequests = MOCK_REQUESTS;
  const visibleRequests = tab === 'active' ? activeRequests : tab === 'completed' ? completedRequests : allRequests;

  return (
    <View className="flex-1 bg-white">
      <AppHeader hasNotif />
      <View className="flex-1 p-4 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-textPrimary">Мои заявки</Text>
          <Pressable className="flex-row items-center gap-1 rounded-lg bg-brandPrimary px-3 py-2">
            <Feather name="plus" size={16} color={Colors.white} />
            <Text className="text-sm font-semibold text-white">Новая</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-1">
          {([
            { key: 'active' as const, label: `Активные (${activeRequests.length})` },
            { key: 'completed' as const, label: `Завершённые (${completedRequests.length})` },
            { key: 'all' as const, label: `Все (${allRequests.length})` },
          ] as const).map((t) => (
            <Pressable key={t.key} onPress={() => setTab(t.key)} className={`flex-1 h-10 items-center justify-center rounded-lg border ${tab === t.key ? 'border-brandPrimary bg-brandPrimary' : 'border-borderLight bg-white'}`}>
              <Text className={`text-xs font-medium ${tab === t.key ? 'font-semibold text-white' : 'text-textMuted'}`}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        {visibleRequests.map((r) => {
          const st = STATUS_MAP[r.status] || STATUS_MAP.NEW;
          return (
            <Pressable key={r.id} className="gap-2 rounded-xl border border-borderLight bg-white p-4">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>{r.title}</Text>
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: st.bg }}>
                  <Text className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <Feather name="briefcase" size={12} color={Colors.textMuted} />
                <Text className="text-xs text-textMuted">{r.service}</Text>
                <Feather name="map-pin" size={12} color={Colors.textMuted} />
                <Text className="text-xs text-textMuted">{r.city}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <Feather name="calendar" size={12} color={Colors.textMuted} />
                  <Text className="text-xs text-textMuted">{r.createdAt}</Text>
                </View>
                {r.messageCount > 0 && (
                  <View className="flex-row items-center gap-1">
                    <Feather name="message-circle" size={12} color={Colors.brandPrimary} />
                    <Text className="text-xs font-medium text-brandPrimary">{r.messageCount} сообщ.</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      <BottomNav activeId="requests" variant="client" />
    </View>
  );
}
