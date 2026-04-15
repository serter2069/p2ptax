import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
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
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useFnsSearch } from '../../hooks/useFnsData';
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

// ---------------------------------------------------------------------------
// Skeleton helper
// ---------------------------------------------------------------------------

function SkeletonBlock({ width, height, rounded }: { width: string | number; height: number; rounded?: string }) {
  return (
    <View
      className={`bg-bgSurface opacity-70 ${rounded || 'rounded-md'}`}
      style={{ width: width as any, height }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // LOADING state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bgPrimary">
        {isMobile && <Header title="Мой профиль" showBack />}
        <View className="p-5 gap-5">
          {/* Avatar skeleton */}
          <View className="flex-row items-center gap-5">
            <SkeletonBlock width={64} height={64} rounded="rounded-full" />
            <View className="gap-1.5">
              <SkeletonBlock width={140} height={20} />
              <SkeletonBlock width={60} height={14} />
            </View>
          </View>
          {/* Stats skeleton */}
          <View className="flex-row gap-2">
            {[1, 2, 3].map(i => (
              <View key={i} className="flex-1 items-center bg-white rounded-[14px] border border-border p-3 gap-1 shadow-sm">
                <SkeletonBlock width={18} height={18} rounded="rounded-full" />
                <SkeletonBlock width={28} height={20} />
                <SkeletonBlock width={48} height={12} />
              </View>
            ))}
          </View>
          {/* Info card skeleton */}
          <View className="bg-white rounded-[14px] border border-border p-5 gap-3 shadow-sm">
            {[1, 2, 3, 4].map(i => (
              <View key={i} className="flex-row items-center gap-2">
                <SkeletonBlock width={16} height={16} rounded="rounded-full" />
                <SkeletonBlock width={60} height={14} />
                <View className="flex-1" />
                <SkeletonBlock width={100} height={14} />
              </View>
            ))}
          </View>
          <SkeletonBlock width="100%" height={48} rounded="rounded-xl" />
          <View className="items-center pt-2">
            <ActivityIndicator size="small" color={Colors.brandPrimary} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // ERROR state
  // ---------------------------------------------------------------------------
  if (error && error !== 'profile_not_found') {
    return (
      <SafeAreaView className="flex-1 bg-bgPrimary">
        {isMobile && <Header title="Мой профиль" showBack />}
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center py-16 gap-3">
            <View className="w-[72px] h-[72px] rounded-full bg-red-100 items-center justify-center">
              <Feather name="user-x" size={36} color={Colors.statusError} />
            </View>
            <Text className="text-lg font-semibold text-textPrimary">Не удалось загрузить профиль</Text>
            <Text className="text-sm text-textMuted text-center max-w-[280px]">
              Проверьте подключение и попробуйте снова
            </Text>
            <Pressable
              className="flex-row items-center justify-center gap-2 h-11 bg-brandPrimary rounded-xl px-8 mt-2"
              onPress={() => fetchProfile()}
            >
              <Feather name="refresh-cw" size={16} color={Colors.white} />
              <Text className="text-sm font-semibold text-white">Попробовать снова</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error === 'profile_not_found') {
    return null;
  }

  // ---------------------------------------------------------------------------
  // DEFAULT state (edit form)
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-bgPrimary">
      {isMobile && <Header title="Мой профиль" showBack />}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
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
        <View className="w-full max-w-[430px] px-5 gap-5">
          {/* Avatar */}
          <View className="items-center gap-2">
            <Pressable
              className="items-center gap-2"
              onPress={pickAvatar}
              disabled={uploadingAvatar || deletingAvatar}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-16 h-16 rounded-full border border-border" />
              ) : (
                <View className="w-16 h-16 rounded-full bg-bgSurface items-center justify-center border border-border">
                  <Text className="text-xl font-bold text-brandPrimary">
                    {profile?.nick ? profile.nick[0].toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={Colors.brandPrimary} />
              ) : (
                <View className="flex-row items-center gap-1">
                  <Feather name="camera" size={14} color={Colors.brandPrimary} />
                  <Text className="text-sm text-brandPrimary font-medium">Изменить фото</Text>
                </View>
              )}
            </Pressable>
            {avatarUrl && (
              <Pressable
                onPress={handleDeleteAvatar}
                disabled={deletingAvatar || uploadingAvatar}
                className="py-1 px-3"
              >
                {deletingAvatar ? (
                  <ActivityIndicator size="small" color={Colors.statusError} />
                ) : (
                  <Text className="text-sm text-statusError font-medium">Удалить фото</Text>
                )}
              </Pressable>
            )}
          </View>

          {/* Nick / basics */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-textPrimary mb-0.5">Основное</Text>
            <View className="gap-1">
              <Text className="text-sm text-textMuted font-medium">Ник</Text>
              <Text className="text-base text-textSecondary py-2.5 px-5 bg-bgSecondary rounded-lg border border-borderLight">
                {profile?.nick ?? ''}
              </Text>
            </View>
            <Input
              label="Отображаемое имя (необязательно)"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Иван Петров"
              autoCapitalize="words"
              style={{ marginTop: 8 }}
            />
            <Input
              label="Контакты (необязательно)"
              value={contacts}
              onChangeText={setContacts}
              placeholder="Telegram: @username, тел: +7..."
              autoCapitalize="sentences"
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Contact & Availability */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-textPrimary mb-0.5">Контакты и доступность</Text>

            {/* isAvailable toggle */}
            <View className="flex-row items-center gap-3 mb-2">
              <View className="flex-1 gap-0.5">
                <Text className="text-base text-textPrimary font-medium">
                  {isAvailable ? 'Принимаю заявки' : 'Не принимаю'}
                </Text>
                <Text className="text-xs text-textMuted">
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
              style={{ marginTop: 8 }}
            />
            <Input
              label="Telegram"
              value={telegram}
              onChangeText={setTelegram}
              placeholder="@username"
              autoCapitalize="none"
              style={{ marginTop: 8 }}
            />
            <Input
              label="WhatsApp"
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="+7 (___) ___-__-__"
              keyboardType="phone-pad"
              style={{ marginTop: 8 }}
            />
            <Input
              label="Адрес офиса"
              value={officeAddress}
              onChangeText={setOfficeAddress}
              placeholder="г. Москва, ул. Примерная, д. 1, оф. 101"
              autoCapitalize="sentences"
              style={{ marginTop: 8 }}
            />
            <Input
              label="Часы работы"
              value={workingHours}
              onChangeText={setWorkingHours}
              placeholder="Пн-Пт 9:00-18:00"
              autoCapitalize="sentences"
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Cities */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-textPrimary mb-0.5">Города работы</Text>
            <View className="flex-row gap-2 items-center">
              <TextInput
                value={cityInput}
                onChangeText={setCityInput}
                placeholder="Добавить город..."
                placeholderTextColor={Colors.textMuted}
                className="flex-1 h-11 bg-white border border-border rounded-lg px-5 text-base text-textPrimary"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={addCity}
              />
              <Pressable className="w-11 h-11 bg-brandPrimary rounded-lg items-center justify-center" onPress={addCity}>
                <Text className="text-2xl text-textPrimary leading-7">+</Text>
              </Pressable>
            </View>
            {cities.length === 0 && (
              <Text className="text-xs text-textMuted italic">Нет городов — добавьте хотя бы один</Text>
            )}
            <View className="flex-row flex-wrap gap-2 mt-1">
              {cities.map((city) => (
                <View key={city} className="flex-row items-center bg-bgSecondary rounded-full px-3 py-1.5 border border-borderLight gap-1">
                  <Text className="text-sm text-textSecondary">{city}</Text>
                  <Pressable onPress={() => removeCity(city)} hitSlop={8}>
                    <Text className="text-base text-textMuted leading-[18px]">{'×'}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Services */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-textPrimary mb-0.5">Услуги и цены</Text>
            <Text className="text-xs text-textMuted mb-1">Формат: "Название — 5000 руб"</Text>
            <View className="flex-row gap-2 items-center">
              <TextInput
                value={serviceInput}
                onChangeText={setServiceInput}
                placeholder="Консультация — 3000 руб"
                placeholderTextColor={Colors.textMuted}
                className="flex-1 h-11 bg-white border border-border rounded-lg px-5 text-base text-textPrimary"
                autoCapitalize="sentences"
                returnKeyType="done"
                onSubmitEditing={addService}
              />
              <Pressable className="w-11 h-11 bg-brandPrimary rounded-lg items-center justify-center" onPress={addService}>
                <Text className="text-2xl text-textPrimary leading-7">+</Text>
              </Pressable>
            </View>
            {services.length === 0 && (
              <Text className="text-xs text-textMuted italic">Нет услуг — добавьте хотя бы одну</Text>
            )}
            <View className="gap-2 mt-1">
              {services.map((svc, idx) => (
                <View key={`${svc}-${idx}`} className="flex-row items-center bg-white rounded-lg px-5 py-3 border border-border gap-2">
                  <Text className="flex-1 text-sm text-textSecondary" numberOfLines={2}>{svc}</Text>
                  <Pressable onPress={() => removeService(idx)} hitSlop={8}>
                    <Text className="text-base text-textMuted leading-[18px]">{'×'}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* FNS Offices */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-textPrimary mb-0.5">Налоговые инспекции (ИФНС)</Text>
            <Text className="text-xs text-textMuted mb-1">Введите номер или город для поиска</Text>
            <View className="flex-row gap-2 items-center">
              <TextInput
                value={fnsSearch}
                onChangeText={setFnsSearch}
                placeholder="Поиск ИФНС..."
                placeholderTextColor={Colors.textMuted}
                className="flex-1 h-11 bg-white border border-border rounded-lg px-5 text-base text-textPrimary"
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
            {fnsSearchResults.length > 0 && (() => {
              const selectedSet = new Set(fnsOffices);
              const matches = fnsSearchResults.filter((o) => !selectedSet.has(o.name)).slice(0, 6);
              if (matches.length === 0) return null;
              return (
                <View className="border border-border rounded-lg bg-white overflow-hidden">
                  {matches.map((office) => (
                    <Pressable
                      key={office.code}
                      className="py-2 px-3 border-b border-bgSecondary"
                      onPress={() => {
                        setFnsOffices((prev) => [...prev, office.name]);
                        setFnsSearch('');
                      }}
                    >
                      <Text className="text-sm text-textPrimary font-medium" numberOfLines={2}>{office.name}</Text>
                      <Text className="text-xs text-brandPrimary mt-px">{office.city.name}</Text>
                    </Pressable>
                  ))}
                </View>
              );
            })()}
            {fnsOffices.length === 0 && (
              <Text className="text-xs text-textMuted italic">Нет ИФНС — добавьте хотя бы одну</Text>
            )}
            <View className="flex-row flex-wrap gap-2 mt-1">
              {fnsOffices.map((name) => {
                const label = shortFnsLabel(name, '');
                return (
                  <View key={name} className="flex-row items-center bg-bgSecondary rounded-full px-3 py-1.5 border border-brandPrimary gap-1">
                    <Text className="text-sm text-textAccent max-w-[200px]" numberOfLines={1}>{label}</Text>
                    <Pressable onPress={() => setFnsOffices((prev) => prev.filter((n) => n !== name))} hitSlop={8}>
                      <Text className="text-base text-textMuted leading-[18px]">{'×'}</Text>
                    </Pressable>
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
            style={{ width: '100%', marginTop: 12 }}
          >
            Сохранить профиль
          </Button>

          {/* Promotion navigation (UC-024) */}
          <Button
            onPress={() => router.push('/(dashboard)/promotion')}
            variant="outline"
            style={{ width: '100%', marginBottom: 32 }}
          >
            Продвинуть профиль
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
