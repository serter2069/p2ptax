import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function AuthScreen({ initialEmail, initialError, initialLoading, initialSuccess }: {
  initialEmail?: string; initialError?: string; initialLoading?: boolean; initialSuccess?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail || '');
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(!!initialLoading);
  const [success, setSuccess] = useState(!!initialSuccess);

  const handleSubmit = () => {
    if (!email || !email.includes('@')) {
      setError('Введите корректный email адрес');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <View style={s.container}>
        <View style={s.successWrap}>
          <View style={s.successIcon}>
            <Feather name="check" size={32} color={Colors.statusSuccess} />
          </View>
          <Text style={s.successTitle}>Код отправлен</Text>
          <Text style={s.successSubtitle}>Проверьте почту {email}</Text>
          <View style={s.successDots}>
            <View style={[s.dot, s.dotActive]} />
            <View style={[s.dot, s.dotActive]} />
            <View style={s.dot} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.logoWrap}>
        <View style={s.logoIcon}>
          <Feather name="shield" size={32} color={Colors.brandPrimary} />
        </View>
        <Text style={s.logo}>Налоговик</Text>
        <Text style={s.tagline}>Найдите налогового специалиста</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Войти или зарегистрироваться</Text>
        <Text style={s.cardSubtitle}>Отправим код подтверждения на ваш email</Text>

        <View style={s.form}>
          <Text style={s.label}>Email</Text>
          <View style={[s.inputWrap, error ? s.inputError : null, loading ? s.inputDisabled : null]}>
            <Feather name="mail" size={18} color={error ? Colors.statusError : Colors.textMuted} />
            <TextInput
              value={email}
              onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textMuted}
              style={s.input}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            {email.length > 0 && !error && !loading && (
              <Pressable onPress={() => setEmail('')} hitSlop={8}>
                <Feather name="x-circle" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>
          {error ? (
            <View style={s.errorRow}>
              <Feather name="alert-circle" size={14} color={Colors.statusError} />
              <Text style={s.error}>{error}</Text>
            </View>
          ) : null}
          <Pressable onPress={handleSubmit} disabled={loading} style={[s.btn, loading ? s.btnDisabled : null]}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={s.btnText}>Получить код</Text>
            )}
          </Pressable>
        </View>
      </View>

      <Text style={s.footer}>Нажимая кнопку, вы соглашаетесь с{'\n'}условиями использования</Text>
    </View>
  );
}

export function AuthEmailStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <AuthScreen />
      </StateSection>

      <StateSection title="LOADING">
        <AuthScreen initialEmail="elena@mail.ru" initialLoading />
      </StateSection>

      <StateSection title="ERROR">
        <AuthScreen initialEmail="elena@" initialError="Введите корректный email адрес" />
      </StateSection>

      <StateSection title="SUCCESS">
        <AuthScreen initialEmail="elena@mail.ru" initialSuccess />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  logoWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  logo: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  tagline: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing['2xl'],
    gap: Spacing.md,
    ...Shadows.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  // Form
  form: {
    gap: Spacing.md,
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
  inputDisabled: {
    opacity: 0.6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  error: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
  },
  btn: {
    height: 48,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    ...Shadows.sm,
  },
  btnDisabled: {
    backgroundColor: Colors.brandPrimaryHover,
  },
  btnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  footer: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing['2xl'],
    lineHeight: 18,
  },

  // Success state
  successWrap: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing['4xl'],
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.statusBg.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  successSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  successDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.brandPrimary,
  },
});
