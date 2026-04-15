import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Pressable,
  Modal,
} from 'react-native';
import { api, ApiError } from '../../lib/api';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';

interface PromotionItem {
  id: string;
  city: string;
  tier: 'BASIC' | 'FEATURED' | 'TOP';
  expiresAt: string;
  createdAt: string;
  active: boolean;
}

type Tier = 'BASIC' | 'FEATURED' | 'TOP';
type PeriodMonths = 1 | 3 | 6;

const TIER_LABELS: Record<string, string> = {
  BASIC: 'Базовое',
  FEATURED: 'Выделенное',
  TOP: 'Топ',
};

const TIER_COLORS: Record<string, string> = {
  BASIC: '#1A5BA8',
  FEATURED: '#8B5CF6',
  TOP: '#D97706',
};

const TIER_PRICES_NUM: Record<Tier, number> = {
  BASIC: 500,
  FEATURED: 1500,
  TOP: 3000,
};

const TIER_PRICES: Record<Tier, string> = {
  BASIC: '500\u20BD/мес',
  FEATURED: '1500\u20BD/мес',
  TOP: '3000\u20BD/мес',
};

const DISCOUNT: Record<PeriodMonths, number> = { 1: 0, 3: 0.1, 6: 0.2 };

function calcTotal(tier: Tier, period: PeriodMonths): number {
  return Math.round(TIER_PRICES_NUM[tier] * period * (1 - DISCOUNT[period]));
}

