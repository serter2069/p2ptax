import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { api } from '../../lib/api';
import { Colors } from '../../constants/Colors';
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
    <View className="flex-1 bg-bgPrimary">
      <Header title="Продвижения" showBack />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
          }
        >
          <View className="w-full max-w-lg px-5 gap-3">
            {/* Price editor */}
            <Text className="text-sm font-semibold text-textMuted uppercase tracking-wider mt-3">Настройка цен</Text>
            <View className="bg-bgCard rounded-xl p-4 border border-border gap-3 shadow-sm">
              <TextInput
                className="h-11 rounded-lg border border-border px-3 text-base text-textPrimary bg-bgSecondary"
                style={{ outlineStyle: 'none' } as any}
                placeholder="Город"
                placeholderTextColor={Colors.textMuted}
                value={editCity}
                onChangeText={setEditCity}
                autoCapitalize="words"
              />
              <View className="flex-row gap-2">
                {(['BASIC', 'FEATURED', 'TOP'] as const).map((t) => (
                  <Pressable
                    key={t}
                    className={`flex-1 py-2 rounded-lg items-center border ${editTier === t ? 'border-brandPrimary' : 'border-border bg-bgSecondary'}`}
                    style={editTier === t ? { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary } : undefined}
                    onPress={() => setEditTier(t)}
                  >
                    <Text className={`text-xs font-medium ${editTier === t ? 'text-white' : 'text-textSecondary'}`}>
                      {TIER_LABELS[t]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                className="h-11 rounded-lg border border-border px-3 text-base text-textPrimary bg-bgSecondary"
                style={{ outlineStyle: 'none' } as any}
                placeholder="Цена (руб.)"
                placeholderTextColor={Colors.textMuted}
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
              />
              <Pressable
                className="h-11 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: Colors.brandPrimary,
                  opacity: saving ? 0.5 : 1,
                }}
                onPress={handleSavePrice}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.textPrimary} />
                ) : (
                  <Text className="text-base font-semibold text-white">Сохранить цену</Text>
                )}
              </Pressable>
            </View>

            {/* Current prices */}
            {prices.length > 0 ? (
              <>
                <Text className="text-sm font-semibold text-textMuted uppercase tracking-wider mt-3">Текущие цены</Text>
                <View className="bg-bgCard rounded-xl border border-border overflow-hidden">
                  {prices.map((p, i) => (
                    <View key={i} className="flex-row items-center px-4 py-2 border-b border-border">
                      <Text className="flex-1 text-sm text-textPrimary">{p.city}</Text>
                      <Text className="w-[90px] text-sm text-textSecondary">{TIER_LABELS[p.tier] ?? p.tier}</Text>
                      <Text className="w-[80px] text-right text-sm font-semibold text-textAccent">{p.price} руб.</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {/* Active promotions list */}
            <Text className="text-sm font-semibold text-textMuted uppercase tracking-wider mt-3">
              Активные продвижения
              {promotions.length > 0 ? ` (${promotions.length})` : ''}
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color={Colors.brandPrimary} style={{ marginVertical: 24 }} />
            ) : error ? (
              <Text className="text-sm text-statusError text-center py-4">{error}</Text>
            ) : promotions.length === 0 ? (
              <Text className="text-base text-textMuted text-center py-6">Нет продвижений</Text>
            ) : (
              <View className="gap-2">
                {promotions.map((p) => (
                  <View
                    key={p.id}
                    className="bg-bgCard rounded-xl p-4 border border-border gap-2 shadow-sm"
                    style={isExpired(p.expiresAt) ? { borderColor: Colors.borderLight, opacity: 0.6 } : undefined}
                  >
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="flex-1 text-sm font-medium text-textPrimary">
                        {p.specialist.specialistProfile?.nick
                          ? `@${p.specialist.specialistProfile.nick}`
                          : p.specialist.email}
                      </Text>
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: p.tier === 'BASIC' ? Colors.bgSecondary : p.tier === 'FEATURED' ? '#F5F3FF' : '#FEF3C7',
                        }}
                      >
                        <Text className="text-xs font-semibold text-textPrimary">{TIER_LABELS[p.tier]}</Text>
                      </View>
                    </View>
                    <Text className="text-sm text-textSecondary">{p.city}</Text>
                    <Text
                      className="text-xs"
                      style={{ color: isExpired(p.expiresAt) ? Colors.statusError : Colors.textMuted }}
                    >
                      {isExpired(p.expiresAt) ? 'Истёк' : 'До'}: {formatDate(p.expiresAt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
