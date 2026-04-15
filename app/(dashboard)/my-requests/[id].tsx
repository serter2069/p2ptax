import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { BackHeader } from '../../../components/AppHeader';

export default function RequestDetailPage() {
  return (
    <View className="flex-1 bg-white">
      <BackHeader title="Заявка" />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="gap-4 rounded-xl border border-borderLight bg-white p-4">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-lg font-bold text-textPrimary">Камеральная проверка декларации по НДС</Text>
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: Colors.statusSuccess + '18' }}>
              <Text className="text-xs font-semibold" style={{ color: Colors.statusSuccess }}>Активная</Text>
            </View>
          </View>
          <Text className="text-base leading-6 text-textSecondary">Получили требование о предоставлении документов при камеральной проверке декларации по НДС. Нужна помощь.</Text>
          <View className="gap-2">
            <View className="flex-row items-center gap-2"><Feather name="map-pin" size={14} color={Colors.textMuted} /><Text className="text-sm text-textMuted">Москва</Text></View>
            <View className="flex-row items-center gap-2"><Feather name="home" size={14} color={Colors.textMuted} /><Text className="text-sm text-textMuted">ФНС №46 по г. Москве</Text></View>
            <View className="flex-row items-center gap-2"><Feather name="briefcase" size={14} color={Colors.textMuted} /><Text className="text-sm text-textMuted">Камеральная проверка</Text></View>
            <View className="flex-row items-center gap-2"><Feather name="calendar" size={14} color={Colors.textMuted} /><Text className="text-sm text-textMuted">08.04.2026</Text></View>
          </View>
          <View className="flex-row gap-2">
            <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-brandPrimary">
              <Feather name="edit-2" size={14} color={Colors.brandPrimary} />
              <Text className="text-sm font-medium text-brandPrimary">Редактировать</Text>
            </Pressable>
            <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-statusError">
              <Feather name="x-circle" size={14} color={Colors.statusError} />
              <Text className="text-sm font-medium text-statusError">Закрыть</Text>
            </Pressable>
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-base font-semibold text-textPrimary">Сообщения (2)</Text>
          <Pressable className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3">
            <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
              <Text className="text-sm font-bold text-brandPrimary">АП</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-textPrimary">Алексей Петров</Text>
                <Text className="text-xs text-textMuted">14:32</Text>
              </View>
              <Text className="text-xs text-textMuted" numberOfLines={1}>Готов помочь с камеральной проверкой.</Text>
            </View>
            <View className="h-2.5 w-2.5 rounded-full bg-brandPrimary" />
          </Pressable>
          <Pressable className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3">
            <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
              <Text className="text-sm font-bold text-brandPrimary">ОС</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-textPrimary">Ольга Смирнова</Text>
                <Text className="text-xs text-textMuted">вчера</Text>
              </View>
              <Text className="text-xs text-textMuted" numberOfLines={1}>Специализируюсь на сопровождении проверок.</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
