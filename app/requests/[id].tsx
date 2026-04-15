import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

export default function PublicRequestDetailPage() {
  return (
    <View className="flex-1">
      <Header variant="back" backTitle="Заявка" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="gap-3 rounded-lg border border-border bg-bgCard p-4">
          <Text className="text-lg font-bold text-textPrimary">Заполнить декларацию 3-НДФЛ за 2025 год</Text>
          <Text className="text-sm text-textSecondary" style={{ lineHeight: 22 }}>
            Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета за покупку квартиры. Документы готовы.
          </Text>
          <View className="flex-row gap-2">
            <View className="rounded-full bg-bgSecondary px-2 py-1">
              <Text className="text-xs text-brandPrimary">Москва</Text>
            </View>
            <View className="rounded-full bg-bgSecondary px-2 py-1">
              <Text className="text-xs text-brandPrimary">Декларация 3-НДФЛ</Text>
            </View>
          </View>
          <View className="gap-2 border-t border-bgSecondary pt-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-textMuted">Бюджет</Text>
              <Text className="text-sm font-medium text-textPrimary">3 000 — 5 000 ₽</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-textMuted">Дата</Text>
              <Text className="text-sm font-medium text-textPrimary">08.04.2026</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-textMuted">Клиент</Text>
              <Text className="text-sm font-medium text-textPrimary">Елена В.</Text>
            </View>
          </View>
        </View>
        <Pressable className="h-12 items-center justify-center rounded-lg bg-brandPrimary">
          <Text className="text-base font-semibold text-white">Откликнуться</Text>
        </Pressable>
        <Text className="text-center text-xs text-textMuted">Для отклика необходимо войти как специалист</Text>
      </ScrollView>
    </View>
  );
}
