import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function OnboardingUsernamePage() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (value.length < 3) {
      setError('Имя должно содержать минимум 3 символа');
    } else {
      setError('');
    }
  };

  return (
    <View className="gap-4 p-6">
      <View className="h-1 rounded-sm bg-bgSecondary">
        <View className="h-1 rounded-sm bg-brandPrimary" style={{ width: '33%' }} />
      </View>
      <Text className="text-xs uppercase tracking-wide text-textMuted">Шаг 1 из 3</Text>
      <Text className="text-xl font-bold text-textPrimary">Как вас зовут?</Text>
      <Text className="text-sm text-textMuted">Это имя будет отображаться в вашем профиле</Text>
      <View className="gap-1">
        <Text className="text-sm font-medium text-textSecondary">Имя пользователя</Text>
        <TextInput
          value={value}
          onChangeText={(t) => { setValue(t); if (error) setError(''); }}
          placeholder="Например: Елена Васильева"
          placeholderTextColor={Colors.textMuted}
          className={`h-12 rounded-lg border bg-bgCard px-4 text-base text-textPrimary ${error ? 'border-statusError' : 'border-border'}`}
        />
        {error ? <Text className="text-xs text-statusError">{error}</Text> : null}
      </View>
      <Pressable onPress={handleContinue} className="h-12 items-center justify-center rounded-lg bg-brandPrimary">
        <Text className="text-base font-semibold text-white">Продолжить</Text>
      </Pressable>
    </View>
  );
}
