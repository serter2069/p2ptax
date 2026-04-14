import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function AuthScreen({ initialEmail, initialError, initialLoading }: { initialEmail: string; initialError?: string; initialLoading?: boolean }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(!!initialLoading);

  const handleSubmit = () => {
    if (!email || !email.includes('@')) {
      setError('Введите корректный email адрес');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <View style={s.container}>
      <View style={s.logoWrap}>
        <View style={s.logoIcon}>
          <Feather name="shield" size={32} color={Colors.brandPrimary} />
        </View>
        <Text style={s.logo}>Налоговик</Text>
        <Text style={s.tagline}>Найдите налогового специалиста</Text>
      </View>
      <View style={s.form}>
        <Text style={s.label}>Email</Text>
        <View style={[s.inputWrap, error ? s.inputError : null]}>
          <Feather name="mail" size={18} color={error ? Colors.statusError : Colors.textMuted} />
          <TextInput
            value={email}
            onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
            placeholder="your@email.com"
            placeholderTextColor={Colors.textMuted}
            style={s.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
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
            <>
              <Feather name="send" size={16} color={Colors.white} />
              <Text style={s.btnText}>Получить код</Text>
            </>
          )}
        </Pressable>
      </View>
      <Text style={s.footer}>Нажимая кнопку, вы соглашаетесь с условиями использования</Text>
    </View>
  );
}

export function AuthEmailStates() {
  return (
    <StateSection title="DEFAULT">
      <AuthScreen initialEmail="" />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing['2xl'], gap: Spacing['2xl'], alignItems: 'center' },
  logoWrap: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing['3xl'] },
  logoIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.brandPrimary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  logo: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  tagline: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  form: { width: '100%', maxWidth: 360, gap: Spacing.md },
  label: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.card, paddingHorizontal: Spacing.lg,
  },
  input: {
    flex: 1, fontSize: Typography.fontSize.base, color: Colors.textPrimary, paddingVertical: 0,
  },
  inputError: { borderColor: Colors.statusError },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  error: { fontSize: Typography.fontSize.sm, color: Colors.statusError },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm,
    flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  footer: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.lg },
});
