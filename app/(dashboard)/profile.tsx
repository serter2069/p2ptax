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
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { FNS_OFFICES, FNSOffice } from '../../constants/FNS';
import { shortFnsLabel } from '../../lib/format';

const BADGE_TAX = 'familiar';
const BADGE_TAX_LABEL = 'Знакомый в налоговой';

interface SpecialistProfile {
  id: string;
  nick: string;
  displayName?: string;
  cities: string[];
  services: string[];
  badges: string[];
  contacts: string | null;
  avatarUrl: string | null;
  fnsOffices: string[];
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
  const [displayName, setDisplayName] = useState('');
  const [contacts, setContacts] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [hasTaxBadge, setHasTaxBadge] = useState(false);
  const [fnsOffices, setFnsOffices] = useState<string[]>([]);
  const [fnsSearch, setFnsSearch] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<SpecialistProfile>('/specialists/me');
      setProfile(data);
      setNick(data.nick);
      setDisplayName(data.displayName ?? '');
      setContacts(data.contacts ?? '');
      setCities(data.cities);
      setServices(data.services);
      setHasTaxBadge(data.badges.includes(BADGE_TAX));
      setAvatarUrl(data.avatarUrl ?? null);
      setFnsOffices(data.fnsOffices ?? []);
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

  // Must be before any conditional return to satisfy Rules of Hooks
  useEffect(() => {
    if (error === 'profile_not_found') {
      router.replace('/(dashboard)/specialist-profile');
    }
  }, [error, router]);

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

  function removeService(idx: number) {
    setServices((prev) => prev.filter((_, i) => i !== idx));
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      const uri = asset.uri;
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', { uri, name: filename, type } as any);
      }

      const data = await api.upload<{ avatarUrl: string }>('/specialists/me/avatar', formData);
      setAvatarUrl(data.avatarUrl);
      Alert.alert('Готово', 'Аватар обновлён');
    } catch (err) {
      Alert.alert('Ошибка', err instanceof ApiError ? err.message : 'Не удалось загрузить фото');
    } finally {
      setUploadingAvatar(false);
    }
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
        displayName: displayName.trim() || undefined,
        contacts: contacts.trim() || null,
        cities,
        services,
        badges,
        fnsOffices,
      });
      setProfile(updated);
      setDisplayName(updated.displayName ?? '');
      setFnsOffices(updated.fnsOffices ?? []);
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
          {/* Avatar */}
          <View style={[styles.section, styles.avatarSection]}>
            <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar} style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {nick ? nick[0].toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={Colors.brandPrimary} style={styles.avatarOverlay} />
              ) : (
                <Text style={styles.changeAvatarText}>Изменить фото</Text>
              )}
            </TouchableOpacity>
          </View>

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
              label="Отображаемое имя (необязательно)"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Иван Петров"
              autoCapitalize="words"
              style={styles.inputGap}
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
                <Text style={styles.badgeLabel}>{BADGE_TAX_LABEL}</Text>
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
                  <TouchableOpacity onPress={() => removeService(idx)} hitSlop={8}>
                    <Text style={styles.tagRemove}>{'×'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* FNS Offices */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Налоговые инспекции (ИФНС)</Text>
            <Text style={styles.sectionHint}>Введите номер или город для поиска</Text>
            <View style={styles.addRow}>
              <TextInput
                value={fnsSearch}
                onChangeText={setFnsSearch}
                placeholder="Поиск ИФНС..."
                placeholderTextColor={Colors.textMuted}
                style={[styles.addInput, styles.addInputWide]}
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
            {fnsSearch.trim().length > 0 && (() => {
              const terms = fnsSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
              const selectedSet = new Set(fnsOffices);
              const matches = FNS_OFFICES.filter((o: FNSOffice) => {
                if (selectedSet.has(o.name)) return false;
                const text = `${o.name} ${o.city}`.toLowerCase();
                return terms.every((t) => text.includes(t));
              }).slice(0, 6);
              if (matches.length === 0) return null;
              return (
                <View style={styles.fnsSuggestions}>
                  {matches.map((office: FNSOffice) => (
                    <TouchableOpacity
                      key={office.code}
                      style={styles.fnsSuggestionItem}
                      onPress={() => {
                        setFnsOffices((prev) => [...prev, office.name]);
                        setFnsSearch('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.fnsSuggestionName} numberOfLines={2}>{office.name}</Text>
                      <Text style={styles.fnsSuggestionCity}>{office.city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })()}
            {fnsOffices.length === 0 && (
              <Text style={styles.emptyHint}>Нет ИФНС — добавьте хотя бы одну</Text>
            )}
            <View style={styles.tagList}>
              {fnsOffices.map((name) => {
                const office = FNS_OFFICES.find((o: FNSOffice) => o.name === name);
                const label = office ? shortFnsLabel(office.name, office.city) : name;
                return (
                  <View key={name} style={[styles.tag, styles.fnsTag]}>
                    <Text style={[styles.tagText, styles.fnsTagText]} numberOfLines={1}>{label}</Text>
                    <TouchableOpacity onPress={() => setFnsOffices((prev) => prev.filter((n) => n !== name))} hitSlop={8}>
                      <Text style={styles.tagRemove}>{'×'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
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
    fontSize: Typography.fontSize['2xl'],
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
    fontSize: Typography.fontSize.md,
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
  fnsSuggestions: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
  },
  fnsSuggestionItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  fnsSuggestionName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  fnsSuggestionCity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    marginTop: 1,
  },
  fnsTag: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.bgSecondary,
  },
  fnsTagText: {
    color: Colors.textAccent,
    maxWidth: 200,
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
  avatarSection: {
    alignItems: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textMuted,
  },
  avatarOverlay: {
    marginTop: 4,
  },
  changeAvatarText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
});
