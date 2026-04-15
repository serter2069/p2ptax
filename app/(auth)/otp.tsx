import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError, setRefreshToken } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { secureStorage } from '../../stores/storage';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 3;

interface VerifyOtpResponse {
  accessToken: string;
  refreshToken?: string;
  isNewUser: boolean;
  user: {
    userId: string;
    email: string;
    role: string;
    username: string | null;
  };
}

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; role?: string; redirectTo?: string }>();
  const email = decodeURIComponent(params.email ?? '');
  const redirectTo = params.redirectTo as string | undefined;
  const role = params.role === 'SPECIALIST' ? 'SPECIALIST' : 'CLIENT';

  const { login, clearNewUser } = useAuth();

  // Redirect to email screen if opened directly without email param
  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/email');
    }
  }, [email, router]);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const submittedRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const code = digits.join('');

  function handleDigitChange(value: string, index: number) {
    // Accept paste of full code
    if (value.length >= CODE_LENGTH && /^\d+$/.test(value)) {
      const next = value.split('').slice(0, CODE_LENGTH);
      setDigits(next);
      inputRefs.current[CODE_LENGTH - 1]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (error) setError('');

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  const handleVerify = useCallback(async () => {
    if (loading || submittedRef.current) return;
    submittedRef.current = true;
    if (code.length < CODE_LENGTH) {
      setError('Введите все 6 цифр');
      submittedRef.current = false;
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post<VerifyOtpResponse>('/auth/verify-otp', {
        email,
        code,
        role: role.toLowerCase(),
      });
      if (res.refreshToken) {
        await setRefreshToken(res.refreshToken);
      }
      await login(res.accessToken, {
        userId: res.user.userId,
        email: res.user.email,
        role: res.user.role,
        username: res.user.username,
        isNewUser: res.isNewUser,
      });
      if (res.isNewUser) {
        if (res.user.role === 'SPECIALIST') {
          router.replace('/(onboarding)/username');
        } else {
          await clearNewUser();
          const pendingRaw = await secureStorage.getItem('p2ptax_pending_request');
          if (pendingRaw) {
            try {
              await secureStorage.removeItem('p2ptax_pending_request');
              const pendingData = JSON.parse(pendingRaw);
              const created = await api.post<{ id: string }>('/requests', pendingData);
              router.replace(`/(dashboard)/my-requests/${created.id}` as any);
              return;
            } catch {
              // POST failed — fall through to dashboard
            }
          }
          router.replace('/(dashboard)');
        }
      } else {
        const pendingRaw = await secureStorage.getItem('p2ptax_pending_request');
        if (pendingRaw && res.user.role === 'CLIENT') {
          try {
            await secureStorage.removeItem('p2ptax_pending_request');
            const pendingData = JSON.parse(pendingRaw);
            const created = await api.post<{ id: string }>('/requests', pendingData);
            router.replace(`/(dashboard)/my-requests/${created.id}` as any);
            return;
          } catch {
            // POST failed — fall through to normal dashboard redirect
          }
        }
        router.replace((redirectTo || '/(dashboard)') as any);
      }
    } catch (err) {
      submittedRef.current = false;
      setAttemptsUsed((prev) => prev + 1);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Неверный код. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  }, [code, email, role, login, router, loading, clearNewUser, redirectTo]);

  // Auto-submit when all digits filled
  useEffect(() => {
    if (code.length === CODE_LENGTH && !loading) {
      handleVerify();
    }
  }, [code]);

  async function handleResend() {
    setResending(true);
    setError('');
    submittedRef.current = false;
    try {
      await api.post('/auth/request-otp', { email });
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimer(RESEND_SECONDS);
      setAttemptsUsed(0);
      inputRefs.current[0]?.focus();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось отправить код.');
      }
    } finally {
      setResending(false);
    }
  }

  const isComplete = code.length === CODE_LENGTH;
  const isDev = process.env.EXPO_PUBLIC_API_URL?.includes('localhost') || process.env.NODE_ENV === 'development';

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
            {/* Back */}
            <View className="w-full max-w-sm">
              <Pressable
                onPress={() => router.back()}
                className="flex-row items-center gap-1 py-1"
                accessibilityRole="button"
                accessibilityLabel="Изменить email"
              >
                <Feather name="arrow-left" size={20} color="#475569" />
                <Text className="text-sm text-textSecondary">Изменить email</Text>
              </Pressable>
            </View>

            {/* Header */}
            <View className="mt-6 items-center gap-2">
              <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
                <Feather name="mail" size={28} color="#0284C7" />
              </View>
              <Text className="text-xl font-bold text-textPrimary">Введите код</Text>
              <View className="flex-row flex-wrap justify-center items-center">
                <Text className="text-base text-textMuted">Код отправлен на </Text>
                <Text className="text-base font-medium text-textPrimary">{email}</Text>
              </View>
            </View>

            {/* OTP inputs */}
            <View className="mt-5 flex-row justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  className={`h-14 w-12 items-center justify-center rounded-lg border-2 ${
                    error
                      ? 'border-red-500 bg-red-50'
                      : digits[i]
                        ? 'border-brandPrimary bg-bgSecondary'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <TextInput
                    ref={(ref) => { inputRefs.current[i] = ref; }}
                    value={digits[i]}
                    onChangeText={(v) => handleDigitChange(v, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH}
                    selectTextOnFocus
                    editable={!loading}
                    className="h-full w-full text-center text-2xl font-bold text-textPrimary"
                    style={{ outlineStyle: 'none' as any }}
                  />
                </View>
              ))}
            </View>

            {/* Error */}
            {error ? (
              <View className="mt-3 flex-row items-center gap-1 rounded-lg bg-red-50 px-3 py-2">
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text className="text-sm font-medium text-red-600">{error}</Text>
              </View>
            ) : null}

            {/* Attempt counter */}
            {attemptsUsed > 0 && attemptsUsed < MAX_ATTEMPTS && (
              <Text className="mt-2 text-sm text-textMuted">
                Попытка {attemptsUsed} из {MAX_ATTEMPTS}
              </Text>
            )}

            {/* Max attempts reached */}
            {attemptsUsed >= MAX_ATTEMPTS && (
              <View className="mt-3 flex-row items-center gap-1 rounded-lg bg-red-50 px-3 py-2">
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text className="text-sm font-medium text-red-600">
                  Превышено количество попыток. Запросите новый код.
                </Text>
              </View>
            )}

            {/* Submit */}
            <Pressable
              onPress={handleVerify}
              disabled={loading || !isComplete || attemptsUsed >= MAX_ATTEMPTS}
              className={`mt-4 h-12 w-full max-w-xs items-center justify-center rounded-lg bg-brandPrimary ${
                loading || !isComplete || attemptsUsed >= MAX_ATTEMPTS ? 'opacity-60' : ''
              }`}
            >
              <Text className="text-base font-semibold text-white">
                {loading ? 'Проверка...' : 'Подтвердить'}
              </Text>
            </Pressable>

            {/* Resend */}
            <View className="mt-3 flex-row items-center gap-1">
              {timer > 0 ? (
                <>
                  <Feather name="clock" size={14} color="#94A3B8" />
                  <Text className="text-sm text-textMuted">
                    Отправить повторно через {timer} сек
                  </Text>
                </>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={resending}
                  className="flex-row items-center gap-1"
                >
                  <Feather name="refresh-cw" size={14} color="#0284C7" />
                  <Text className="text-sm font-medium text-brandPrimary">
                    {resending ? 'Отправляем...' : 'Отправить код повторно'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Dev mode hint */}
            {isDev && (
              <View className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
                <Text className="text-xs text-yellow-700">
                  В режиме разработки код: 000000
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
