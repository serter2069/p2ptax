import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { api, ApiError, tryRefreshTokens, getToken } from '../../lib/api';
import { useAuth, AuthUser } from '../../stores/authStore';

// Phone mask: +7 (XXX) XXX-XX-XX
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

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

const MAX_BIO_CHARS = 1000;

export default function ProfileScreen() {
  const router = useRouter();
  const { completeOnboarding, login, user } = useAuth();

  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [bio, setBio] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handlePhoneChange(text: string) {
    setPhone(formatPhone(text));
  }

  function handleTelegramChange(text: string) {
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
      // Save phone to User model
      const profileData: Record<string, string> = {};
      const rawPhone = unformatPhone(phone);

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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-[480px] px-5">
            {/* Progress bar */}
            <View className="mb-1 h-1 rounded-full bg-bgSecondary">
              <View className="h-1 rounded-full bg-green-600" style={{ width: '100%' }} />
            </View>
            <Text className="mb-4 text-xs uppercase tracking-wider text-textMuted">
              Шаг 3 из 3
            </Text>

            {/* Header */}
            <Text className="text-xl font-bold text-textPrimary">Расскажите о себе</Text>
            <Text className="mb-4 text-base text-textMuted">
              Эта информация поможет клиентам выбрать вас
            </Text>

            {/* Avatar */}
            <View className="mb-4 flex-row items-center gap-4">
              <View
                className={`h-16 w-16 items-center justify-center rounded-full ${
                  hasPhoto
                    ? 'bg-brandPrimary'
                    : 'border-2 border-dashed border-gray-300 bg-bgSecondary'
                }`}
              >
                <Feather name="user" size={28} color={hasPhoto ? '#fff' : '#0284C7'} />
              </View>
              <View>
                <Pressable
                  className="flex-row items-center gap-1"
                  onPress={() => setHasPhoto(true)}
                >
                  <Feather name="camera" size={14} color="#0284C7" />
                  <Text className="text-base font-medium text-brandPrimary">
                    {hasPhoto ? 'Изменить фото' : 'Загрузить фото'}
                  </Text>
                </Pressable>
                <Text className="text-xs text-textMuted">JPG или PNG, до 5 МБ</Text>
              </View>
            </View>

            {/* Bio */}
            <View className="mb-3">
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-sm font-medium text-textSecondary">О себе</Text>
                <Text
                  className={`text-xs ${
                    bio.length > MAX_BIO_CHARS ? 'text-red-600' : 'text-textMuted'
                  }`}
                >
                  {bio.length}/{MAX_BIO_CHARS}
                </Text>
              </View>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Расскажите о вашем опыте..."
                placeholderTextColor="#94A3B8"
                multiline
                className="rounded-lg border border-gray-200 p-3 text-base text-textPrimary"
                style={{
                  minHeight: 80,
                  textAlignVertical: 'top',
                  outlineStyle: 'none' as any,
                }}
                maxLength={MAX_BIO_CHARS}
              />
            </View>

            {/* Phone */}
            <View className="mb-3">
              <Text className="mb-1 text-sm font-medium text-textSecondary">Телефон</Text>
              <View className="h-12 flex-row items-center gap-2 rounded-lg border border-gray-200 px-4">
                <Feather name="phone" size={16} color="#94A3B8" />
                <TextInput
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="+7 (XXX) XXX-XX-XX"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 text-base text-textPrimary"
                  style={{ outlineStyle: 'none' as any }}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Telegram */}
            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-textSecondary">Telegram</Text>
              <View className="h-12 flex-row items-center gap-2 rounded-lg border border-gray-200 px-4">
                <Feather name="send" size={16} color="#94A3B8" />
                <TextInput
                  value={telegram}
                  onChangeText={handleTelegramChange}
                  placeholder="@username"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 text-base text-textPrimary"
                  style={{ outlineStyle: 'none' as any }}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Error */}
            {!!error && <Text className="mb-3 text-xs text-red-600">{error}</Text>}

            {/* Buttons */}
            <View className="flex-row gap-3">
              <Pressable
                className="h-12 flex-row items-center justify-center gap-1 rounded-lg border border-gray-200 px-4"
                onPress={() => router.back()}
              >
                <Feather name="arrow-left" size={16} color="#475569" />
                <Text className="text-base font-medium text-textSecondary">Назад</Text>
              </Pressable>
              <Pressable
                className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${
                  loading ? 'opacity-50' : ''
                }`}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text className="text-base font-semibold text-white">
                  {loading ? 'Сохранение...' : 'Завершить'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
