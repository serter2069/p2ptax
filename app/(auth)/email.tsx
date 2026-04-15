import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function AuthEmailPage() {
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
    <View className="items-center gap-6 p-6">
      <View className="mt-8 items-center gap-1">
        <Text className="text-textPrimary" style={{ fontSize: 28, fontWeight: '700' }}>Налоговик</Text>
        <Text className="text-base text-textMuted">Найдите налогового специалиста</Text>
      </View>
      <View className="w-full gap-3" style={{ maxWidth: 360 }}>
        <Text className="text-sm font-medium text-textSecondary">Email</Text>
        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
          placeholder="your@email.com"
          placeholderTextColor={Colors.textMuted}
          className={`h-12 rounded-lg border bg-bgCard px-4 text-base text-textPrimary ${error ? 'border-statusError' : 'border-border'}`}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {error ? <Text className="text-xs text-statusError">{error}</Text> : null}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`mt-2 h-12 items-center justify-center rounded-lg bg-brandPrimary ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text className="text-base font-semibold text-white">Получить код</Text>
          )}
        </Pressable>
      </View>
      <Text className="mt-4 text-center text-xs text-textMuted">Нажимая кнопку, вы соглашаетесь с условиями использования</Text>
    </View>
  );
}
