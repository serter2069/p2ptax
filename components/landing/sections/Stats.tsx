import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../../constants/Colors';
import { Container, Heading, Text } from '../../../components/ui';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { stats } from '../../../lib/api/endpoints';

interface LandingStats {
  specialistsCount: number;
  ifnsCount: number;
  requestsCount: number;
}

type StatIcon = 'users' | 'map-pin' | 'file-text';

export function Stats() {
  const { atLeast } = useBreakpoint();
  const isDesktop = atLeast('md');
  const [data, setData] = useState<LandingStats | null>(null);

  useEffect(() => {
    stats
      .getLandingStats()
      .then((res) => {
        const d = (res as any).data ?? res;
        setData(d && typeof d === 'object' ? d : null);
      })
      .catch(() => {});
  }, []);

  const items: { value: string; label: string; icon: StatIcon }[] = [
    { value: data ? String(data.specialistsCount) : '—', label: 'специалистов', icon: 'users' },
    { value: data ? String(data.ifnsCount) : '—', label: 'инспекций', icon: 'map-pin' },
    { value: data ? String(data.requestsCount) : '—', label: 'обращений', icon: 'file-text' },
  ];

  return (
    <View
      style={{
        backgroundColor: Colors.bgPrimary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing['4xl'],
      }}
    >
      <Container padded={false}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: isDesktop ? 'space-around' : 'center',
            gap: isDesktop ? 0 : Spacing['2xl'],
          }}
        >
          {items.map((stat) => (
            <View key={stat.label} style={{ alignItems: 'center', gap: Spacing.xs, minWidth: 80 }}>
              <Feather name={stat.icon} size={18} color={Colors.textMuted} />
              <Heading level={2}>{stat.value}</Heading>
              <Text variant="caption" style={{ color: Colors.textMuted, fontSize: Typography.fontSize.xs }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </Container>
    </View>
  );
}
