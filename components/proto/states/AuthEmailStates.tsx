import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

function AuthEmailScreen({ initialEmail, initialError, initialLoading }: {
  initialEmail?: string; initialError?: string; initialLoading?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail || '');
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(!!initialLoading);

  const handleSubmit = () => {
    if (!email || !email.includes('@')) {
      setError('Введите корректный email адрес');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-4 py-8">
      {/* Logo */}
      <View className="mb-8 items-center gap-2">
        <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
          <Feather name="shield" size={28} color="#0284C7" />
        </View>
        <Text className="text-2xl font-bold text-textPrimary">Налоговик</Text>
        <Text className="text-base text-textMuted">Найдите налогового специалиста</Text>
      </View>

      {/* Card */}
      <View className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6">
        <Text className="mb-1 text-center text-lg font-bold text-textPrimary">Войти или зарегистрироваться</Text>
        <Text className="mb-4 text-center text-sm text-textMuted">Отправим код подтверждения на ваш email</Text>

        <Text className="mb-1 text-sm font-medium text-textSecondary">Email</Text>
        <View className={`mb-2 h-12 flex-row items-center gap-2 rounded-lg border px-4 ${error ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'} ${loading ? 'opacity-60' : ''}`}>
          <Feather name="mail" size={18} color={error ? '#DC2626' : '#94A3B8'} />
          <TextInput
            value={email}
            onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
            placeholder="your@email.com"
            placeholderTextColor="#94A3B8"
            className="flex-1 text-base text-textPrimary"
            style={{ outlineStyle: 'none' as any }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {email.length > 0 && !loading && (
            <Pressable onPress={() => setEmail('')} hitSlop={8}>
              <Feather name="x-circle" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {error ? (
          <View className="mb-2 flex-row items-center gap-1">
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`mt-1 h-12 items-center justify-center rounded-lg bg-brandPrimary ${loading ? 'opacity-60' : ''}`}
        >
          <Text className="text-base font-semibold text-white">
            {loading ? 'Отправка...' : 'Отправить код'}
          </Text>
        </Pressable>
      </View>

      <Text className="mt-6 text-center text-xs text-textMuted">
        {'Нажимая кнопку, вы соглашаетесь с\nусловиями использования'}
      </Text>
    </View>
  );
}

export function AuthEmailStates() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="w-full max-w-md self-center px-4 py-8">
        <Text className="mb-4 text-lg font-bold text-textPrimary">Screen: Auth Email</Text>

        <Text className="mb-2 text-sm font-medium text-textMuted">IDLE</Text>
        <View className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 480 }}>
          <AuthEmailScreen />
        </View>

        <Text className="mb-2 text-sm font-medium text-textMuted">SUBMITTING</Text>
        <View className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 480 }}>
          <AuthEmailScreen initialEmail="elena@mail.ru" initialLoading />
        </View>

        <Text className="mb-2 text-sm font-medium text-textMuted">ERROR</Text>
        <View className="mb-6 rounded-xl border border-gray-200 overflow-hidden" style={{ height: 480 }}>
          <AuthEmailScreen initialEmail="elena@" initialError="Введите корректный email адрес" />
        </View>
      </View>
    </ScrollView>
  );
}
