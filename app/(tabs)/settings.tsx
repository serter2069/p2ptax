import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { api, ApiError } from '../../lib/api';
import { isAdmin } from '../../lib/adminEmails';
import { users } from '../../lib/api/endpoints';
import { Colors } from '../../constants/Colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SpecialistProfile {
  id: string;
  nick: string;
  displayName?: string;
  cities: string[];
  services: string[];
  fnsOffices: string[];
  isAvailable: boolean;
  avatarUrl: string | null;
}

interface MyReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  specialist: {
    id: string;
    email: string;
    specialistProfile: {
      nick: string;
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  };
}

type EmailChangeStep = 'idle' | 'email_input' | 'otp_input' | 'success';

const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SettingRow({
  label,
  value,
  icon,
  danger,
  onPress,
}: {
  label: string;
  value?: string;
  icon?: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3 border-b border-sky-50"
    >
      {icon && (
        <Feather
          name={icon as any}
          size={18}
          color={danger ? Colors.statusError : Colors.textMuted}
        />
      )}
      <Text
        className="flex-1 text-[13px]"
        style={{ color: danger ? Colors.statusError : Colors.textPrimary }}
      >
        {label}
      </Text>
      {value && (
        <Text className="text-[13px] mr-2" style={{ color: Colors.textMuted }}>
          {value}
        </Text>
      )}
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function ToggleRow({
  label,
  icon,
  enabled,
  onToggle,
  disabled,
}: {
  label: string;
  icon: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      className="flex-row items-center gap-3 px-4 py-3 border-b border-sky-50"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Feather name={icon as any} size={18} color={Colors.textMuted} />
      <Text className="flex-1 text-[13px]" style={{ color: Colors.textPrimary }}>
        {label}
      </Text>
      <Switch
        value={enabled}
        onValueChange={(v) => { if (!disabled) onToggle(v); }}
        trackColor={{ false: '#D1D5DB', true: '#0284C7' }}
        thumbColor="#fff"
        disabled={disabled}
      />
    </View>
  );
}

function ConfirmCard({
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  loading,
}: {
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <View
      className="bg-white rounded-[14px] p-4 gap-3 shadow-sm"
      style={{ borderWidth: 1, borderColor: Colors.statusBg.error }}
    >
      <Text className="text-[13px] text-center" style={{ color: Colors.textSecondary }}>
        {message}
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={onCancel}
          disabled={loading}
          className="flex-1 h-10 rounded-[12px] items-center justify-center"
          style={{ borderWidth: 1, borderColor: Colors.border }}
        >
          <Text className="text-[13px]" style={{ color: Colors.textMuted }}>
            Отмена
          </Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={loading}
          className="flex-1 h-10 rounded-[12px] items-center justify-center"
          style={{ backgroundColor: Colors.statusError }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text className="text-[13px] font-semibold" style={{ color: Colors.white }}>
              {confirmLabel}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function SettingsTab() {
  const { user, logout, updateEmail } = useAuth();
  const router = useRouter();
  const isSpecialist = user?.role === 'SPECIALIST';

  // Notification toggles
  const [notifSettings, setNotifSettings] = useState<{
    new_responses: boolean;
    new_messages: boolean;
  }>({
    new_responses: true,
    new_messages: true,
  });

  // Confirm modals
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Specialist profile
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Client reviews
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);

  // Email change
  const [emailChangeStep, setEmailChangeStep] = useState<EmailChangeStep>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState('');

  // Refresh
  const [refreshing, setRefreshing] = useState(false);

  // ---- Fetch data ----
  const fetchData = useCallback(async () => {
    try {
      const promises: Promise<unknown>[] = [];

      promises.push(
        users
          .getNotificationSettings()
          .then((res: { data: { new_responses: boolean; new_messages: boolean } }) => {
            if (res.data) {
              setNotifSettings({
                new_responses:
                  typeof res.data.new_responses === 'boolean' ? res.data.new_responses : true,
                new_messages:
                  typeof res.data.new_messages === 'boolean' ? res.data.new_messages : true,
              });
            }
          })
          .catch(() => {}),
      );

      if (isSpecialist) {
        promises.push(
          api
            .get<SpecialistProfile>('/specialists/me')
            .then((data) => {
              setProfile(data);
              setIsAvailable(data.isAvailable ?? true);
            })
            .catch(() => {}),
        );
      }

      if (!isSpecialist) {
        promises.push(
          api
            .get<MyReview[]>('/reviews/my')
            .then(setMyReviews)
            .catch(() => {}),
        );
      }

      await Promise.all(promises);
    } finally {
      setRefreshing(false);
    }
  }, [isSpecialist]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // ---- Notification toggles ----
  const handleNotifToggle = useCallback(
    async (key: 'new_responses' | 'new_messages', v: boolean) => {
      const prev = notifSettings[key];
      setNotifSettings((s) => ({ ...s, [key]: v }));
      try {
        await users.updateNotificationSettings({ [key]: v });
      } catch {
        setNotifSettings((s) => ({ ...s, [key]: prev }));
      }
    },
    [notifSettings],
  );

  // ---- Availability toggle (specialist) ----
  const handleToggleAvailability = useCallback(async (val: boolean) => {
    setIsAvailable(val);
    setSavingAvailability(true);
    try {
      const updated = await api.patch<SpecialistProfile>('/specialists/me', {
        isAvailable: val,
      });
      setIsAvailable(updated.isAvailable ?? val);
    } catch {
      setIsAvailable(!val);
    } finally {
      setSavingAvailability(false);
    }
  }, []);

  // ---- Email change ----
  function handleStartEmailChange() {
    setNewEmail('');
    setEmailOtpCode('');
    setEmailChangeError('');
    setEmailChangeStep('email_input');
  }

  function handleCancelEmailChange() {
    setEmailChangeStep('idle');
    setNewEmail('');
    setEmailOtpCode('');
    setEmailChangeError('');
  }

  async function handleRequestEmailChange() {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      setEmailChangeError('Введите новый email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailChangeError('Введите корректный email');
      return;
    }
    setEmailChangeLoading(true);
    setEmailChangeError('');
    try {
      await api.post('/users/me/change-email/request', { newEmail: trimmed });
      setEmailChangeStep('otp_input');
    } catch (err) {
      setEmailChangeError(
        err instanceof ApiError ? err.message : 'Ошибка отправки кода',
      );
    } finally {
      setEmailChangeLoading(false);
    }
  }

  async function handleConfirmEmailChange() {
    const code = emailOtpCode.trim();
    if (code.length !== 6) {
      setEmailChangeError('Введите 6-значный код');
      return;
    }
    setEmailChangeLoading(true);
    setEmailChangeError('');
    try {
      const res = await api.post<{
        accessToken: string;
        refreshToken: string;
        email: string;
      }>('/users/me/change-email/confirm', {
        newEmail: newEmail.trim().toLowerCase(),
        code,
      });
      await updateEmail(res.email, res.accessToken, res.refreshToken);
      setEmailChangeStep('success');
    } catch (err) {
      setEmailChangeError(
        err instanceof ApiError ? err.message : 'Ошибка подтверждения',
      );
    } finally {
      setEmailChangeLoading(false);
    }
  }

  // ---- Logout ----
  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await logout();
      router.replace('/');
    } catch {
      setLogoutLoading(false);
    }
  }, [logout, router]);

  // ---- Delete account ----
  const handleDeleteAccount = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await api.del('/users/me');
      await logout();
      router.replace('/');
    } catch {
      setDeleteLoading(false);
      if (Platform.OS === 'web') {
        alert('Не удалось удалить аккаунт. Попробуйте позже.');
      } else {
        Alert.alert('Ошибка', 'Не удалось удалить аккаунт. Попробуйте позже.');
      }
    }
  }, [logout, router]);

  const displayName = user?.username || user?.email || '';
  const displayEmail = user?.email || '';
  const initials = (user?.username || user?.email || '?')[0].toUpperCase();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        {/* Page title */}
        <Text
          className="text-[20px] font-bold"
          style={{ color: Colors.textPrimary }}
        >
          Настройки
        </Text>

        {/* ============ Profile card ============ */}
        <View
          className="bg-white rounded-[14px] overflow-hidden shadow-sm"
          style={{ borderWidth: 1, borderColor: Colors.border }}
        >
          <View className="flex-row items-center gap-3 p-4">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: Colors.brandPrimary }}
            >
              <Text className="text-[18px] font-bold text-white">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-[15px] font-semibold"
                style={{ color: Colors.textPrimary }}
              >
                {displayName}
              </Text>
              <Text className="text-[13px] mt-0.5" style={{ color: Colors.textMuted }}>
                {displayEmail}
              </Text>
            </View>
          </View>
        </View>

        {/* ============ Specialist: Work area ============ */}
        {isSpecialist && profile && (
          <View className="gap-2">
            <Text
              className="text-[11px] font-semibold uppercase"
              style={{ color: Colors.textMuted, letterSpacing: 0.5 }}
            >
              Рабочая зона
            </Text>
            <View
              className="bg-white rounded-[14px] overflow-hidden shadow-sm"
              style={{ borderWidth: 1, borderColor: Colors.border }}
            >
              <Pressable
                className="flex-row items-center gap-3 px-4 py-3"
                onPress={() => router.push('/profile/edit')}
              >
                <Feather name="edit-2" size={18} color={Colors.brandPrimary} />
                <Text className="flex-1 text-[13px]" style={{ color: Colors.brandPrimary }}>
                  Редактировать профиль
                </Text>
                <Feather name="chevron-right" size={16} color={Colors.brandPrimary} />
              </Pressable>
            </View>
            <View className="gap-1 px-1">
              {profile.cities.length > 0 && (
                <View className="flex-row items-center gap-2">
                  <Feather name="map-pin" size={14} color={Colors.textMuted} />
                  <Text className="text-[13px] flex-1" style={{ color: Colors.textSecondary }}>
                    {profile.cities.join(', ')}
                  </Text>
                </View>
              )}
              {profile.fnsOffices.length > 0 && (
                <View className="flex-row items-center gap-2">
                  <Feather name="briefcase" size={14} color={Colors.textMuted} />
                  <Text className="text-[13px]" style={{ color: Colors.textSecondary }}>
                    {profile.fnsOffices.length} ИФНС
                  </Text>
                </View>
              )}
              {profile.services.length > 0 && (
                <View className="flex-row items-center gap-2">
                  <Feather name="check-circle" size={14} color={Colors.textMuted} />
                  <Text className="text-[13px] flex-1" style={{ color: Colors.textSecondary }}>
                    {profile.services.join(', ')}
                  </Text>
                </View>
              )}
              {profile.cities.length === 0 &&
                profile.fnsOffices.length === 0 &&
                profile.services.length === 0 && (
                  <Text className="text-[13px] italic" style={{ color: Colors.textMuted }}>
                    Профиль не заполнен
                  </Text>
                )}
            </View>
          </View>
        )}

        {/* ============ Specialist: Public profile toggle ============ */}
        {isSpecialist && (
          <View className="gap-2">
            <Text
              className="text-[11px] font-semibold uppercase"
              style={{ color: Colors.textMuted, letterSpacing: 0.5 }}
            >
              Публичный профиль
            </Text>
            <View
              className="bg-white rounded-[14px] overflow-hidden shadow-sm"
              style={{ borderWidth: 1, borderColor: Colors.border }}
            >
              <ToggleRow
                label="Принимаю заявки"
                icon="eye"
                enabled={isAvailable}
                onToggle={handleToggleAvailability}
                disabled={savingAvailability}
              />
            </View>
          </View>
        )}

        {/* ============ Notifications ============ */}
        <View className="gap-2">
          <Text
            className="text-[11px] font-semibold uppercase"
            style={{ color: Colors.textMuted, letterSpacing: 0.5 }}
          >
            Уведомления
          </Text>
          <View
            className="bg-white rounded-[14px] overflow-hidden shadow-sm"
            style={{ borderWidth: 1, borderColor: Colors.border }}
          >
            <ToggleRow
              label="Email-уведомления"
              icon="mail"
              enabled={notifSettings.new_responses}
              onToggle={(v) => handleNotifToggle('new_responses', v)}
            />
            <ToggleRow
              label="Push-уведомления"
              icon="bell"
              enabled={false}
              onToggle={() => {}}
              disabled
            />
            <ToggleRow
              label="Новые отклики"
              icon="message-circle"
              enabled={notifSettings.new_messages}
              onToggle={(v) => handleNotifToggle('new_messages', v)}
            />
          </View>
        </View>

        {/* ============ Account ============ */}
        <View className="gap-2">
          <Text
            className="text-[11px] font-semibold uppercase"
            style={{ color: Colors.textMuted, letterSpacing: 0.5 }}
          >
            Аккаунт
          </Text>
          <View
            className="bg-white rounded-[14px] overflow-hidden shadow-sm"
            style={{ borderWidth: 1, borderColor: Colors.border }}
          >
            {emailChangeStep === 'idle' && (
              <SettingRow
                label="Изменить email"
                icon="mail"
                onPress={handleStartEmailChange}
              />
            )}

            {emailChangeStep === 'email_input' && (
              <View className="p-4 gap-2">
                <Text className="text-[13px]" style={{ color: Colors.textSecondary }}>
                  Новый email
                </Text>
                <TextInput
                  className="rounded-[6px] px-4 py-2 text-[15px]"
                  style={{
                    backgroundColor: Colors.bgSecondary,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    color: Colors.textPrimary,
                  }}
                  value={newEmail}
                  onChangeText={(t) => {
                    setNewEmail(t);
                    setEmailChangeError('');
                  }}
                  placeholder="example@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!emailChangeLoading}
                />
                {emailChangeError ? (
                  <Text className="text-[11px]" style={{ color: Colors.statusError }}>
                    {emailChangeError}
                  </Text>
                ) : null}
                <View className="flex-row gap-2">
                  <Pressable
                    className="flex-1 rounded-[6px] py-2 items-center justify-center min-h-[40px]"
                    style={{
                      backgroundColor: Colors.bgSecondary,
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                    onPress={handleCancelEmailChange}
                    disabled={emailChangeLoading}
                  >
                    <Text className="text-[13px] font-medium" style={{ color: Colors.textSecondary }}>
                      Отмена
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 rounded-[6px] py-2 items-center justify-center min-h-[40px]"
                    style={{
                      backgroundColor: Colors.brandPrimary,
                      opacity: emailChangeLoading ? 0.6 : 1,
                    }}
                    onPress={handleRequestEmailChange}
                    disabled={emailChangeLoading}
                  >
                    {emailChangeLoading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text className="text-[13px] font-medium text-white">
                        Получить код
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {emailChangeStep === 'otp_input' && (
              <View className="p-4 gap-2">
                <Text className="text-[13px]" style={{ color: Colors.textSecondary }}>
                  Код отправлен на {newEmail.trim().toLowerCase()}
                </Text>
                <TextInput
                  className="rounded-[6px] px-4 py-2 text-[18px] text-center"
                  style={{
                    backgroundColor: Colors.bgSecondary,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    color: Colors.textPrimary,
                    letterSpacing: 4,
                  }}
                  value={emailOtpCode}
                  onChangeText={(t) => {
                    setEmailOtpCode(t.replace(/\D/g, '').slice(0, 6));
                    setEmailChangeError('');
                  }}
                  placeholder="000000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!emailChangeLoading}
                />
                {emailChangeError ? (
                  <Text className="text-[11px]" style={{ color: Colors.statusError }}>
                    {emailChangeError}
                  </Text>
                ) : null}
                <View className="flex-row gap-2">
                  <Pressable
                    className="flex-1 rounded-[6px] py-2 items-center justify-center min-h-[40px]"
                    style={{
                      backgroundColor: Colors.bgSecondary,
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                    onPress={handleCancelEmailChange}
                    disabled={emailChangeLoading}
                  >
                    <Text className="text-[13px] font-medium" style={{ color: Colors.textSecondary }}>
                      Отмена
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 rounded-[6px] py-2 items-center justify-center min-h-[40px]"
                    style={{
                      backgroundColor: Colors.brandPrimary,
                      opacity: emailChangeLoading ? 0.6 : 1,
                    }}
                    onPress={handleConfirmEmailChange}
                    disabled={emailChangeLoading}
                  >
                    {emailChangeLoading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text className="text-[13px] font-medium text-white">
                        Подтвердить
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {emailChangeStep === 'success' && (
              <View className="p-4 gap-2">
                <Text
                  className="text-[15px] font-medium text-center py-2"
                  style={{ color: Colors.statusSuccess }}
                >
                  Email успешно изменён
                </Text>
                <Pressable
                  className="flex-1 rounded-[6px] py-2 items-center justify-center min-h-[40px]"
                  style={{ backgroundColor: Colors.brandPrimary }}
                  onPress={() => {
                    setEmailChangeStep('idle');
                    setNewEmail('');
                    setEmailOtpCode('');
                    setEmailChangeError('');
                  }}
                >
                  <Text className="text-[13px] font-medium text-white">Готово</Text>
                </Pressable>
              </View>
            )}

            <SettingRow label="Язык" value="Русский" icon="globe" />
            <SettingRow label="Тема" value="Светлая" icon="sun" />
          </View>
        </View>

        {/* ============ Client reviews ============ */}
        {!isSpecialist && myReviews.length > 0 && (
          <View className="gap-2">
            <Text
              className="text-[11px] font-semibold uppercase"
              style={{ color: Colors.textMuted, letterSpacing: 0.5 }}
            >
              Мои отзывы
            </Text>
            <View
              className="bg-white rounded-[14px] overflow-hidden shadow-sm"
              style={{ borderWidth: 1, borderColor: Colors.border }}
            >
              {myReviews.map((review, idx) => {
                const specName =
                  review.specialist.specialistProfile?.displayName ??
                  review.specialist.specialistProfile?.nick ??
                  review.specialist.email.split('@')[0];
                const stars = Array.from({ length: 5 }, (_, i) =>
                  i < review.rating ? '\u2605' : '\u2606',
                ).join('');
                return (
                  <View key={review.id}>
                    {idx > 0 && (
                      <View className="h-px mx-4" style={{ backgroundColor: Colors.border }} />
                    )}
                    <View className="px-4 py-3 gap-1">
                      <View className="flex-row justify-between items-center">
                        <Text
                          className="text-[15px] font-medium flex-1"
                          style={{ color: Colors.textPrimary }}
                          numberOfLines={1}
                        >
                          {specName}
                        </Text>
                        <Text
                          className="text-[13px] font-medium ml-2"
                          style={{ color: Colors.brandPrimary }}
                        >
                          {stars} {review.rating}/5
                        </Text>
                      </View>
                      {review.comment ? (
                        <Text
                          className="text-[13px] mt-0.5"
                          style={{ color: Colors.textSecondary }}
                          numberOfLines={3}
                        >
                          {review.comment}
                        </Text>
                      ) : null}
                      <Text
                        className="text-[11px] mt-0.5"
                        style={{ color: Colors.textMuted }}
                      >
                        {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ============ Information ============ */}
        <View className="gap-2">
          <Text
            className="text-[11px] font-semibold uppercase"
            style={{ color: Colors.textMuted, letterSpacing: 0.5 }}
          >
            Информация
          </Text>
          <View
            className="bg-white rounded-[14px] overflow-hidden shadow-sm"
            style={{ borderWidth: 1, borderColor: Colors.border }}
          >
            <SettingRow label="Политика конфиденциальности" icon="shield" />
            <SettingRow label="Условия использования" icon="file-text" />
            <SettingRow label="Версия" value={APP_VERSION} icon="info" />
          </View>
        </View>

        {/* ============ Admin ============ */}
        {isAdmin(user?.email) && (
          <View className="gap-2">
            <Text
              className="text-[11px] font-semibold uppercase"
              style={{ color: Colors.textMuted, letterSpacing: 0.5 }}
            >
              Администрирование
            </Text>
            <View
              className="bg-white rounded-[14px] overflow-hidden shadow-sm"
              style={{ borderWidth: 1, borderColor: Colors.border }}
            >
              <SettingRow
                label="Панель администратора"
                icon="shield"
                onPress={() => router.push('/(admin)')}
              />
            </View>
          </View>
        )}

        {/* ============ Danger zone ============ */}
        <View className="gap-2">
          <Pressable
            onPress={() => setShowLogoutConfirm(true)}
            className="flex-row items-center justify-center gap-2 h-12 rounded-[12px]"
            style={{ backgroundColor: Colors.statusBg.error }}
          >
            <Feather name="log-out" size={18} color={Colors.statusError} />
            <Text
              className="text-[13px] font-semibold"
              style={{ color: Colors.statusError }}
            >
              Выйти из аккаунта
            </Text>
          </Pressable>

          {showLogoutConfirm && (
            <ConfirmCard
              message="Вы уверены, что хотите выйти?"
              confirmLabel="Выйти"
              onCancel={() => setShowLogoutConfirm(false)}
              onConfirm={handleLogout}
              loading={logoutLoading}
            />
          )}

          <Pressable
            onPress={() => setShowDeleteConfirm(true)}
            className="flex-row items-center justify-center gap-2 h-12 rounded-[12px]"
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: Colors.statusBg.error,
            }}
          >
            <Feather name="trash-2" size={18} color={Colors.statusError} />
            <Text
              className="text-[13px] font-semibold"
              style={{ color: Colors.statusError }}
            >
              Удалить аккаунт
            </Text>
          </Pressable>

          {showDeleteConfirm && (
            <ConfirmCard
              message="Это действие необратимо. Все ваши данные будут удалены."
              confirmLabel="Удалить"
              onCancel={() => setShowDeleteConfirm(false)}
              onConfirm={handleDeleteAccount}
              loading={deleteLoading}
            />
          )}
        </View>

        {/* ============ Version ============ */}
        <Text
          className="text-[11px] text-center mt-2"
          style={{ color: Colors.textMuted }}
        >
          Версия {APP_VERSION}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
