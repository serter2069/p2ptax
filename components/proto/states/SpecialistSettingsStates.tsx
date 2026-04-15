import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';

const SERVICES = ['Выездная проверка', 'Камеральная проверка', 'Оперативный контроль'];
const FNS_LIST = ['ИФНС №46', 'ИФНС №15', 'МРИ ФНС №12', 'ИФНС №7', 'ИФНС №28'];

function IdleState() {
  const [name, setName] = useState('Алексей Петров');
  const [phone, setPhone] = useState('+7 (916) 123-45-67');
  const [telegram, setTelegram] = useState('@alexpetrov');
  const [whatsapp, setWhatsapp] = useState('+7 916 123 45 67');
  const [address, setAddress] = useState('Москва, ул. Тверская, 12, офис 305');
  const [hours, setHours] = useState('Пн-Пт 9:00-18:00');
  const [available, setAvailable] = useState(true);
  const [selectedServices, setSelectedServices] = useState([0, 1]);
  const [selectedFns, setSelectedFns] = useState([0, 1, 2]);
  const [notifResponses, setNotifResponses] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);

  const toggleService = (i: number) => {
    setSelectedServices((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i]);
  };
  const toggleFns = (i: number) => {
    setSelectedFns((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i]);
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 20 }}>
      <Text className="text-xl font-bold text-textPrimary">Настройки профиля</Text>

      {/* Avatar */}
      <View className="items-center gap-2">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-bgSecondary">
          <Feather name="user" size={32} color={Colors.textMuted} />
        </View>
        <Pressable><Text className="text-sm font-medium text-brandPrimary">Изменить фото</Text></Pressable>
      </View>

      {/* Fields */}
      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-sm font-medium text-textSecondary">Имя</Text>
          <TextInput value={name} onChangeText={setName} className="h-11 rounded-lg border border-borderLight px-3 text-base text-textPrimary" style={{ outlineStyle: 'none' as any }} />
        </View>
        <View className="gap-1">
          <Text className="text-sm font-medium text-textSecondary">Телефон</Text>
          <TextInput value={phone} onChangeText={setPhone} className="h-11 rounded-lg border border-borderLight px-3 text-base text-textPrimary" style={{ outlineStyle: 'none' as any }} />
        </View>
        <View className="gap-1">
          <Text className="text-sm font-medium text-textSecondary">Telegram</Text>
          <TextInput value={telegram} onChangeText={setTelegram} className="h-11 rounded-lg border border-borderLight px-3 text-base text-textPrimary" style={{ outlineStyle: 'none' as any }} />
        </View>
        <View className="gap-1">
          <Text className="text-sm font-medium text-textSecondary">WhatsApp</Text>
          <TextInput value={whatsapp} onChangeText={setWhatsapp} className="h-11 rounded-lg border border-borderLight px-3 text-base text-textPrimary" style={{ outlineStyle: 'none' as any }} />
        </View>
        <View className="gap-1">
          <Text className="text-sm font-medium text-textSecondary">Адрес офиса</Text>
          <TextInput value={address} onChangeText={setAddress} className="h-11 rounded-lg border border-borderLight px-3 text-base text-textPrimary" style={{ outlineStyle: 'none' as any }} />
        </View>
        <View className="gap-1">
          <Text className="text-sm font-medium text-textSecondary">Часы работы</Text>
          <TextInput value={hours} onChangeText={setHours} className="h-11 rounded-lg border border-borderLight px-3 text-base text-textPrimary" style={{ outlineStyle: 'none' as any }} />
        </View>
      </View>

      {/* Services */}
      <View className="gap-2">
        <Text className="text-base font-semibold text-textPrimary">Услуги</Text>
        <View className="flex-row flex-wrap gap-2">
          {SERVICES.map((s, i) => (
            <Pressable key={s} onPress={() => toggleService(i)}
              className={`h-9 items-center justify-center rounded-full border px-4 ${selectedServices.includes(i) ? 'border-brandPrimary bg-brandPrimary' : 'border-borderLight bg-white'}`}>
              <Text className={`text-sm ${selectedServices.includes(i) ? 'font-semibold text-white' : 'text-textMuted'}`}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* FNS coverage */}
      <View className="gap-2">
        <Text className="text-base font-semibold text-textPrimary">Зона обслуживания (ФНС)</Text>
        <Text className="text-xs text-textMuted">Москва</Text>
        <View className="flex-row flex-wrap gap-2">
          {FNS_LIST.map((f, i) => (
            <Pressable key={f} onPress={() => toggleFns(i)}
              className={`h-8 items-center justify-center rounded-full border px-3 ${selectedFns.includes(i) ? 'border-brandPrimary bg-brandPrimary' : 'border-borderLight bg-white'}`}>
              <Text className={`text-xs ${selectedFns.includes(i) ? 'font-semibold text-white' : 'text-textMuted'}`}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Availability */}
      <View className="flex-row items-center justify-between rounded-xl border border-borderLight p-4">
        <View className="flex-1">
          <Text className="text-base font-semibold text-textPrimary">Принимаю заявки</Text>
          <Text className="text-xs text-textMuted">{available ? 'Вы видны в каталоге' : 'Вы скрыты из каталога'}</Text>
        </View>
        <Switch value={available} onValueChange={setAvailable} trackColor={{ true: Colors.brandPrimary, false: '#ddd' }} />
      </View>

      {/* Notifications */}
      <View className="gap-3">
        <Text className="text-base font-semibold text-textPrimary">Уведомления</Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-textSecondary">Новые отклики</Text>
          <Switch value={notifResponses} onValueChange={setNotifResponses} trackColor={{ true: Colors.brandPrimary, false: '#ddd' }} />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-textSecondary">Новые сообщения</Text>
          <Switch value={notifMessages} onValueChange={setNotifMessages} trackColor={{ true: Colors.brandPrimary, false: '#ddd' }} />
        </View>
      </View>

      <Pressable className="h-12 items-center justify-center rounded-lg bg-brandPrimary">
        <Text className="text-base font-semibold text-white">Сохранить</Text>
      </Pressable>
    </ScrollView>
  );
}

function SavingState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-textPrimary">Настройки профиля</Text>
      <View className="items-center gap-3 py-16">
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
        <Text className="text-base font-semibold text-textPrimary">Сохранение...</Text>
      </View>
      <Pressable className="h-12 items-center justify-center rounded-lg bg-bgSecondary">
        <Text className="text-base font-semibold text-textMuted">Сохранить</Text>
      </Pressable>
    </ScrollView>
  );
}

function ErrorState() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-textPrimary">Настройки профиля</Text>
      <View className="rounded-lg border p-3" style={{ borderColor: Colors.statusError, backgroundColor: Colors.statusBg.error }}>
        <Text className="text-sm" style={{ color: Colors.statusError }}>Ошибка сохранения. Проверьте данные и попробуйте снова.</Text>
      </View>
      <View className="gap-1">
        <Text className="text-sm font-medium text-textSecondary">Имя</Text>
        <View className="h-11 justify-center rounded-lg border border-borderLight px-3">
          <Text className="text-base text-textPrimary">Алексей Петров</Text>
        </View>
      </View>
      <Pressable className="h-12 items-center justify-center rounded-lg bg-brandPrimary">
        <Text className="text-base font-semibold text-white">Повторить</Text>
      </Pressable>
    </ScrollView>
  );
}

export function SpecialistSettingsStates() {
  return (
    <>
      <StateSection title="idle"><IdleState /></StateSection>
      <StateSection title="saving"><SavingState /></StateSection>
      <StateSection title="error"><ErrorState /></StateSection>
    </>
  );
}
