import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { api, ApiError } from '../../lib/api';
import { isAdmin } from '../../lib/adminEmails';
import { Header } from '../../components/Header';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';

type EmailChangeStep = 'viewing' | 'enterEmail' | 'enterOtp';

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

const NOTIF_KEY = '@p2ptax_email_notif';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, updateEmail } = useAuth();

  const [emailNotif, setEmailNotif] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Email change state machine
  const [emailChangeStep, setEmailChangeStep] = useState<EmailChangeStep>('viewing');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);

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

  // Load notification preference from API, fallback to AsyncStorage
  useEffect(() => {
    api.get('/users/me/settings')
      .then((data: any) => {
        setEmailNotif(data.emailNotifications);
        AsyncStorage.setItem(NOTIF_KEY, String(data.emailNotifications)).catch(() => {});
      })
      .catch(() => {
        // Fallback to AsyncStorage if API unavailable
        AsyncStorage.getItem(NOTIF_KEY)
          .then((val) => {
            if (val !== null) setEmailNotif(val === 'true');
          })
          .catch(() => {});
      })
      .finally(() => setNotifLoading(false));
  }, []);

  async function handleNotifToggle(value: boolean) {
    setEmailNotif(value);
    try {
      await api.patch('/users/me/settings', { emailNotifications: value });
      await AsyncStorage.setItem(NOTIF_KEY, String(value));
    } catch {
      // Revert on failure
      setEmailNotif(!value);
    }
  }

  function handleStartEmailChange() {
    setNewEmailInput('');
    setOtpInput('');
    setEmailChangeError(null);
    setEmailChangeStep('enterEmail');
  }

  function handleCancelEmailChange() {
    setEmailChangeStep('viewing');
    setNewEmailInput('');
    setOtpInput('');
    setEmailChangeError(null);
  }

  async function handleRequestOtp() {
    const trimmed = newEmailInput.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailChangeError('Введите корректный email');
      return;
    }
    setEmailChangeError(null);
    setEmailChangeLoading(true);
    try {
      await api.post('/users/me/change-email/request', { newEmail: trimmed });
      setEmailChangeStep('enterOtp');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось отправить код. Попробуйте позже.';
      setEmailChangeError(msg);
    } finally {
      setEmailChangeLoading(false);
    }
  }

  async function handleConfirmOtp() {
    const trimmedEmail = newEmailInput.trim().toLowerCase();
    const trimmedCode = otpInput.trim();
    if (trimmedCode.length !== 6) {
      setEmailChangeError('Введите 6-значный код');
      return;
    }
    setEmailChangeError(null);
    setEmailChangeLoading(true);
    try {
      const result = await api.post<{ accessToken: string; refreshToken: string; email: string }>(
        '/users/me/change-email/confirm',
        { newEmail: trimmedEmail, code: trimmedCode },
      );
      await updateEmail(result.email, result.accessToken, result.refreshToken);
      setEmailChangeStep('viewing');
      setNewEmailInput('');
      setOtpInput('');
      Alert.alert('Готово', 'Email успешно изменён');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Неверный код или истёк срок действия.';
      setEmailChangeError(msg);
    } finally {
      setEmailChangeLoading(false);
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

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Настройки" showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Account section */}
          <Text style={styles.sectionTitle}>Аккаунт</Text>
          <View style={styles.card}>
            {/* Email row — collapses into edit form when changing */}
            {emailChangeStep === 'viewing' && (
              <TouchableOpacity
                style={styles.row}
                onPress={handleStartEmailChange}
                activeOpacity={0.7}
              >
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowLabel}>Email</Text>
                  <Text style={styles.rowHint} numberOfLines={1}>{user?.email ?? '—'}</Text>
                </View>
                <Text style={styles.changeLink}>Изменить</Text>
              </TouchableOpacity>
            )}

            {emailChangeStep === 'enterEmail' && (
              <View style={styles.emailChangeBlock}>
                <Text style={styles.emailChangeTitle}>Новый email</Text>
                <TextInput
                  style={styles.emailInput}
                  value={newEmailInput}
                  onChangeText={setNewEmailInput}
                  placeholder="new@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  editable={!emailChangeLoading}
                />
                {emailChangeError ? (
                  <Text style={styles.emailChangeError}>{emailChangeError}</Text>
                ) : null}
                <View style={styles.emailChangeActions}>
                  <TouchableOpacity
                    style={[styles.emailChangeBtn, styles.emailChangeBtnSecondary]}
                    onPress={handleCancelEmailChange}
                    disabled={emailChangeLoading}
                  >
                    <Text style={styles.emailChangeBtnSecondaryText}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emailChangeBtn, styles.emailChangeBtnPrimary, emailChangeLoading && styles.emailChangeBtnDisabled]}
                    onPress={handleRequestOtp}
                    disabled={emailChangeLoading}
                  >
                    {emailChangeLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.emailChangeBtnPrimaryText}>Отправить код</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {emailChangeStep === 'enterOtp' && (
              <View style={styles.emailChangeBlock}>
                <Text style={styles.emailChangeTitle}>Код из письма</Text>
                <Text style={styles.emailChangeHint}>
                  Код отправлен на {newEmailInput.trim().toLowerCase()}
                </Text>
                <TextInput
                  style={styles.emailInput}
                  value={otpInput}
                  onChangeText={setOtpInput}
                  placeholder="000000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  editable={!emailChangeLoading}
                />
                {emailChangeError ? (
                  <Text style={styles.emailChangeError}>{emailChangeError}</Text>
                ) : null}
                <View style={styles.emailChangeActions}>
                  <TouchableOpacity
                    style={[styles.emailChangeBtn, styles.emailChangeBtnSecondary]}
                    onPress={handleCancelEmailChange}
                    disabled={emailChangeLoading}
                  >
                    <Text style={styles.emailChangeBtnSecondaryText}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emailChangeBtn, styles.emailChangeBtnPrimary, emailChangeLoading && styles.emailChangeBtnDisabled]}
                    onPress={handleConfirmOtp}
                    disabled={emailChangeLoading}
                  >
                    {emailChangeLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.emailChangeBtnPrimaryText}>Подтвердить</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Роль</Text>
              <Text style={styles.rowValue}>
                {user?.role === 'SPECIALIST' ? 'Специалист' : 'Заказчик'}
              </Text>
            </View>
          </View>

          {/* Notifications section */}
          <Text style={styles.sectionTitle}>Уведомления</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowTextBlock}>
                <Text style={styles.rowLabel}>Email-уведомления</Text>
                <Text style={styles.rowHint}>
                  Получать уведомления о новых сообщениях
                </Text>
              </View>
              {notifLoading ? (
                <ActivityIndicator size="small" color={Colors.brandPrimary} />
              ) : (
                <Switch
                  value={emailNotif}
                  onValueChange={handleNotifToggle}
                  trackColor={{ false: Colors.border, true: Colors.brandPrimary }}
                  thumbColor={Colors.textPrimary}
                />
              )}
            </View>
          </View>

          {/* My Reviews — CLIENT only */}
          {user?.role === 'CLIENT' && (
            <>
              <Text style={styles.sectionTitle}>Мои отзывы</Text>
              <View style={styles.card}>
                {reviewsLoading ? (
                  <View style={styles.row}>
                    <ActivityIndicator size="small" color={Colors.brandPrimary} />
                  </View>
                ) : myReviews.length === 0 ? (
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Вы пока не оставляли отзывов</Text>
                  </View>
                ) : (
                  myReviews.map((review, idx) => {
                    const specName =
                      review.specialist.specialistProfile?.displayName ??
                      review.specialist.specialistProfile?.nick ??
                      review.specialist.email.split('@')[0];
                    const stars = Array.from({ length: 5 }, (_, i) => (i < review.rating ? '\u2605' : '\u2606')).join('');
                    return (
                      <View key={review.id}>
                        {idx > 0 && <View style={styles.divider} />}
                        <View style={styles.reviewRow}>
                          <View style={styles.reviewHeader}>
                            <Text style={styles.reviewSpecialist} numberOfLines={1}>{specName}</Text>
                            <Text style={styles.reviewRating}>{stars} {review.rating}/5</Text>
                          </View>
                          {review.comment ? (
                            <Text style={styles.reviewComment} numberOfLines={3}>{review.comment}</Text>
                          ) : null}
                          <Text style={styles.reviewDate}>
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
            </>
          )}

          {/* Admin section — visible only for admin emails */}
          {isAdmin(user?.email) ? (
            <>
              <Text style={styles.sectionTitle}>Администрирование</Text>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push('/(admin)')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rowLabel}>Панель администратора</Text>
                  <Text style={styles.rowArrow}>{'>'}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {/* Actions section */}
          <Text style={styles.sectionTitle}>Действия</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.rowLabel}>Выйти из аккаунта</Text>
              <Text style={styles.rowArrow}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Danger zone */}
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Опасная зона</Text>
          <View style={[styles.card, styles.cardDanger]}>
            <TouchableOpacity
              style={styles.row}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={Colors.statusError} />
              ) : (
                <>
                  <Text style={styles.deleteText}>Удалить аккаунт</Text>
                  <Text style={styles.rowArrow}>{'>'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.deleteHint}>
            Удаление аккаунта необратимо. Все данные будут удалены.
          </Text>
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
  scroll: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  dangerTitle: {
    color: Colors.statusError,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardDanger: {
    borderColor: Colors.statusError + '40',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    minHeight: 52,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xl,
  },
  rowTextBlock: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  rowValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    maxWidth: '55%',
    textAlign: 'right',
  },
  rowArrow: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  deleteText: {
    fontSize: Typography.fontSize.base,
    color: Colors.statusError,
    flex: 1,
    fontWeight: Typography.fontWeight.medium,
  },
  deleteHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.xs,
  },
  reviewRow: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewSpecialist: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  reviewRating: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.sm,
  },
  reviewComment: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  changeLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.sm,
  },
  emailChangeBlock: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  emailChangeTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  emailChangeHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgPrimary,
  },
  emailChangeError: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
  },
  emailChangeActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  emailChangeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  emailChangeBtnPrimary: {
    backgroundColor: Colors.brandPrimary,
  },
  emailChangeBtnPrimaryText: {
    color: '#fff',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  emailChangeBtnSecondary: {
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailChangeBtnSecondaryText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  emailChangeBtnDisabled: {
    opacity: 0.6,
  },
});
