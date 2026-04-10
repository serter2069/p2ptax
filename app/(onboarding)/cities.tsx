import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/Button';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
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
      // Save cities to AsyncStorage so they survive refresh/deep links
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
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Back button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← Назад</Text>
          </TouchableOpacity>

          <OnboardingProgress currentStep={2} />

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '50%' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.step}>Шаг 2 из 5</Text>
            <Text style={styles.title}>Выберите города</Text>
            <Text style={styles.subtitle}>
              В каких городах России вы оказываете услуги?
            </Text>
          </View>

          {/* City chips */}
          <View style={styles.chipsGrid}>
            {RUSSIAN_CITIES.map((city) => {
              const isSelected = selected.includes(city);
              return (
                <TouchableOpacity
                  key={city}
                  onPress={() => toggleCity(city)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selected.length > 0 && (
            <Text style={styles.selectedHint}>
              Выбрано: {selected.join(', ')}
            </Text>
          )}

          <Button
            onPress={handleContinue}
            disabled={selected.length === 0}
            loading={isLoading}
            style={styles.btn}
          >
            Продолжить
          </Button>

          <TouchableOpacity
            onPress={async () => {
              await AsyncStorage.setItem('onboarding_cities', JSON.stringify([]));
              router.push('/(onboarding)/fns');
            }}
            style={styles.skipBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Заполнить позже</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing['2xl'],
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.brandPrimary,
    borderRadius: 2,
  },
  header: {
    gap: Spacing.xs,
  },
  step: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipSelected: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.statusBg.accent,
  },
  chipText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  chipTextSelected: {
    color: Colors.textAccent,
    fontWeight: Typography.fontWeight.semibold,
  },
  selectedHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  btn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  backBtnText: {
    fontSize: Typography.fontSize.base,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipBtnText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
});
