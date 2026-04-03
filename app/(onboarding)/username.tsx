import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { api, ApiError } from '../../lib/api';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

function validateUsername(value: string): string | null {
  if (value.length < 3) return 'Минимум 3 символа';
  if (value.length > 20) return 'Максимум 20 символов';
  if (!USERNAME_REGEX.test(value)) return 'Только буквы, цифры и символ _';
  return null;
}

export default function UsernameScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(value: string) {
    setUsername(value);
    if (error) setError('');
  }

  async function handleSubmit() {
    const trimmed = username.trim();
    const validationError = validateUsername(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.patch('/users/me/username', { username: trimmed });
      // Do NOT call completeOnboarding here — onboarding continues in fns + services steps
      router.replace('/(onboarding)/fns');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Этот ник уже занят, попробуйте другой');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось сохранить ник. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  }

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
            {/* Progress — 4 steps */}
            <View style={styles.progressRow}>
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressLine} />
              <View style={styles.progressDot} />
              <View style={styles.progressLine} />
              <View style={styles.progressDot} />
              <View style={styles.progressLine} />
              <View style={styles.progressDot} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.step}>Шаг 1 из 4</Text>
              <Text style={styles.title}>Придумайте ник</Text>
              <Text style={styles.subtitle}>
                Это ваш публичный псевдоним на платформе. Можно изменить позже.
              </Text>
            </View>

            {/* Rules hint */}
            <View style={styles.rulesBox}>
              <Text style={styles.rulesText}>
                3–20 символов: буквы, цифры, знак подчёркивания (_)
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Ник"
                value={username}
                onChangeText={handleChange}
                placeholder="например: ivan_petrov"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                error={error}
                maxLength={20}
              />
              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || validateUsername(username.trim()) !== null}
                style={styles.btn}
              >
                Продолжить
              </Button>
            </View>
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
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing['2xl'],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginTop: Spacing.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.brandPrimary,
    width: 12,
    height: 12,
    borderRadius: BorderRadius.sm,
  },
  progressLine: {
    width: 32,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  step: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  header: {
    gap: Spacing.sm,
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
  rulesBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rulesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  form: {
    gap: Spacing.lg,
  },
  btn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
});
