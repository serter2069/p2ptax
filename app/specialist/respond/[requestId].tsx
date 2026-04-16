import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { Header } from '../../../components/Header';

function IdleState() {
  const [message, setMessage] = useState('Здравствуйте! Готов помочь с декларацией. Опыт — 8 лет, 200+ успешных деклараций.');

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="gap-2 rounded-xl border border-borderLight bg-white p-4">
        <View className="self-start rounded-full bg-bgSecondary px-2 py-0.5">
          <Text className="text-xs font-medium text-textMuted">Заявка #1</Text>
        </View>
        <Text className="text-lg font-semibold text-textPrimary">Заполнить декларацию 3-НДФЛ за 2025 год</Text>
        <Text className="text-sm text-textSecondary" numberOfLines={2}>
          Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета за покупку квартиры.
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
            <Feather name="map-pin" size={12} color={Colors.textMuted} />
            <Text className="text-xs text-textMuted">Москва &middot; ИФНС №46</Text>
          </View>
          <View className="flex-row items-center gap-1 rounded-full bg-bgSecondary px-2 py-1">
            <Feather name="dollar-sign" size={12} color={Colors.textMuted} />
            <Text className="text-xs text-textMuted">3 000 — 5 000 ₽</Text>
          </View>
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-textSecondary">Сообщение клиенту</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="Напишите первое сообщение клиенту..."
          placeholderTextColor={Colors.textMuted}
          className="min-h-[100px] rounded-lg border border-borderLight bg-white p-3 text-base text-textPrimary"
          style={{ textAlignVertical: 'top', outlineStyle: 'none' as any }}
        />
        <Text className="self-end text-xs text-textMuted">{message.length}/500</Text>
      </View>

      <Pressable className="h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary">
        <Feather name="send" size={16} color={Colors.white} />
        <Text className="text-base font-semibold text-white">Написать по заявке</Text>
      </Pressable>
      <Pressable className="items-center py-2">
        <Text className="text-sm text-textMuted">Отмена</Text>
      </Pressable>
    </ScrollView>
  );
}

function LoadingState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="h-32 w-full rounded-xl bg-bgSecondary" />
      <View className="h-12 w-full rounded-lg bg-bgSecondary" />
      <View className="h-24 w-full rounded-lg bg-bgSecondary" />
      <View className="h-12 w-full rounded-lg bg-bgSecondary" />
      <View className="items-center pt-4">
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
        <Text className="mt-2 text-xs text-textMuted">Загрузка заявки...</Text>
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
        <Text className="text-lg font-semibold text-textPrimary">Не удалось отправить сообщение</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">
          Проверьте подключение и попробуйте снова.
        </Text>
        <Pressable className="mt-2 h-10 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary px-6">
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Попробовать снова</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function RespondScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Отклик" onBack={() => router.back()} />
      <IdleState />
    </View>
  );
}
