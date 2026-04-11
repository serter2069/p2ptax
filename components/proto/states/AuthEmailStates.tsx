import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, StyleSheet, Platform } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { ProtoHeader, ProtoTabBar } from '../NavComponents';

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
        <Text style={s.logo}>Налоговик</Text>
        <Text style={s.tagline}>Найдите налогового специалиста</Text>
      </View>
      <View style={s.form}>
        <Text style={s.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
          placeholder="your@email.com"
          placeholderTextColor={Colors.textMuted}
          style={[s.input, error ? s.inputError : null]}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable onPress={handleSubmit} disabled={loading} style={[s.btn, loading ? s.btnDisabled : null]}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={s.btnText}>Получить код</Text>
          )}
        </Pressable>
      </View>
      <Text style={s.footer}>Нажимая кнопку, вы соглашаетесь с условиями использования</Text>
    </View>
  );
}

export function AuthEmailStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <AuthScreen initialEmail="" />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="ERROR">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <AuthScreen initialEmail="invalid-email" initialError="Введите корректный email адрес" />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="LOADING">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <AuthScreen initialEmail="elena@mail.ru" initialLoading />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
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
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  footer: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.lg },
});
