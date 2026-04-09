import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function Screen({ inn, status }: { inn: string; status: 'default' | 'verified' | 'error' }) {
  return (
    <View style={s.container}>
      <View style={s.progress}><View style={[s.progressBar, { width: '80%' }]} /></View>
      <Text style={s.step}>Шаг 4 из 5</Text>
      <Text style={s.title}>Привязка к ФНС</Text>
      <Text style={s.subtitle}>Введите ИНН для верификации в системе</Text>
      <View style={s.form}>
        <Text style={s.label}>ИНН</Text>
        <View style={s.inputRow}>
          <TextInput
            value={inn}
            editable={false}
            placeholder="123456789012"
            placeholderTextColor={Colors.textMuted}
            style={[
              s.input,
              status === 'verified' ? s.inputSuccess : null,
              status === 'error' ? s.inputError : null,
            ]}
          />
          {status === 'verified' && (
            <View style={s.statusIcon}>
              <Text style={s.checkIcon}>{'✓'}</Text>
            </View>
          )}
        </View>
        {status === 'verified' && (
          <View style={s.verifiedBox}>
            <Text style={s.verifiedIcon}>{'✓'}</Text>
            <View style={s.verifiedInfo}>
              <Text style={s.verifiedName}>ИП Петров Алексей Сергеевич</Text>
              <Text style={s.verifiedDetails}>ИФНС №46 по г. Москве | УСН 6%</Text>
            </View>
          </View>
        )}
        {status === 'error' && (
          <Text style={s.error}>ИНН не найден в реестре ФНС. Проверьте правильность ввода.</Text>
        )}
      </View>
      <View style={[s.btn, status !== 'verified' ? s.btnDisabled : null]}>
        <Text style={s.btnText}>Продолжить</Text>
      </View>
      <Text style={s.skip}>Пропустить этот шаг</Text>
    </View>
  );
}

export function OnboardingFnsStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <Screen inn="" status="default" />
      </StateSection>
      <StateSection title="VERIFIED">
        <Screen inn="771234567890" status="verified" />
      </StateSection>
      <StateSection title="ERROR">
        <Screen inn="000000000000" status="error" />
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
  form: { gap: Spacing.sm },
  label: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  inputRow: { position: 'relative' },
  input: {
    height: 48, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, fontSize: Typography.fontSize.base, color: Colors.textPrimary,
  },
  inputSuccess: { borderColor: Colors.statusSuccess },
  inputError: { borderColor: Colors.statusError },
  statusIcon: { position: 'absolute', right: 14, top: 12 },
  checkIcon: { fontSize: 20, color: Colors.statusSuccess },
  verifiedBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: '#e6f4ed', padding: Spacing.md, borderRadius: BorderRadius.md,
  },
  verifiedIcon: { fontSize: 20, color: Colors.statusSuccess },
  verifiedInfo: { flex: 1, gap: 2 },
  verifiedName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  verifiedDetails: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  error: { fontSize: Typography.fontSize.xs, color: Colors.statusError },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  skip: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, textAlign: 'center' },
});
