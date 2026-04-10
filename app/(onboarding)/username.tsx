import React, { useState, useEffect, useMemo } from 'react';
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
import { Colors, Spacing, Typography } from '../../constants/Colors';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { api, ApiError } from '../../lib/api';
import { generateUsername } from '../../lib/transliterate';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

function validateUsername(value: string): string | null {
  if (value.length < 3) return 'Минимум 3 символа';
  if (value.length > 20) return 'Максимум 20 символов';
  if (!USERNAME_REGEX.test(value)) return 'Только буквы, цифры и символ _';
  return null;
}

export default function UsernameScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  function handleUsernameChange(value: string) {
    setUsername(value);
    setUsernameEdited(true);
    if (error) setError('');
  }

  function handleNameChange() {
    if (error) setError('');
  }

  async function handleSubmit() {
    const trimmedUsername = username.trim();
    const validationError = validateUsername(trimmedUsername);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!firstName.trim()) {
      setError('Введите имя');
      return;
    }
    if (!lastName.trim()) {
      setError('Введите фамилию');
      return;
    }

    setError('');
    setLoading(true);
    try {
      // Save username + name in one patch
      await api.patch('/users/me/username', {
        username: trimmedUsername,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      router.replace('/(onboarding)/cities');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Этот ник уже занят, попробуйте другой');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось сохранить. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  }

  const usernameValidationError = validateUsername(username.trim());
  const canSubmit = !usernameValidationError && firstName.trim().length > 0 && lastName.trim().length > 0;

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
            <OnboardingProgress currentStep={1} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.step}>Шаг 1 из 5</Text>
              <Text style={styles.title}>Представьтесь</Text>
              <Text style={styles.subtitle}>
                Ваши имя и фамилия. Ник сгенерируется автоматически — можно изменить.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Имя"
                value={firstName}
                onChangeText={(t) => { setFirstName(t); handleNameChange(); }}
                placeholder="Иван"
                autoCapitalize="words"
                autoFocus
              />
              <Input
                label="Фамилия"
                value={lastName}
                onChangeText={(t) => { setLastName(t); handleNameChange(); }}
                placeholder="Иванов"
                autoCapitalize="words"
              />
              <Input
                label="Ник (уникальный)"
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="ivan_ivanov"
                autoCapitalize="none"
                autoCorrect={false}
                error={error}
                maxLength={20}
              />
              {suggestedUsername && !usernameEdited && (
                <Text style={styles.hint}>
                  Автоматически: {suggestedUsername}
                </Text>
              )}
              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !canSubmit}
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
  form: {
    gap: Spacing.lg,
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  btn: {
    width: '100%',
    marginTop: Spacing.sm,
  },
});
