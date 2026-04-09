import React from 'react';
import { View, Text, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function AuthScreen({ email, error, loading }: { email: string; error?: string; loading?: boolean }) {
  return (
    <View style={s.container}>
      <View style={s.logoWrap}>
        <Text style={s.logo}>Налоговик</Text>
        <Text style={s.tagline}>Найдите налогового специалиста</Text>
      </View>
      <View style={s.form}>
        <Text style={s.label}>Email</Text>
        <TextInput
          value={email}
          editable={false}
          placeholder="your@email.com"
          placeholderTextColor={Colors.textMuted}
          style={[s.input, error ? s.inputError : null]}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <View style={[s.btn, loading ? s.btnDisabled : null]}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={s.btnText}>Получить код</Text>
          )}
        </View>
      </View>
      <Text style={s.footer}>Нажимая кнопку, вы соглашаетесь с условиями использования</Text>
    </View>
  );
}

export function AuthEmailStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <AuthScreen email="" />
      </StateSection>
      <StateSection title="ERROR">
        <AuthScreen email="invalid-email" error="Введите корректный email адрес" />
      </StateSection>
      <StateSection title="LOADING">
        <AuthScreen email="elena@mail.ru" loading />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing['2xl'], gap: Spacing['2xl'], alignItems: 'center' },
  logoWrap: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing['3xl'] },
  logo: { fontSize: 28, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  tagline: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  form: { width: '100%', maxWidth: 360, gap: Spacing.md },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.statusError },
  error: { fontSize: Typography.fontSize.xs, color: Colors.statusError },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  footer: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.lg },
});
