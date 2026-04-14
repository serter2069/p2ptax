import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function Screen({ initialValue, initialError }: { initialValue?: string; initialError?: string }) {
  const [value, setValue] = useState(initialValue || '');
  const [error, setError] = useState(initialError || '');

  const handleContinue = () => {
    if (value.length < 3) {
      setError('Имя должно содержать минимум 3 символа');
    } else {
      setError('');
    }
  };

  return (
    <View style={s.container}>
      <View style={s.progress}><View style={[s.progressBar, { width: '33%' }]} /></View>
      <Text style={s.step}>Шаг 1 из 3</Text>
      <Text style={s.title}>Как вас зовут?</Text>
      <Text style={s.subtitle}>Это имя будет отображаться в вашем профиле</Text>
      <View style={s.form}>
        <Text style={s.label}>Имя пользователя</Text>
        <View style={[s.inputWrap, error ? s.inputError : null]}>
          <Feather name="user" size={18} color={error ? Colors.statusError : Colors.textMuted} />
          <TextInput
            value={value}
            onChangeText={(t) => { setValue(t); if (error) setError(''); }}
            placeholder="Например: Елена Васильева"
            placeholderTextColor={Colors.textMuted}
            style={s.input}
          />
        </View>
        {error ? (
          <View style={s.errorRow}>
            <Feather name="alert-circle" size={14} color={Colors.statusError} />
            <Text style={s.error}>{error}</Text>
          </View>
        ) : null}
      </View>
      <Pressable onPress={handleContinue} style={s.btn}>
        <Text style={s.btnText}>Продолжить</Text>
        <Feather name="arrow-right" size={16} color={Colors.white} />
      </Pressable>
    </View>
  );
}

export function OnboardingUsernameStates() {
  return (
    <StateSection title="DEFAULT">
      <Screen />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing['2xl'], gap: Spacing.lg },
  progress: { height: 4, backgroundColor: Colors.bgSecondary, borderRadius: 2 },
  progressBar: { height: 4, backgroundColor: Colors.brandPrimary, borderRadius: 2 },
  step: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  form: { gap: Spacing.xs },
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
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm,
    ...Shadows.sm,
  },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
});
