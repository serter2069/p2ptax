import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';

type PromotionTier = 'BASIC' | 'FEATURED' | 'TOP';

interface PriceItem {
  city: string;
  tier: PromotionTier;
  price: number;
}

interface Promotion {
  id: string;
  city: string;
  tier: PromotionTier;
  expiresAt: string;
  createdAt: string;
}

interface SpecialistProfile {
  cities: string[];
}

const TIER_LABELS: Record<PromotionTier, string> = {
  BASIC: 'Базовый',
  FEATURED: 'Продвинутый',
  TOP: 'ТОП',
};

const TIER_ORDER: PromotionTier[] = ['BASIC', 'FEATURED', 'TOP'];

const TIER_COLORS: Record<PromotionTier, string> = {
  BASIC: Colors.statusInfo,
  FEATURED: Colors.brandPrimary,
  TOP: Colors.statusWarning,
};

export default function PromotionScreen() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [myCities, setMyCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState<string | null>(null); // city:tier

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const [myPromos, profile] = await Promise.all([
        api.get<Promotion[]>('/promotions/my'),
        api.get<SpecialistProfile>('/specialists/me'),
      ]);

      setPromotions(myPromos);
      setMyCities(profile.cities);

      // Fetch prices for each city
      if (profile.cities.length > 0) {
        const priceResults = await Promise.all(
          profile.cities.map((city) =>
            api
              .get<PriceItem[]>(`/promotions/prices?city=${encodeURIComponent(city)}`)
              .catch(() => [] as PriceItem[]),
          ),
        );
        const allPrices = priceResults.flat();
        setPrices(allPrices);
      } else {
        // Fall back to default prices
        const defaultPrices = await api.get<PriceItem[]>('/promotions/prices').catch(() => []);
        setPrices(defaultPrices);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('no_profile');
      } else {
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleRefresh() {
    setRefreshing(true);
    fetchData(true);
  }

  function getActivePromo(city: string, tier: PromotionTier): Promotion | undefined {
    const now = new Date();
    return promotions.find(
      (p) => p.city === city && p.tier === tier && new Date(p.expiresAt) > now,
    );
  }

  function getPrice(city: string, tier: PromotionTier): number | null {
    const item = prices.find((p) => p.city === city && p.tier === tier);
    return item?.price ?? null;
  }

  async function handlePurchase(city: string, tier: PromotionTier) {
    const price = getPrice(city, tier);
    const key = `${city}:${tier}`;
    setPurchasing(key);
    try {
      await api.post('/promotions/purchase', { city, tier });
      Alert.alert(
        'Оплата обрабатывается...',
        `Продвижение "${TIER_LABELS[tier]}" в городе ${city}${price !== null ? ` на сумму ${price} руб.` : ''} будет активировано после подтверждения оплаты.`,
      );
      // Refresh to show updated promotion
      await fetchData(true);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 400
            ? err.message
            : err.message
          : 'Ошибка при оформлении';
      Alert.alert('Ошибка', msg);
    } finally {
      setPurchasing(null);
    }
  }

  function formatExpiry(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Продвижение" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error === 'no_profile') {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Продвижение" showBack />
        <EmptyState
          icon="👤"
          title="Профиль не найден"
          subtitle="Создайте профиль специалиста, чтобы управлять продвижением"
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Продвижение" showBack />
        <EmptyState
          icon="⚠️"
          title="Ошибка загрузки"
          subtitle={error}
          ctaLabel="Повторить"
          onCtaPress={() => fetchData()}
        />
      </SafeAreaView>
    );
  }

  const activePrPromotions = promotions.filter(
    (p) => new Date(p.expiresAt) > new Date(),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Продвижение" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        <View style={styles.container}>
          {/* Active promotions section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Активное продвижение</Text>
            {activePrPromotions.length === 0 ? (
              <View style={styles.noneCard}>
                <Text style={styles.noneText}>Нет активного продвижения</Text>
              </View>
            ) : (
              activePrPromotions.map((promo) => (
                <View key={promo.id} style={styles.activePromoCard}>
                  <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[promo.tier] + '22' }]}>
                    <Text style={[styles.tierBadgeText, { color: TIER_COLORS[promo.tier] }]}>
                      {TIER_LABELS[promo.tier]}
                    </Text>
                  </View>
                  <View style={styles.activePromoInfo}>
                    <Text style={styles.activePromoCity}>{promo.city}</Text>
                    <Text style={styles.activePromoExpiry}>
                      {'До: '}{formatExpiry(promo.expiresAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Pricing by city */}
          {myCities.length === 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Тарифы</Text>
              <View style={styles.noneCard}>
                <Text style={styles.noneText}>
                  Добавьте города в профиль, чтобы видеть тарифы
                </Text>
              </View>
            </View>
          ) : (
            myCities.map((city) => (
              <View key={city} style={styles.section}>
                <Text style={styles.sectionTitle}>{city}</Text>
                <Card padding={0}>
                  {TIER_ORDER.map((tier, idx) => {
                    const price = getPrice(city, tier);
                    const active = getActivePromo(city, tier);
                    const key = `${city}:${tier}`;
                    const isBuying = purchasing === key;
                    const isLast = idx === TIER_ORDER.length - 1;
                    return (
                      <View
                        key={tier}
                        style={[styles.priceRow, !isLast && styles.priceRowBorder]}
                      >
                        <View style={styles.priceLeft}>
                          <View style={[styles.dot, { backgroundColor: TIER_COLORS[tier] }]} />
                          <View style={styles.priceInfo}>
                            <Text style={styles.tierName}>{TIER_LABELS[tier]}</Text>
                            {active ? (
                              <Text style={styles.activeUntil}>
                                {'Активно до '}{formatExpiry(active.expiresAt)}
                              </Text>
                            ) : (
                              <Text style={styles.priceVal}>
                                {price !== null ? `${price} руб / 30 дней` : 'Уточните цену'}
                              </Text>
                            )}
                          </View>
                        </View>
                        {active ? (
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>Активно</Text>
                          </View>
                        ) : (
                          <Button
                            onPress={() => handlePurchase(city, tier)}
                            variant="secondary"
                            loading={isBuying}
                            disabled={isBuying || purchasing !== null}
                            style={styles.buyBtn}
                          >
                            Продвинуть
                          </Button>
                        )}
                      </View>
                    );
                  })}
                </Card>
              </View>
            ))
          )}

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              {'Продвижение увеличивает ваш приоритет в каталоге. '}
              {'Оплата обрабатывается после подтверждения. '}
              {'Срок действия: 30 дней.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  noneCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  noneText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  activePromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  tierBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tierBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  activePromoInfo: {
    flex: 1,
    gap: 3,
  },
  activePromoCity: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  activePromoExpiry: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  priceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  priceLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priceInfo: {
    flex: 1,
    gap: 3,
  },
  tierName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  priceVal: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  activeUntil: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusSuccess,
  },
  buyBtn: {
    paddingHorizontal: Spacing.md,
    minWidth: 110,
  },
  activePill: {
    backgroundColor: Colors.statusBg.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  activePillText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },
  disclaimer: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  disclaimerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
