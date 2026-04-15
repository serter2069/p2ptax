import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { AppHeader } from '../../components/AppHeader';
import { BottomNav } from '../../components/BottomNav';

export default function ProfilePage() {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('Елена Васильева');
  const [city, setCity] = useState('Москва');

  if (editMode) {
    return (
      <View className="flex-1 bg-white">
        <AppHeader />
        <View className="flex-1 p-4 gap-4">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
              <Text className="text-xl font-bold text-brandPrimary">ЕВ</Text>
            </View>
            <Pressable className="flex-row items-center gap-1">
              <Feather name="camera" size={14} color={Colors.brandPrimary} />
              <Text className="text-sm font-medium text-brandPrimary">Изменить фото</Text>
            </Pressable>
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Имя</Text>
            <TextInput value={name} onChangeText={setName} className="h-12 rounded-xl border border-borderLight bg-white px-4 text-base text-textPrimary" style={{ outlineStyle: 'none' } as any} />
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Email</Text>
            <TextInput value="elena@mail.ru" editable={false} className="h-12 rounded-xl border border-borderLight bg-bgSecondary px-4 text-base text-textPrimary opacity-50" style={{ outlineStyle: 'none' } as any} />
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Город</Text>
            <TextInput value={city} onChangeText={setCity} className="h-12 rounded-xl border border-borderLight bg-white px-4 text-base text-textPrimary" style={{ outlineStyle: 'none' } as any} />
          </View>
          <Pressable onPress={() => setEditMode(false)} className="h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary">
            <Feather name="check" size={16} color={Colors.white} />
            <Text className="text-base font-semibold text-white">Сохранить</Text>
          </Pressable>
          <Pressable onPress={() => setEditMode(false)} className="h-12 items-center justify-center rounded-lg border border-borderLight">
            <Text className="text-base text-textMuted">Отмена</Text>
          </Pressable>
        </View>
        <BottomNav activeId="profile" variant="client" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <AppHeader />
      <View className="flex-1 p-4 gap-4">
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
            <Text className="text-xl font-bold text-brandPrimary">ЕВ</Text>
          </View>
          <View>
            <Text className="text-xl font-bold text-textPrimary">{name}</Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Feather name="user" size={14} color={Colors.textMuted} />
              <Text className="text-base text-textMuted">Клиент</Text>
            </View>
          </View>
        </View>

        <View className="flex-row gap-2">
          {[
            { icon: 'file-text', value: '5', label: 'Заявок' },
            { icon: 'check-circle', value: '3', label: 'Завершено' },
            { icon: 'star', value: '4.9', label: 'Рейтинг' },
          ].map((s) => (
            <View key={s.label} className="flex-1 items-center gap-1 rounded-xl border border-borderLight bg-white p-3">
              <Feather name={s.icon as any} size={18} color={Colors.brandPrimary} />
              <Text className="text-lg font-bold text-textPrimary">{s.value}</Text>
              <Text className="text-xs text-textMuted">{s.label}</Text>
            </View>
          ))}
        </View>

        <View className="rounded-xl border border-borderLight bg-white p-4 gap-3">
          {[
            { label: 'Email', value: 'elena@mail.ru', icon: 'mail' },
            { label: 'Город', value: city, icon: 'map-pin' },
            { label: 'Регистрация', value: '15.02.2026', icon: 'calendar' },
            { label: 'Заявки', value: '5 (3 активных)', icon: 'file-text' },
          ].map((row) => (
            <View key={row.label} className="flex-row items-center gap-2">
              <Feather name={row.icon as any} size={16} color={Colors.textMuted} />
              <Text className="flex-1 text-sm text-textMuted">{row.label}</Text>
              <Text className="text-sm font-medium text-textPrimary">{row.value}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={() => setEditMode(true)} className="h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary">
          <Feather name="edit-2" size={16} color={Colors.white} />
          <Text className="text-base font-semibold text-white">Редактировать</Text>
        </Pressable>

        <Pressable className="flex-row items-center gap-2 rounded-xl border border-borderLight bg-white p-4">
          <Feather name="settings" size={16} color={Colors.textMuted} />
          <Text className="flex-1 text-base text-textPrimary">Настройки</Text>
          <Feather name="chevron-right" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>
      <BottomNav activeId="profile" variant="client" />
    </View>
  );
}
