import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { Card, Container, Heading, Screen, Text } from '../../components/ui';
import { BorderRadius, Colors, Spacing } from '../../constants/Colors';

export default function RoleScreen() {
  const router = useRouter();

  function selectRole(role: 'CLIENT' | 'SPECIALIST') {
    router.push({ pathname: '/(auth)/email', params: { role } });
  }

  return (
    <Screen>
      <Header variant="back" backTitle="Выбор роли" onBack={() => router.back()} />
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
            <Text variant="muted" align="center">Кто вы на платформе?</Text>
          </View>

          <View style={{ gap: Spacing.lg }}>
            <Card variant="outlined" padding="lg" onPress={() => selectRole('CLIENT')}>
              <View style={{ gap: Spacing.md }}>
                <View
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: BorderRadius.xl,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: Colors.bgSecondary,
                  }}
                >
                  <Feather name="search" size={24} color={Colors.brandPrimary} />
                </View>
                <View style={{ gap: Spacing.xs }}>
                  <Heading level={4}>Я ищу специалиста</Heading>
                  <Text variant="muted">
                    Нужна помощь с налоговой проверкой или вопросом — найду специалиста по своей ФНС
                  </Text>
                </View>
              </View>
            </Card>

            <Card variant="outlined" padding="lg" onPress={() => selectRole('SPECIALIST')}>
              <View style={{ gap: Spacing.md }}>
                <View
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: BorderRadius.xl,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: Colors.bgSecondary,
                  }}
                >
                  <Feather name="briefcase" size={24} color={Colors.brandPrimary} />
                </View>
                <View style={{ gap: Spacing.xs }}>
                  <Heading level={4}>Я специалист по налогам</Heading>
                  <Text variant="muted">
                    Консультирую клиентов по вопросам налоговых проверок в конкретных ФНС
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        </View>
      </Container>
    </Screen>
  );
}
