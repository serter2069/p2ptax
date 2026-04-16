import React, { useState, useRef, useEffect } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from '../../components/Header';
import { auth } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth';
import { Button, Container, Heading, Screen, Text } from '../../components/ui';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/Colors';

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

      // Sync AuthContext so downstream screens (onboarding) see the correct role.
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
    <Screen>
      <Header variant="back" backTitle="Подтверждение" onBack={() => router.back()} />
      <Container>
        <View style={{ paddingVertical: Spacing['2xl'], gap: Spacing.lg, alignItems: 'center' }}>
          <View style={{ alignSelf: 'stretch' }}>
            <Button
              variant="ghost"
              size="md"
              onPress={() => router.back()}
              icon={<Feather name="arrow-left" size={18} color={Colors.brandPrimary} />}
            >
              Изменить email
            </Button>
          </View>

          <View style={{ alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm }}>
            <View
              style={{
                height: 64,
                width: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: Colors.bgSecondary,
              }}
            >
              <Feather name="mail" size={28} color={Colors.brandPrimary} />
            </View>
            <Heading level={3} align="center">Введите код</Heading>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Text variant="muted">Код отправлен на </Text>
              <Text variant="body" weight="medium">{email ?? '...'}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md }}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const filled = !!digits[i];
              const borderColor = error
                ? Colors.statusError
                : filled
                ? Colors.brandPrimary
                : Colors.borderLight;
              const bgColor = error ? Colors.bgSecondary : filled ? Colors.bgSecondary : Colors.white;
              return (
                <View
                  key={i}
                  style={{
                    height: 56,
                    width: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: BorderRadius.lg,
                    borderWidth: 2,
                    borderColor,
                    backgroundColor: bgColor,
                  }}
                >
                  <TextInput
                    ref={(ref) => { inputRefs.current[i] = ref; }}
                    value={digits[i]}
                    onChangeText={(v) => handleDigitChange(i, v)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading}
                    style={[
                      {
                        height: '100%',
                        width: '100%',
                        textAlign: 'center',
                        fontSize: Typography.fontSize['2xl'],
                        fontWeight: Typography.fontWeight.bold,
                        fontFamily: Typography.fontFamily.bold,
                        color: Colors.textPrimary,
                      },
                      Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {error ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                borderRadius: BorderRadius.lg,
                backgroundColor: Colors.bgSecondary,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
              }}
            >
              <Feather name="alert-circle" size={14} color={Colors.statusError} />
              <Text variant="caption" weight="medium" style={{ color: Colors.statusError }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ alignSelf: 'stretch', maxWidth: 320, width: '100%', alignItems: 'center' }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleSubmit}
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </Button>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs }}>
            {resendTimer > 0 ? (
              <>
                <Feather name="clock" size={14} color={Colors.textMuted} />
                <Text variant="caption">Отправить повторно через {resendTimer} сек</Text>
              </>
            ) : (
              <Pressable onPress={handleResend} disabled={resendLoading} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Feather name="refresh-cw" size={14} color={Colors.brandPrimary} />
                <Text variant="caption" weight="medium" style={{ color: Colors.brandPrimary }}>
                  {resendLoading ? 'Отправка...' : 'Отправить код повторно'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Container>
    </Screen>
  );
}
