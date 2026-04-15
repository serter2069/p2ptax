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
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { api, ApiError } from '../../lib/api';
import { isAdmin } from '../../lib/adminEmails';
import { Toggle } from '../../components/ui/Toggle';
import { users } from '../../lib/api/endpoints';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../../constants/Colors';

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
function SectionCard({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <View style={[s.card, danger && s.cardDanger]}>
      {children}
    </View>
  );
}

function SettingRow({
  label,
  value,
  icon,
  danger,
  onPress,
  last,
}: {
  label: string;
  value?: string;
  icon: string;
  danger?: boolean;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[s.row, last && s.rowLast]}>
      <Feather
        name={icon as any}
        size={18}
        color={danger ? Colors.statusError : Colors.textMuted}
      />
      <Text style={[s.rowLabel, danger && { color: Colors.statusError }]}>
        {label}
      </Text>
      {value && <Text style={s.rowValue}>{value}</Text>}
      {onPress && (
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      )}
    </Pressable>
  );
}

function ToggleRow({
  label,
  sublabel,
  icon,
  value,
  onToggle,
  disabled,
  last,
}: {
  label: string;
  sublabel?: string;
  icon: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[s.row, last && s.rowLast]}>
      <Feather name={icon as any} size={18} color={Colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Toggle
          value={value}
          onValueChange={onToggle}
          label={label}
          sublabel={sublabel}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  loading,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <View style={s.confirmCard}>
      <Text style={s.confirmTitle}>{title}</Text>
      <Text style={s.confirmText}>{message}</Text>
      <View style={s.confirmActions}>
        <Pressable
          onPress={onCancel}
          style={s.confirmBtnCancel}
          disabled={loading}
        >
          <Text style={s.confirmBtnCancelText}>Отмена</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          style={s.confirmBtnDanger}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={s.confirmBtnDangerText}>{confirmLabel}</Text>
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
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);

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

      // Load notification settings
      promises.push(
        users
          .getSettings()
          .then((res: { data: Record<string, unknown> }) => {
            if (res.data) {
              if (typeof res.data.emailNotifications === 'boolean')
                setEmailNotif(res.data.emailNotifications);
              if (typeof res.data.pushNotifications === 'boolean')
                setPushNotif(res.data.pushNotifications);
            }
          })
          .catch(() => {}),
      );

      // Specialist: load profile
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

      // Client: load reviews
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
  const handleToggleEmail = useCallback(async (v: boolean) => {
    setEmailNotif(v);
    try {
      await users.updateSettings({ emailNotifications: v });
    } catch {
      setEmailNotif(!v);
    }
  }, []);

  const handleTogglePush = useCallback(async (v: boolean) => {
    setPushNotif(v);
    try {
      await users.updateSettings({ pushNotifications: v });
    } catch {
      setPushNotif(!v);
    }
  }, []);

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
      style={{ flex: 1, backgroundColor: Colors.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        <Text style={s.pageTitle}>Настройки</Text>

        {/* ============ Profile ============ */}
        <View style={s.section}>
          <SectionCard>
            <View style={s.profileRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.profileName}>{displayName}</Text>
                <Text style={s.profileEmail}>{displayEmail}</Text>
              </View>
            </View>
          </SectionCard>
        </View>

        {/* ============ Specialist: Work area ============ */}
        {isSpecialist && profile && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Рабочая зона</Text>
            <SectionCard>
              <Pressable
                style={[s.row, s.rowLast]}
                onPress={() => router.push('/(dashboard)/profile')}
              >
                <Feather name="edit-2" size={18} color={Colors.brandPrimary} />
                <Text style={[s.rowLabel, { color: Colors.brandPrimary }]}>
                  Редактировать профиль
                </Text>
                <Feather
                  name="chevron-right"
                  size={16}
                  color={Colors.brandPrimary}
                />
              </Pressable>
            </SectionCard>
            <View style={s.workAreaSummary}>
              {profile.cities.length > 0 && (
                <View style={s.chipRow}>
                  <Feather name="map-pin" size={14} color={Colors.textMuted} />
                  <Text style={s.chipText}>{profile.cities.join(', ')}</Text>
                </View>
              )}
              {profile.fnsOffices.length > 0 && (
                <View style={s.chipRow}>
                  <Feather
                    name="briefcase"
                    size={14}
                    color={Colors.textMuted}
                  />
                  <Text style={s.chipText}>
                    {profile.fnsOffices.length} ИФНС
                  </Text>
                </View>
              )}
              {profile.services.length > 0 && (
                <View style={s.chipRow}>
                  <Feather
                    name="check-circle"
                    size={14}
                    color={Colors.textMuted}
                  />
                  <Text style={s.chipText}>
                    {profile.services.join(', ')}
                  </Text>
                </View>
              )}
              {profile.cities.length === 0 &&
                profile.fnsOffices.length === 0 &&
                profile.services.length === 0 && (
                  <Text style={s.emptyHint}>Профиль не заполнен</Text>
                )}
            </View>
          </View>
        )}

        {/* ============ Specialist: Public profile toggle ============ */}
        {isSpecialist && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Публичный профиль</Text>
            <SectionCard>
              <ToggleRow
                label="Принимаю заявки"
                sublabel={
                  isAvailable
                    ? 'Ваш профиль виден клиентам'
                    : 'Профиль скрыт от поиска'
                }
                icon="eye"
                value={isAvailable}
                onToggle={handleToggleAvailability}
                disabled={savingAvailability}
                last
              />
            </SectionCard>
          </View>
        )}

        {/* ============ Notifications ============ */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Уведомления</Text>
          <SectionCard>
            <ToggleRow
              label="Email-уведомления"
              sublabel={
                isSpecialist
                  ? 'Новые запросы в ваших городах'
                  : 'Отклики специалистов и сообщения'
              }
              icon="mail"
              value={emailNotif}
              onToggle={handleToggleEmail}
            />
            <ToggleRow
              label="Push-уведомления"
              icon="bell"
              value={pushNotif}
              onToggle={handleTogglePush}
              last
            />
          </SectionCard>
        </View>

        {/* ============ Account / Email change ============ */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Аккаунт</Text>
          <SectionCard>
            {emailChangeStep === 'idle' && (
              <SettingRow
                label="Изменить email"
                icon="mail"
                onPress={handleStartEmailChange}
                last
              />
            )}

            {emailChangeStep === 'email_input' && (
              <View style={s.emailChangeBlock}>
                <Text style={s.emailChangeLabel}>Новый email</Text>
                <TextInput
                  style={s.emailChangeInput}
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
                  <Text style={s.emailChangeError}>{emailChangeError}</Text>
                ) : null}
                <View style={s.emailChangeActions}>
                  <Pressable
                    style={s.emailChangeCancelBtn}
                    onPress={handleCancelEmailChange}
                    disabled={emailChangeLoading}
                  >
                    <Text style={s.emailChangeCancelText}>Отмена</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      s.emailChangePrimaryBtn,
                      emailChangeLoading && { opacity: 0.6 },
                    ]}
                    onPress={handleRequestEmailChange}
                    disabled={emailChangeLoading}
                  >
                    {emailChangeLoading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={s.emailChangePrimaryText}>
                        Получить код
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {emailChangeStep === 'otp_input' && (
              <View style={s.emailChangeBlock}>
                <Text style={s.emailChangeLabel}>
                  Код отправлен на {newEmail.trim().toLowerCase()}
                </Text>
                <TextInput
                  style={[s.emailChangeInput, s.emailChangeOtpInput]}
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
                  <Text style={s.emailChangeError}>{emailChangeError}</Text>
                ) : null}
                <View style={s.emailChangeActions}>
                  <Pressable
                    style={s.emailChangeCancelBtn}
                    onPress={handleCancelEmailChange}
                    disabled={emailChangeLoading}
                  >
                    <Text style={s.emailChangeCancelText}>Отмена</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      s.emailChangePrimaryBtn,
                      emailChangeLoading && { opacity: 0.6 },
                    ]}
                    onPress={handleConfirmEmailChange}
                    disabled={emailChangeLoading}
                  >
                    {emailChangeLoading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={s.emailChangePrimaryText}>
                        Подтвердить
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {emailChangeStep === 'success' && (
              <View style={s.emailChangeBlock}>
                <Text style={s.emailChangeSuccess}>
                  Email успешно изменён
                </Text>
                <Pressable
                  style={s.emailChangePrimaryBtn}
                  onPress={() => {
                    setEmailChangeStep('idle');
                    setNewEmail('');
                    setEmailOtpCode('');
                    setEmailChangeError('');
                  }}
                >
                  <Text style={s.emailChangePrimaryText}>Готово</Text>
                </Pressable>
              </View>
            )}
          </SectionCard>
        </View>

        {/* ============ Client reviews ============ */}
        {!isSpecialist && myReviews.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Мои отзывы</Text>
            <SectionCard>
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
                    {idx > 0 && <View style={s.reviewDivider} />}
                    <View style={s.reviewRow}>
                      <View style={s.reviewHeader}>
                        <Text style={s.reviewSpecialist} numberOfLines={1}>
                          {specName}
                        </Text>
                        <Text style={s.reviewRating}>
                          {stars} {review.rating}/5
                        </Text>
                      </View>
                      {review.comment ? (
                        <Text style={s.reviewComment} numberOfLines={3}>
                          {review.comment}
                        </Text>
                      ) : null}
                      <Text style={s.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString(
                          'ru-RU',
                          { day: 'numeric', month: 'short', year: 'numeric' },
                        )}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </SectionCard>
          </View>
        )}

        {/* ============ Admin ============ */}
        {isAdmin(user?.email) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Администрирование</Text>
            <SectionCard>
              <SettingRow
                label="Панель администратора"
                icon="shield"
                onPress={() => router.push('/(admin)')}
                last
              />
            </SectionCard>
          </View>
        )}

        {/* ============ Danger zone ============ */}
        <View style={s.dangerSection}>
          <Pressable
            onPress={() => setShowLogoutConfirm(true)}
            style={s.dangerBtn}
          >
            <Feather name="log-out" size={18} color={Colors.statusError} />
            <Text style={s.dangerBtnText}>Выйти из аккаунта</Text>
          </Pressable>

          {showLogoutConfirm && (
            <ConfirmModal
              title="Выход"
              message="Вы уверены, что хотите выйти?"
              confirmLabel="Выйти"
              onCancel={() => setShowLogoutConfirm(false)}
              onConfirm={handleLogout}
              loading={logoutLoading}
            />
          )}

          <Pressable
            onPress={() => setShowDeleteConfirm(true)}
            style={[s.dangerBtn, s.dangerBtnOutline]}
          >
            <Feather name="trash-2" size={18} color={Colors.statusError} />
            <Text style={s.dangerBtnText}>Удалить аккаунт</Text>
          </Pressable>

          {showDeleteConfirm && (
            <ConfirmModal
              title="Удаление аккаунта"
              message="Это действие необратимо. Все ваши данные будут удалены."
              confirmLabel="Удалить"
              onCancel={() => setShowDeleteConfirm(false)}
              onConfirm={handleDeleteAccount}
              loading={deleteLoading}
            />
          )}
        </View>

        {/* ============ Version ============ */}
        <Text style={s.version}>Версия {APP_VERSION}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },
  pageTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // Sections
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardDanger: {
    borderColor: Colors.statusError + '40',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  rowValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  profileName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Work area summary (specialist)
  workAreaSummary: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  emptyHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // Danger
  dangerSection: { gap: Spacing.sm },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    backgroundColor: Colors.statusBg.error,
    borderRadius: BorderRadius.btn,
  },
  dangerBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.statusBg.error,
  },
  dangerBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.statusError,
  },

  // Confirm
  confirmCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.statusBg.error,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  confirmTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  confirmBtnCancel: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmBtnCancelText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  confirmBtnDanger: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.statusError,
  },
  confirmBtnDangerText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },

  // Email change
  emailChangeBlock: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  emailChangeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  emailChangeInput: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  emailChangeOtpInput: {
    letterSpacing: 4,
    textAlign: 'center',
    fontSize: Typography.fontSize.lg,
  },
  emailChangeError: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
  },
  emailChangeSuccess: {
    fontSize: Typography.fontSize.base,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  emailChangeActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  emailChangeCancelBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailChangeCancelText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  emailChangePrimaryBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    backgroundColor: Colors.brandPrimary,
  },
  emailChangePrimaryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
  },

  // Reviews
  reviewDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  reviewRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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

  // Version
  version: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
