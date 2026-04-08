import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';

interface PromotionItem {
  id: string;
  city: string;
  tier: 'BASIC' | 'FEATURED' | 'TOP';
  expiresAt: string;
  createdAt: string;
  specialist: {
    id: string;
    email: string;
    specialistProfile: { nick: string } | null;
  };
}

interface PriceItem {
  city: string;
  tier: string;
  price: number;
}

const TIER_LABELS: Record<string, string> = {
  BASIC: 'Базовое',
  FEATURED: 'Выделенное',
  TOP: 'Топ',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function isExpired(iso: string): boolean {
  return new Date(iso) < new Date();
}

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Price edit state
  const [editCity, setEditCity] = useState('');
  const [editTier, setEditTier] = useState<'BASIC' | 'FEATURED' | 'TOP'>('BASIC');
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const [promos, priceList] = await Promise.all([
        api.get<PromotionItem[]>('/promotions/admin'),
        api.get<PriceItem[]>('/promotions/admin/prices'),
      ]);
      setPromotions(promos);
      setPrices(priceList);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load promotions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(true); };

  const handleSavePrice = async () => {
    if (!editCity.trim()) {
      Alert.alert('Ошибка', 'Введите город');
      return;
    }
    const priceNum = parseInt(editPrice, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Ошибка', 'Введите корректную цену');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/promotions/admin/prices', { city: editCity.trim(), tier: editTier, price: priceNum });
      Alert.alert('Готово', `Цена обновлена: ${editCity} / ${editTier} = ${priceNum} руб.`);
      setEditCity('');
      setEditPrice('');
      fetchData(true);
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message ?? 'Не удалось обновить цену');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Продвижения" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
          }
        >
          <View style={styles.container}>
            {/* Price editor */}
            <Text style={styles.sectionTitle}>Настройка цен</Text>
            <View style={styles.priceEditor}>
              <TextInput
                style={styles.input}
                placeholder="Город"
                placeholderTextColor={Colors.textMuted}
                value={editCity}
                onChangeText={setEditCity}
                autoCapitalize="words"
              />
              <View style={styles.tierRow}>
                {(['BASIC', 'FEATURED', 'TOP'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tierBtn, editTier === t && styles.tierBtnActive]}
                    onPress={() => setEditTier(t)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.tierBtnText, editTier === t && styles.tierBtnTextActive]}>
                      {TIER_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Цена (руб.)"
                placeholderTextColor={Colors.textMuted}
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSavePrice}
                disabled={saving}
                activeOpacity={0.75}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.textPrimary} />
                ) : (
                  <Text style={styles.saveBtnText}>Сохранить цену</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Current prices */}
            {prices.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Текущие цены</Text>
                <View style={styles.priceTable}>
                  {prices.map((p, i) => (
                    <View key={i} style={styles.priceRow}>
                      <Text style={styles.priceCity}>{p.city}</Text>
                      <Text style={styles.priceTier}>{TIER_LABELS[p.tier] ?? p.tier}</Text>
                      <Text style={styles.priceValue}>{p.price} руб.</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {/* Active promotions list */}
            <Text style={styles.sectionTitle}>
              Активные продвижения
              {promotions.length > 0 ? ` (${promotions.length})` : ''}
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color={Colors.brandPrimary} style={styles.loader} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : promotions.length === 0 ? (
              <Text style={styles.emptyText}>Нет продвижений</Text>
            ) : (
              <View style={styles.list}>
                {promotions.map((p) => (
                  <View key={p.id} style={[styles.card, isExpired(p.expiresAt) && styles.cardExpired]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardNick}>
                        {p.specialist.specialistProfile?.nick
                          ? `@${p.specialist.specialistProfile.nick}`
                          : p.specialist.email}
                      </Text>
                      <View style={[styles.tierPill, styles[`tier${p.tier}` as keyof typeof styles] as any]}>
                        <Text style={styles.tierPillText}>{TIER_LABELS[p.tier]}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardCity}>{p.city}</Text>
                    <Text style={[styles.cardExpiry, isExpired(p.expiresAt) && styles.cardExpiryExpired]}>
                      {isExpired(p.expiresAt) ? 'Истёк' : 'До'}: {formatDate(p.expiresAt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  flex: {
    flex: 1,
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
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
  },
  priceEditor: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  input: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgSecondary,
  },
  tierRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tierBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tierBtnActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  tierBtnText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  tierBtnTextActive: {
    color: Colors.white,
  },
  saveBtn: {
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  priceTable: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  priceCity: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  priceTier: {
    width: 90,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  priceValue: {
    width: 80,
    textAlign: 'right',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textAccent,
  },
  loader: {
    marginVertical: Spacing['2xl'],
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing['2xl'],
  },
  list: {
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardExpired: {
    borderColor: Colors.borderLight,
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardNick: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  tierPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tierBASIC: {
    backgroundColor: Colors.statusBg.info,
  },
  tierFEATURED: {
    backgroundColor: Colors.statusBg.accent,
  },
  tierTOP: {
    backgroundColor: Colors.statusBg.warning,
  },
  tierPillText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  cardCity: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  cardExpiry: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  cardExpiryExpired: {
    color: Colors.statusError,
  },
});
