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

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  function handleRefresh() {
    setRefreshing(true);
    fetchPromotions(true);
  }

  function handlePurchase() {
    Alert.alert(
      'Подключить продвижение',
      'Оплата временно недоступна. Для подключения продвижения свяжитесь с нами через чат поддержки.',
      [{ text: 'Понятно', style: 'cancel' }],
    );
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
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
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
});
