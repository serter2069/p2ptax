import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
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

  // Fallback: load from AsyncStorage if params are empty (deep link / refresh)
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
      // Save services to AsyncStorage and proceed to step 5 (profile)
      await AsyncStorage.setItem('onboarding_services', JSON.stringify(combined));
      router.push('/(onboarding)/profile');
    } catch (err) {
      setError('Не удалось сохранить данные. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <OnboardingProgress currentStep={4} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.step}>Шаг 4 из 5</Text>
              <Text style={styles.title}>Ваши услуги</Text>
              <Text style={styles.subtitle}>
                Расскажите, что вы умеете делать. Клиенты увидят это в вашем профиле.
              </Text>
            </View>

            {/* Hint */}
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                Например: декларирование доходов, консультации по НДС, налоговое планирование
              </Text>
            </View>

            {/* Popular services chips */}
            <View style={styles.chipsContainer}>
              <Text style={styles.chipsLabel}>Популярные услуги</Text>
              <View style={styles.chipsRow}>
                {POPULAR_SERVICES.map((svc) => {
                  const isActive = selectedChips.includes(svc);
                  return (
                    <TouchableOpacity
                      key={svc}
                      onPress={() => handleChipToggle(svc)}
                      style={[styles.chip, isActive && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {svc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Textarea */}
            <View style={styles.form}>
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
                style={styles.btn}
              >
                Продолжить
              </Button>

              <TouchableOpacity
                onPress={async () => {
                  // Skip services — save empty and go to profile
                  await AsyncStorage.setItem('onboarding_services', JSON.stringify([]));
                  router.push('/(onboarding)/profile');
                }}
                style={styles.skipBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>Заполнить позже</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  kav: {
    flex: 1,
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
  hintBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  form: {
    gap: Spacing.lg,
  },
  chipsContainer: {
    gap: Spacing.xs,
  },
  chipsLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  btn: {
    width: '100%',
    marginTop: Spacing.sm,
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
