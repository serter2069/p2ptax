import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';

function OtpScreen({ initialCode, initialError, initialResendTimer, initialLoading, initialAttempts, maxedOut }: {
  initialCode?: string; initialError?: string; initialResendTimer?: number; initialLoading?: boolean;
  initialAttempts?: number; maxedOut?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(
    initialCode ? initialCode.split('').slice(0, 6) : ['', '', '', '', '', '']
  );
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(!!initialLoading);
  const [resendTimer, setResendTimer] = useState(initialResendTimer ?? 0);
  const [attempts, setAttempts] = useState(initialAttempts ?? 0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    if (maxedOut) return;
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
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 5) {
          setError('Превышено число попыток. Запросите новый код.');
        } else {
          setError(`Неверный код. Осталось ${5 - newAttempts} попыток`);
        }
      }
    }, 1500);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    setDigits(['', '', '', '', '', '']);
    setError('');
    setAttempts(0);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const isLocked = maxedOut || attempts >= 5;

  return (
    <View style={s.container}>
      {/* Back button */}
      <View style={s.backRow}>
        <Pressable style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textSecondary} />
          <Text style={s.backText}>Изменить email</Text>
        </Pressable>
      </View>

      <View style={s.header}>
        <View style={[s.iconWrap, isLocked ? s.iconWrapError : null]}>
          <Feather name={isLocked ? 'lock' : 'mail'} size={28} color={isLocked ? Colors.statusError : Colors.brandPrimary} />
        </View>
        <Text style={s.title}>{isLocked ? 'Доступ заблокирован' : 'Введите код'}</Text>
        {isLocked ? (
          <Text style={s.subtitle}>Слишком много неверных попыток</Text>
        ) : (
          <View style={s.emailRow}>
            <Text style={s.subtitle}>Код отправлен на </Text>
            <Text style={s.emailHighlight}>elena@mail.ru</Text>
          </View>
        )}
      </View>

      {/* Code inputs */}
      <View style={s.codeRow}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[
            s.codeBox,
            error ? s.codeBoxError : null,
            digits[i] ? s.codeBoxFilled : null,
            isLocked ? s.codeBoxLocked : null,
          ]}>
            <TextInput
              ref={(ref) => { inputRefs.current[i] = ref; }}
              value={digits[i]}
              onChangeText={(v) => handleDigitChange(i, v)}
              onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              style={[s.codeInput, error ? s.codeCharError : null, isLocked ? s.codeCharLocked : null]}
              selectTextOnFocus
              editable={!isLocked && !loading}
            />
          </View>
        ))}
      </View>

      {/* Error message */}
      {error ? (
        <View style={s.errorRow}>
          <Feather name="alert-circle" size={14} color={Colors.statusError} />
          <Text style={s.error}>{error}</Text>
        </View>
      ) : null}

      {/* Attempts indicator */}
      {attempts > 0 && attempts < 5 && !error && (
        <View style={s.attemptsRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[s.attemptDot, i < attempts ? s.attemptDotUsed : null]} />
          ))}
        </View>
      )}

      {/* Submit button */}
      {!isLocked && (
        <Pressable onPress={handleSubmit} disabled={loading} style={[s.btn, loading ? s.btnDisabled : null]}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={s.btnText}>Подтвердить</Text>
          )}
        </Pressable>
      )}

      {/* Locked: request new code */}
      {isLocked && (
        <Pressable onPress={handleResend} style={s.btnOutline}>
          <Feather name="refresh-cw" size={16} color={Colors.brandPrimary} />
          <Text style={s.btnOutlineText}>Запросить новый код</Text>
        </Pressable>
      )}

      {/* Resend timer */}
      {!isLocked && (
        <Pressable onPress={handleResend} disabled={resendTimer > 0}>
          {resendTimer > 0 ? (
            <View style={s.resendRow}>
              <Feather name="clock" size={14} color={Colors.textMuted} />
              <Text style={s.resend}>Отправить повторно через {resendTimer} сек</Text>
            </View>
          ) : (
            <View style={s.resendRow}>
              <Feather name="refresh-cw" size={14} color={Colors.brandPrimary} />
              <Text style={s.resendActive}>Отправить код повторно</Text>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}

export function AuthOtpStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <OtpScreen initialResendTimer={57} />
      </StateSection>

      <StateSection title="RESEND_AVAILABLE">
        <OtpScreen initialResendTimer={0} />
      </StateSection>

      <StateSection title="ERROR">
        <OtpScreen initialCode="123456" initialError="Неверный код. Осталось 3 попытки" initialAttempts={2} initialResendTimer={34} />
      </StateSection>

      <StateSection title="LOADING">
        <OtpScreen initialCode="000000" initialLoading initialResendTimer={12} />
      </StateSection>

      <StateSection title="MAX_ATTEMPTS">
        <OtpScreen initialCode="999999" maxedOut initialError="Превышено число попыток. Запросите новый код." initialAttempts={5} />
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },

  // Back
  backRow: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'flex-start',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Header
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  iconWrapError: {
    backgroundColor: Colors.statusBg.error,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  emailHighlight: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Code inputs
  codeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  codeBoxError: {
    borderColor: Colors.statusError,
    backgroundColor: Colors.statusBg.error,
  },
  codeBoxFilled: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.bgSecondary,
  },
  codeBoxLocked: {
    borderColor: Colors.statusError,
    backgroundColor: Colors.statusBg.error,
    opacity: 0.6,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  codeCharError: {
    color: Colors.statusError,
  },
  codeCharLocked: {
    color: Colors.statusError,
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.statusBg.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  error: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    fontWeight: Typography.fontWeight.medium,
  },

  // Attempts
  attemptsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  attemptDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  attemptDotUsed: {
    backgroundColor: Colors.statusWarning,
  },

  // Button
  btn: {
    height: 48,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
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

  // Outline button (locked state)
  btnOutline: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnOutlineText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },

  // Resend
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  resend: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  resendActive: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
});
