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
      // Do NOT call completeOnboarding here — onboarding continues in cities + services steps
      router.replace('/(onboarding)/cities');
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
            {/* Header */}
            <View style={styles.header}>
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
                disabled={loading || username.trim().length < 3}
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
