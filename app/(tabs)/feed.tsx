import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { MOCK_CITIES, MOCK_FNS } from '../../constants/protoMockData';
import { AppHeader } from '../../components/AppHeader';
import { BottomNav } from '../../components/BottomNav';

const MOCK_REQUESTS = [
  { id: 1, title: 'Выездная проверка ООО «Ромашка»', description: 'Назначена выездная налоговая проверка.', city: 'Москва', fns: 'ФНС №15 по г. Москве', service: 'Выездная проверка', date: '12.04.2026', author: 'Елена В.', memberSince: 2024, messageCount: 3 },
  { id: 2, title: 'Камеральная проверка декларации', description: 'Получил требование при камеральной проверке.', city: 'Москва', fns: 'ФНС №46 по г. Москве', service: 'Камеральная проверка', date: '11.04.2026', author: 'Дмитрий К.', memberSince: 2023, messageCount: 5 },
  { id: 3, title: 'Оперативный контроль — помощь', description: 'Пришло уведомление от отдела оперативного контроля.', city: 'Санкт-Петербург', fns: 'ФНС №1 по г. Санкт-Петербургу', service: 'Отдел оперативного контроля', date: '10.04.2026', author: 'Татьяна Ф.', memberSince: 2022, messageCount: 1 },
  { id: 4, title: 'Не знаю какая услуга — нужна помощь', description: 'Получил письмо от налоговой, не понимаю что делать.', city: 'Казань', fns: 'ФНС №3 по г. Казани', service: 'Не знаю', date: '09.04.2026', author: 'Иван М.', memberSince: 2025, messageCount: 0 },
];

export default function FeedPage() {
  const [filterCity, setFilterCity] = useState('');
  const [selectedFns, setSelectedFns] = useState<string[]>([]);

  const requests = MOCK_REQUESTS.filter((r) => {
    if (filterCity && r.city !== filterCity) return false;
    if (selectedFns.length > 0 && !selectedFns.includes(r.fns)) return false;
    return true;
  });

  return (
    <View className="flex-1 bg-white">
      <AppHeader hasNotif initials="АП" />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View>
          <Text className="text-xl font-bold text-textPrimary">Заявки</Text>
          <Text className="mt-0.5 text-sm text-textMuted">{requests.length} активных заявок</Text>
        </View>

        {requests.map((r) => (
          <Pressable key={r.id} className="gap-2 rounded-xl border border-borderLight bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={1}>{r.title}</Text>
              <Feather name="chevron-right" size={16} color={Colors.textMuted} />
            </View>
            <Text className="text-sm leading-5 text-textSecondary" numberOfLines={2}>{r.description}</Text>
            <View className="flex-row flex-wrap gap-2">
              <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
                <Feather name="map-pin" size={11} color={Colors.brandPrimary} />
                <Text className="text-xs font-medium text-brandPrimary">{r.city}</Text>
              </View>
              <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-0.5">
                <Feather name="briefcase" size={11} color={Colors.brandPrimary} />
                <Text className="text-xs font-medium text-brandPrimary">{r.service}</Text>
              </View>
            </View>
            <View className="mt-1 flex-row items-center justify-between border-t border-borderLight pt-2">
              <View className="flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-bgSecondary">
                  <Feather name="user" size={14} color={Colors.textMuted} />
                </View>
                <Text className="text-sm font-medium text-textPrimary">{r.author}</Text>
              </View>
              <Text className="text-xs text-textMuted">{r.date}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <BottomNav activeId="dashboard" variant="specialist" />
    </View>
  );
}
