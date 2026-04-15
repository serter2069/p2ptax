import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { useAuth } from '../../stores/authStore';
import { api, ApiError } from '../../lib/api';
import { isAdmin } from '../../lib/adminEmails';
import { Header } from '../../components/Header';
import { Colors } from '../../constants/Colors';

interface MyReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  specialist: {
    id: string;
    email: string;
    specialistProfile: { nick: string; displayName: string | null; avatarUrl: string | null } | null;
  };
}

type EmailChangeStep = 'idle' | 'email_input' | 'otp_input' | 'success';

interface NotificationSettings {
  new_responses: boolean;
  new_messages: boolean;
}

const NOTIF_KEY_RESPONSES = '@p2ptax_notif_responses';
const NOTIF_KEY_MESSAGES = '@p2ptax_notif_messages';

// ---------------------------------------------------------------------------
// Toggle (matching proto pattern)
// ---------------------------------------------------------------------------
function Toggle({
  label,
  sublabel,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  sublabel?: string;
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
      <View className="mr-3 flex-1">
        <Text className="text-sm text-textSecondary">{label}</Text>
        {sublabel ? <Text className="text-xs text-textMuted">{sublabel}</Text> : null}
      </View>
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

export default function SettingsScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const { user, logout, updateEmail } = useAuth();

  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    new_responses: true,
    new_messages: true,
  });
  const [notifLoading, setNotifLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Email change state
  const [emailChangeStep, setEmailChangeStep] = useState<EmailChangeStep>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState('');

  // Load my reviews for CLIENT role
  useEffect(() => {
    if (user?.role === 'CLIENT') {
      setReviewsLoading(true);
      api.get<MyReview[]>('/reviews/my')
        .then(setMyReviews)
        .catch(() => {})
        .finally(() => setReviewsLoading(false));
    }
  }, [user?.role]);

  // Load notification preferences from API, fallback to AsyncStorage
  useEffect(() => {
    api.get<NotificationSettings>('/users/me/notification-settings')
      .then((data) => {
        setNotifSettings(data);
        AsyncStorage.setItem(NOTIF_KEY_RESPONSES, String(data.new_responses)).catch(() => {});
        AsyncStorage.setItem(NOTIF_KEY_MESSAGES, String(data.new_messages)).catch(() => {});
      })
      .catch(() => {
        Promise.all([
          AsyncStorage.getItem(NOTIF_KEY_RESPONSES),
          AsyncStorage.getItem(NOTIF_KEY_MESSAGES),
        ]).then(([responses, messages]) => {
          setNotifSettings({
            new_responses: responses !== null ? responses === 'true' : true,
            new_messages: messages !== null ? messages === 'true' : true,
          });
        }).catch(() => {});
      })
      .finally(() => setNotifLoading(false));
  }, []);

  async function handleNotifToggle(key: keyof NotificationSettings, value: boolean) {
    const prev = notifSettings[key];
    setNotifSettings((s) => ({ ...s, [key]: value }));
    try {
      await api.patch('/users/me/notification-settings', { [key]: value });
      if (key === 'new_responses') {
        await AsyncStorage.setItem(NOTIF_KEY_RESPONSES, String(value));
      } else {
        await AsyncStorage.setItem(NOTIF_KEY_MESSAGES, String(value));
      }
    } catch {
      setNotifSettings((s) => ({ ...s, [key]: prev }));
    }
  }

  function handleLogout() {
    Alert.alert('Выйти', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Удалить аккаунт',
      'Это действие необратимо. Все ваши данные, запросы и диалоги будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ],
    );
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.del('/users/me');
      await logout();
      router.replace('/');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Не удалось удалить аккаунт. Попробуйте позже.';
      Alert.alert('Ошибка', msg);
    } finally {
      setDeleting(false);
    }
  }

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
      const msg = err instanceof ApiError ? err.message : 'Ошибка отправки кода. Попробуйте позже.';
      setEmailChangeError(msg);
    } finally {
      setEmailChangeLoading(false);
    }
  }

  async function handleConfirmEmailChange() {
    const trimmedCode = emailOtpCode.trim();
    if (trimmedCode.length !== 6) {
      setEmailChangeError('Введите 6-значный код');
      return;
    }
    setEmailChangeLoading(true);
    setEmailChangeError('');
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; email: string }>(
        '/users/me/change-email/confirm',
        { newEmail: newEmail.trim().toLowerCase(), code: trimmedCode },
      );
      await updateEmail(res.email, res.accessToken, res.refreshToken);
      setEmailChangeStep('success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Ошибка подтверждения. Попробуйте позже.';
      setEmailChangeError(msg);
    } finally {
      setEmailChangeLoading(false);
    }
  }

  function handleEmailChangeSuccess() {
    setEmailChangeStep('idle');
    setNewEmail('');
    setEmailOtpCode('');
    setEmailChangeError('');
  }

  const displayEmail = user?.email ?? '\u2014';

  return (
    <SafeAreaView className="flex-1 bg-white">
      {isMobile && <Header title="Настройки" showBack />}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ alignItems: 'center', paddingVertical: 24, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-[430px] px-5 gap-5">
            {/* Page title */}
            <Text className="text-xl font-bold text-textPrimary">Настройки</Text>

            {/* ============ Account ============ */}
            <View className="gap-3 rounded-xl border border-borderLight p-4">
              <Text className="text-base font-semibold text-textPrimary">Аккаунт</Text>

              {/* Email — readonly */}
              <View className="gap-1">
                <Text className="text-sm font-medium text-textMuted">Email</Text>
                <View className="h-11 flex-row items-center rounded-lg border border-borderLight bg-bgSecondary px-3">
                  <Feather name="mail" size={16} color={Colors.textMuted} />
                  <Text className="ml-2 flex-1 text-base text-textSecondary" numberOfLines={1}>
                    {displayEmail}
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
                    onChangeText={(t) => { setNewEmail(t); setEmailChangeError(''); }}
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
                    onChangeText={(t) => { setEmailOtpCode(t.replace(/\D/g, '').slice(0, 6)); setEmailChangeError(''); }}
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
                    onPress={handleEmailChangeSuccess}
                  >
                    <Text className="text-sm font-medium text-white">Готово</Text>
                  </Pressable>
                </View>
              )}

              {/* Role */}
              <View className="gap-1">
                <Text className="text-sm font-medium text-textMuted">Роль</Text>
                <View className="h-11 flex-row items-center rounded-lg border border-borderLight bg-bgSecondary px-3">
                  <Feather name="user" size={16} color={Colors.textMuted} />
                  <Text className="ml-2 flex-1 text-base text-textSecondary">
                    {user?.role === 'SPECIALIST' ? 'Специалист' : 'Заказчик'}
                  </Text>
                </View>
              </View>

              {/* Edit profile link — specialist only */}
              {user?.role === 'SPECIALIST' && (
                <Pressable
                  className="h-10 flex-row items-center justify-center gap-2 rounded-lg border"
                  style={{ borderColor: Colors.brandPrimary + '60' }}
                  onPress={() => router.push('/(dashboard)/profile')}
                >
                  <Feather name="edit-2" size={14} color={Colors.brandPrimary} />
                  <Text className="text-sm font-medium" style={{ color: Colors.brandPrimary }}>
                    Редактировать профиль
                  </Text>
                </Pressable>
              )}
            </View>

            {/* ============ Notifications ============ */}
            <View className="gap-3 rounded-xl border border-borderLight p-4">
              <Text className="text-base font-semibold text-textPrimary">Уведомления</Text>
              {notifLoading ? (
                <ActivityIndicator size="small" color={Colors.brandPrimary} />
              ) : (
                <>
                  <Toggle
                    label="Новые отклики"
                    sublabel="Уведомления о новых откликах на ваши запросы"
                    value={notifSettings.new_responses}
                    onValueChange={(v) => handleNotifToggle('new_responses', v)}
                  />
                  <Toggle
                    label="Новые сообщения"
                    sublabel="Уведомления о новых сообщениях в чатах"
                    value={notifSettings.new_messages}
                    onValueChange={(v) => handleNotifToggle('new_messages', v)}
                  />
                  <Toggle
                    label="Автозакрытие"
                    sublabel="Уведомления об автоматическом закрытии запросов"
                    value={true}
                    onValueChange={() => {}}
                    disabled
                  />
                </>
              )}
            </View>

            {/* ============ My Reviews — CLIENT only ============ */}
            {user?.role === 'CLIENT' && (
              <View className="gap-3 rounded-xl border border-borderLight p-4">
                <Text className="text-base font-semibold text-textPrimary">Мои отзывы</Text>
                {reviewsLoading ? (
                  <ActivityIndicator size="small" color={Colors.brandPrimary} />
                ) : myReviews.length === 0 ? (
                  <Text className="text-sm text-textMuted">Вы пока не оставляли отзывов</Text>
                ) : (
                  myReviews.map((review, idx) => {
                    const specName =
                      review.specialist.specialistProfile?.displayName ??
                      review.specialist.specialistProfile?.nick ??
                      review.specialist.email.split('@')[0];
                    const stars = Array.from({ length: 5 }, (_, i) => (i < review.rating ? '\u2605' : '\u2606')).join('');
                    return (
                      <View key={review.id}>
                        {idx > 0 && <View className="h-px bg-borderLight" />}
                        <View className="gap-1">
                          <View className="flex-row justify-between items-center">
                            <Text className="text-base font-medium flex-1 text-textPrimary" numberOfLines={1}>
                              {specName}
                            </Text>
                            <Text className="text-sm font-medium ml-2" style={{ color: Colors.brandPrimary }}>
                              {stars} {review.rating}/5
                            </Text>
                          </View>
                          {review.comment ? (
                            <Text className="text-sm text-textSecondary" numberOfLines={3}>{review.comment}</Text>
                          ) : null}
                          <Text className="text-xs text-textMuted">
                            {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
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
              onPress={handleLogout}
            >
              <Feather name="log-out" size={18} color={Colors.statusError} />
              <Text className="text-base font-semibold" style={{ color: Colors.statusError }}>
                Выйти из аккаунта
              </Text>
            </Pressable>

            {/* ============ Delete account ============ */}
            <Pressable
              className="h-12 flex-row items-center justify-center gap-2 rounded-xl border"
              style={{ borderColor: Colors.statusBg.error }}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={Colors.statusError} />
              ) : (
                <>
                  <Feather name="trash-2" size={18} color={Colors.statusError} />
                  <Text className="text-base font-semibold" style={{ color: Colors.statusError }}>
                    Удалить аккаунт
                  </Text>
                </>
              )}
            </Pressable>
            <Text className="text-xs text-textMuted px-1">
              Удаление аккаунта необратимо. Все данные будут удалены.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
