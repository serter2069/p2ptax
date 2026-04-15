import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function OnboardingUsernamePage() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [available, setAvailable] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const canContinue = available && agreed && value.length >= 2;

  return (
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
          onChangeText={(t) => { setValue(t); setError(''); setAvailable(t.length >= 2); }}
          placeholder="Например: Елена Васильева"
          placeholderTextColor="#94A3B8"
          className="flex-1 text-base text-textPrimary"
          style={{ outlineStyle: 'none' } as any}
        />
        {available && <Feather name="check-circle" size={18} color="#15803D" />}
        {error ? <Feather name="x-circle" size={18} color="#DC2626" /> : null}
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
        <Text className="flex-1 text-sm text-textSecondary">
          Принимаю <Text className="text-brandPrimary">условия использования</Text>
        </Text>
      </Pressable>

      <Pressable
        disabled={!canContinue}
        className={`mt-6 h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brandPrimary ${!canContinue ? 'opacity-40' : ''}`}
      >
        <Text className="text-base font-semibold text-white">Далее</Text>
        <Feather name="arrow-right" size={16} color="#fff" />
      </Pressable>
    </View>
  );
}
