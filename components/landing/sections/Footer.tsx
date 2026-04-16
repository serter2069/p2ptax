import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '../../../constants/Colors';
import { Container, Text } from '../../../components/ui';

export function Footer() {
  return (
    <View
      style={{
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing['2xl'],
        backgroundColor: Colors.bgSurface,
      }}
    >
      <Container padded={false}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View
              style={{
                height: 24,
                width: 24,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: BorderRadius.lg,
                backgroundColor: Colors.brandPrimary,
              }}
            >
              <Feather name="shield" size={13} color={Colors.white} />
            </View>
            <Text weight="bold" style={{ fontSize: Typography.fontSize.sm }}>
              P2PTax
            </Text>
          </View>
          <Text variant="caption" style={{ color: Colors.textMuted, fontSize: Typography.fontSize.xs }}>
            2026. Все права защищены.
          </Text>
        </View>
      </Container>
    </View>
  );
}
