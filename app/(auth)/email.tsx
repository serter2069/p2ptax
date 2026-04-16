import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';

export default function AuthEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header variant="back" backTitle="Вход" onBack={() => router.back()} />
      <View className="flex-1 items-center justify-center bg-white px-4 py-8">
      <View className="mb-8 items-center gap-2">
        <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-bgSecondary">
          <Feather name="shield" size={28} color="#0284C7" />
        </View>
        <Text className="text-2xl font-bold text-textPrimary">Налоговик</Text>
        <Text className="text-base text-textMuted">Найдите налогового специалиста</Text>
      </View>

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
            style={{ outlineStyle: 'none' } as any}
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
    </View>
  );
}
