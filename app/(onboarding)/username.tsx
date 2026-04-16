import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { users } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth';

// Russian + English letters, space, hyphen, apostrophe; 2–50 chars.
const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\s'-]{2,50}$/;

export default function NameScreen() {
  const router = useRouter();
  const { role, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstErr, setFirstErr] = useState('');
  const [lastErr, setLastErr] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const validateField = (val: string): string => {
    if (val.trim().length < 2) return 'Минимум 2 символа';
    if (val.trim().length > 50) return 'Максимум 50 символов';
    if (!NAME_REGEX.test(val.trim())) return 'Только буквы, пробел, дефис и апостроф';
    return '';
  };

  const canContinue =
    !!firstName.trim() &&
    !!lastName.trim() &&
    !firstErr &&
    !lastErr &&
    agreed &&
    !loading;

  async function handleNext() {
    const fErr = validateField(firstName);
    const lErr = validateField(lastName);
    setFirstErr(fErr);
    setLastErr(lErr);
    if (fErr || lErr || !agreed) return;

    setLoading(true);
    setSubmitErr('');
    try {
      await users.setName({ firstName: firstName.trim(), lastName: lastName.trim() });
      await refreshUser();
      // New SA-requested flow: name → work-area (specialist) → profile
      // For clients: name → profile
      if (role === 'SPECIALIST') {
        router.push('/(onboarding)/work-area' as any);
      } else {
        router.push('/(onboarding)/profile' as any);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Ошибка сохранения';
      setSubmitErr(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Имя" onBack={() => router.back()} />
      <View className="flex-1 bg-white px-4 py-6">
        <View className="mb-1 h-1 rounded-full bg-bgSecondary">
          <View className="h-1 rounded-full bg-brandPrimary" style={{ width: role === 'SPECIALIST' ? '33%' : '50%' }} />
        </View>
        <Text className="mb-4 text-xs uppercase tracking-wider text-textMuted">
          {role === 'SPECIALIST' ? 'Шаг 1 из 3' : 'Шаг 1 из 2'}
        </Text>
        <Text className="text-xl font-bold text-textPrimary">Как вас зовут?</Text>
        <Text className="mb-4 text-base leading-6 text-textMuted">Имя и фамилия будут видны клиентам в вашем профиле</Text>

        <Text className="mb-1 text-sm font-medium text-textSecondary">Имя</Text>
        <View className={`mb-1 h-12 flex-row items-center gap-2 rounded-lg border px-4 ${firstErr ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
          <Feather name="user" size={18} color={firstErr ? '#DC2626' : '#94A3B8'} />
          <TextInput
            value={firstName}
            onChangeText={(t) => { setFirstName(t); if (firstErr) setFirstErr(''); }}
            onBlur={() => setFirstErr(validateField(firstName))}
            placeholder="Иван"
            placeholderTextColor="#94A3B8"
            className="flex-1 text-base text-textPrimary"
            style={{ outlineStyle: 'none' } as any}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
        {firstErr ? (
          <View className="mb-2 flex-row items-center gap-1">
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text className="text-sm text-red-600">{firstErr}</Text>
          </View>
        ) : null}

        <Text className="mb-1 mt-3 text-sm font-medium text-textSecondary">Фамилия</Text>
        <View className={`mb-1 h-12 flex-row items-center gap-2 rounded-lg border px-4 ${lastErr ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
          <Feather name="user" size={18} color={lastErr ? '#DC2626' : '#94A3B8'} />
          <TextInput
            value={lastName}
            onChangeText={(t) => { setLastName(t); if (lastErr) setLastErr(''); }}
            onBlur={() => setLastErr(validateField(lastName))}
            placeholder="Иванов"
            placeholderTextColor="#94A3B8"
            className="flex-1 text-base text-textPrimary"
            style={{ outlineStyle: 'none' } as any}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
        {lastErr ? (
          <View className="mb-2 flex-row items-center gap-1">
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text className="text-sm text-red-600">{lastErr}</Text>
          </View>
        ) : null}

        <Pressable className="mt-3 flex-row items-start gap-2" onPress={() => setAgreed(!agreed)}>
          <View className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${agreed ? 'border-brandPrimary bg-brandPrimary' : 'border-gray-300 bg-white'}`}>
            {agreed && <Feather name="check" size={13} color="#fff" />}
          </View>
          <Text className="flex-1 text-sm text-textSecondary">Принимаю <Text className="text-brandPrimary">условия использования</Text></Text>
        </Pressable>

        {submitErr ? (
          <View className="mt-3 flex-row items-center gap-1 rounded-lg bg-red-50 px-3 py-2">
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text className="text-sm text-red-600">{submitErr}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={!canContinue}
          onPress={handleNext}
          className={`mt-6 h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${!canContinue ? 'opacity-40' : ''}`}
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
