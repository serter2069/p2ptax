import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Colors } from '../constants/Colors';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { LandingHeader } from '../components/LandingHeader';
import { Footer } from '../components/Footer';

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
    <View className="flex-1 bg-bgPrimary">
      <Stack.Screen options={{ title: 'Тарифы продвижения — Налоговик' }} />
      <Head>
        <title>Тарифы продвижения — Налоговик</title>
        <meta name="description" content="Тарифы продвижения для специалистов на платформе Налоговик. BASIC, Featured, Top — выберите подходящий тариф." />
      </Head>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <LandingHeader />

        <View className="w-full max-w-lg self-center px-4 py-8 gap-5">
          {/* Title */}
          <Text className="text-2xl font-bold text-textPrimary text-center">Тарифы продвижения</Text>
          <Text className="text-base text-textSecondary text-center leading-[22px]">
            Выберите тариф, чтобы получать больше клиентов в вашем городе
          </Text>

          {/* City selector */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-textPrimary">Город</Text>
            <View className="flex-row flex-wrap gap-2">
              {CITIES.map((city) => (
                <Pressable
                  key={city.key}
                  className={`px-3 py-2 rounded border ${selectedCity === city.key ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
                  style={selectedCity === city.key ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
                  onPress={() => handleCityChange(city.key)}
                >
                  <Text className={`text-sm font-medium ${selectedCity === city.key ? 'text-white' : 'text-textSecondary'}`}>
                    {city.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Period selector */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-textPrimary">Период</Text>
            <View className="flex-row flex-wrap gap-2">
              {PERIODS.map((period) => (
                <Pressable
                  key={period.months}
                  className={`px-3 py-2 rounded border ${selectedPeriod === period.months ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
                  style={selectedPeriod === period.months ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
                  onPress={() => handlePeriodChange(period.months)}
                >
                  <Text className={`text-sm font-medium ${selectedPeriod === period.months ? 'text-white' : 'text-textSecondary'}`}>
                    {period.label}
                    {period.discount > 0 ? ` (-${period.discount * 100}%)` : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Tier cards */}
          <View className={`gap-4 ${!isMobile ? 'flex-row' : ''}`}>
            {TIERS.map((tier) => {
              const isFeatured = tier.key === 'FEATURED';
              const price = getPrice(tier.key);

              return (
                <View
                  key={tier.key}
                  className={`flex-1 rounded-xl border p-5 gap-3 items-center ${isFeatured ? 'border-brandPrimary' : 'border-border bg-bgCard'}`}
                  style={isFeatured ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
                >
                  {isFeatured && (
                    <View className="rounded-full px-3 py-0.5" style={{ backgroundColor: '#F5F3FF' }}>
                      <Text className="text-xs font-semibold text-brandPrimary">Популярный</Text>
                    </View>
                  )}
                  <Text className={`text-lg font-bold ${isFeatured ? 'text-white' : 'text-textPrimary'}`}>
                    {tier.name}
                  </Text>
                  <View className="flex-row items-baseline gap-1">
                    {priceLoading ? (
                      <ActivityIndicator size="small" color={isFeatured ? Colors.white : Colors.brandPrimary} />
                    ) : (
                      <>
                        <Text className={`text-3xl font-bold ${isFeatured ? 'text-white' : 'text-textPrimary'}`}>
                          {formatPrice(price)}
                        </Text>
                        <Text className={`text-base ${isFeatured ? 'text-white/70' : 'text-textSecondary'}`}>
                          /мес
                        </Text>
                      </>
                    )}
                  </View>
                  {currentDiscount > 0 && (
                    <Text className={`text-sm line-through ${isFeatured ? 'text-white/50' : 'text-textMuted'}`}>
                      {formatPrice(PRICES[selectedCity][tier.key])} /мес без скидки
                    </Text>
                  )}
                  <View className="w-full gap-2 mt-2">
                    {tier.features.map((feature) => (
                      <View key={feature} className="flex-row gap-2 items-start">
                        <Text className={`text-base font-bold ${isFeatured ? 'text-white' : 'text-statusSuccess'}`}>
                          {'\u2713'}
                        </Text>
                        <Text className={`text-sm leading-5 flex-1 ${isFeatured ? 'text-white/90' : 'text-textSecondary'}`}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Pressable
                    className={`w-full h-11 rounded-lg items-center justify-center mt-2 border-2 ${isFeatured ? 'bg-white border-white' : 'border-brandPrimary'}`}
                    onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
                  >
                    <Text className="text-base font-semibold text-brandPrimary">
                      Выбрать тариф
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* CTA */}
          <View className="items-center gap-3 py-8 border-t border-border">
            <Text className="text-xl font-bold text-textPrimary">Готовы начать?</Text>
            <Text className="text-base text-textSecondary text-center leading-[22px]">
              Зарегистрируйтесь как специалист и выберите подходящий тариф
            </Text>
            <Pressable
              className="h-[52px] px-8 rounded-lg items-center justify-center mt-2"
              style={{ backgroundColor: Colors.brandPrimary }}
              onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
            >
              <Text className="text-base font-semibold text-white">Зарегистрироваться как специалист</Text>
            </Pressable>
          </View>
        </View>

        <Footer isWide={!isMobile} />
      </ScrollView>
    </View>
  );
}
