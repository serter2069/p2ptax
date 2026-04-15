import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-xl border border-borderLight bg-white p-3">
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: color + '15' }}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text className="text-lg font-bold" style={{ color }}>{value}</Text>
      <Text className="text-xs text-textMuted">{label}</Text>
    </View>
  );
}

const REQUESTS = [
  { id: '1', title: 'Заполнить декларацию 3-НДФЛ за 2025 год', city: 'Москва', fns: 'ФНС №46 по г. Москве', service: '3-НДФЛ', messageCount: 0, date: '12.04.2026' },
  { id: '2', title: 'Регистрация ИП — срочно', city: 'Новосибирск', fns: 'ФНС №12 по г. Новосибирску', service: 'Регистрация ИП', messageCount: 2, date: '11.04.2026' },
  { id: '3', title: 'Налоговый вычет за квартиру', city: 'Москва', fns: 'ФНС №15 по г. Москве', service: 'Налоговый вычет', messageCount: 1, date: '10.04.2026' },
];

function RequestCard({ r }: { r: typeof REQUESTS[0] }) {
  return (
    <View className="gap-2 rounded-xl border border-borderLight bg-white p-4">
      <Text className="text-base font-semibold text-textPrimary" numberOfLines={2}>{r.title}</Text>
      <View className="flex-row items-center gap-2">
        <Feather name="map-pin" size={12} color={Colors.textMuted} />
        <Text className="text-xs text-textMuted">{r.city} &middot; {r.fns}</Text>
        <Feather name="briefcase" size={12} color={Colors.textMuted} />
        <Text className="text-xs text-textMuted">{r.service}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-textMuted">{r.date}</Text>
        {r.messageCount > 0 && (
          <View className="flex-row items-center gap-1">
            <Feather name="message-circle" size={12} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary">{r.messageCount} сообщ.</Text>
          </View>
        )}
      </View>
      <Pressable className="mt-1 h-10 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary">
        <Feather name="send" size={14} color={Colors.white} />
        <Text className="text-sm font-semibold text-white">Написать по заявке</Text>
      </Pressable>
    </View>
  );
}

function PopulatedState() {
  const [tab, setTab] = useState<'new' | 'progress' | 'done'>('new');
  const tabs = [
    { key: 'new' as const, label: 'Новые (3)' },
    { key: 'progress' as const, label: 'В работе (1)' },
    { key: 'done' as const, label: 'Завершены (2)' },
  ];
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xl font-bold text-textPrimary">Добрый день, Алексей!</Text>
        <Text className="text-sm text-textMuted">Ваши заявки и сообщения</Text>
      </View>
      <View className="flex-row gap-2">
        <StatCard icon="send" label="Сообщения" value="5" color={Colors.brandPrimary} />
        <StatCard icon="star" label="Рейтинг" value="4.8" color={Colors.statusWarning} />
        <StatCard icon="dollar-sign" label="Заработок" value="32 500 ₽" color={Colors.statusSuccess} />
      </View>
      <View className="flex-row gap-2">
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className={`flex-1 h-9 items-center justify-center rounded-lg border ${tab === t.key ? 'border-brandPrimary bg-brandPrimary' : 'border-borderLight bg-white'}`}
          >
            <Text className={`text-sm font-medium ${tab === t.key ? 'text-white' : 'text-textMuted'}`}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {REQUESTS.map((r) => <RequestCard key={r.id} r={r} />)}
    </ScrollView>
  );
}

function EmptyState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-textPrimary">Добрый день, Алексей!</Text>
      <View className="flex-row gap-2">
        <StatCard icon="send" label="Сообщения" value="0" color={Colors.textMuted} />
        <StatCard icon="star" label="Рейтинг" value="—" color={Colors.textMuted} />
        <StatCard icon="dollar-sign" label="Заработок" value="0 ₽" color={Colors.textMuted} />
      </View>
      <View className="items-center gap-3 py-10">
        <View className="h-16 w-16 items-center justify-center rounded-full border border-borderLight bg-bgSecondary">
          <Feather name="inbox" size={32} color={Colors.brandPrimary} />
        </View>
        <Text className="text-lg font-semibold text-textPrimary">Новых заявок пока нет</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">
          Настройте фильтры или расширьте зону обслуживания, чтобы видеть больше заявок
        </Text>
        <Pressable className="mt-2 h-11 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6">
          <Feather name="search" size={16} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Посмотреть заявки</Text>
        </Pressable>
      </View>
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
        <Text className="max-w-[280px] text-center text-sm text-textMuted">
          Не удалось загрузить данные. Проверьте подключение и попробуйте снова.
        </Text>
        <Pressable className="mt-2 h-10 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6">
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Повторить</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function LoadingState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="h-6 w-3/5 rounded-md bg-bgSecondary" />
      <View className="h-4 w-2/5 rounded-md bg-bgSecondary" />
      <View className="flex-row gap-2">
        {[0, 1, 2].map((i) => <View key={i} className="flex-1 h-20 rounded-xl bg-bgSecondary" />)}
      </View>
      {[0, 1, 2].map((i) => <View key={i} className="h-36 w-full rounded-xl bg-bgSecondary" />)}
    </ScrollView>
  );
}

export function SpecialistDashboardStates() {
  return (
    <>
      <StateSection title="populated"><PopulatedState /></StateSection>
      <StateSection title="empty"><EmptyState /></StateSection>
      <StateSection title="loading"><LoadingState /></StateSection>
      <StateSection title="error"><ErrorState /></StateSection>
    </>
  );
}
