import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { AppHeader } from '../../components/AppHeader';
import { BottomNav } from '../../components/BottomNav';

const REQUESTS = [
  { id: '1', title: 'Выездная проверка ООО «Ромашка»', description: 'Назначена выездная налоговая проверка за 2023–2025 годы.', city: 'Москва', fns: 'ФНС №46 по г. Москве', service: 'Выездная проверка', date: '12.04.2026', author: 'Елена В.' },
  { id: '2', title: 'Отдел оперативного контроля — требование', description: 'Получили требование от отдела оперативного контроля.', city: 'Новосибирск', fns: 'ФНС №12 по г. Новосибирску', service: 'Отдел оперативного контроля', date: '11.04.2026', author: 'Дмитрий К.' },
  { id: '3', title: 'Камеральная проверка декларации по НДС', description: 'Получили требование о предоставлении документов.', city: 'Москва', fns: 'ФНС №15 по г. Москве', service: 'Камеральная проверка', date: '10.04.2026', author: 'Татьяна Ф.' },
];

export default function SpecialistDashboardPage() {
  const [search, setSearch] = useState('');
  const filtered = search
    ? REQUESTS.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()) || r.service.toLowerCase().includes(search.toLowerCase()))
    : REQUESTS;

  return (
    <View className="flex-1 bg-white">
      <AppHeader hasNotif initials="АП" />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View>
          <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
          <Text className="text-sm text-textMuted">{REQUESTS.length} заявок в вашем регионе</Text>
        </View>

        <View className="flex-row items-center gap-2 rounded-xl border border-borderLight bg-white px-3">
          <Feather name="search" size={18} color={Colors.textMuted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Поиск по заявкам..." placeholderTextColor={Colors.textMuted} className="h-11 flex-1 text-base text-textPrimary" style={{ outlineStyle: 'none' } as any} />
          {search ? <Pressable onPress={() => setSearch('')}><Feather name="x" size={18} color={Colors.textMuted} /></Pressable> : null}
        </View>

        {filtered.map((r) => (
          <View key={r.id} className="gap-2 rounded-xl border border-borderLight bg-white p-4">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>{r.title}</Text>
              <Text className="text-xs text-textMuted">{r.date}</Text>
            </View>
            <Text className="text-sm leading-5 text-textSecondary" numberOfLines={2}>{r.description}</Text>
            <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <View className="flex-row items-center gap-1"><Feather name="map-pin" size={12} color={Colors.textMuted} /><Text className="text-xs text-textMuted">{r.city}</Text></View>
              <View className="flex-row items-center gap-1"><Feather name="briefcase" size={12} color={Colors.textMuted} /><Text className="text-xs text-textMuted">{r.service}</Text></View>
            </View>
            <View className="mt-1 flex-row gap-2">
              <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary">
                <Feather name="send" size={14} color={Colors.white} />
                <Text className="text-sm font-semibold text-white">Написать по заявке</Text>
              </Pressable>
              <Pressable className="h-10 flex-row items-center justify-center gap-1.5 rounded-lg border border-borderLight px-4">
                <Feather name="eye" size={14} color={Colors.textPrimary} />
                <Text className="text-sm font-medium text-textPrimary">Подробнее</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <BottomNav activeId="dashboard" variant="specialist" />
    </View>
  );
}
