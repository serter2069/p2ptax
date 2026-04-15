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
// Sub-components (matching proto Toggle pattern)
// ---------------------------------------------------------------------------
function Toggle({
  label,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const trackColor = value ? Colors.brandPrimary : '#D1D5DB';
  return (
    <Pressable
      className="flex-row items-center justify-between"
      onPress={() => !disabled && onValueChange(!value)}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Text className="mr-3 flex-1 text-sm text-textSecondary">{label}</Text>
      <View
        className="h-7 w-12 justify-center rounded-full px-0.5"
        style={{ backgroundColor: trackColor }}
      >
        <View
          className="h-[22px] w-[22px] rounded-full bg-white"
          style={{
            alignSelf: value ? 'flex-end' : 'flex-start',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </View>
    </Pressable>
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
    <View className="rounded-xl border border-borderLight bg-white p-4 gap-3">
      <Text className="text-sm text-center text-textSecondary">{message}</Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={onCancel}
          disabled={loading}
          className="flex-1 h-10 rounded-xl items-center justify-center border border-borderLight"
        >
          <Text className="text-sm text-textMuted">Отмена</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={loading}
          className="flex-1 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: Colors.statusError }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text className="text-sm font-semibold text-white">{confirmLabel}</Text>
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

  const displayEmail = user?.email || '';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 16, gap: 20 }}
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
        <Text className="text-xl font-bold text-textPrimary">Настройки</Text>

        {/* ============ Account card ============ */}
        <View className="gap-3 rounded-xl border border-borderLight p-4">
          <Text className="text-base font-semibold text-textPrimary">Аккаунт</Text>

          {/* Email — readonly */}
          <View className="gap-1">
            <Text className="text-sm font-medium text-textMuted">Email</Text>
            <View className="h-11 flex-row items-center rounded-lg border border-borderLight bg-bgSecondary px-3">
              <Feather name="mail" size={16} color={Colors.textMuted} />
              <Text className="ml-2 flex-1 text-base text-textSecondary" numberOfLines={1}>
                {displayEmail || '\u2014'}
              </Text>
            </View>
          </View>

          {/* Email change flow */}
          {emailChangeStep === 'idle' && (
            <Pressable
              className="h-10 items-center justify-center rounded-lg border bg-bgSecondary"
              style={{ borderColor: Colors.brandPrimary + '60' }}
              onPress={handleStartEmailChange}
            >
              <Text className="text-sm font-medium" style={{ color: Colors.brandPrimary }}>
                Изменить email
              </Text>
            </Pressable>
          )}

          {emailChangeStep === 'email_input' && (
            <View className="gap-2">
              <Text className="text-sm text-textSecondary">Новый email</Text>
              <TextInput
                className="h-11 rounded-lg border border-borderLight bg-bgSecondary px-3 text-base text-textPrimary"
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
                style={{ outlineStyle: 'none' } as any}
              />
              {emailChangeError ? (
                <Text className="text-xs" style={{ color: Colors.statusError }}>
                  {emailChangeError}
                </Text>
              ) : null}
              <View className="flex-row gap-2">
                <Pressable
                  className="flex-1 h-10 rounded-lg items-center justify-center border border-borderLight bg-bgSecondary"
                  onPress={handleCancelEmailChange}
                  disabled={emailChangeLoading}
                >
                  <Text className="text-sm font-medium text-textSecondary">Отмена</Text>
                </Pressable>
                <Pressable
                  className="flex-1 h-10 rounded-lg items-center justify-center"
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
                    <Text className="text-sm font-medium text-white">Получить код</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {emailChangeStep === 'otp_input' && (
            <View className="gap-2">
              <Text className="text-sm text-textSecondary">
                Код отправлен на {newEmail.trim().toLowerCase()}
              </Text>
              <TextInput
                className="h-11 rounded-lg border border-borderLight bg-bgSecondary px-3 text-center text-lg text-textPrimary"
                style={{ letterSpacing: 4, outlineStyle: 'none' } as any}
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
                <Text className="text-xs" style={{ color: Colors.statusError }}>
                  {emailChangeError}
                </Text>
              ) : null}
              <View className="flex-row gap-2">
                <Pressable
                  className="flex-1 h-10 rounded-lg items-center justify-center border border-borderLight bg-bgSecondary"
                  onPress={handleCancelEmailChange}
                  disabled={emailChangeLoading}
                >
                  <Text className="text-sm font-medium text-textSecondary">Отмена</Text>
                </Pressable>
                <Pressable
                  className="flex-1 h-10 rounded-lg items-center justify-center"
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
                    <Text className="text-sm font-medium text-white">Подтвердить</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {emailChangeStep === 'success' && (
            <View className="gap-2">
              <Text
                className="text-base font-medium text-center py-2"
                style={{ color: Colors.statusSuccess }}
              >
                Email успешно изменён
              </Text>
              <Pressable
                className="h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: Colors.brandPrimary }}
                onPress={() => {
                  setEmailChangeStep('idle');
                  setNewEmail('');
                  setEmailOtpCode('');
                  setEmailChangeError('');
                }}
              >
                <Text className="text-sm font-medium text-white">Готово</Text>
              </Pressable>
            </View>
          )}

          {/* Phone — specialist, matching prototype */}
          {isSpecialist && (
            <View className="gap-1">
              <Text className="text-sm font-medium text-textMuted">Телефон</Text>
              <View className="h-11 flex-row items-center rounded-lg border border-borderLight bg-bgSecondary px-3">
                <Feather name="phone" size={16} color={Colors.textMuted} />
                <Text className="ml-2 flex-1 text-base text-textSecondary">
                  {'\u2014'}
                </Text>
                <Pressable hitSlop={8} onPress={() => router.push('/profile/edit')}>
                  <Feather name="edit-2" size={16} color={Colors.brandPrimary} />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ============ Notifications ============ */}
        <View className="gap-3 rounded-xl border border-borderLight p-4">
          <Text className="text-base font-semibold text-textPrimary">Уведомления</Text>
          <Toggle
            label="Email-уведомления"
            value={notifSettings.new_responses}
            onValueChange={(v) => handleNotifToggle('new_responses', v)}
          />
          <Toggle
            label="Push-уведомления"
            value={notifSettings.new_messages}
            onValueChange={(v) => handleNotifToggle('new_messages', v)}
          />
        </View>

        {/* ============ Public profile — specialist ============ */}
        {isSpecialist && (
          <View className="gap-3 rounded-xl border border-borderLight p-4">
            <Text className="text-base font-semibold text-textPrimary">Публичный профиль</Text>
            <Toggle
              label="Профиль виден всем"
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              disabled={savingAvailability}
            />
          </View>
        )}

        {/* ============ Client reviews ============ */}
        {!isSpecialist && myReviews.length > 0 && (
          <View className="gap-3 rounded-xl border border-borderLight p-4">
            <Text className="text-base font-semibold text-textPrimary">Мои отзывы</Text>
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
                  {idx > 0 && <View className="h-px bg-borderLight" />}
                  <View className="gap-1">
                    <View className="flex-row justify-between items-center">
                      <Text
                        className="text-base font-medium flex-1 text-textPrimary"
                        numberOfLines={1}
                      >
                        {specName}
                      </Text>
                      <Text
                        className="text-sm font-medium ml-2"
                        style={{ color: Colors.brandPrimary }}
                      >
                        {stars} {review.rating}/5
                      </Text>
                    </View>
                    {review.comment ? (
                      <Text className="text-sm text-textSecondary" numberOfLines={3}>
                        {review.comment}
                      </Text>
                    ) : null}
                    <Text className="text-xs text-textMuted">
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
        )}

        {/* ============ Admin ============ */}
        {isAdmin(user?.email) && (
          <View className="gap-3 rounded-xl border border-borderLight p-4">
            <Text className="text-base font-semibold text-textPrimary">Администрирование</Text>
            <Pressable
              className="h-10 flex-row items-center justify-center gap-2 rounded-lg border border-borderLight"
              onPress={() => router.push('/(admin)')}
            >
              <Feather name="shield" size={16} color={Colors.textMuted} />
              <Text className="text-sm font-medium text-textPrimary">Панель администратора</Text>
              <Feather name="chevron-right" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* ============ Logout ============ */}
        <Pressable
          className="h-12 flex-row items-center justify-center gap-2 rounded-xl"
          style={{ backgroundColor: Colors.statusBg.error }}
          onPress={() => setShowLogoutConfirm(true)}
        >
          <Feather name="log-out" size={18} color={Colors.statusError} />
          <Text className="text-base font-semibold" style={{ color: Colors.statusError }}>
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

        {/* ============ Delete account ============ */}
        <Pressable
          className="h-12 flex-row items-center justify-center gap-2 rounded-xl border"
          style={{ borderColor: Colors.statusBg.error }}
          onPress={() => setShowDeleteConfirm(true)}
        >
          <Feather name="trash-2" size={18} color={Colors.statusError} />
          <Text className="text-base font-semibold" style={{ color: Colors.statusError }}>
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

        {/* Version */}
        <Text className="text-xs text-center text-textMuted">
          Версия {APP_VERSION}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
