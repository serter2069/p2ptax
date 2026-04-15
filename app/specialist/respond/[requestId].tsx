import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { Header } from '../../../components/Header';

export default function SpecialistRespondPage() {
  const [price, setPrice] = useState('4 500');
  const [message, setMessage] = useState('Здравствуйте! Готов помочь с декларацией. Опыт — 8 лет, 200+ успешных деклараций.');
  const [deadline, setDeadline] = useState('2 рабочих дня');
  const [popup, setPopup] = useState<'success' | 'error' | null>(null);

  const handleSubmit = () => {
    setPopup(Math.random() > 0.3 ? 'success' : 'error');
  };

  return (
    <View className="flex-1">
      <Header variant="back" backTitle="Откликнуться" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, position: 'relative' }}>
        {popup && (
          <View className="absolute bottom-0 left-0 right-0 top-0 z-10 items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View className="w-full items-center gap-3 rounded-xl bg-bgCard p-6" style={{ maxWidth: 340 }}>
              <Feather
                name={popup === 'success' ? 'check' : 'x'}
                size={44}
                color={popup === 'success' ? Colors.statusSuccess : Colors.statusError}
              />
              <Text className="text-lg font-bold text-textPrimary">
                {popup === 'success' ? 'Отклик отправлен!' : 'Ошибка отправки'}
              </Text>
              <Text className="text-center text-sm text-textMuted">
                {popup === 'success'
                  ? 'Клиент получит уведомление о вашем отклике и сможет связаться с вами'
                  : 'Не удалось отправить отклик. Попробуйте ещё раз.'}
              </Text>
              <Pressable
                onPress={() => setPopup(null)}
                className="h-11 w-full items-center justify-center rounded-lg"
                style={{ backgroundColor: popup === 'success' ? Colors.brandPrimary : Colors.statusError }}
              >
                <Text className="text-sm font-semibold text-white">
                  {popup === 'success' ? 'К моим откликам' : 'Попробовать снова'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        <View className="gap-2 rounded-lg bg-bgSecondary p-4">
          <Text className="text-base font-semibold text-textPrimary">Заполнить декларацию 3-НДФЛ за 2025 год</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-textMuted">Москва</Text>
            <Text className="text-xs text-border">{'·'}</Text>
            <Text className="text-xs text-textMuted">3 000 — 5 000 ₽</Text>
          </View>
        </View>
        <View className="gap-4">
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Ваша цена *</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="Укажите стоимость в рублях"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              className="h-12 rounded-lg border border-border bg-bgCard px-4 text-base text-textPrimary"
            />
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Сообщение клиенту *</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              className="rounded-lg border border-border bg-bgCard p-4 text-base text-textPrimary"
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>
          <View className="gap-1">
            <Text className="text-sm font-medium text-textSecondary">Срок выполнения</Text>
            <TextInput
              value={deadline}
              onChangeText={setDeadline}
              className="h-12 rounded-lg border border-border bg-bgCard px-4 text-base text-textPrimary"
            />
          </View>
        </View>
        <Pressable onPress={handleSubmit} className="h-12 items-center justify-center rounded-lg bg-brandPrimary">
          <Text className="text-base font-semibold text-white">Отправить отклик</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
