import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function OtpScreen({ initialCode, initialError, initialResendTimer, initialLoading }: {
  initialCode?: string; initialError?: string; initialResendTimer?: number; initialLoading?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(
    initialCode ? initialCode.split('').slice(0, 6) : ['', '', '', '', '', '']
  );
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(!!initialLoading);
  const [resendTimer, setResendTimer] = useState(initialResendTimer ?? 0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    if (error) setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Введите все 6 цифр');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (code !== '000000') {
        setError('Неверный код. Попробуйте ещё раз.');
      }
    }, 1500);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    setDigits(['', '', '', '', '', '']);
    setError('');
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.iconWrap}>
          <Feather name="lock" size={28} color={Colors.brandPrimary} />
        </View>
        <Text style={s.title}>Введите код</Text>
        <View style={s.emailRow}>
          <Feather name="mail" size={14} color={Colors.textMuted} />
          <Text style={s.subtitle}>Код отправлен на elena@mail.ru</Text>
        </View>
      </View>
      <View style={s.codeRow}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[s.codeBox, error ? s.codeBoxError : null, digits[i] ? s.codeBoxFilled : null]}>
            <TextInput
              ref={(ref) => { inputRefs.current[i] = ref; }}
              value={digits[i]}
              onChangeText={(v) => handleDigitChange(i, v)}
              onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              style={[s.codeInput, error ? s.codeCharError : null]}
              selectTextOnFocus
            />
          </View>
        ))}
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
            <Feather name="check" size={16} color={Colors.white} />
            <Text style={s.btnText}>Подтвердить</Text>
          </>
        )}
      </Pressable>
      <Pressable onPress={handleResend}>
        {resendTimer > 0 ? (
          <View style={s.resendRow}>
            <Feather name="clock" size={14} color={Colors.textMuted} />
            <Text style={s.resend}>Отправить код повторно через {resendTimer} сек</Text>
          </View>
        ) : (
          <View style={s.resendRow}>
            <Feather name="refresh-cw" size={14} color={Colors.brandPrimary} />
            <Text style={s.resendActive}>Отправить код повторно</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

export function AuthOtpStates() {
  return (
    <StateSection title="DEFAULT">
      <OtpScreen />
    </StateSection>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing['2xl'], gap: Spacing['2xl'], alignItems: 'center' },
  header: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing['2xl'] },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.brandPrimary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  subtitle: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  codeRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  codeBox: {
    width: 44, height: 52, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.card, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgCard,
    ...Shadows.sm,
  },
  codeBoxError: { borderColor: Colors.statusError },
  codeBoxFilled: { borderColor: Colors.brandPrimary },
  codeInput: {
    fontSize: 22, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary,
    textAlign: 'center', width: '100%', height: '100%',
  },
  codeCharError: { color: Colors.statusError },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  error: { fontSize: Typography.fontSize.sm, color: Colors.statusError, textAlign: 'center' },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.btn,
    alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 300,
    flexDirection: 'row', gap: Spacing.sm, ...Shadows.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  resendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  resend: { fontSize: Typography.fontSize.base, color: Colors.textMuted },
  resendActive: { fontSize: Typography.fontSize.base, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
});
