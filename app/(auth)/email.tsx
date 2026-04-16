import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from '../../components/Header';
import { auth } from '../../lib/api/endpoints';
import { Button, Card, Container, Heading, Input, Screen, Text } from '../../components/ui';
import { Colors, Spacing } from '../../constants/Colors';

export default function AuthEmailScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If role is missing, redirect to role selection
  useEffect(() => {
    if (!role) {
      router.replace('/(auth)/role');
    }
  }, [role]);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Введите корректный email адрес');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await auth.requestOtp(email.trim().toLowerCase());
      router.push({ pathname: '/(auth)/otp', params: { email: email.trim().toLowerCase(), role: role ?? 'CLIENT' } });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Не удалось отправить код. Попробуйте ещё раз.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Header variant="back" backTitle="Вход" onBack={() => router.back()} />
      <Container>
        <View style={{ paddingVertical: Spacing['2xl'], gap: Spacing['2xl'] }}>
          <View style={{ alignItems: 'center', gap: Spacing.sm }}>
            <View
              style={{
                height: 64,
                width: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: Colors.bgSecondary,
              }}
            >
              <Feather name="shield" size={28} color={Colors.brandPrimary} />
            </View>
            <Heading level={2} align="center">Налоговик</Heading>
            <Text variant="muted" align="center">
              {role === 'SPECIALIST' ? 'Регистрация специалиста' : 'Найдите налогового специалиста'}
            </Text>
          </View>

          <Card variant="outlined" padding="lg">
            <View style={{ gap: Spacing.lg }}>
              <View style={{ gap: Spacing.xs }}>
                <Heading level={4} align="center">Войти или зарегистрироваться</Heading>
                <Text variant="caption" align="center">Отправим код подтверждения на ваш email</Text>
              </View>

              <Input
                label="Email"
                value={email}
                onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                error={error || undefined}
                icon={<Feather name="mail" size={18} color={error ? Colors.statusError : Colors.textMuted} />}
                rightIcon={
                  email.length > 0 && !loading ? (
                    <Pressable onPress={() => setEmail('')} hitSlop={8}>
                      <Feather name="x-circle" size={16} color={Colors.textMuted} />
                    </Pressable>
                  ) : undefined
                }
              />

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleSubmit}
              >
                {loading ? 'Отправка...' : 'Отправить код'}
              </Button>
            </View>
          </Card>

          <Text variant="caption" align="center">
            {'Нажимая кнопку, вы соглашаетесь с\nусловиями использования'}
          </Text>
        </View>
      </Container>
    </Screen>
  );
}
