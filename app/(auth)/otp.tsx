import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from '../../components/Header';
import { auth } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth';

export default function OtpScreen() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const { email, role } = useLocalSearchParams<{ email: string; role?: string }>();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (error) setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleSubmit = async () => {
    const code = digits.join('');
    if (code.length < 6) { setError('Введите все 6 цифр'); return; }
    if (!email) { setError('Email не передан. Вернитесь и попробуйте снова.'); return; }
    setLoading(true);
    setError('');
    try {
      // Pass role (lowercase) so backend assigns it on first registration
      const normalizedRole = role ? role.toLowerCase() : 'client';
      const res = await auth.verifyOtp(email, code, normalizedRole);
      const data = (res as any).data ?? res;
      const isNewUser: boolean = data?.isNewUser ?? false;
      const userRole: string = data?.user?.role ?? role ?? 'CLIENT';

      // Sync AuthContext so downstream screens (onboarding) see the correct role
      // Without this, useAuth() returns role=null and specialist-only steps are skipped.
      try {
        const u = data?.user ?? {};
        await authLogin(
          data.accessToken,
          data.refreshToken,
          {
            id: u.userId ?? u.id ?? '',
            email: u.email ?? email,
            role: (u.role ?? userRole) as 'CLIENT' | 'SPECIALIST' | 'ADMIN',
            username: u.username ?? undefined,
            isNewUser,
          },
        );
      } catch {
        // Non-critical — tokens are already stored by verifyOtp
      }

      if (isNewUser) {
        // New user: start onboarding
        router.replace('/(onboarding)/username' as any);
      } else if (userRole === 'SPECIALIST') {
        router.replace('/(tabs)/specialist-dashboard' as any);
      } else {
        router.replace('/(tabs)/dashboard' as any);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Неверный код. Попробуйте ещё раз.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendTimer > 0) return;
    setResendLoading(true);
    setError('');
    try {
      await auth.requestOtp(email);
      setResendTimer(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Не удалось отправить код.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Подтверждение" onBack={() => router.back()} />
      <View className="flex-1 items-center bg-white px-4 py-8">
      <View className="w-full max-w-sm">
        <Pressable className="flex-row items-center gap-1 py-1" onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#475569" />
          <Text className="text-sm text-textSecondary">Изменить email</Text>
        </Pressable>
      </View>
      <View className="mt-6 items-center gap-2">
        <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
          <Feather name="mail" size={28} color="#0284C7" />
        </View>
        <Text className="text-xl font-bold text-textPrimary">Введите код</Text>
        <View className="flex-row items-center">
          <Text className="text-base text-textMuted">Код отправлен на </Text>
          <Text className="text-base font-medium text-textPrimary">{email ?? '...'}</Text>
        </View>
      </View>
      <View className="mt-5 flex-row justify-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} className={`h-14 w-12 items-center justify-center rounded-lg border-2 ${error ? 'border-red-500 bg-red-50' : digits[i] ? 'border-brandPrimary bg-bgSecondary' : 'border-gray-200 bg-white'}`}>
            <TextInput
              ref={(ref) => { inputRefs.current[i] = ref; }}
              value={digits[i]}
              onChangeText={(v) => handleDigitChange(i, v)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
              className="h-full w-full text-center text-2xl font-bold text-textPrimary"
              style={{ outlineStyle: 'none' } as any}
            />
          </View>
        ))}
      </View>
      {error ? (
        <View className="mt-3 flex-row items-center gap-1 rounded-lg bg-red-50 px-3 py-2">
          <Feather name="alert-circle" size={14} color="#DC2626" />
          <Text className="text-sm font-medium text-red-600">{error}</Text>
        </View>
      ) : null}
      <Pressable onPress={handleSubmit} disabled={loading} className={`mt-4 h-12 w-full max-w-xs items-center justify-center rounded-lg bg-brandPrimary ${loading ? 'opacity-60' : ''}`}>
        <Text className="text-base font-semibold text-white">{loading ? 'Проверка...' : 'Подтвердить'}</Text>
      </Pressable>
      <View className="mt-3 flex-row items-center gap-1">
        {resendTimer > 0 ? (
          <>
            <Feather name="clock" size={14} color="#94A3B8" />
            <Text className="text-sm text-textMuted">Отправить повторно через {resendTimer} сек</Text>
          </>
        ) : (
          <Pressable onPress={handleResend} disabled={resendLoading} className="flex-row items-center gap-1">
            <Feather name="refresh-cw" size={14} color="#0284C7" />
            <Text className="text-sm font-medium text-brandPrimary">
              {resendLoading ? 'Отправка...' : 'Отправить код повторно'}
            </Text>
          </Pressable>
        )}
      </View>
      </View>
    </View>
  );
}
