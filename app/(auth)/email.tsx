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
import { Footer } from '../../components/Footer';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { api, ApiError } from '../../lib/api';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { AuthProgress } from '../../components/AuthProgress';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '/api';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function EmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; redirectTo?: string }>();
  const redirectTo = params.redirectTo as string | undefined;

  const { isMobile } = useBreakpoints();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(role: 'CLIENT' | 'SPECIALIST') {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError('Введите корректный email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { email: trimmed });
      const redirectParam = redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : '';
      router.push(
        `/(auth)/otp?email=${encodeURIComponent(trimmed)}&role=${role}${redirectParam}`,
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
          <View style={styles.formArea}>
            <View style={[styles.container, !isMobile && styles.containerWide]}>
              <AuthProgress step={1} />

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
                  returnKeyType="go"
                />
              </View>

              <Text style={styles.hint}>
                Вход и регистрация — одно действие. Просто введите email.
              </Text>

              {/* Google OAuth */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={() => {
                  // Redirect to backend Google OAuth
                  const origin = typeof window !== 'undefined' ? window.location.origin : '';
                  window.location.href = `${API_BASE}/auth/google?state=${encodeURIComponent(origin)}`;
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Войти через Google"
              >
                <Text style={styles.googleBtnText}>Войти через Google</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>или</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Role buttons */}
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={styles.roleCard}
                  onPress={() => handleSubmit('CLIENT')}
                  disabled={loading}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Войти как клиент"
                >
                  <Text style={styles.roleCardIcon}>{'\u{1F50D}'}</Text>
                  <Text style={styles.roleCardTitle}>Я ищу специалиста</Text>
                  <Text style={styles.roleCardDesc}>
                    Опубликую запрос и получу предложения от консультантов
                  </Text>
                  <View style={styles.roleCardBtn}>
                    <Text style={styles.roleCardBtnText}>
                      {loading ? 'Отправляем...' : 'Получить код'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleCard, styles.roleCardSpecialist]}
                  onPress={() => handleSubmit('SPECIALIST')}
                  disabled={loading}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Войти как специалист"
                >
                  <Text style={styles.roleCardIcon}>{'\u{1F4BC}'}</Text>
                  <Text style={styles.roleCardTitleSpecialist}>Я специалист</Text>
                  <Text style={styles.roleCardDescSpecialist}>
                    Буду получать заявки от клиентов и предлагать свои услуги
                  </Text>
                  <View style={[styles.roleCardBtn, styles.roleCardBtnSpecialist]}>
                    <Text style={styles.roleCardBtnTextSpecialist}>
                      {loading ? 'Отправляем...' : 'Получить код'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <Footer />
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
  },
  formArea: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing['2xl'],
  },
  containerWide: {
    maxWidth: 520,
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
  hint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  googleBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  roleButtons: {
    gap: Spacing.lg,
  },
  roleCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing['2xl'],
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleCardSpecialist: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.statusBg.accent,
  },
  roleCardIcon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  roleCardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  roleCardTitleSpecialist: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
    textAlign: 'center',
  },
  roleCardDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  roleCardDescSpecialist: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textAccent,
    lineHeight: 20,
    textAlign: 'center',
  },
  roleCardBtn: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xs,
  },
  roleCardBtnSpecialist: {
    backgroundColor: Colors.brandPrimary,
  },
  roleCardBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  roleCardBtnTextSpecialist: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
