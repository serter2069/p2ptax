import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const BADGE_TAX = 'Знакомый в налоговой';

interface SpecialistProfile {
  id: string;
  nick: string;
  cities: string[];
  services: string[];
  badges: string[];
  contacts: string | null;
}

export default function SpecialistProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [nick, setNick] = useState('');
  const [contacts, setContacts] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [hasTaxBadge, setHasTaxBadge] = useState(false);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<SpecialistProfile>('/specialists/me');
      setProfile(data);
      setNick(data.nick);
      setContacts(data.contacts ?? '');
      setCities(data.cities);
      setServices(data.services);
      setHasTaxBadge(data.badges.includes(BADGE_TAX));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // No profile yet — will need to create one
        setError('profile_not_found');
      } else {
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить профиль');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function handleRefresh() {
    setRefreshing(true);
    fetchProfile(true);
  }

  function addCity() {
    const trimmed = cityInput.trim();
    if (!trimmed) return;
    if (cities.includes(trimmed)) {
      Alert.alert('Уже добавлен', `Город "${trimmed}" уже в списке.`);
      return;
    }
    setCities((prev) => [...prev, trimmed]);
    setCityInput('');
  }

  function removeCity(city: string) {
    setCities((prev) => prev.filter((c) => c !== city));
  }

  function addService() {
    const trimmed = serviceInput.trim();
    if (!trimmed) return;
    setServices((prev) => [...prev, trimmed]);
    setServiceInput('');
  }

  function removeService(svc: string) {
    setServices((prev) => prev.filter((s) => s !== svc));
  }

  async function handleSave() {
    if (!nick.trim()) {
      Alert.alert('Ошибка', 'Ник не может быть пустым');
      return;
    }
    setSaving(true);
    try {
      const badges = hasTaxBadge ? [BADGE_TAX] : [];
      const updated = await api.patch<SpecialistProfile>('/specialists/me', {
        nick: nick.trim(),
        contacts: contacts.trim() || null,
        cities,
        services,
        badges,
      });
      setProfile(updated);
      Alert.alert('Сохранено', 'Профиль обновлён.');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 409
            ? 'Этот ник уже занят, выберите другой.'
            : err.message
          : 'Ошибка при сохранении';
      Alert.alert('Ошибка', msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Мой профиль" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && error !== 'profile_not_found') {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Мой профиль" showBack />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={() => fetchProfile()} variant="ghost" style={styles.retryBtn}>
            Повторить
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (error === 'profile_not_found') {
    router.replace('/(dashboard)/specialist-profile');
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Мой профиль" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        <View style={styles.container}>
          {/* Nick */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Основное</Text>
            <Input
              label="Ник (уникальный)"
              value={nick}
              onChangeText={setNick}
              placeholder="moi_nik"
              autoCapitalize="none"
            />
            <Input
              label="Контакты (необязательно)"
              value={contacts}
              onChangeText={setContacts}
              placeholder="Telegram: @username, тел: +7..."
              autoCapitalize="sentences"
              style={styles.inputGap}
            />
          </View>

          {/* Badge toggle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Бейджи</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badgeInfo}>
                <Text style={styles.badgeLabel}>{BADGE_TAX}</Text>
                <Text style={styles.badgeHint}>Подтверждённый контакт в ФНС</Text>
              </View>
              <Switch
                value={hasTaxBadge}
                onValueChange={setHasTaxBadge}
                trackColor={{ false: Colors.border, true: Colors.brandPrimary }}
                thumbColor={Colors.textPrimary}
              />
            </View>
          </View>

          {/* Cities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Города работы</Text>
            <View style={styles.addRow}>
              <TextInput
                value={cityInput}
                onChangeText={setCityInput}
                placeholder="Добавить город..."
                placeholderTextColor={Colors.textMuted}
                style={styles.addInput}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={addCity}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addCity}>
                <Text style={styles.addBtnText}>{'+'}</Text>
              </TouchableOpacity>
            </View>
            {cities.length === 0 && (
              <Text style={styles.emptyHint}>Нет городов — добавьте хотя бы один</Text>
            )}
            <View style={styles.tagList}>
              {cities.map((city) => (
                <View key={city} style={styles.tag}>
                  <Text style={styles.tagText}>{city}</Text>
                  <TouchableOpacity onPress={() => removeCity(city)} hitSlop={8}>
                    <Text style={styles.tagRemove}>{'×'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Услуги и цены</Text>
            <Text style={styles.sectionHint}>Формат: "Название — 5000 руб"</Text>
            <View style={styles.addRow}>
              <TextInput
                value={serviceInput}
                onChangeText={setServiceInput}
                placeholder="Консультация — 3000 руб"
                placeholderTextColor={Colors.textMuted}
                style={[styles.addInput, styles.addInputWide]}
                autoCapitalize="sentences"
                returnKeyType="done"
                onSubmitEditing={addService}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addService}>
                <Text style={styles.addBtnText}>{'+'}</Text>
              </TouchableOpacity>
            </View>
            {services.length === 0 && (
              <Text style={styles.emptyHint}>Нет услуг — добавьте хотя бы одну</Text>
            )}
            <View style={styles.serviceList}>
              {services.map((svc, idx) => (
                <View key={`${svc}-${idx}`} style={styles.serviceRow}>
                  <Text style={styles.serviceText} numberOfLines={2}>{svc}</Text>
                  <TouchableOpacity onPress={() => removeService(svc)} hitSlop={8}>
                    <Text style={styles.tagRemove}>{'×'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <Button
            onPress={handleSave}
            variant="primary"
            loading={saving}
            disabled={saving}
            style={styles.saveBtn}
          >
            Сохранить профиль
          </Button>
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
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  inputGap: {
    marginTop: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  badgeInfo: {
    flex: 1,
    gap: 3,
  },
  badgeLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  badgeHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  addInputWide: {
    flex: 1,
  },
  addBtn: {
    width: 44,
    height: 44,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 24,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.xs,
  },
  tagText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  tagRemove: {
    fontSize: 16,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  serviceList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  serviceText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.statusError,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.sm,
  },
  saveBtn: {
    width: '100%',
    marginTop: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
});
