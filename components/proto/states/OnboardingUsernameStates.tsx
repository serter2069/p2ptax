import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

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
      <View style={s.progress}><View style={[s.progressBar, { width: '20%' }]} /></View>
      <Text style={s.step}>Шаг 1 из 5</Text>
      <Text style={s.title}>Как вас зовут?</Text>
      <Text style={s.subtitle}>Это имя будет отображаться в вашем профиле</Text>
      <View style={s.form}>
        <Text style={s.label}>Имя пользователя</Text>
        <TextInput
          value={value}
          onChangeText={(t) => { setValue(t); if (error) setError(''); }}
          placeholder="Например: Елена Васильева"
          placeholderTextColor={Colors.textMuted}
          style={[s.input, error ? s.inputError : null]}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
      </View>
      <Pressable onPress={handleContinue} style={s.btn}>
        <Text style={s.btnText}>Продолжить</Text>
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
      <StateSection title="VALIDATION_ERROR">
        <Screen initialValue="Ел" initialError="Имя должно содержать минимум 3 символа" />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing['2xl'], gap: Spacing.lg },
  progress: { height: 4, backgroundColor: Colors.bgSecondary, borderRadius: 2 },
  progressBar: { height: 4, backgroundColor: Colors.brandPrimary, borderRadius: 2 },
  step: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  form: { gap: Spacing.xs },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.statusError },
  error: { fontSize: Typography.fontSize.xs, color: Colors.statusError },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
});
