import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';

type FilterKey = 'all' | 'active' | 'deactivated';
type Status = 'sent' | 'viewed' | 'accepted' | 'deactivated';

const STATUS_CFG: Record<Status, { label: string; bg: string; fg: string; icon: string }> = {
  sent: { label: 'Отправлен', bg: Colors.statusBg.info, fg: Colors.brandPrimary, icon: 'send' },
  viewed: { label: 'Просмотрен', bg: Colors.statusBg.warning, fg: Colors.statusWarning, icon: 'eye' },
  accepted: { label: 'Принят', bg: Colors.statusBg.success, fg: Colors.statusSuccess, icon: 'check-circle' },
  deactivated: { label: 'Отклонён', bg: Colors.statusBg.error, fg: Colors.statusError, icon: 'x-circle' },
};

const RESPONSES = [
  { id: '1', title: 'Декларация 3-НДФЛ за 2025', city: 'Москва', service: 'Камеральная', status: 'accepted' as Status, date: '10.04.2026' },
  { id: '2', title: 'Регистрация ИП', city: 'Новосибирск', service: 'Выездная', status: 'sent' as Status, date: '11.04.2026' },
  { id: '3', title: 'Оптимизация налогов ООО', city: 'Москва', service: 'Оперативный контроль', status: 'viewed' as Status, date: '09.04.2026' },
  { id: '4', title: 'Налоговый вычет за квартиру', city: 'Москва', service: 'Камеральная', status: 'deactivated' as Status, date: '05.04.2026' },
];

function StatusBadge({ status }: { status: Status }) {
  const c = STATUS_CFG[status];
  return (
    <View className="flex-row items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: c.bg }}>
      <Feather name={c.icon as any} size={12} color={c.fg} />
      <Text className="text-xs font-medium" style={{ color: c.fg }}>{c.label}</Text>
    </View>
  );
}

function ResponseCard({ r }: { r: typeof RESPONSES[0] }) {
  return (
    <View className="gap-2 rounded-xl border border-borderLight bg-white p-4">
      <Text className="text-base font-semibold text-textPrimary" numberOfLines={2}>{r.title}</Text>
      <View className="flex-row items-center gap-2">
        <Feather name="map-pin" size={12} color={Colors.textMuted} />
        <Text className="text-xs text-textMuted">{r.city}</Text>
        <Feather name="briefcase" size={12} color={Colors.textMuted} />
        <Text className="text-xs text-textMuted">{r.service}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <StatusBadge status={r.status} />
      </View>
      <Text className="text-xs text-textMuted">Написано: {r.date}</Text>
      {r.status === 'accepted' && (
        <Pressable className="mt-1 h-9 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary">
          <Feather name="message-circle" size={14} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Перейти в чат</Text>
        </Pressable>
      )}
    </View>
  );
}

function PopulatedState() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Все' }, { key: 'active', label: 'Активные' }, { key: 'deactivated', label: 'Деактивированные' },
  ];
  const filtered = RESPONSES.filter((r) => {
    if (filter === 'active') return r.status !== 'deactivated';
    if (filter === 'deactivated') return r.status === 'deactivated';
    return true;
  });
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="flex-row items-center gap-2">
        <Feather name="mail" size={20} color={Colors.brandPrimary} />
        <Text className="text-xl font-bold text-textPrimary">Мои сообщения</Text>
      </View>
      <View className="flex-row gap-2">
        {filters.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            className={`h-9 items-center justify-center rounded-full border px-4 ${filter === f.key ? 'border-brandPrimary bg-brandPrimary' : 'border-borderLight bg-white'}`}
          >
            <Text className={`text-sm font-medium ${filter === f.key ? 'text-white' : 'text-textMuted'}`}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      {filtered.map((r) => <ResponseCard key={r.id} r={r} />)}
    </ScrollView>
  );
}

function EmptyState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="flex-row items-center gap-2">
        <Feather name="mail" size={20} color={Colors.brandPrimary} />
        <Text className="text-xl font-bold text-textPrimary">Мои сообщения</Text>
      </View>
      <View className="items-center gap-3 py-10">
        <View className="h-16 w-16 items-center justify-center rounded-full border border-borderLight bg-bgSecondary">
          <Feather name="send" size={32} color={Colors.brandPrimary} />
        </View>
        <Text className="text-lg font-semibold text-textPrimary">Вы ещё не писали клиентам</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">
          Найдите подходящие заявки и предложите свои услуги клиентам
        </Text>
        <Pressable className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6">
          <Feather name="search" size={16} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Просмотреть заявки</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function LoadingState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="h-6 w-2/5 rounded-md bg-bgSecondary" />
      <View className="flex-row gap-2">
        {[0, 1, 2].map((i) => <View key={i} className="h-9 w-20 rounded-full bg-bgSecondary" />)}
      </View>
      {[0, 1, 2].map((i) => <View key={i} className="h-32 w-full rounded-xl bg-bgSecondary" />)}
    </ScrollView>
  );
}

function ErrorState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="items-center gap-3 py-16">
        <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: Colors.statusBg.error }}>
          <Feather name="alert-circle" size={32} color={Colors.statusError} />
        </View>
        <Text className="text-lg font-semibold text-textPrimary">Ошибка загрузки</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">Не удалось загрузить сообщения. Попробуйте снова.</Text>
        <Pressable className="mt-2 h-10 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6">
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Повторить</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export function MyResponsesStates() {
  return (
    <>
      <StateSection title="populated"><PopulatedState /></StateSection>
      <StateSection title="empty"><EmptyState /></StateSection>
      <StateSection title="loading"><LoadingState /></StateSection>
      <StateSection title="error"><ErrorState /></StateSection>
    </>
  );
}
