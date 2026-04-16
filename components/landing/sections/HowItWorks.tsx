import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '../../../constants/Colors';
import { Container, Heading, Text } from '../../../components/ui';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

type StepIcon = 'map-pin' | 'file-text' | 'message-circle';

const STEPS: { icon: StepIcon; title: string; desc: string }[] = [
  { icon: 'map-pin', title: 'Укажите ФНС', desc: 'Выберите город и вашу налоговую инспекцию' },
  { icon: 'file-text', title: 'Опишите ситуацию', desc: 'Укажите тип проверки и детали задачи' },
  {
    icon: 'message-circle',
    title: 'Получите помощь',
    desc: 'Специалист вашей ФНС свяжется в чате',
  },
];

export function HowItWorks() {
  const { atLeast } = useBreakpoint();
  const isDesktop = atLeast('md');

  return (
    <View
      style={{
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing['4xl'],
        backgroundColor: Colors.bgSecondary,
      }}
    >
      <Container padded={false}>
        <Text
          style={{
            marginBottom: Spacing.xs,
            fontSize: Typography.fontSize.xs,
            fontWeight: Typography.fontWeight.bold,
            fontFamily: Typography.fontFamily.bold,
            color: Colors.brandPrimary,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          Как это работает
        </Text>
        <Heading level={2} style={{ marginBottom: Spacing['2xl'] }}>
          Три шага к решению
        </Heading>

        <View style={{ gap: Spacing.lg, flexDirection: isDesktop ? 'row' : 'column' }}>
          {STEPS.map((step, i) => (
            <View
              key={step.title}
              style={{
                flex: 1,
                gap: Spacing.md,
                borderRadius: BorderRadius.xl,
                backgroundColor: Colors.white,
                padding: Spacing.xl,
                ...Shadows.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View
                  style={{
                    height: 28,
                    width: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: BorderRadius.full,
                    backgroundColor: Colors.brandPrimary,
                  }}
                >
                  <Text
                    weight="bold"
                    style={{ fontSize: Typography.fontSize.sm, color: Colors.white }}
                  >
                    {i + 1}
                  </Text>
                </View>
                <Feather name={step.icon} size={18} color={Colors.brandPrimary} />
              </View>
              <Heading level={4}>{step.title}</Heading>
              <Text variant="muted" style={{ fontSize: Typography.fontSize.sm, lineHeight: 20 }}>
                {step.desc}
              </Text>
            </View>
          ))}
        </View>
      </Container>
    </View>
  );
}
