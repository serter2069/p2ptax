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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { api } from '../../lib/api';
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
  phone?: string | null;
}

const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Sub-components
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
  const { user, logout } = useAuth();
  const router = useRouter();
  const isSpecialist = user?.role === 'SPECIALIST';

  // Notification toggles (2 toggles matching proto)
  const [notifSettings, setNotifSettings] = useState<{
    new_responses: boolean;
    new_messages: boolean;
  }>({
    new_responses: true,
    new_messages: true,
  });

  // Public profile toggle
  const [publicProfile, setPublicProfile] = useState(true);
  const [savingPublicProfile, setSavingPublicProfile] = useState(false);

  // Confirm modals
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Specialist profile (for phone display)
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);

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
              setPublicProfile(data.isAvailable ?? true);
            })
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

  // ---- Public profile toggle ----
  const handleTogglePublicProfile = useCallback(async (val: boolean) => {
    setPublicProfile(val);
    setSavingPublicProfile(true);
    try {
      await api.patch<SpecialistProfile>('/specialists/me', {
        isAvailable: val,
      });
    } catch {
      setPublicProfile(!val);
    } finally {
      setSavingPublicProfile(false);
    }
  }, []);

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
  const displayPhone = profile?.phone || null;

  return (
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

        {/* Email — read-only */}
        <View className="gap-1">
          <Text className="text-sm font-medium text-textMuted">Email</Text>
          <View className="h-11 flex-row items-center rounded-lg border border-borderLight bg-bgSecondary px-3">
            <Feather name="mail" size={16} color={Colors.textMuted} />
            <Text className="ml-2 flex-1 text-base text-textSecondary" numberOfLines={1}>
              {displayEmail || '\u2014'}
            </Text>
          </View>
        </View>

        {/* Phone — with edit icon (matching proto) */}
        <View className="gap-1">
          <Text className="text-sm font-medium text-textMuted">Телефон</Text>
          <View className="h-11 flex-row items-center rounded-lg border border-borderLight bg-bgSecondary px-3">
            <Feather name="phone" size={16} color={Colors.textMuted} />
            <Text className="ml-2 flex-1 text-base text-textSecondary">
              {displayPhone || '\u2014'}
            </Text>
          </View>
        </View>
      </View>

      {/* ============ Notifications (2 toggles matching proto) ============ */}
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

      {/* ============ Public profile toggle (matching proto) ============ */}
      {isSpecialist && (
        <View className="gap-3 rounded-xl border border-borderLight p-4">
          <Text className="text-base font-semibold text-textPrimary">Публичный профиль</Text>
          <Toggle
            label="Профиль виден всем"
            value={publicProfile}
            onValueChange={handleTogglePublicProfile}
            disabled={savingPublicProfile}
          />
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
  );
}
