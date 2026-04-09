import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Typography, BorderRadius, Colors, Spacing } from '../constants/Colors';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { LandingHeader } from '../components/LandingHeader';

// ---- Pricing data ----

type TierKey = 'BASIC' | 'FEATURED' | 'TOP';
type CityKey = 'moscow' | 'spb' | 'other';

const TIERS: { key: TierKey; name: string; features: string[] }[] = [
  {
    key: 'BASIC',
    name: 'Basic',
    features: [
      'Профиль в каталоге',
      'До 5 откликов в месяц',
      'Базовая позиция в поиске',
    ],
  },
  {
    key: 'FEATURED',
    name: 'Featured',
    features: [
      'Все из Basic',
      'Безлимитные отклики',
      'Выделение в поиске',
      'Бейдж "Проверенный"',
    ],
  },
  {
    key: 'TOP',
    name: 'Top',
    features: [
      'Все из Featured',
      'Первая позиция в городе',
      'Персональный менеджер',
      'Приоритетная модерация',
      'Баннер на главной',
    ],
  },
];

const CITIES: { key: CityKey; label: string }[] = [
  { key: 'moscow', label: 'Москва' },
  { key: 'spb', label: 'Санкт-Петербург' },
  { key: 'other', label: 'Другие города' },
];

// Base monthly prices per city
const PRICES: Record<CityKey, Record<TierKey, number>> = {
  moscow: { BASIC: 1500, FEATURED: 3000, TOP: 5000 },
  spb: { BASIC: 1200, FEATURED: 2500, TOP: 4000 },
  other: { BASIC: 800, FEATURED: 1500, TOP: 2500 },
};

type PeriodKey = 1 | 3 | 6;

const PERIODS: { months: PeriodKey; label: string; discount: number }[] = [
  { months: 1, label: '1 месяц', discount: 0 },
  { months: 3, label: '3 месяца', discount: 0.1 },
  { months: 6, label: '6 месяцев', discount: 0.2 },
];

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU');
}

// ---- Main ----

