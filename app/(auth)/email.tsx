import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LandingHeader } from '../../components/LandingHeader';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { api, ApiError } from '../../lib/api';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function EmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; redirectTo?: string }>();
  const hasExplicitRole = params.role === 'SPECIALIST' || params.role === 'CLIENT';
  const role = params.role === 'SPECIALIST' ? 'SPECIALIST' : 'CLIENT';
  const redirectTo = params.redirectTo as string | undefined;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError('Введите корректный email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { email: trimmed });
      const roleParam = hasExplicitRole ? `&role=${role}` : '';
      const redirectParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : '';
      router.push(
        `/(auth)/otp?email=${encodeURIComponent(trimmed)}${roleParam}${redirectParam}`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось отправить код. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LandingHeader />
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
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.back} accessibilityRole="button" accessibilityLabel="Назад">
              <Text style={styles.backText}>← Назад</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Введите email</Text>
              <Text style={styles.subtitle}>
                Мы отправим вам код для входа. Если вы новый пользователь — аккаунт создастся автоматически.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError('');
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                error={error}
                onSubmitEditing={handleSubmit}
                returnKeyType="go"
              />
              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.btn}
              >
                Получить код
              </Button>
            </View>

            <Text style={styles.hint}>
              Вход и регистрация — одно действие. Просто введите email.
            </Text>

            {role === 'SPECIALIST' ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Войти как клиент"
                onPress={() => {
                  const redirectParam = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : '';
                  router.replace(`/(auth)/email${redirectParam}`);
                }}
              >
                <Text style={styles.roleSwitchText}>
                  Вы клиент?{' '}
                  <Text style={styles.roleSwitchLink}>Войти как клиент</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Зарегистрироваться как специалист"
                onPress={() => {
                  const redirectParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : '';
                  router.replace(`/(auth)/email?role=SPECIALIST${redirectParam}`);
                }}
              >
                <Text style={styles.roleSwitchText}>
                  Вы специалист?{' '}
                  <Text style={styles.roleSwitchLink}>Зарегистрироваться как специалист</Text>
                </Text>
              </TouchableOpacity>
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
  form: {
    gap: Spacing.lg,
  },
  btn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  roleSwitchText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  roleSwitchLink: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
});
