import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/Button';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../stores/authStore';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

interface VerifyOtpResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; role?: string }>();
  const email = decodeURIComponent(params.email ?? '');
  const role = params.role === 'SPECIALIST' ? 'SPECIALIST' : 'CLIENT';

  const { login } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  const inputs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const code = digits.join('');

  function handleDigitChange(value: string, index: number) {
    // Accept paste of full code
    if (value.length === CODE_LENGTH && /^\d+$/.test(value)) {
      const next = value.split('').slice(0, CODE_LENGTH);
      setDigits(next);
      inputs.current[CODE_LENGTH - 1]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (error) setError('');

    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputs.current[index - 1]?.focus();
    }
  }

  const handleVerify = useCallback(async () => {
    if (code.length < CODE_LENGTH) {
      setError('Введите все 6 цифр кода');
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
      await login(res.accessToken, {
        userId: res.user.userId,
        email: res.user.email,
        role: res.user.role,
      });
      // Navigate based on role — expand when dashboards are ready
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Неверный код. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  }, [code, email, role, login, router]);

  // Auto-submit when all digits filled
  useEffect(() => {
    if (code.length === CODE_LENGTH && !loading) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleResend() {
    setResending(true);
    setError('');
    try {
      await api.post('/auth/request-otp', { email });
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimer(RESEND_SECONDS);
      inputs.current[0]?.focus();
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
            {/* Back */}
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Text style={styles.backText}>← Назад</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Введите код</Text>
              <Text style={styles.subtitle}>
                Отправили код на{' '}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            {/* OTP boxes */}
            <View style={styles.otpRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputs.current[i] = ref; }}
                  value={d}
                  onChangeText={(v) => handleDigitChange(v, i)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, i)
                  }
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH} // allow paste
                  style={[
                    styles.otpBox,
                    d ? styles.otpBoxFilled : null,
                    error ? styles.otpBoxError : null,
                  ]}
                  selectionColor={Colors.brandPrimary}
                  textAlign="center"
                />
              ))}
            </View>

            {/* Error */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Submit */}
            <Button
              onPress={handleVerify}
              loading={loading}
              disabled={!isComplete || loading}
              style={styles.btn}
            >
              Войти
            </Button>

            {/* Resend */}
            <View style={styles.resendRow}>
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  Отправить повторно через {timer} с
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resending}
                >
                  <Text style={styles.resendText}>
                    {resending ? 'Отправляем...' : 'Отправить код повторно'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Dev hint */}
            {__DEV__ && (
              <View style={styles.devHint}>
                <Text style={styles.devHintText}>DEV: код — 000000</Text>
              </View>
            )}
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
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing['2xl'],
    alignItems: 'center',
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  backText: {
    fontSize: Typography.fontSize.base,
    color: Colors.brandPrimary,
  },
  header: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
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
  emailHighlight: {
    color: Colors.textAccent,
    fontWeight: Typography.fontWeight.medium,
  },
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  otpBoxFilled: {
    borderColor: Colors.brandPrimary,
  },
  otpBoxError: {
    borderColor: Colors.statusError,
  },
  error: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
  },
  resendRow: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  resendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  devHint: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.statusWarning,
  },
  devHintText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusWarning,
  },
});
