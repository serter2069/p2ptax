import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { api, ApiError, tryRefreshTokens, getToken } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { AuthUser } from '../../stores/authStore';

export default function ServicesScreen() {
  const router = useRouter();
  const { cities: citiesParam, fnsOffices: fnsParam } = useLocalSearchParams<{ cities: string; fnsOffices: string }>();
  const { completeOnboarding, login, user } = useAuth();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const [focused, setFocused] = useState(false);

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
      await api.patch('/users/me/specialist-profile', {
        cities,
        fnsOffices,
        services: combined,
      });
      // Refresh JWT so the new token carries SPECIALIST role (not CLIENT)
      await tryRefreshTokens();
      const freshToken = await getToken();
      if (freshToken) {
        // Fetch updated user profile (role is now SPECIALIST in DB)
        const freshUser = await api.get<{ id: string; email: string; role: string; username: string | null }>('/users/me');
        await login(freshToken, {
          userId: freshUser.id,
          email: freshUser.email,
          role: freshUser.role,
          username: freshUser.username,
          isNewUser: false,
        } as AuthUser);
      }
      // Mark onboarding complete — sets isNewUser=false in store + AsyncStorage
      await completeOnboarding(user?.username ?? '');
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Профиль уже существует. Попробуйте войти снова.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось сохранить профиль. Попробуйте снова.');
      }
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
            {/* Progress indicator — 4 steps */}
            <View style={styles.progressRow}>
              <View style={[styles.progressDot, styles.progressDotDone]} />
              <View style={styles.progressLine} />
              <View style={[styles.progressDot, styles.progressDotDone]} />
              <View style={styles.progressLine} />
              <View style={[styles.progressDot, styles.progressDotDone]} />
              <View style={styles.progressLine} />
              <View style={[styles.progressDot, styles.progressDotActive]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.step}>Шаг 4 из 4</Text>
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
              <View style={styles.textareaWrapper}>
                <Text style={styles.inputLabel}>Описание услуг</Text>
                <TextInput
                  value={services}
                  onChangeText={handleChange}
                  placeholder="Опишите ваши услуги..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={[
                    styles.textarea,
                    focused && styles.textareaFocused,
                    !!error && styles.textareaError,
                  ]}
                />
                {!!error && <Text style={styles.errorText}>{error}</Text>}
              </View>

              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || (services.trim().length === 0 && selectedChips.length === 0)}
                style={styles.btn}
              >
                Завершить настройку
              </Button>
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
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginTop: Spacing.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.border,
  },
  progressDotDone: {
    backgroundColor: Colors.brandSecondary,
  },
  progressDotActive: {
    backgroundColor: Colors.brandPrimary,
    width: 12,
    height: 12,
    borderRadius: BorderRadius.sm,
  },
  progressLine: {
    width: 32,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
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
  textareaWrapper: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  textarea: {
    minHeight: 120,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  textareaFocused: {
    borderColor: Colors.brandPrimary,
  },
  textareaError: {
    borderColor: Colors.statusError,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
    marginTop: 2,
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
    color: '#FFFFFF',
  },
  btn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
});
