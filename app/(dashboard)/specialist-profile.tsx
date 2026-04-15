import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../lib/api';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export default function SpecialistProfileSetupScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [nick, setNick] = useState('');
  const [headline, setHeadline] = useState('');
  const [contacts, setContacts] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [services, setServices] = useState<string[]>([]);

  function addCity() {
    const trimmed = cityInput.trim();
    if (!trimmed) return;
    setCities((prev) => [...prev, trimmed]);
    setCityInput('');
  }

  function removeCity(idx: number) {
    setCities((prev) => prev.filter((_, i) => i !== idx));
  }

  function addService() {
    const trimmed = serviceInput.trim();
    if (!trimmed) return;
    setServices((prev) => [...prev, trimmed]);
    setServiceInput('');
  }

  function removeService(idx: number) {
    setServices((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!nick.trim()) {
      Alert.alert('Ошибка', 'Ник не может быть пустым');
      return;
    }
    if (nick.trim().length < 3) {
      Alert.alert('Ошибка', 'Ник должен быть не менее 3 символов');
      return;
    }
    if (cities.length === 0) {
      Alert.alert('Укажите хотя бы один город', 'Добавьте город для работы');
      return;
    }
    if (services.length === 0) {
      Alert.alert('Укажите хотя бы одну услугу', 'Добавьте услугу которую вы предоставляете');
      return;
    }
    setSaving(true);
    try {
      await api.post('/specialists/profile', {
        nick: nick.trim(),
        headline: headline.trim() || undefined,
        contacts: contacts.trim() || undefined,
        cities,
        services,
        badges: [],
      });
      router.replace('/(dashboard)');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? 'Этот ник уже занят, выберите другой.'
            : err.message
          : 'Ошибка при создании профиля';
      Alert.alert('Ошибка', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-bgPrimary">
      <Header title="Настройка профиля" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-[430px] px-5 gap-5">
            <Text className="text-base text-textSecondary text-center">
              Заполните профиль, чтобы клиенты могли вас найти
            </Text>

            {/* Nick + Contacts */}
            <View className="gap-2">
              <Text className="text-base font-semibold text-textPrimary mb-0.5">Основное</Text>
              <Input
                label="Ник (уникальный)"
                value={nick}
                onChangeText={setNick}
                placeholder="moi_nik"
                autoCapitalize="none"
              />
              <Input
                label="Слоган / заголовок (до 150 символов)"
                value={headline}
                onChangeText={setHeadline}
                placeholder="Решу ваш вопрос с ФНС быстро"
                autoCapitalize="sentences"
                style={{ marginTop: 8 }}
              />
              <Input
                label="Контакты (необязательно)"
                value={contacts}
                onChangeText={setContacts}
                placeholder="Telegram: @username, тел: +7..."
                autoCapitalize="sentences"
                style={{ marginTop: 8 }}
              />
            </View>

            {/* Cities */}
            <View className="gap-2">
              <Text className="text-base font-semibold text-textPrimary mb-0.5">Города работы</Text>
              <View className="flex-row gap-2 items-center">
                <TextInput
                  value={cityInput}
                  onChangeText={setCityInput}
                  placeholder="Добавить город..."
                  placeholderTextColor={Colors.textMuted}
                  className="flex-1 h-11 bg-bgCard border border-border rounded-lg px-4 text-base text-textPrimary"
                  style={{ outlineStyle: 'none' } as any}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={addCity}
                />
                <Pressable
                  className="w-11 h-11 rounded-lg items-center justify-center"
                  style={{ backgroundColor: Colors.brandPrimary }}
                  onPress={addCity}
                >
                  <Text className="text-2xl text-textPrimary leading-7">{'+'}</Text>
                </Pressable>
              </View>
              {cities.length === 0 && (
                <Text className="text-xs text-textMuted italic">Нет городов — добавьте хотя бы один</Text>
              )}
              <View className="flex-row flex-wrap gap-2 mt-1">
                {cities.map((city, idx) => (
                  <View key={idx} className="flex-row items-center bg-bgSecondary rounded-full px-3 py-1.5 border border-borderLight gap-1">
                    <Text className="text-sm text-textSecondary">{city}</Text>
                    <Pressable onPress={() => removeCity(idx)} hitSlop={8}>
                      <Text className="text-base text-textMuted leading-[18px]">{'×'}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>

            {/* Services */}
            <View className="gap-2">
              <Text className="text-base font-semibold text-textPrimary mb-0.5">Услуги и цены</Text>
              <Text className="text-xs text-textMuted mb-1">Формат: "Название — 5000 руб"</Text>
              <View className="flex-row gap-2 items-center">
                <TextInput
                  value={serviceInput}
                  onChangeText={setServiceInput}
                  placeholder="Консультация — 3000 руб"
                  placeholderTextColor={Colors.textMuted}
                  className="flex-1 h-11 bg-bgCard border border-border rounded-lg px-4 text-base text-textPrimary"
                  style={{ outlineStyle: 'none' } as any}
                  autoCapitalize="sentences"
                  returnKeyType="done"
                  onSubmitEditing={addService}
                />
                <Pressable
                  className="w-11 h-11 rounded-lg items-center justify-center"
                  style={{ backgroundColor: Colors.brandPrimary }}
                  onPress={addService}
                >
                  <Text className="text-2xl text-textPrimary leading-7">{'+'}</Text>
                </Pressable>
              </View>
              {services.length === 0 && (
                <Text className="text-xs text-textMuted italic">Нет услуг — добавьте хотя бы одну</Text>
              )}
              <View className="gap-2 mt-1">
                {services.map((svc, idx) => (
                  <View key={idx} className="flex-row items-center bg-bgCard rounded-lg px-4 py-3 border border-border gap-2">
                    <Text className="flex-1 text-sm text-textSecondary" numberOfLines={2}>{svc}</Text>
                    <Pressable onPress={() => removeService(idx)} hitSlop={8}>
                      <Text className="text-base text-textMuted leading-[18px]">{'×'}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>

            <Button
              onPress={handleSubmit}
              variant="primary"
              loading={saving}
              disabled={saving}
              style={{ width: '100%', marginTop: 12, marginBottom: 32 }}
            >
              Создать профиль
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
