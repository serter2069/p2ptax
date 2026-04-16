import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { users } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth';

const USERNAME_REGEX = /^[a-z0-9_-]{3,20}$/;

export default function UsernameScreen() {
  const router = useRouter();
  const { role } = useAuth();

  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const canContinue = available && agreed && value.length >= 3;

  function validateLocal(val: string): string {
    if (val.length < 3) return 'Минимум 3 символа';
    if (val.length > 20) return 'Максимум 20 символов';
    if (!USERNAME_REGEX.test(val)) return 'Только латиница, цифры, _ и -';
    return '';
  }

  async function checkAvailability() {
    const localErr = validateLocal(value);
    if (localErr) {
      setError(localErr);
      setAvailable(false);
      return;
    }
    setChecking(true);
    setError('');
    setAvailable(false);
    try {
      const res = await users.checkUsername(value);
      if (res.data.available) {
        setAvailable(true);
      } else {
        setError('Имя уже занято');
      }
    } catch (e: any) {
      setError('Ошибка проверки');
    } finally {
      setChecking(false);
    }
  }

  async function handleNext() {
    if (!canContinue || loading) return;
    setLoading(true);
    setError('');
    try {
      await users.setUsername({ username: value });

      if (role === 'SPECIALIST') {
        router.push('/(onboarding)/work-area' as any);
      } else {
        router.replace('/(tabs)/dashboard' as any);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Ошибка сохранения';
      setError(typeof msg === 'string' ? msg : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Имя" onBack={() => router.back()} />
      <View className="flex-1 bg-white px-4 py-6">
        <View className="mb-1 h-1 rounded-full bg-bgSecondary">
          <View className="h-1 rounded-full bg-brandPrimary" style={{ width: '33%' }} />
        </View>
        <Text className="mb-4 text-xs uppercase tracking-wider text-textMuted">Шаг 1 из 3</Text>
        <Text className="text-xl font-bold text-textPrimary">Как вас зовут?</Text>
        <Text className="mb-4 text-base leading-6 text-textMuted">Это имя будет видно клиентам в вашем профиле</Text>
        <Text className="mb-1 text-sm font-medium text-textSecondary">Имя пользователя</Text>
        <View className={`mb-1 h-12 flex-row items-center gap-2 rounded-lg border px-4 ${error ? 'border-red-500 bg-red-50' : available ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'}`}>
          <Feather name="user" size={18} color={error ? '#DC2626' : available ? '#15803D' : '#94A3B8'} />
          <TextInput
            value={value}
            onChangeText={(t) => { setValue(t.toLowerCase()); setError(''); setAvailable(false); }}
            placeholder="a-z, 0-9, _, - (3-20 символов)"
            placeholderTextColor="#94A3B8"
            className="flex-1 text-base text-textPrimary"
            style={{ outlineStyle: 'none' } as any}
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={checkAvailability}
          />
          {checking && <ActivityIndicator size="small" color="#94A3B8" />}
          {!checking && available && <Feather name="check-circle" size={18} color="#15803D" />}
          {!checking && error ? <Feather name="x-circle" size={18} color="#DC2626" /> : null}
        </View>
        {error ? (
          <View className="mb-2 flex-row items-center gap-1">
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : available ? (
          <View className="mb-2 flex-row items-center gap-1">
            <Feather name="check-circle" size={14} color="#15803D" />
            <Text className="text-sm font-medium text-green-700">Имя свободно</Text>
          </View>
        ) : null}
        <Pressable className="mt-3 flex-row items-start gap-2" onPress={() => setAgreed(!agreed)}>
          <View className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${agreed ? 'border-brandPrimary bg-brandPrimary' : 'border-gray-300 bg-white'}`}>
            {agreed && <Feather name="check" size={13} color="#fff" />}
          </View>
          <Text className="flex-1 text-sm text-textSecondary">Принимаю <Text className="text-brandPrimary">условия использования</Text></Text>
        </Pressable>
        <Pressable
          disabled={!canContinue || loading}
          onPress={handleNext}
          className={`mt-6 h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${(!canContinue || loading) ? 'opacity-40' : ''}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text className="text-base font-semibold text-white">Далее</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
