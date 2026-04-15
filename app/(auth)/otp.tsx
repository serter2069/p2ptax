import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function AuthOtpPage() {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
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
    <View className="items-center gap-6 p-6">
      <View className="mt-6 items-center gap-1">
        <Text className="text-xl font-bold text-textPrimary">Введите код</Text>
        <Text className="text-sm text-textMuted">Код отправлен на elena@mail.ru</Text>
      </View>
      <View className="flex-row justify-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            className={`items-center justify-center rounded-lg bg-bgCard ${error ? 'border-statusError' : digits[i] ? 'border-brandPrimary' : 'border-border'}`}
            style={{ width: 44, height: 52, borderWidth: 1.5 }}
          >
            <TextInput
              ref={(ref) => { inputRefs.current[i] = ref; }}
              value={digits[i]}
              onChangeText={(v) => handleDigitChange(i, v)}
              onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              className="h-full w-full text-center text-textPrimary"
              style={{ fontSize: 22, fontWeight: '700', color: error ? Colors.statusError : Colors.textPrimary }}
            />
          </View>
        ))}
      </View>
      {error ? <Text className="text-center text-xs text-statusError">{error}</Text> : null}
      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        className={`h-12 w-full items-center justify-center rounded-lg bg-brandPrimary ${loading ? 'opacity-70' : ''}`}
        style={{ maxWidth: 300 }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text className="text-base font-semibold text-white">Подтвердить</Text>
        )}
      </Pressable>
      <Pressable onPress={handleResend}>
        {resendTimer > 0 ? (
          <Text className="text-sm text-textMuted">Отправить код повторно через {resendTimer} сек</Text>
        ) : (
          <Text className="text-sm font-medium text-brandPrimary">Отправить код повторно</Text>
        )}
      </Pressable>
    </View>
  );
}
