import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Image,
  Platform,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useFnsSearch, useFnsOffices, FnsOfficeItem } from '../../hooks/useFnsData';
import { shortFnsLabel } from '../../lib/format';
import { useBreakpoints } from '../../hooks/useBreakpoints';

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
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  officeAddress: string | null;
  workingHours: string | null;
  isAvailable: boolean;
}

export default function MySpecialistProfileScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [contacts, setContacts] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [fnsOffices, setFnsOffices] = useState<string[]>([]);
  const [fnsSearch, setFnsSearch] = useState('');
  const { results: fnsSearchResults } = useFnsSearch(fnsSearch);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);

  // Specialist contact & availability fields
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<SpecialistProfile>('/specialists/me');
      setProfile(data);
      setDisplayName(data.displayName ?? '');
      setContacts(data.contacts ?? '');
      setCities(data.cities);
      setServices(data.services);
      setAvatarUrl(data.avatarUrl ?? null);
      setFnsOffices(data.fnsOffices ?? []);
      setPhone(data.phone ?? '');
      setTelegram(data.telegram ?? '');
      setWhatsapp(data.whatsapp ?? '');
      setOfficeAddress(data.officeAddress ?? '');
      setWorkingHours(data.workingHours ?? '');
      setIsAvailable(data.isAvailable ?? true);
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

    // Validate minimum image size
    if (asset.width && asset.height && (asset.width < 100 || asset.height < 100)) {
      Alert.alert('Ошибка', 'Изображение слишком маленькое (мин. 100x100)');
      return;
    }

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

  async function handleDeleteAvatar() {
    if (!avatarUrl) return;
    Alert.alert(
      'Удалить фото',
      'Вы уверены, что хотите удалить аватар?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setDeletingAvatar(true);
            try {
              await api.del('/specialists/me/avatar');
              setAvatarUrl(null);
              Alert.alert('Готово', 'Аватар удалён');
            } catch (err) {
              Alert.alert('Ошибка', err instanceof ApiError ? err.message : 'Не удалось удалить фото');
            } finally {
              setDeletingAvatar(false);
            }
          },
        },
      ],
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.patch<SpecialistProfile>('/specialists/me', {
        displayName: displayName.trim() || undefined,
        contacts: contacts.trim() || null,
        cities,
        services,
        fnsOffices,
        phone: phone.trim() || null,
        telegram: telegram.trim() || null,
        whatsapp: whatsapp.trim() || null,
        officeAddress: officeAddress.trim() || null,
        workingHours: workingHours.trim() || null,
        isAvailable,
      });
      setProfile(updated);
      setDisplayName(updated.displayName ?? '');
      setFnsOffices(updated.fnsOffices ?? []);
      setPhone(updated.phone ?? '');
      setTelegram(updated.telegram ?? '');
      setWhatsapp(updated.whatsapp ?? '');
      setOfficeAddress(updated.officeAddress ?? '');
      setWorkingHours(updated.workingHours ?? '');
      setIsAvailable(updated.isAvailable ?? true);
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
        {isMobile && <Header title="Мой профиль" showBack />}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && error !== 'profile_not_found') {
    return (
      <SafeAreaView style={styles.safe}>
        {isMobile && <Header title="Мой профиль" showBack />}
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
      {isMobile && <Header title="Мой профиль" showBack />}
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
            <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar || deletingAvatar} style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {profile?.nick ? profile.nick[0].toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={Colors.brandPrimary} style={styles.avatarOverlay} />
              ) : (
                <Text style={styles.changeAvatarText}>Изменить фото</Text>
              )}
            </TouchableOpacity>
            {avatarUrl && (
              <TouchableOpacity
                onPress={handleDeleteAvatar}
                disabled={deletingAvatar || uploadingAvatar}
                style={styles.deleteAvatarBtn}
              >
                {deletingAvatar ? (
                  <ActivityIndicator size="small" color={Colors.statusError} />
                ) : (
                  <Text style={styles.deleteAvatarText}>Удалить фото</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Nick */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Основное</Text>
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyLabel}>Ник</Text>
              <Text style={styles.readonlyValue}>{profile?.nick ?? ''}</Text>
            </View>
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

          {/* Contact & Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Контакты и доступность</Text>

            {/* isAvailable toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextBlock}>
                <Text style={styles.toggleLabel}>
                  {isAvailable ? 'Принимаю заявки' : 'Не принимаю'}
                </Text>
                <Text style={styles.toggleHint}>
                  Отключите, если временно не хотите получать новые заявки
                </Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: Colors.border, true: Colors.brandPrimary }}
                thumbColor={Colors.textPrimary}
                accessibilityLabel="Принимаю заявки"
              />
            </View>

            <Input
              label="Телефон"
              value={phone}
              onChangeText={setPhone}
              placeholder="+7 (___) ___-__-__"
              keyboardType="phone-pad"
              style={styles.inputGap}
            />
            <Input
              label="Telegram"
              value={telegram}
              onChangeText={setTelegram}
              placeholder="@username"
              autoCapitalize="none"
              style={styles.inputGap}
            />
            <Input
              label="WhatsApp"
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="+7 (___) ___-__-__"
              keyboardType="phone-pad"
              style={styles.inputGap}
            />
            <Input
              label="Адрес офиса"
              value={officeAddress}
              onChangeText={setOfficeAddress}
              placeholder="г. Москва, ул. Примерная, д. 1, оф. 101"
              autoCapitalize="sentences"
              style={styles.inputGap}
            />
            <Input
              label="Часы работы"
              value={workingHours}
              onChangeText={setWorkingHours}
              placeholder="Пн-Пт 9:00-18:00"
              autoCapitalize="sentences"
              style={styles.inputGap}
            />
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
            {fnsSearchResults.length > 0 && (() => {
              const selectedSet = new Set(fnsOffices);
              const matches = fnsSearchResults.filter((o) => !selectedSet.has(o.name)).slice(0, 6);
              if (matches.length === 0) return null;
              return (
                <View style={styles.fnsSuggestions}>
                  {matches.map((office) => (
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
                      <Text style={styles.fnsSuggestionCity}>{office.city.name}</Text>
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
                const label = shortFnsLabel(name, '');
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

          {/* Promotion navigation (UC-024) */}
          <Button
            onPress={() => router.push('/(dashboard)/promotion')}
            variant="outline"
            style={styles.promotionBtn}
          >
            Продвинуть профиль
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  toggleTextBlock: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  toggleHint: {
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
  },
  promotionBtn: {
    width: '100%',
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
  deleteAvatarBtn: {
    marginTop: Spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
  },
  deleteAvatarText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    fontWeight: Typography.fontWeight.medium,
  },
  readonlyField: {
    gap: 4,
  },
  readonlyLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  readonlyValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
