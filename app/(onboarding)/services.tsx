import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors } from '../../constants/Colors';
import { OnboardingProgress } from '../../components/OnboardingProgress';

export default function ServicesScreen() {
  const router = useRouter();
  const { cities: citiesParam, fnsOffices: fnsParam } = useLocalSearchParams<{ cities: string; fnsOffices: string }>();

  let citiesFromParams: string[] = [];
  let fnsFromParams: string[] = [];
  try {
    citiesFromParams = citiesParam ? (JSON.parse(citiesParam) as string[]) : [];
    fnsFromParams = fnsParam ? (JSON.parse(fnsParam) as string[]) : [];
  } catch {
    citiesFromParams = [];
    fnsFromParams = [];
  }

  const [cities, setCities] = useState<string[]>(citiesFromParams);
  const [fnsOffices, setFnsOffices] = useState<string[]>(fnsFromParams);

  useEffect(() => {
    async function loadFromStorage() {
      if (cities.length === 0) {
        try {
          const stored = await AsyncStorage.getItem('onboarding_cities');
          if (stored) setCities(JSON.parse(stored));
        } catch { /* ignore */ }
      }
      if (fnsOffices.length === 0) {
        try {
          const stored = await AsyncStorage.getItem('onboarding_fns');
          if (stored) setFnsOffices(JSON.parse(stored));
        } catch { /* ignore */ }
      }
    }
    loadFromStorage();
  }, []);

  const POPULAR_SERVICES = [
    'Декларации 3-НДФЛ',
    'Налоговые споры',
    'Оптимизация налогов',
    'Вычеты НДФЛ',
    'Регистрация ООО/ИП',
    'НДС консультации',
    'Налоговый аудит',
    'Представительство в суде',
  ];

  const [services, setServices] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChipToggle(chip: string) {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
    );
    if (error) setError('');
  }

  function handleChange(value: string) {
    setServices(value);
    if (error) setError('');
  }

  async function handleSubmit() {
    const trimmed = services.trim();
    const combined = [...selectedChips, ...(trimmed ? [trimmed] : [])];
    if (combined.length === 0) {
      setError('Расскажите о своих услугах');
      return;
    }
    if (cities.length === 0) {
      setError('Не выбраны города — вернитесь на предыдущий шаг');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await AsyncStorage.setItem('onboarding_services', JSON.stringify(combined));
      router.push('/(onboarding)/profile');
    } catch (err) {
      setError('Не удалось сохранить данные. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-bgPrimary">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-lg px-5 gap-6">
            <OnboardingProgress currentStep={4} />

            {/* Header */}
            <View className="gap-1">
              <Text className="text-sm font-medium text-textMuted">Шаг 4 из 5</Text>
              <Text className="text-2xl font-bold text-textPrimary">Ваши услуги</Text>
              <Text className="text-base text-textSecondary leading-[22px]">
                Расскажите, что вы умеете делать. Клиенты увидят это в вашем профиле.
              </Text>
            </View>

            {/* Hint */}
            <View className="bg-bgCard rounded-lg py-2 px-4 border border-border">
              <Text className="text-sm text-textMuted leading-[18px]">
                Например: декларирование доходов, консультации по НДС, налоговое планирование
              </Text>
            </View>

            {/* Popular services chips */}
            <View className="gap-1">
              <Text className="text-sm font-medium text-textSecondary mb-0.5">Популярные услуги</Text>
              <View className="flex-row flex-wrap gap-2">
                {POPULAR_SERVICES.map((svc) => {
                  const isActive = selectedChips.includes(svc);
                  return (
                    <Pressable
                      key={svc}
                      onPress={() => handleChipToggle(svc)}
                      className={`py-1 px-2 rounded-full border ${isActive ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
                      style={isActive ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
                    >
                      <Text className={`text-sm ${isActive ? 'text-white' : 'text-textSecondary'}`}>
                        {svc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Textarea */}
            <View className="gap-4">
              <Input
                label="Описание услуг"
                value={services}
                onChangeText={handleChange}
                placeholder="Например: Консультации по НДС, 3-НДФЛ, 2000 руб/час"
                autoCapitalize="sentences"
                multiline
                numberOfLines={5}
                minHeight={120}
                error={error}
                hint="Описывайте услуги на русском языке"
              />

              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || (services.trim().length === 0 && selectedChips.length === 0)}
                style={{ width: '100%', marginTop: 8 }}
              >
                Продолжить
              </Button>

              <Pressable
                onPress={async () => {
                  await AsyncStorage.setItem('onboarding_services', JSON.stringify([]));
                  router.push('/(onboarding)/profile');
                }}
                className="items-center py-2"
              >
                <Text className="text-base text-textMuted">Заполнить позже</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