export default function PricingScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const [selectedCity, setSelectedCity] = useState<CityKey>('moscow');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>(1);
  const [priceLoading, setPriceLoading] = useState(false);

  function handleCityChange(key: CityKey) {
    setPriceLoading(true);
    setSelectedCity(key);
    setTimeout(() => setPriceLoading(false), 300);
  }

  function handlePeriodChange(months: PeriodKey) {
    setPriceLoading(true);
    setSelectedPeriod(months);
    setTimeout(() => setPriceLoading(false), 300);
  }

  const currentDiscount = PERIODS.find((p) => p.months === selectedPeriod)?.discount ?? 0;

  function getPrice(tier: TierKey): number {
    const base = PRICES[selectedCity][tier];
    return Math.round(base * (1 - currentDiscount));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Тарифы продвижения — Налоговик' }} />
      <Head>
        <title>Тарифы продвижения — Налоговик</title>
        <meta name="description" content="Тарифы продвижения для специалистов на платформе Налоговик. BASIC, Featured, Top — выберите подходящий тариф." />
      </Head>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LandingHeader />

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>Тарифы продвижения</Text>
          <Text style={styles.subtitle}>
            Выберите тариф, чтобы получать больше клиентов в вашем городе
          </Text>

          {/* City selector */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorLabel}>Город</Text>
            <View style={styles.chipRow}>
              {CITIES.map((city) => (
                <TouchableOpacity
                  key={city.key}
                  style={[styles.chip, selectedCity === city.key && styles.chipSelected]}
                  onPress={() => handleCityChange(city.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedCity === city.key && styles.chipTextSelected]}>
                    {city.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Period selector */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorLabel}>Период</Text>
            <View style={styles.chipRow}>
              {PERIODS.map((period) => (
                <TouchableOpacity
                  key={period.months}
                  style={[styles.chip, selectedPeriod === period.months && styles.chipSelected]}
                  onPress={() => handlePeriodChange(period.months)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedPeriod === period.months && styles.chipTextSelected]}>
                    {period.label}
                    {period.discount > 0 ? ` (-${period.discount * 100}%)` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tier cards */}
          <View style={[styles.tiersRow, !isMobile && styles.tiersRowWide]}>
            {TIERS.map((tier, index) => {
              const isFeatured = tier.key === 'FEATURED';
              const price = getPrice(tier.key);

              return (
                <View
                  key={tier.key}
                  style={[
                    styles.tierCard,
                    isFeatured && styles.tierCardFeatured,
                    !isMobile && styles.tierCardWide,
                  ]}
                >
                  {isFeatured && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Популярный</Text>
                    </View>
                  )}
                  <Text style={[styles.tierName, isFeatured && styles.tierNameFeatured]}>
                    {tier.name}
                  </Text>
                  <View style={styles.priceRow}>
                    {priceLoading ? (
                      <ActivityIndicator size="small" color={isFeatured ? Colors.white : Colors.brandPrimary} />
                    ) : (
                      <>
                        <Text style={[styles.priceAmount, isFeatured && styles.priceAmountFeatured]}>
                          {formatPrice(price)}
                        </Text>
                        <Text style={[styles.pricePeriod, isFeatured && styles.pricePeriodFeatured]}>
                          /мес
                        </Text>
                      </>
                    )}
                  </View>
                  {currentDiscount > 0 && (
                    <Text style={[styles.originalPrice, isFeatured && styles.originalPriceFeatured]}>
                      {formatPrice(PRICES[selectedCity][tier.key])} /мес без скидки
                    </Text>
                  )}
                  <View style={styles.featuresList}>
                    {tier.features.map((feature) => (
                      <View key={feature} style={styles.featureItem}>
                        <Text style={[styles.featureCheck, isFeatured && styles.featureCheckFeatured]}>
                          {'\u2713'}
                        </Text>
                        <Text style={[styles.featureText, isFeatured && styles.featureTextFeatured]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.tierBtn, isFeatured && styles.tierBtnFeatured]}
                    onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tierBtnText, isFeatured && styles.tierBtnTextFeatured]}>
                      Выбрать тариф
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* CTA */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Готовы начать?</Text>
            <Text style={styles.ctaSubtitle}>
              Зарегистрируйтесь как специалист и выберите подходящий тариф
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaBtnText}>Зарегистрироваться как специалист</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['3xl'],
    gap: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Selectors
  selectorSection: {
    gap: Spacing.sm,
  },
  selectorLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  chipSelected: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.white,
  },

  // Tier cards
  tiersRow: {
    gap: Spacing.lg,
  },
  tiersRowWide: {
    flexDirection: 'row',
  },
  tierCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  tierCardFeatured: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  tierCardWide: {
    flex: 1,
  },
  popularBadge: {
    backgroundColor: Colors.statusBg.accent,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xxs,
  },
  popularBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },
  tierName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  tierNameFeatured: {
    color: Colors.white,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  priceAmountFeatured: {
    color: Colors.white,
  },
  pricePeriod: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  pricePeriodFeatured: {
    color: 'rgba(255,255,255,0.7)',
  },
  originalPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  originalPriceFeatured: {
    color: 'rgba(255,255,255,0.5)',
  },
  featuresList: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  featureCheck: {
    fontSize: Typography.fontSize.base,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.bold,
  },
  featureCheckFeatured: {
    color: Colors.white,
  },
  featureText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  featureTextFeatured: {
    color: 'rgba(255,255,255,0.9)',
  },
  tierBtn: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  tierBtnFeatured: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  tierBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },
  tierBtnTextFeatured: {
    color: Colors.brandPrimary,
  },

  // CTA
  ctaSection: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing['3xl'],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  ctaSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaBtn: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    height: 52,
    paddingHorizontal: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  ctaBtnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});
