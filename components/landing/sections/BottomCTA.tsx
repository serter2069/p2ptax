import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '../../../constants/Colors';
import { Button, Heading, Text } from '../../../components/ui';

export function BottomCTA() {
  const router = useRouter();

  return (
    <View
      style={{
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing['4xl'],
        backgroundColor: Colors.bgSecondary,
      }}
    >
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          gap: Spacing.lg,
          borderRadius: BorderRadius.xl,
          backgroundColor: Colors.white,
          padding: Spacing['3xl'],
          maxWidth: 600,
          ...Shadows.md,
        }}
      >
        <Feather name="search" size={28} color={Colors.brandPrimary} />
        <Heading level={3} align="center">
          Найти специалиста по вашей ФНС
        </Heading>
        <Text
          variant="muted"
          align="center"
          style={{ fontSize: Typography.fontSize.sm, maxWidth: 360 }}
        >
          Воспользуйтесь каталогом, чтобы найти специалиста с опытом работы в вашей налоговой
          инспекции
        </Text>
        <View style={{ width: '100%', maxWidth: 300, alignSelf: 'center' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push('/specialists' as any)}
            icon={<Feather name="search" size={16} color={Colors.white} />}
          >
            Открыть каталог
          </Button>
        </View>
      </View>

      <View
        style={{
          marginTop: Spacing['2xl'],
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
        }}
      >
        <Feather name="briefcase" size={14} color={Colors.textMuted} />
        <Text variant="caption" style={{ color: Colors.textMuted }}>
          Вы налоговый специалист?
        </Text>
        <Button variant="ghost" onPress={() => router.push('/(auth)/role' as any)}>
          Присоединиться
        </Button>
      </View>
    </View>
  );
}
