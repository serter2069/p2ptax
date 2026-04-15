import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function OnboardingProfilePage() {
  const [about, setAbout] = useState('');
  const [price, setPrice] = useState('');

  return (
    <View className="gap-4 p-6">
      <View className="h-1 rounded-sm bg-bgSecondary">
        <View className="h-1 rounded-sm bg-statusSuccess" style={{ width: '100%' }} />
      </View>
      <Text className="text-xs uppercase tracking-wide text-textMuted">Шаг 3 из 3</Text>
      <Text className="text-xl font-bold text-textPrimary">Расскажите о себе</Text>
      <Text className="text-sm text-textMuted">Информация поможет клиентам выбрать вас</Text>
      <View className="gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
            <Feather name="user" size={28} color={Colors.brandPrimary} />
          </View>
          <Pressable><Text className="text-sm font-medium text-brandPrimary">Загрузить фото</Text></Pressable>
        </View>
        <View className="gap-1">
          <Text className="text-sm font-medium text-textSecondary">О себе</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            placeholder="Расскажите о вашем опыте и специализации..."
            placeholderTextColor={Colors.textMuted}
            multiline
            className="rounded-lg border border-border bg-bgCard p-4 text-base text-textPrimary"
            style={{ minHeight: 96, textAlignVertical: 'top' }}
          />
        </View>
        <View className="gap-1">
          <Text className="text-sm font-medium text-textSecondary">Стоимость консультации</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="Например: 2 000"
            placeholderTextColor={Colors.textMuted}
            className="h-12 rounded-lg border border-border bg-bgCard px-4 text-base text-textPrimary"
          />
        </View>
      </View>
      <Pressable className="h-12 items-center justify-center rounded-lg bg-brandPrimary">
        <Text className="text-base font-semibold text-white">Завершить регистрацию</Text>
      </Pressable>
    </View>
  );
}
