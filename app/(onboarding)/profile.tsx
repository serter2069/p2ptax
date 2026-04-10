import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors, Spacing, Typography } from '../../constants/Colors';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { api, ApiError, tryRefreshTokens, getToken } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { AuthUser } from '../../stores/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { completeOnboarding, login, user } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [contacts, setContacts] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      // Read all previously saved onboarding data
      const [citiesRaw, fnsRaw, fnsDataRaw, servicesRaw] = await Promise.all([
        AsyncStorage.getItem('onboarding_cities'),
        AsyncStorage.getItem('onboarding_fns'),
        AsyncStorage.getItem('onboarding_fns_data'),
        AsyncStorage.getItem('onboarding_services'),
      ]);

      const cities: string[] = citiesRaw ? JSON.parse(citiesRaw) : [];
      const fnsOffices: string[] = fnsRaw ? JSON.parse(fnsRaw) : [];
      const services: string[] = servicesRaw ? JSON.parse(servicesRaw) : [];

      const patchBody: Record<string, unknown> = {
        cities,
        fnsOffices,
        services,
      };

      const trimmedDisplayName = displayName.trim();
      const trimmedHeadline = headline.trim();
      const trimmedBio = bio.trim();
      const trimmedContacts = contacts.trim();

      if (trimmedDisplayName) patchBody.displayName = trimmedDisplayName;
      if (trimmedHeadline) patchBody.headline = trimmedHeadline;
      if (trimmedBio) patchBody.bio = trimmedBio;
      if (trimmedContacts) patchBody.contacts = trimmedContacts;

      await api.patch('/users/me/specialist-profile', patchBody);

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

      // Clean up AsyncStorage onboarding keys
      await Promise.all([
        AsyncStorage.removeItem('onboarding_cities'),
        AsyncStorage.removeItem('onboarding_fns'),
        AsyncStorage.removeItem('onboarding_fns_data'),
        AsyncStorage.removeItem('onboarding_services'),
      ]);

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
            <OnboardingProgress currentStep={5} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.step}>Шаг 5 из 5 — Расскажите о себе</Text>
              <Text style={styles.title}>Ваш профиль</Text>
              <Text style={styles.subtitle}>
                Все поля необязательны. Заполните то, что хотите показать клиентам.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* displayName */}
              <Input
                label="Отображаемое имя"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Иван Петров"
                autoCapitalize="words"
              />

              {/* headline */}
              <Input
                label="Слоган / заголовок"
                value={headline}
                onChangeText={setHeadline}
                placeholder="Решу ваш вопрос с ФНС быстро"
                autoCapitalize="sentences"
                maxLength={150}
                showCharCount
              />

              {/* bio */}
              <Input
                label="О себе"
                value={bio}
                onChangeText={setBio}
                placeholder="Опыт работы, специализация..."
                autoCapitalize="sentences"
                multiline
                numberOfLines={5}
                minHeight={120}
                maxLength={1000}
                showCharCount
              />

              {/* contacts */}
              <Input
                label="Контакты / ссылки"
                value={contacts}
                onChangeText={setContacts}
                placeholder="Telegram: @username"
                autoCapitalize="none"
                maxLength={200}
                showCharCount
              />

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.btn}
              >
                Завершить регистрацию
              </Button>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={styles.skipBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>Пропустить</Text>
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
  form: {
    gap: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
    marginTop: 2,
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
