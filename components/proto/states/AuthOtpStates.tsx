import React from 'react';
import { View, Text, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

function OtpScreen({ code, error, resendTimer, loading }: { code: string; error?: string; resendTimer?: number; loading?: boolean }) {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Введите код</Text>
        <Text style={s.subtitle}>Код отправлен на elena@mail.ru</Text>
      </View>
      <View style={s.codeRow}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[s.codeBox, error ? s.codeBoxError : null, code[i] ? s.codeBoxFilled : null]}>
            <Text style={[s.codeChar, error ? s.codeCharError : null]}>{code[i] || ''}</Text>
          </View>
        ))}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={[s.btn, loading ? s.btnDisabled : null]}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={s.btnText}>Подтвердить</Text>
        )}
      </View>
      {resendTimer !== undefined ? (
        resendTimer > 0 ? (
          <Text style={s.resend}>Отправить код повторно через {resendTimer} сек</Text>
        ) : (
          <Text style={s.resendActive}>Отправить код повторно</Text>
        )
      ) : (
        <Text style={s.resendActive}>Отправить код повторно</Text>
      )}
    </View>
  );
}

export function AuthOtpStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <OtpScreen code="" />
      </StateSection>
      <StateSection title="ERROR">
        <OtpScreen code="123456" error="Неверный код. Попробуйте ещё раз." />
      </StateSection>
      <StateSection title="RESEND">
        <OtpScreen code="" resendTimer={42} />
      </StateSection>
      <StateSection title="LOADING">
        <OtpScreen code="000000" loading />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing['2xl'], gap: Spacing['2xl'], alignItems: 'center' },
  header: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing['2xl'] },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  codeRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  codeBox: {
    width: 44, height: 52, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgCard,
  },
  codeBoxError: { borderColor: Colors.statusError },
  codeBoxFilled: { borderColor: Colors.brandPrimary },
  codeChar: { fontSize: 22, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  codeCharError: { color: Colors.statusError },
  error: { fontSize: Typography.fontSize.xs, color: Colors.statusError, textAlign: 'center' },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 300,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: '#FFF' },
  resend: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  resendActive: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
});
