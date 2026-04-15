import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-textMuted">{label}</Text>
      <Text className="text-sm font-medium text-textPrimary">{value}</Text>
    </View>
  );
}

export default function ProfilePage() {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('Елена Васильева');
  const [city, setCity] = useState('Москва');
  const [savedName, setSavedName] = useState('Елена Васильева');
  const [savedCity, setSavedCity] = useState('Москва');

  const handleSave = () => {
    setSavedName(name);
    setSavedCity(city);
    setEditMode(false);
  };

  const handleCancel = () => {
    setName(savedName);
    setCity(savedCity);
    setEditMode(false);
  };

  if (editMode) {
    return (
      <View className="flex-1">
        <Header variant="auth" />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View className="flex-row items-center gap-4">
            <Image source={{ uri: 'https://picsum.photos/seed/ElenaV/64/64' }} style={{ width: 64, height: 64, borderRadius: 32 }} />
            <Pressable><Text className="text-sm font-medium text-brandPrimary">Изменить фото</Text></Pressable>
          </View>
          <View className="gap-4">
            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary">Имя</Text>
              <TextInput value={name} onChangeText={setName} className="h-12 rounded-lg border border-border bg-bgCard px-4 text-base text-textPrimary" />
            </View>
            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary">Email</Text>
              <TextInput value="elena@mail.ru" editable={false} className="h-12 rounded-lg border border-border bg-bgCard px-4 text-base text-textPrimary opacity-50" />
              <Text className="text-xs text-textMuted">Email нельзя изменить</Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary">Город</Text>
              <TextInput value={city} onChangeText={setCity} className="h-12 rounded-lg border border-border bg-bgCard px-4 text-base text-textPrimary" />
            </View>
          </View>
          <View className="gap-2">
            <Pressable onPress={handleSave} className="h-12 items-center justify-center rounded-lg bg-brandPrimary">
              <Text className="text-base font-semibold text-white">Сохранить</Text>
            </Pressable>
            <Pressable onPress={handleCancel} className="h-12 items-center justify-center rounded-lg border border-border">
              <Text className="text-base text-textMuted">Отмена</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Header variant="auth" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="flex-row items-center gap-4">
          <Image source={{ uri: 'https://picsum.photos/seed/ElenaV/64/64' }} style={{ width: 64, height: 64, borderRadius: 32 }} />
          <View>
            <Text className="text-lg font-bold text-textPrimary">{savedName}</Text>
            <Text className="text-sm text-textMuted">Клиент</Text>
          </View>
        </View>
        <View className="gap-3 rounded-lg border border-border bg-bgCard p-4">
          <InfoRow label="Email" value="elena@mail.ru" />
          <InfoRow label="Город" value={savedCity} />
          <InfoRow label="Дата регистрации" value="15.02.2026" />
          <InfoRow label="Заявки" value="5 (3 активных)" />
        </View>
        <Pressable onPress={() => setEditMode(true)} className="h-12 items-center justify-center rounded-lg bg-brandPrimary">
          <Text className="text-base font-semibold text-white">Редактировать</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
