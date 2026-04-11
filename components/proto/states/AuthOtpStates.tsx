import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, StyleSheet, Platform } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';
import { ProtoHeader, ProtoTabBar } from '../NavComponents';

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

  const code = digits.join('');

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Введите код</Text>
        <Text style={s.subtitle}>Код отправлен на elena@mail.ru</Text>
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
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Pressable onPress={handleSubmit} disabled={loading} style={[s.btn, loading ? s.btnDisabled : null]}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={s.btnText}>Подтвердить</Text>
        )}
      </Pressable>
      <Pressable onPress={handleResend}>
        {resendTimer > 0 ? (
          <Text style={s.resend}>Отправить код повторно через {resendTimer} сек</Text>
        ) : (
          <Text style={s.resendActive}>Отправить код повторно</Text>
        )}
      </Pressable>
    </View>
  );
}

export function AuthOtpStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <OtpScreen />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="ERROR">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <OtpScreen initialCode="123456" initialError="Неверный код. Попробуйте ещё раз." />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="RESEND">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <OtpScreen initialResendTimer={42} />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
</StateSection>
      <StateSection title="LOADING">
        <View style={{ minHeight: Platform.OS === 'web' ? '100vh' : 844 }}>
          <ProtoHeader variant="auth" />
          <View style={{ flex: 1 }}>

        <OtpScreen initialCode="000000" initialLoading />
                </View>
          <ProtoTabBar activeTab="home" />
        </View>
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
  codeInput: {
    fontSize: 22, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary,
    textAlign: 'center', width: '100%', height: '100%',
  },
  codeCharError: { color: Colors.statusError },
  error: { fontSize: Typography.fontSize.xs, color: Colors.statusError, textAlign: 'center' },
  btn: {
    height: 48, backgroundColor: Colors.brandPrimary, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 300,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.white },
  resend: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  resendActive: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
});
