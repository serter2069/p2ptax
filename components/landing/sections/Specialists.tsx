import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
  avatarPalette,
} from '../../../constants/Colors';
import { Button, Card, Container, Heading, Text } from '../../../components/ui';
import { specialists } from '../../../lib/api/endpoints';

interface FeaturedSpecialist {
  nick: string;
  displayName: string;
  avatarUrl: string | null;
  cities: string[];
  services: string[];
  badges: string[];
  experience: number | null;
  headline: string | null;
  createdAt: string;
}

// Deterministic color from nick string
function nickColor(nick: string): string {
  let hash = 0;
  for (let i = 0; i < nick.length; i++) hash = nick.charCodeAt(i) + ((hash << 5) - hash);
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

function initials(displayName: string): string {
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

const CARD_WIDTH = 220;
const CARD_GAP = Spacing.md;

function CardSkeleton() {
  return (
    <View
      style={{
        width: CARD_WIDTH,
        gap: Spacing.md,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.white,
        padding: Spacing.lg,
        ...Shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <View style={{ width: 48, height: 48, borderRadius: BorderRadius.full, backgroundColor: Colors.bgSecondary }} />
        <View style={{ flex: 1, gap: Spacing.xs + 2 }}>
          <View style={{ height: 12, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgSecondary, width: '80%' }} />
          <View style={{ height: 10, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgSecondary, width: '50%' }} />
        </View>
      </View>
      <View style={{ height: 10, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgSecondary, width: '60%' }} />
      <View style={{ height: 24, borderRadius: BorderRadius.full, backgroundColor: Colors.bgSecondary, width: '70%' }} />
      <View style={{ height: 10, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgSecondary, width: '40%' }} />
      <View style={{ height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.bgSecondary }} />
    </View>
  );
}

export function Specialists() {
  const router = useRouter();
  const [featured, setFeatured] = useState<FeaturedSpecialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    specialists
      .getFeatured()
      .then((res) => {
        const data = (res as any).data ?? res;
        setFeatured(Array.isArray(data) ? data : []);
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && featured.length === 0) return null;

  return (
    <View style={{ paddingVertical: Spacing['4xl'], backgroundColor: Colors.bgSecondary }}>
      <Container style={{ marginBottom: Spacing['2xl'] }}>
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
          Наши специалисты
        </Text>
        <Heading level={2}>Работают на платформе</Heading>
      </Container>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: CARD_GAP }}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : featured.map((spec) => (
              <SpecialistCard
                key={spec.nick}
                spec={spec}
                onPress={() => router.push(`/specialists/${spec.nick}` as any)}
              />
            ))}
      </ScrollView>
    </View>
  );
}

function SpecialistCard({
  spec,
  onPress,
}: {
  spec: FeaturedSpecialist;
  onPress: () => void;
}) {
  const color = nickColor(spec.nick);
  const inits = initials(spec.displayName);
  const city = spec.cities?.[0] ?? '';
  const service = spec.services?.[0] ?? '';

  return (
    <Card variant="elevated" padding="md" style={{ width: CARD_WIDTH, gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <View
          style={{
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: BorderRadius.full,
            backgroundColor: color + '15',
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.md,
              fontWeight: Typography.fontWeight.bold,
              fontFamily: Typography.fontFamily.bold,
              color,
            }}
          >
            {inits}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="semibold" numberOfLines={1} style={{ fontSize: Typography.fontSize.sm }}>
            {spec.displayName}
          </Text>
          {city ? (
            <Text variant="caption" style={{ color: Colors.textMuted, fontSize: Typography.fontSize.xs }}>
              {city}
            </Text>
          ) : null}
        </View>
      </View>

      {spec.headline ? (
        <Text variant="caption" numberOfLines={2} style={{ fontSize: Typography.fontSize.xs }}>
          {spec.headline}
        </Text>
      ) : service ? (
        <View
          style={{
            alignSelf: 'flex-start',
            borderRadius: BorderRadius.full,
            paddingHorizontal: Spacing.sm + 2,
            paddingVertical: Spacing.xs,
            backgroundColor: Colors.brandPrimary + '12',
          }}
        >
          <Text
            weight="medium"
            style={{ fontSize: Typography.fontSize.xs, color: Colors.brandPrimary }}
          >
            {service}
          </Text>
        </View>
      ) : null}

      {spec.experience != null ? (
        <Text variant="caption" style={{ color: Colors.textMuted, fontSize: Typography.fontSize.xs }}>
          Опыт: {spec.experience} лет
        </Text>
      ) : null}

      <Button variant="secondary" onPress={onPress} fullWidth>
        Подробнее
      </Button>
    </Card>
  );
}
