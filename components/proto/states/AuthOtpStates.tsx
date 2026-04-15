import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

function OtpScreen({ initialCode, initialError, initialResendTimer, initialLoading }: {
  initialCode?: string; initialError?: string; initialResendTimer?: number; initialLoading?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(
    initialCode ? initialCode.split('').slice(0, 6) : ['', '', '', '', '', '']
  );
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(!!initialLoading);
  const [resendTimer] = useState(initialResendTimer ?? 0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (error) setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleSubmit = () => {
    if (digits.join('').length < 6) { setError('Введите все 6 цифр'); return; }
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <View className="flex-1 items-center bg-white px-4 py-8">
      {/* Back */}
      <View className="w-full max-w-sm">
        <Pressable className="flex-row items-center gap-1 py-1">
          <Feather name="arrow-left" size={20} color="#475569" />
          <Text className="text-sm text-textSecondary">Изменить email</Text>
        </Pressable>
      </View>

      {/* Header */}
      <View className="mt-6 items-center gap-2">
        <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
          <Feather name="mail" size={28} color="#0284C7" />
        </View>
        <Text className="text-xl font-bold text-textPrimary">Введите код</Text>
        <View className="flex-row items-center">
          <Text className="text-base text-textMuted">Код отправлен на </Text>
          <Text className="text-base font-medium text-textPrimary">elena@mail.ru</Text>
        </View>
      </View>

      {/* OTP inputs */}
      <View className="mt-5 flex-row justify-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            className={`h-14 w-12 items-center justify-center rounded-lg border-2 ${error ? 'border-red-500 bg-red-50' : digits[i] ? 'border-brandPrimary bg-bgSecondary' : 'border-gray-200 bg-white'}`}
          >
            <TextInput
              ref={(ref) => { inputRefs.current[i] = ref; }}
              value={digits[i]}
              onChangeText={(v) => handleDigitChange(i, v)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
              className="h-full w-full text-center text-2xl font-bold text-textPrimary"
              style={{ outlineStyle: 'none' as any }}
            />
          </View>
        ))}
      </View>

      {/* Error */}
      {error ? (
        <View className="mt-3 flex-row items-center gap-1 rounded-lg bg-red-50 px-3 py-2">
          <Feather name="alert-circle" size={14} color="#DC2626" />
          <Text className="text-sm font-medium text-red-600">{error}</Text>
        </View>
      ) : null}

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        className={`mt-4 h-12 w-full max-w-xs items-center justify-center rounded-lg bg-brandPrimary ${loading ? 'opacity-60' : ''}`}
      >
        <Text className="text-base font-semibold text-white">
          {loading ? 'Проверка...' : 'Подтвердить'}
        </Text>
      </Pressable>

      {/* Resend */}
      <View className="mt-3 flex-row items-center gap-1">
        {resendTimer > 0 ? (
          <>
            <Feather name="clock" size={14} color="#94A3B8" />
            <Text className="text-sm text-textMuted">Отправить повторно через {resendTimer} сек</Text>
          </>
        ) : (
          <>
            <Feather name="refresh-cw" size={14} color="#0284C7" />
            <Text className="text-sm font-medium text-brandPrimary">Отправить код повторно</Text>
          </>
        )}
      </View>
    </View>
  );
}

export function AuthOtpStates() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="w-full max-w-md self-center px-4 py-8">
        <Text className="mb-4 text-lg font-bold text-textPrimary">Screen: Auth OTP</Text>

        <Text className="mb-2 text-sm font-medium text-textMuted">IDLE</Text>
        <View className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 480 }}>
          <OtpScreen initialResendTimer={57} />
        </View>

        <Text className="mb-2 text-sm font-medium text-textMuted">VERIFYING</Text>
        <View className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 480 }}>
          <OtpScreen initialCode="000000" initialLoading initialResendTimer={12} />
        </View>

        <Text className="mb-2 text-sm font-medium text-textMuted">ERROR</Text>
        <View className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 480 }}>
          <OtpScreen initialCode="123456" initialError="Неверный код. Осталось 3 попытки" initialResendTimer={34} />
        </View>

        <Text className="mb-2 text-sm font-medium text-textMuted">RESEND AVAILABLE</Text>
        <View className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 480 }}>
          <OtpScreen initialResendTimer={0} />
        </View>
      </View>
    </ScrollView>
  );
}
