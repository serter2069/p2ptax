import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

function ProfileScreen({ initialFilled, uploading }: {
  initialFilled?: boolean; uploading?: boolean;
}) {
  const [description, setDescription] = useState(initialFilled ? 'Налоговый консультант, 8 лет опыта. Специализация — НДФЛ, вычеты, ИП.' : '');
  const [phone, setPhone] = useState(initialFilled ? '+79001234567' : '');
  const [telegram, setTelegram] = useState(initialFilled ? '@elena_tax' : '');
  const [hasPhoto, setHasPhoto] = useState(!!initialFilled);
  const maxChars = 1000;

  return (
    <View className="flex-1 bg-white px-4 py-6">
      {/* Progress */}
      <View className="mb-1 h-1 rounded-full bg-bgSecondary">
        <View className="h-1 rounded-full bg-green-600" style={{ width: '100%' }} />
      </View>
      <Text className="mb-4 text-xs uppercase tracking-wider text-textMuted">Шаг 3 из 3</Text>

      <Text className="text-xl font-bold text-textPrimary">Расскажите о себе</Text>
      <Text className="mb-4 text-base text-textMuted">Эта информация поможет клиентам выбрать вас</Text>

      {/* Avatar */}
      <View className="mb-4 flex-row items-center gap-4">
        <View className={`h-16 w-16 items-center justify-center rounded-full ${hasPhoto ? 'bg-brandPrimary' : 'border-2 border-dashed border-gray-300 bg-bgSecondary'}`}>
          <Feather name="user" size={28} color={hasPhoto ? '#fff' : '#0284C7'} />
          {uploading && (
            <View className="absolute inset-0 items-center justify-center rounded-full bg-black/50">
              <Text className="text-xs font-bold text-white">45%</Text>
            </View>
          )}
        </View>
        <View>
          <Pressable className="flex-row items-center gap-1" onPress={() => setHasPhoto(true)}>
            <Feather name="camera" size={14} color="#0284C7" />
            <Text className="text-base font-medium text-brandPrimary">{hasPhoto ? 'Изменить фото' : 'Загрузить фото'}</Text>
          </Pressable>
          <Text className="text-xs text-textMuted">JPG или PNG, до 5 МБ</Text>
        </View>
      </View>

      {/* Description */}
      <View className="mb-3">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-textSecondary">О себе</Text>
          <Text className={`text-xs ${description.length > maxChars ? 'text-red-600' : 'text-textMuted'}`}>{description.length}/{maxChars}</Text>
        </View>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Расскажите о вашем опыте..."
          placeholderTextColor="#94A3B8"
          multiline
          className="rounded-lg border border-gray-200 p-3 text-base text-textPrimary"
          style={{ minHeight: 80, textAlignVertical: 'top', outlineStyle: 'none' as any }}
          maxLength={maxChars}
        />
      </View>

      {/* Phone */}
      <View className="mb-3">
        <Text className="mb-1 text-sm font-medium text-textSecondary">Телефон</Text>
        <View className="h-12 flex-row items-center gap-2 rounded-lg border border-gray-200 px-4">
          <Feather name="phone" size={16} color="#94A3B8" />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+7XXXXXXXXXX"
            placeholderTextColor="#94A3B8"
            className="flex-1 text-base text-textPrimary"
            style={{ outlineStyle: 'none' as any }}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Telegram */}
      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium text-textSecondary">Telegram</Text>
        <View className="h-12 flex-row items-center gap-2 rounded-lg border border-gray-200 px-4">
          <Feather name="send" size={16} color="#94A3B8" />
          <TextInput
            value={telegram}
            onChangeText={setTelegram}
            placeholder="@username"
            placeholderTextColor="#94A3B8"
            className="flex-1 text-base text-textPrimary"
            style={{ outlineStyle: 'none' as any }}
          />
        </View>
      </View>

      {/* Buttons */}
      <View className="flex-row gap-3">
        <Pressable className="h-12 flex-row items-center justify-center gap-1 rounded-lg border border-gray-200 px-4">
          <Feather name="arrow-left" size={16} color="#475569" />
          <Text className="text-base font-medium text-textSecondary">Назад</Text>
        </Pressable>
        <Pressable className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary">
          <Feather name="check" size={16} color="#fff" />
          <Text className="text-base font-semibold text-white">Завершить</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function OnboardingProfileStates() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="w-full max-w-lg self-center px-4 py-8">
        <Text className="mb-4 text-lg font-bold text-textPrimary">Screen: Onboarding Profile</Text>

        <Text className="mb-2 text-sm font-medium text-textMuted">IDLE</Text>
        <View className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 620 }}>
          <ProfileScreen />
        </View>

        <Text className="mb-2 text-sm font-medium text-textMuted">UPLOADING</Text>
        <View className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 620 }}>
          <ProfileScreen uploading />
        </View>

        <Text className="mb-2 text-sm font-medium text-textMuted">COMPLETE</Text>
        <View className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 620 }}>
          <ProfileScreen initialFilled />
        </View>
      </View>
    </ScrollView>
  );
}
