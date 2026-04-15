import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { Header } from '../../../components/Header';

export default function SpecialistRespondPage() {
  const [message, setMessage] = useState('Здравствуйте! Готов помочь с декларацией. Опыт — 8 лет, 200+ успешных деклараций.');

  return (
    <View className="flex-1 bg-white">
      <Header variant="back" backTitle="Написать по заявке" />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
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
            style={{ textAlignVertical: 'top', outlineStyle: 'none' } as any}
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
    </View>
  );
}
