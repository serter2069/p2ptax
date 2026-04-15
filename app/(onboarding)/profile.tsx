import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { api, ApiError, tryRefreshTokens, getToken } from '../../lib/api';
import { useAuth, AuthUser } from '../../stores/authStore';

// Phone mask: +7 (XXX) XXX-XX-XX
function formatPhone(raw: string): string {
  // Keep only digits
  const digits = raw.replace(/\D/g, '');

  // Ensure starts with 7
  let d = digits;
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7') && d.length > 0) d = '7' + d;

  if (d.length === 0) return '';
  if (d.length <= 1) return '+7';
  if (d.length <= 4) return `+7 (${d.slice(1)}`;
  if (d.length <= 7) return `+7 (${d.slice(1, 4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}

function unformatPhone(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

export default function ProfileScreen() {
  const router = useRouter();
  const { completeOnboarding, login, user } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSpecialist = user?.role === 'SPECIALIST';

  function handlePhoneChange(text: string) {
    const formatted = formatPhone(text);
    setPhone(formatted);
  }

  function handleTelegramChange(text: string) {
    // Auto-prefix @ if not present
    if (text.length > 0 && !text.startsWith('@')) {
      setTelegram('@' + text);
    } else {
      setTelegram(text);
    }
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      // Save firstName, lastName, phone to User model
      const profileData: Record<string, string> = {};
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const rawPhone = unformatPhone(phone);

      if (trimmedFirstName) profileData.firstName = trimmedFirstName;
      if (trimmedLastName) profileData.lastName = trimmedLastName;
      if (rawPhone.length > 1) profileData.phone = '+' + rawPhone;

      if (Object.keys(profileData).length > 0) {
        await api.patch('/users/me/profile', profileData);
      }

      // Read all previously saved onboarding data
      const [citiesRaw, fnsRaw, servicesRaw] = await Promise.all([
        AsyncStorage.getItem('onboarding_cities'),
        AsyncStorage.getItem('onboarding_fns'),
        AsyncStorage.getItem('onboarding_services'),
      ]);

      const cities: string[] = citiesRaw ? JSON.parse(citiesRaw) : [];
      const services: string[] = servicesRaw ? JSON.parse(servicesRaw) : [];
      const fnsOffices: string[] = fnsRaw ? JSON.parse(fnsRaw) : [];

      const specialistBody: Record<string, unknown> = {
        cities,
        services,
      };

      if (fnsOffices.length > 0) specialistBody.fnsOffices = fnsOffices;

      // Build display name from first + last name
      const displayName = [trimmedFirstName, trimmedLastName].filter(Boolean).join(' ');
      if (displayName) specialistBody.displayName = displayName;

      const trimmedBio = bio.trim();
      const trimmedTelegram = telegram.trim();
      if (trimmedBio) specialistBody.bio = trimmedBio;
      if (trimmedTelegram) specialistBody.telegram = trimmedTelegram;

      await api.patch('/users/me/specialist-profile', specialistBody);

      // Refresh JWT so the new token carries SPECIALIST role
      await tryRefreshTokens();
      const freshToken = await getToken();
      if (freshToken) {
        const freshUser = await api.get<{
          id: string;
          email: string;
          role: string;
          username: string | null;
        }>('/users/me');
        await login(freshToken, {
          userId: freshUser.id,
          email: freshUser.email,
          role: freshUser.role,
          username: freshUser.username,
          isNewUser: false,
        } as AuthUser);
      }

      // Mark onboarding complete
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
            <OnboardingProgress currentStep={3} totalSteps={3} />

            {/* Progress text */}
            <View style={styles.progressBar}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '100%' }]} />
              </View>
              <Text style={styles.stepText}>Шаг 3 из 3</Text>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Заполните профиль</Text>
              <Text style={styles.subtitle}>
                Эта информация поможет клиентам выбрать вас
              </Text>
            </View>

            {/* Avatar placeholder */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={28} color={Colors.brandPrimary} />
              </View>
              <View>
                <Pressable style={styles.avatarBtn}>
                  <Feather name="camera" size={14} color={Colors.brandPrimary} />
                  <Text style={styles.avatarBtnText}>Загрузить фото</Text>
                </Pressable>
                <Text style={styles.avatarHint}>JPG или PNG, до 5 МБ</Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Имя"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Иван"
                autoCapitalize="words"
              />

              <Input
                label="Фамилия"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Иванов"
                autoCapitalize="words"
              />

              <Input
                label="Телефон"
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="+7 (XXX) XXX-XX-XX"
                keyboardType="phone-pad"
              />

              <Input
                label="Telegram"
                value={telegram}
                onChangeText={handleTelegramChange}
                placeholder="@username"
                autoCapitalize="none"
              />

              {isSpecialist && (
                <Input
                  label="О себе"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Расскажите о вашем опыте..."
                  autoCapitalize="sentences"
                  multiline
                  numberOfLines={4}
                  minHeight={100}
                  maxLength={1000}
                  showCharCount
                />
              )}

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.btn}
              >
                Завершить
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
  },
  container: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  progressBar: {
    gap: Spacing.xs,
  },
  progressTrack: {
    height: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgSecondary,
  },
  progressFill: {
    height: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.statusSuccess,
  },
  stepText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  header: {
    gap: Spacing.xs,
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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.textMuted,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatarBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
  },
  avatarHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
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
});
