import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError, setRefreshToken } from '../../lib/api';
import { useAuth } from '../../stores/authStore';
import { secureStorage } from '../../stores/storage';
import { Colors } from '../../constants/Colors';

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
          <View className="flex-1 items-center px-6 py-6" style={{ gap: 24 }}>
            {/* Back */}
            <View className="w-full" style={{ maxWidth: 300 }}>
              <Pressable
                onPress={() => router.back()}
                className="flex-row items-center gap-1 py-1"
                accessibilityRole="button"
                accessibilityLabel="Изменить email"
              >
                <Feather name="arrow-left" size={20} color={Colors.brandPrimary} />
                <Text className="text-sm" style={{ color: Colors.brandPrimary }}>Изменить email</Text>
              </Pressable>
            </View>

            {/* Header — matching proto: title + subtitle with email */}
            <View className="items-center" style={{ gap: 4, marginTop: 24 }}>
              <Text className="text-xl font-bold" style={{ color: Colors.textPrimary }}>Введите код</Text>
              <Text className="text-sm" style={{ color: Colors.textMuted }}>Код отправлен на {email}</Text>
            </View>

            {/* OTP inputs — proto: 44x52, border 1.5, borderRadius 6 */}
            <View className="flex-row justify-center" style={{ gap: 8 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  className="items-center justify-center"
                  style={{
                    width: 44,
                    height: 52,
                    borderWidth: 1.5,
                    borderColor: error ? Colors.statusError : digits[i] ? Colors.brandPrimary : Colors.border,
                    borderRadius: 6,
                    backgroundColor: Colors.bgCard,
                  }}
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
                    className="h-full w-full text-center font-bold"
                    style={{
                      fontSize: 22,
                      color: error ? Colors.statusError : Colors.textPrimary,
                      outlineStyle: 'none' as any,
                    }}
                  />
                </View>
              ))}
            </View>

            {/* Error — proto: simple text, xs size */}
            {error ? (
              <Text className="text-center" style={{ fontSize: 11, color: Colors.statusError }}>{error}</Text>
            ) : null}

            {/* Attempt counter */}
            {attemptsUsed > 0 && attemptsUsed < MAX_ATTEMPTS && (
              <Text className="text-sm" style={{ color: Colors.textMuted }}>
                Попытка {attemptsUsed} из {MAX_ATTEMPTS}
              </Text>
            )}

            {/* Max attempts reached */}
            {attemptsUsed >= MAX_ATTEMPTS && (
              <Text className="text-center" style={{ fontSize: 11, color: Colors.statusError }}>
                Превышено количество попыток. Запросите новый код.
              </Text>
            )}

            {/* Submit — proto: h48, maxWidth 300, borderRadius 6 */}
            <Pressable
              onPress={handleVerify}
              disabled={loading || !isComplete || attemptsUsed >= MAX_ATTEMPTS}
              className="items-center justify-center w-full"
              style={{
                height: 48,
                backgroundColor: Colors.brandPrimary,
                borderRadius: 6,
                maxWidth: 300,
                opacity: loading || !isComplete || attemptsUsed >= MAX_ATTEMPTS ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text className="font-semibold" style={{ fontSize: 15, color: Colors.white }}>Подтвердить</Text>
              )}
            </Pressable>

            {/* Resend — proto: plain text, no icons */}
            {timer > 0 ? (
              <Text className="text-sm" style={{ color: Colors.textMuted }}>
                Отправить код повторно через {timer} сек
              </Text>
            ) : (
              <Pressable onPress={handleResend} disabled={resending}>
                <Text className="text-sm font-medium" style={{ color: Colors.brandPrimary }}>
                  {resending ? 'Отправляем...' : 'Отправить код повторно'}
                </Text>
              </Pressable>
            )}

            {/* Dev mode hint */}
            {isDev && (
              <View className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
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
