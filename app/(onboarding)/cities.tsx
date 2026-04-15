import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { RUSSIAN_CITIES } from '../../constants/Cities';

export default function CitiesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  function toggleCity(city: string) {
    setSelected((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );
  }

  async function handleContinue() {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('onboarding_cities', JSON.stringify(selected));
      router.push({
        pathname: '/(onboarding)/fns',
        params: { cities: JSON.stringify(selected) },
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-bgPrimary">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-lg px-5 gap-6">
          {/* Back button */}
          <Pressable onPress={() => router.back()} className="self-start py-2">
            <Text className="text-base font-medium text-brandPrimary">{'\u2190'} Назад</Text>
          </Pressable>

          <OnboardingProgress currentStep={2} />

          {/* Progress bar */}
          <View className="h-1 bg-border rounded-sm overflow-hidden">
            <View className="h-1 rounded-sm" style={{ width: '50%', backgroundColor: Colors.brandPrimary }} />
          </View>

          {/* Header */}
          <View className="gap-1">
            <Text className="text-sm font-medium text-textMuted">Шаг 2 из 5</Text>
            <Text className="text-2xl font-bold text-textPrimary">Выберите города</Text>
            <Text className="text-base text-textSecondary leading-[22px]">
              В каких городах России вы оказываете услуги?
            </Text>
          </View>

          {/* City chips */}
          <View className="flex-row flex-wrap gap-2">
            {RUSSIAN_CITIES.map((city) => {
              const isSelected = selected.includes(city);
              return (
                <Pressable
                  key={city}
                  onPress={() => toggleCity(city)}
                  className={`py-2 px-4 rounded-full border ${isSelected ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
                  style={isSelected ? { borderColor: Colors.brandPrimary, backgroundColor: Colors.statusBg.accent } : undefined}
                >
                  <Text className={`text-base font-medium ${isSelected ? 'font-semibold' : 'text-textSecondary'}`}
                    style={isSelected ? { color: Colors.textAccent } : undefined}
                  >
                    {city}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selected.length > 0 && (
            <Text className="text-sm text-textMuted leading-[18px]">
              Выбрано: {selected.join(', ')}
            </Text>
          )}

          <Button
            onPress={handleContinue}
            disabled={selected.length === 0}
            loading={isLoading}
            style={{ width: '100%', marginTop: 8 }}
          >
            Продолжить
          </Button>

          <Pressable
            onPress={async () => {
              await AsyncStorage.setItem('onboarding_cities', JSON.stringify([]));
              router.push('/(onboarding)/fns');
            }}
            className="items-center py-2"
          >
            <Text className="text-base text-textMuted">Заполнить позже</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
