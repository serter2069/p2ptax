import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { generateUsername } from '../../lib/transliterate';

const DEBOUNCE_MS = 500;

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export default function UsernameScreen() {
  const router = useRouter();

  const [value, setValue] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced availability check via auto-generated username
  const checkAvailability = useCallback((name: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (name.length < 2) {
      setAvailable(false);
      setError('');
      setChecking(false);
      return;
    }

    const { firstName, lastName } = splitName(name);
    const username = generateUsername(firstName, lastName);
    if (!username) {
      setAvailable(false);
      setError('');
      setChecking(false);
      return;
    }

    setChecking(true);
    setAvailable(false);
    setError('');

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean }>(
          `/users/check-username?username=${encodeURIComponent(username)}`,
        );
        if (res.available) {
          setAvailable(true);
          setError('');
        } else {
          setAvailable(false);
          setError('Это имя уже занято');
        }
      } catch {
        setError('Не удалось проверить доступность');
        setAvailable(false);
      } finally {
        setChecking(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    checkAvailability(value.trim());
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, checkAvailability]);

  function handleChange(text: string) {
    setValue(text);
    setError('');
    setAvailable(false);
  }

  async function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError('Минимум 2 символа');
      return;
    }

    const { firstName, lastName } = splitName(trimmed);
    const username = generateUsername(firstName, lastName);

    if (!username) {
      setError('Введите имя и фамилию');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/users/me/username', {
        username,
        firstName: firstName || trimmed,
        lastName: lastName || '',
      });
      router.replace('/(onboarding)/cities');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Это имя уже занято, попробуйте другое');
        setAvailable(false);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось сохранить. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  }

  const canContinue = available && agreed && value.trim().length >= 2 && !loading;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-4 py-6">
            {/* Progress */}
            <View className="mb-1 h-1 rounded-full bg-bgSecondary">
              <View className="h-1 rounded-full bg-brandPrimary" style={{ width: '33%' }} />
            </View>
            <Text className="mb-4 text-xs uppercase tracking-wider text-textMuted">Шаг 1 из 5</Text>

            {/* Header */}
            <Text className="text-xl font-bold text-textPrimary">Как вас зовут?</Text>
            <Text className="mb-4 text-base leading-6 text-textMuted">Это имя будет видно клиентам в вашем профиле</Text>

            {/* Input */}
            <Text className="mb-1 text-sm font-medium text-textSecondary">Имя пользователя</Text>
            <View className={`mb-1 h-12 flex-row items-center gap-2 rounded-lg border px-4 ${error ? 'border-red-500 bg-red-50' : available ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'}`}>
              <Feather name="user" size={18} color={error ? '#DC2626' : available ? '#15803D' : '#94A3B8'} />
              <TextInput
                value={value}
                onChangeText={handleChange}
                placeholder="Например: Елена Васильева"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                autoFocus
                className="flex-1 text-base text-textPrimary"
                style={{ outlineStyle: 'none' as any }}
              />
              {checking && <ActivityIndicator size="small" color="#94A3B8" />}
              {!checking && available && <Feather name="check-circle" size={18} color="#15803D" />}
              {!checking && error ? <Feather name="x-circle" size={18} color="#DC2626" /> : null}
            </View>

            {error ? (
              <View className="mb-2 flex-row items-center gap-1">
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            ) : available ? (
              <View className="mb-2 flex-row items-center gap-1">
                <Feather name="check-circle" size={14} color="#15803D" />
                <Text className="text-sm font-medium text-green-700">Имя свободно</Text>
              </View>
            ) : null}

            {/* Terms checkbox */}
            <Pressable className="mt-3 flex-row items-start gap-2" onPress={() => setAgreed(!agreed)}>
              <View className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${agreed ? 'border-brandPrimary bg-brandPrimary' : 'border-gray-300 bg-white'}`}>
                {agreed && <Feather name="check" size={13} color="#fff" />}
              </View>
              <Text className="flex-1 text-sm text-textSecondary">
                Принимаю <Text className="text-brandPrimary">условия использования</Text>
              </Text>
            </Pressable>

            {/* Continue */}
            <Pressable
              onPress={handleSubmit}
              disabled={!canContinue}
              className={`mt-6 h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${!canContinue ? 'opacity-40' : ''}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text className="text-base font-semibold text-white">Далее</Text>
                  <Feather name="arrow-right" size={16} color="#fff" />
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
