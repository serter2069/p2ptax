import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '../../../constants/Colors';
import { Container, Heading, Text } from '../../../components/ui';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

type ServiceIcon = 'clipboard' | 'truck' | 'eye';

const SERVICES: { icon: ServiceIcon; title: string; desc: string }[] = [
  {
    icon: 'truck',
    title: 'Выездная проверка',
    desc: 'Полное сопровождение при выездной налоговой проверке. Подготовка документов, контроль действий инспекторов, подготовка возражений на акт проверки.',
  },
  {
    icon: 'clipboard',
    title: 'Камеральная проверка',
    desc: 'Подготовка пояснений на требования ФНС, представление интересов при камеральной проверке деклараций, оспаривание доначислений.',
  },
  {
    icon: 'eye',
    title: 'Отдел оперативного контроля',
    desc: 'Представительство при взаимодействии с отделом оперативного контроля. Консультирование по оперативным мероприятиям, минимизация рисков.',
  },
];

export function Services() {
  const { atLeast } = useBreakpoint();
  const isDesktop = atLeast('md');

  return (
    <View
      style={{
        backgroundColor: Colors.bgPrimary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing['4xl'],
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
          Направления работы
        </Text>
        <Heading level={2} style={{ marginBottom: Spacing['2xl'] }}>
          Чем мы помогаем
        </Heading>

        <View
          style={{
            gap: Spacing.lg,
            flexDirection: isDesktop ? 'row' : 'column',
          }}
        >
          {SERVICES.map((svc) => (
            <View
              key={svc.title}
              style={{
                flex: 1,
                gap: Spacing.md,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.borderLight,
                backgroundColor: Colors.bgSecondary,
                padding: Spacing.xl,
              }}
            >
              <View
                style={{
                  height: 40,
                  width: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: BorderRadius.lg,
                  backgroundColor: Colors.brandPrimary + '12',
                }}
              >
                <Feather name={svc.icon} size={20} color={Colors.brandPrimary} />
              </View>
              <Heading level={4}>{svc.title}</Heading>
              <Text variant="muted" style={{ fontSize: Typography.fontSize.sm, lineHeight: 20 }}>
                {svc.desc}
              </Text>
            </View>
          ))}
        </View>
      </Container>
    </View>
  );
}
