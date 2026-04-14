import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function Screen({ initialValue, initialError, initialChecking, initialAvailable }: {
  initialValue?: string; initialError?: string; initialChecking?: boolean; initialAvailable?: boolean;
}) {
  const [value, setValue] = useState(initialValue || '');
  const [error, setError] = useState(initialError || '');
  const [checking, setChecking] = useState(!!initialChecking);
  const [available, setAvailable] = useState(!!initialAvailable);

  const handleChange = (t: string) => {
    setValue(t);
    setError('');
    setAvailable(false);
    if (t.length >= 3) {
      setChecking(true);
      // Simulated check
      setTimeout(() => {
        setChecking(false);
        if (t.toLowerCase() === 'elena') {
          setError('Это имя уже занято');
        } else {
          setAvailable(true);
        }
      }, 800);
    }
  };

  const handleContinue = () => {
    if (value.length < 3) {
      setError('Имя должно содержать минимум 3 символа');
    }
  };

  const getInputState = () => {
    if (error) return 'error';
    if (available) return 'success';
    if (checking) return 'checking';
    return 'default';
  };
  const inputState = getInputState();

  return (
    <View style={s.container}>
      {/* Progress */}
      <View style={s.progressWrap}>
        <View style={s.progressTrack}>
          <View style={[s.progressBar, { width: '33%' }]} />
        </View>
        <Text style={s.step}>Шаг 1 из 3</Text>
      </View>

      {/* Header */}
      <View style={s.headerWrap}>
        <Text style={s.title}>Как вас зовут?</Text>
        <Text style={s.subtitle}>Это имя будет видно клиентам в вашем профиле</Text>
      </View>

      {/* Form */}
      <View style={s.form}>
        <Text style={s.label}>Имя пользователя</Text>
        <View style={[
          s.inputWrap,
          inputState === 'error' && s.inputError,
          inputState === 'success' && s.inputSuccess,
        ]}>
          <Feather
            name="user"
            size={18}
            color={inputState === 'error' ? Colors.statusError : inputState === 'success' ? Colors.statusSuccess : Colors.textMuted}
          />
          <TextInput
            value={value}
            onChangeText={handleChange}
            placeholder="Например: Елена Васильева"
            placeholderTextColor={Colors.textMuted}
            style={s.input}
          />
          {checking && <ActivityIndicator size="small" color={Colors.brandPrimary} />}
          {available && <Feather name="check-circle" size={18} color={Colors.statusSuccess} />}
          {error && <Feather name="x-circle" size={18} color={Colors.statusError} />}
        </View>

        {/* Feedback messages */}
        {error ? (
          <View style={s.feedbackRow}>
            <Feather name="alert-circle" size={14} color={Colors.statusError} />
            <Text style={s.feedbackError}>{error}</Text>
          </View>
        ) : available ? (
          <View style={s.feedbackRow}>
            <Feather name="check-circle" size={14} color={Colors.statusSuccess} />
            <Text style={s.feedbackSuccess}>Имя свободно</Text>
          </View>
        ) : checking ? (
          <View style={s.feedbackRow}>
            <ActivityIndicator size={14} color={Colors.textMuted} />
            <Text style={s.feedbackChecking}>Проверяем доступность...</Text>
          </View>
        ) : null}
      </View>

      {/* Continue button */}
      <Pressable
        onPress={handleContinue}
        style={[s.btn, (!available && !initialAvailable) ? s.btnDisabled : null]}
        disabled={!available && !initialAvailable}
      >
        <Text style={s.btnText}>Продолжить</Text>
        <Feather name="arrow-right" size={16} color={Colors.white} />
      </Pressable>
    </View>
  );
}

export function OnboardingUsernameStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <Screen />
      </StateSection>

      <StateSection title="CHECKING">
        <Screen initialValue="Елена Васильева" initialChecking />
      </StateSection>

      <StateSection title="TAKEN">
        <Screen initialValue="elena" initialError="Это имя уже занято" />
      </StateSection>

      <StateSection title="AVAILABLE">
        <Screen initialValue="Елена Васильева" initialAvailable />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    backgroundColor: Colors.bgPrimary,
  },

  // Progress
  progressWrap: {
    gap: Spacing.sm,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.brandPrimary,
    borderRadius: 2,
  },
  step: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Header
  headerWrap: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    lineHeight: 22,
  },

  // Form
  form: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  inputError: {
    borderColor: Colors.statusError,
    backgroundColor: Colors.statusBg.error,
  },
  inputSuccess: {
    borderColor: Colors.statusSuccess,
    backgroundColor: Colors.statusBg.success,
  },

  // Feedback
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackError: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
  },
  feedbackSuccess: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },
  feedbackChecking: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  // Button
  btn: {
    height: 48,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});