const PERIOD_OPTIONS: { value: PeriodMonths; label: string }[] = [
  { value: 1, label: '1 мес' },
  { value: 3, label: '3 мес (-10%)' },
  { value: 6, label: '6 мес (-20%)' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

function isExpired(iso: string): boolean {
  return new Date(iso) < new Date();
}

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export default function PromotionScreen() {
  const { isMobile } = useBreakpoints();
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Purchase modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier>('BASIC');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodMonths>(1);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [profileCities, setProfileCities] = useState<string[]>([]);

  const fetchPromotions = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<PromotionItem[]>('/promotions/my');
      setPromotions(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить продвижения');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const profile = await api.get<{ cities?: string[] }>('/specialists/me');
        const cities = profile.cities && profile.cities.length > 0 ? profile.cities : ['Москва'];
        setProfileCities(cities);
        setSelectedCity(cities[0]);
      } catch {
        setProfileCities(['Москва']);
        setSelectedCity('Москва');
      }
    })();
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  function handleRefresh() {
    setRefreshing(true);
    fetchPromotions(true);
  }

  function handlePurchase() {
    setPurchaseError('');
    setPurchaseSuccess(false);
    setSelectedTier('BASIC');
    setSelectedPeriod(1);
    if (profileCities.length > 0) setSelectedCity(profileCities[0]);
    setModalVisible(true);
  }

  async function handleConfirmPurchase() {
    setPurchasing(true);
    setPurchaseError('');
    setPurchaseSuccess(false);
    try {
      const idempotencyKey = Math.random().toString(36).slice(2) + Date.now();
      await api.post<{ promotion: unknown; payment: unknown }>('/promotions/purchase', {
        city: selectedCity,
        tier: selectedTier,
        periodMonths: selectedPeriod,
        idempotencyKey,
      });
      setPurchaseSuccess(true);
      fetchPromotions();
      setTimeout(() => {
        setModalVisible(false);
        setPurchaseSuccess(false);
      }, 1500);
    } catch (err) {
      setPurchaseError(
        err instanceof ApiError ? err.message : 'Ошибка оплаты. Попробуйте снова.',
      );
    } finally {
      setPurchasing(false);
    }
  }

  const activePromotions = promotions.filter((p) => !isExpired(p.expiresAt));
  const expiredPromotions = promotions.filter((p) => isExpired(p.expiresAt));

  return (
    <View className="flex-1 bg-bgPrimary">
      {isMobile && <Header title="Продвижение" showBack />}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
          }
        >
          <View className="w-full max-w-[430px] px-5 gap-3">
            {/* Status banner */}
            <View
              className="flex-row items-center gap-3 rounded-xl p-4 border shadow-sm"
              style={{
                backgroundColor: activePromotions.length > 0 ? Colors.bgSecondary : Colors.bgCard,
                borderColor: activePromotions.length > 0 ? Colors.statusSuccess : Colors.border,
              }}
            >
              <Text className="text-[28px]">{activePromotions.length > 0 ? '\uD83D\uDE80' : '\uD83D\uDCC4'}</Text>
              <View className="flex-1 gap-0.5">
                <Text className="text-base font-semibold text-textPrimary">
                  {activePromotions.length > 0
                    ? `Активно ${activePromotions.length} продвижени${activePromotions.length === 1 ? 'е' : 'я'}`
                    : 'Продвижение не активно'}
                </Text>
                <Text className="text-sm text-textSecondary leading-[18px]">
                  {activePromotions.length > 0
                    ? 'Ваш профиль показывается выше в каталоге'
                    : 'Подключите продвижение, чтобы получать больше клиентов'}
                </Text>
              </View>
            </View>

            {/* CTA button */}
            <Pressable
              className="h-[52px] rounded-lg items-center justify-center shadow-sm"
              style={{ backgroundColor: Colors.brandPrimary }}
              onPress={handlePurchase}
            >
              <Text className="text-base font-semibold text-white">Подключить продвижение</Text>
            </Pressable>

            {error ? (
              <Text className="text-sm text-statusError text-center">{error}</Text>
            ) : null}

            {/* Active promotions */}
            {activePromotions.length > 0 && (
              <>
                <Text className="text-xs font-semibold text-textMuted uppercase tracking-wider mt-2">Активные</Text>
                {activePromotions.map((p) => (
                  <View key={p.id} className="bg-bgCard rounded-lg p-4 border border-border gap-2 shadow-sm">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="py-0.5 px-2 rounded border"
                        style={{ backgroundColor: TIER_COLORS[p.tier] + '22', borderColor: TIER_COLORS[p.tier] + '55' }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: TIER_COLORS[p.tier] }}>{TIER_LABELS[p.tier]}</Text>
                      </View>
                      <Text className="text-sm font-medium text-textPrimary">{p.city}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-textSecondary">
                        Осталось дней: <Text className="font-bold text-brandPrimary">{daysLeft(p.expiresAt)}</Text>
                      </Text>
                      <Text className="text-xs text-textMuted">до {formatDate(p.expiresAt)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Expired promotions */}
            {expiredPromotions.length > 0 && (
              <>
                <Text className="text-xs font-semibold text-textMuted uppercase tracking-wider mt-2">История</Text>
                {expiredPromotions.slice(0, 5).map((p) => (
                  <View key={p.id} className="bg-bgCard rounded-lg p-4 border border-border gap-2 shadow-sm" style={{ opacity: 0.6 }}>
                    <View className="flex-row items-center gap-2">
                      <View className="py-0.5 px-2 rounded bg-bgSecondary border border-borderLight">
                        <Text className="text-xs font-semibold text-textMuted">{TIER_LABELS[p.tier]}</Text>
                      </View>
                      <Text className="text-sm text-textMuted">{p.city}</Text>
                    </View>
                    <Text className="text-xs text-textMuted">Истёк {formatDate(p.expiresAt)}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Empty state hint */}
            {promotions.length === 0 && !error && (
              <View className="bg-bgCard rounded-xl p-4 border border-border gap-3 mt-2">
                <Text className="text-base font-semibold text-textPrimary mb-1">Как работает продвижение?</Text>
                <View className="flex-row items-start gap-2">
                  <Text className="text-[16px] leading-[22px]">{'\u2B50'}</Text>
                  <Text className="flex-1 text-sm text-textSecondary leading-5"><Text className="font-semibold text-textPrimary">Топ</Text> — первое место в каталоге вашего города</Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Text className="text-[16px] leading-[22px]">{'\uD83D\uDD25'}</Text>
                  <Text className="flex-1 text-sm text-textSecondary leading-5"><Text className="font-semibold text-textPrimary">Выделенное</Text> — карточка выделяется цветом и значком</Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Text className="text-[16px] leading-[22px]">{'\u2705'}</Text>
                  <Text className="flex-1 text-sm text-textSecondary leading-5"><Text className="font-semibold text-textPrimary">Базовое</Text> — повышенный приоритет в выдаче</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Purchase Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable
          className="flex-1 items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable className="w-full max-w-[430px] bg-bgCard rounded-xl p-5 gap-3 shadow-sm" onPress={() => {}}>
            <Text className="text-lg font-semibold text-textPrimary text-center">Подключить продвижение</Text>

            {/* City selector */}
            <Text className="text-sm font-semibold text-textSecondary mt-1">Город</Text>
            <View className="flex-row flex-wrap gap-2">
              {profileCities.map((city) => (
                <Pressable
                  key={city}
                  className={`py-2 px-3 rounded-lg border ${selectedCity === city ? 'border-brandPrimary' : 'border-border bg-bgSecondary'}`}
                  style={selectedCity === city ? { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary + '15' } : undefined}
                  onPress={() => setSelectedCity(city)}
                >
                  <Text className={`text-sm ${selectedCity === city ? 'text-brandPrimary font-semibold' : 'text-textSecondary'}`}>{city}</Text>
                </Pressable>
              ))}
            </View>

            {/* Tier selector */}
            <Text className="text-sm font-semibold text-textSecondary mt-1">Тариф</Text>
            <View className="flex-row flex-wrap gap-2">
              {(['BASIC', 'FEATURED', 'TOP'] as Tier[]).map((tier) => (
                <Pressable
                  key={tier}
                  className={`py-2 px-3 rounded-lg border ${selectedTier === tier ? 'border-brandPrimary' : 'border-border bg-bgSecondary'}`}
                  style={selectedTier === tier ? { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary + '15' } : undefined}
                  onPress={() => setSelectedTier(tier)}
                >
                  <Text className={`text-sm ${selectedTier === tier ? 'text-brandPrimary font-semibold' : 'text-textSecondary'}`}>
                    {TIER_LABELS[tier]} ({TIER_PRICES[tier]})
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Period selector */}
            <Text className="text-sm font-semibold text-textSecondary mt-1">Период</Text>
            <View className="flex-row flex-wrap gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  className={`py-2 px-3 rounded-lg border ${selectedPeriod === opt.value ? 'border-brandPrimary' : 'border-border bg-bgSecondary'}`}
                  style={selectedPeriod === opt.value ? { borderColor: Colors.brandPrimary, backgroundColor: Colors.brandPrimary + '15' } : undefined}
                  onPress={() => setSelectedPeriod(opt.value)}
                >
                  <Text className={`text-sm ${selectedPeriod === opt.value ? 'text-brandPrimary font-semibold' : 'text-textSecondary'}`}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            {purchaseError ? <Text className="text-sm text-statusError text-center">{purchaseError}</Text> : null}

            {purchaseSuccess ? (
              <View className="rounded-lg py-2 items-center" style={{ backgroundColor: Colors.bgSecondary }}>
                <Text className="text-sm font-semibold" style={{ color: Colors.statusSuccess }}>Активировано</Text>
              </View>
            ) : null}

            <Pressable
              className="h-12 rounded-lg items-center justify-center mt-2"
              style={{
                backgroundColor: purchaseSuccess ? Colors.statusSuccess : Colors.brandPrimary,
                opacity: (purchasing || purchaseSuccess) ? 0.7 : 1,
              }}
              onPress={handleConfirmPurchase}
              disabled={purchasing || purchaseSuccess}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : purchaseSuccess ? (
                <Text className="text-base font-semibold text-white">Активировано</Text>
              ) : (
                <Text className="text-base font-semibold text-white">
                  Оплатить {calcTotal(selectedTier, selectedPeriod)} {'\u20BD'}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={() => setModalVisible(false)} className="items-center py-2">
              <Text className="text-sm text-textMuted">Отмена</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
