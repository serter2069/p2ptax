import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
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

const TIER_PRICES: Record<Tier, string> = {
  BASIC: '500\u20BD/мес',
  FEATURED: '1500\u20BD/мес',
  TOP: '3000\u20BD/мес',
};

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

  // Fetch specialist profile cities on mount
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
    setSelectedTier('BASIC');
    setSelectedPeriod(1);
    if (profileCities.length > 0) setSelectedCity(profileCities[0]);
    setModalVisible(true);
  }

  async function handleConfirmPurchase() {
    setPurchasing(true);
    setPurchaseError('');
    try {
      const idempotencyKey = Math.random().toString(36).slice(2) + Date.now();
      await api.post<{ promotion: unknown; payment: unknown }>('/promotions/purchase', {
        city: selectedCity,
        tier: selectedTier,
        periodMonths: selectedPeriod,
        idempotencyKey,
      });
      setModalVisible(false);
      fetchPromotions();
      Alert.alert('Продвижение подключено!');
    } catch (err) {
      setPurchaseError(err instanceof ApiError ? err.message : 'Ошибка при покупке');
    } finally {
      setPurchasing(false);
    }
  }

  const activePromotions = promotions.filter((p) => !isExpired(p.expiresAt));
  const expiredPromotions = promotions.filter((p) => isExpired(p.expiresAt));

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Продвижение" showBack />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
          }
        >
          <View style={styles.container}>
            {/* Status banner */}
            <View style={[styles.statusCard, activePromotions.length > 0 ? styles.statusActive : styles.statusInactive]}>
              <Text style={styles.statusIcon}>{activePromotions.length > 0 ? '\uD83D\uDE80' : '\uD83D\uDCC4'}</Text>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {activePromotions.length > 0
                    ? `Активно ${activePromotions.length} продвижени${activePromotions.length === 1 ? 'е' : 'я'}`
                    : 'Продвижение не активно'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {activePromotions.length > 0
                    ? 'Ваш профиль показывается выше в каталоге'
                    : 'Подключите продвижение, чтобы получать больше клиентов'}
                </Text>
              </View>
            </View>

            {/* CTA button */}
            <TouchableOpacity style={styles.purchaseBtn} onPress={handlePurchase} activeOpacity={0.85}>
              <Text style={styles.purchaseBtnText}>Подключить продвижение</Text>
            </TouchableOpacity>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Active promotions */}
            {activePromotions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Активные</Text>
                {activePromotions.map((p) => (
                  <View key={p.id} style={styles.promoCard}>
                    <View style={styles.promoCardHeader}>
                      <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[p.tier] + '22', borderColor: TIER_COLORS[p.tier] + '55' }]}>
                        <Text style={[styles.tierLabel, { color: TIER_COLORS[p.tier] }]}>{TIER_LABELS[p.tier]}</Text>
                      </View>
                      <Text style={styles.promoCity}>{p.city}</Text>
                    </View>
                    <View style={styles.promoDates}>
                      <Text style={styles.promoDaysLeft}>
                        Осталось дней: <Text style={styles.promoDaysNum}>{daysLeft(p.expiresAt)}</Text>
                      </Text>
                      <Text style={styles.promoExpiry}>до {formatDate(p.expiresAt)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Expired promotions */}
            {expiredPromotions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>История</Text>
                {expiredPromotions.slice(0, 5).map((p) => (
                  <View key={p.id} style={[styles.promoCard, styles.promoCardExpired]}>
                    <View style={styles.promoCardHeader}>
                      <View style={styles.tierBadgeExpired}>
                        <Text style={styles.tierLabelExpired}>{TIER_LABELS[p.tier]}</Text>
                      </View>
                      <Text style={styles.promoCityExpired}>{p.city}</Text>
                    </View>
                    <Text style={styles.promoExpiryExpired}>Истёк {formatDate(p.expiresAt)}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Empty state hint */}
            {promotions.length === 0 && !error && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Как работает продвижение?</Text>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemIcon}>{'\u2B50'}</Text>
                  <Text style={styles.infoItemText}><Text style={styles.bold}>Топ</Text> — первое место в каталоге вашего города</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemIcon}>{'\uD83D\uDD25'}</Text>
                  <Text style={styles.infoItemText}><Text style={styles.bold}>Выделенное</Text> — карточка выделяется цветом и значком</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemIcon}>{'\u2705'}</Text>
                  <Text style={styles.infoItemText}><Text style={styles.bold}>Базовое</Text> — повышенный приоритет в выдаче</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Purchase Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => { /* prevent close on card tap */ }}>
            <Text style={styles.modalTitle}>Подключить продвижение</Text>

            {/* City selector */}
            <Text style={styles.modalLabel}>Город</Text>
            <View style={styles.chipRow}>
              {profileCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[styles.chip, selectedCity === city && styles.chipActive]}
                  onPress={() => setSelectedCity(city)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedCity === city && styles.chipTextActive]}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tier selector */}
            <Text style={styles.modalLabel}>Тариф</Text>
            <View style={styles.chipRow}>
              {(['BASIC', 'FEATURED', 'TOP'] as Tier[]).map((tier) => (
                <TouchableOpacity
                  key={tier}
                  style={[styles.chip, selectedTier === tier && styles.chipActive]}
                  onPress={() => setSelectedTier(tier)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedTier === tier && styles.chipTextActive]}>
                    {TIER_LABELS[tier]} ({TIER_PRICES[tier]})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Period selector */}
            <Text style={styles.modalLabel}>Период</Text>
            <View style={styles.chipRow}>
              {PERIOD_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, selectedPeriod === opt.value && styles.chipActive]}
                  onPress={() => setSelectedPeriod(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedPeriod === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Error */}
            {purchaseError ? <Text style={styles.modalError}>{purchaseError}</Text> : null}

            {/* CTA */}
            <TouchableOpacity
              style={[styles.modalCta, purchasing && styles.modalCtaDisabled]}
              onPress={handleConfirmPurchase}
              activeOpacity={0.85}
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalCtaText}>Подключить (бесплатно)</Text>
              )}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel} activeOpacity={0.7}>
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: Spacing.md,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  statusActive: {
    backgroundColor: Colors.statusBg.success,
    borderColor: Colors.statusSuccess,
  },
  statusInactive: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
  },
  statusIcon: {
    fontSize: 28,
  },
  statusInfo: {
    flex: 1,
    gap: 3,
  },
  statusTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  statusSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  purchaseBtn: {
    height: 52,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  purchaseBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
  },
  promoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  promoCardExpired: {
    opacity: 0.6,
  },
  promoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tierBadge: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  tierLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  tierBadgeExpired: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tierLabelExpired: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
  },
  promoCity: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  promoCityExpired: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  promoDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoDaysLeft: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  promoDaysNum: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  promoExpiry: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  promoExpiryExpired: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  infoTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoItemIcon: {
    fontSize: 16,
    lineHeight: 22,
  },
  infoItemText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgSecondary,
  },
  chipActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.brandPrimary + '15',
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalError: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    textAlign: 'center',
  },
  modalCta: {
    height: 48,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  modalCtaDisabled: {
    opacity: 0.7,
  },
  modalCtaText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  modalCancelText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
});
