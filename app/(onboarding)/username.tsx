import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const DEBOUNCE_MS = 500;

function validateUsername(value: string): string | null {
  if (value.length === 0) return null; // empty — no error yet
  if (value.length < 3) return 'Минимум 3 символа';
  if (value.length > 20) return 'Максимум 20 символов';
  if (!USERNAME_REGEX.test(value)) return 'Только буквы (a-z), цифры и _';
  return null;
}

export default function UsernameScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-generate username from firstName + lastName
  const suggestedUsername = useMemo(
    () => generateUsername(firstName, lastName),
    [firstName, lastName],
  );

  useEffect(() => {
    if (!usernameEdited) {
      setUsername(suggestedUsername);
    }
  }, [suggestedUsername, usernameEdited]);

  // Debounced availability check
  const checkAvailability = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const validationError = validateUsername(value);
    if (validationError || value.length === 0) {
      setAvailable(null);
      setServerError('');
      setChecking(false);
      return;
    }

    setChecking(true);
    setAvailable(null);
    setServerError('');

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<{ available: boolean }>(
          `/users/check-username?username=${encodeURIComponent(value)}`,
        );
        setAvailable(res.available);
        if (!res.available) {
          setServerError('Этот ник уже занят');
        }
      } catch {
        setServerError('Не удалось проверить доступность');
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  // Trigger check when username changes
  useEffect(() => {
    checkAvailability(username.trim());
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, checkAvailability]);

  function handleUsernameChange(value: string) {
    setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    setUsernameEdited(true);
    setSubmitError('');
  }

  async function handleSubmit() {
    const trimmedUsername = username.trim();
    const validationError = validateUsername(trimmedUsername);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    if (!firstName.trim()) {
      setSubmitError('Введите имя');
      return;
    }
    if (!lastName.trim()) {
      setSubmitError('Введите фамилию');
      return;
    }

    setSubmitError('');
    setLoading(true);
    try {
      await api.patch('/users/me/username', {
        username: trimmedUsername,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      router.replace('/(onboarding)/cities');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError('Этот ник уже занят, попробуйте другой');
        setAvailable(false);
      } else if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Не удалось сохранить. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  }

  const clientError = validateUsername(username.trim());
  const hasError = !!clientError || !!serverError || !!submitError;
  const displayError = submitError || clientError || serverError;
  const canSubmit =
    !clientError &&
    available === true &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    !loading;

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
          <View className="flex-1 items-center px-4 py-8">
            <View className="w-full max-w-sm">
              {/* Progress */}
              <View className="mb-1 h-1 rounded-full bg-gray-100">
                <View className="h-1 rounded-full bg-brandPrimary" style={{ width: '20%' }} />
              </View>
              <Text className="mb-6 text-xs uppercase tracking-wider text-textMuted">
                Шаг 1 из 5
              </Text>

              {/* Header */}
              <View className="mb-1 h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                <Feather name="user" size={24} color="#0284C7" />
              </View>
              <Text className="mt-3 text-xl font-bold text-textPrimary">Представьтесь</Text>
              <Text className="mt-1 mb-6 text-base text-textMuted leading-relaxed">
                Имя и фамилия. Ник сгенерируется автоматически — можете изменить.
              </Text>

              {/* First name */}
              <Text className="mb-1 text-sm font-medium text-textSecondary">Имя</Text>
              <TextInput
                value={firstName}
                onChangeText={(t) => { setFirstName(t); setSubmitError(''); }}
                placeholder="Иван"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                autoFocus
                className="mb-4 h-12 rounded-lg border border-gray-200 bg-white px-4 text-base text-textPrimary"
                style={{ outlineStyle: 'none' as any }}
              />

              {/* Last name */}
              <Text className="mb-1 text-sm font-medium text-textSecondary">Фамилия</Text>
              <TextInput
                value={lastName}
                onChangeText={(t) => { setLastName(t); setSubmitError(''); }}
                placeholder="Иванов"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                className="mb-4 h-12 rounded-lg border border-gray-200 bg-white px-4 text-base text-textPrimary"
                style={{ outlineStyle: 'none' as any }}
              />

              {/* Username */}
              <Text className="mb-1 text-sm font-medium text-textSecondary">
                Ник (уникальный)
              </Text>
              <View
                className={`mb-1 h-12 flex-row items-center rounded-lg border px-4 ${
                  hasError && username.length > 0
                    ? 'border-red-500 bg-red-50'
                    : available === true
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 bg-white'
                }`}
              >
                <Feather
                  name="at-sign"
                  size={16}
                  color={
                    hasError && username.length > 0
                      ? '#DC2626'
                      : available === true
                        ? '#15803D'
                        : '#94A3B8'
                  }
                />
                <TextInput
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="ivan_ivanov"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  className="ml-2 flex-1 text-base text-textPrimary"
                  style={{ outlineStyle: 'none' as any }}
                />
                {checking && (
                  <ActivityIndicator size="small" color="#94A3B8" />
                )}
                {!checking && available === true && (
                  <Feather name="check-circle" size={18} color="#15803D" />
                )}
                {!checking && (available === false || (serverError && !checking)) && username.length > 0 && (
                  <Feather name="x-circle" size={18} color="#DC2626" />
                )}
              </View>

              {/* Status messages */}
              {displayError && username.length > 0 ? (
                <View className="mb-3 flex-row items-center gap-1">
                  <Feather name="alert-circle" size={14} color="#DC2626" />
                  <Text className="text-sm text-red-600">{displayError}</Text>
                </View>
              ) : available === true && !checking ? (
                <View className="mb-3 flex-row items-center gap-1">
                  <Feather name="check-circle" size={14} color="#15803D" />
                  <Text className="text-sm font-medium text-green-700">Ник свободен</Text>
                </View>
              ) : (
                <View className="mb-3" />
              )}

              {/* Auto-generated hint */}
              {suggestedUsername && !usernameEdited && username.length > 0 && (
                <Text className="mb-3 text-xs text-textMuted">
                  Автоматически: {suggestedUsername}
                </Text>
              )}

              {/* Continue button */}
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                className={`mt-2 h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${
                  !canSubmit ? 'opacity-40' : ''
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text className="text-base font-semibold text-white">Продолжить</Text>
                    <Feather name="arrow-right" size={16} color="#fff" />
                  </>
                )}
              </Pressable>

              {/* Submit error (separate from field errors) */}
              {submitError && !clientError && !serverError ? (
                <View className="mt-3 flex-row items-center gap-1 rounded-lg bg-red-50 px-3 py-2">
                  <Feather name="alert-circle" size={14} color="#DC2626" />
                  <Text className="text-sm font-medium text-red-600">{submitError}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
