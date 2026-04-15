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
// Sub-components — matching proto SettingsStates
// ---------------------------------------------------------------------------

/** Proto-matching toggle: 44x24 track, 20x20 dot */
function ToggleRow({
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
  return (
    <Pressable
      className="flex-row items-center justify-between"
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.bgSecondary,
        opacity: disabled ? 0.5 : 1,
      }}
      onPress={() => !disabled && onValueChange(!value)}
    >
      <Text className="flex-1 text-sm" style={{ color: Colors.textPrimary }}>{label}</Text>
      <View
        className="justify-center"
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: value ? Colors.brandPrimary : Colors.border,
          paddingHorizontal: 2,
        }}
      >
        <View
          className="rounded-full bg-white"
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            alignSelf: value ? 'flex-end' : 'flex-start',
          }}
        />
      </View>
    </Pressable>
  );
}

/** Proto-matching setting row with label, optional value, and ">" arrow */
function SettingRow({
  label,
  value,
  danger,
  onPress,
}: {
  label: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between"
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.bgSecondary,
      }}
    >
      <Text
        className="flex-1 text-sm"
        style={{ color: danger ? Colors.statusError : Colors.textPrimary }}
      >
        {label}
      </Text>
      {value ? (
        <Text className="text-sm" style={{ color: Colors.textMuted, marginRight: 8 }}>
          {value}
        </Text>
      ) : null}
      <Text className="text-sm" style={{ color: Colors.textMuted }}>{'>'}</Text>
    </Pressable>
  );
}

/** Proto-matching section title: uppercase, letterSpacing */
function SectionTitle({ text }: { text: string }) {
  return (
    <Text
      className="font-semibold"
      style={{
        fontSize: 13,
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {text}
    </Text>
  );
}

/** Proto-matching card wrapper */
function Card({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: Colors.bgCard,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: danger ? Colors.statusBg.error : Colors.border,
        overflow: 'hidden',
      }}
    >
      {children}
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

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.brandPrimary}
        />
      }
    >
      {/* Page title — proto: lg/bold */}
      <Text
        className="font-bold"
        style={{ fontSize: 18, color: Colors.textPrimary }}
      >
        Настройки
      </Text>

      {/* ============ Notifications — proto order: first section ============ */}
      <View style={{ gap: 8 }}>
        <SectionTitle text="Уведомления" />
        <Card>
          <ToggleRow
            label="Email-уведомления"
            value={notifSettings.new_responses}
            onValueChange={(v) => handleNotifToggle('new_responses', v)}
          />
          <ToggleRow
            label="Push-уведомления"
            value={notifSettings.new_messages}
            onValueChange={(v) => handleNotifToggle('new_messages', v)}
          />
        </Card>
      </View>

      {/* ============ Account — proto: rows with value + arrow ============ */}
      <View style={{ gap: 8 }}>
        <SectionTitle text="Аккаунт" />
        <Card>
          <SettingRow label="Email" value={displayEmail || '\u2014'} />
          <SettingRow label="Язык" value="Русский" />
        </Card>
      </View>

      {/* ============ Public profile toggle (specialist only) ============ */}
      {isSpecialist && (
        <View style={{ gap: 8 }}>
          <SectionTitle text="Публичный профиль" />
          <Card>
            <ToggleRow
              label="Профиль виден всем"
              value={publicProfile}
              onValueChange={handleTogglePublicProfile}
              disabled={savingPublicProfile}
            />
          </Card>
        </View>
      )}

      {/* ============ Other — proto: privacy, terms, version ============ */}
      <View style={{ gap: 8 }}>
        <SectionTitle text="Прочее" />
        <Card>
          <SettingRow label="Политика конфиденциальности" />
          <SettingRow label="Условия использования" />
          <SettingRow label="Версия" value={APP_VERSION} />
        </Card>
      </View>

      {/* ============ Admin ============ */}
      {isAdmin(user?.email) && (
        <View style={{ gap: 8 }}>
          <SectionTitle text="Администрирование" />
          <Card>
            <SettingRow
              label="Панель администратора"
              onPress={() => router.push('/(admin)')}
            />
          </Card>
        </View>
      )}

      {/* ============ Danger zone — proto: error border card ============ */}
      <Card danger>
        <SettingRow
          label="Выйти из аккаунта"
          danger
          onPress={() => setShowLogoutConfirm(true)}
        />
        <SettingRow
          label="Удалить аккаунт"
          danger
          onPress={() => setShowDeleteConfirm(true)}
        />
      </Card>

      {showLogoutConfirm && (
        <ConfirmCard
          message="Вы уверены, что хотите выйти?"
          confirmLabel="Выйти"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          loading={logoutLoading}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmCard
          message="Это действие необратимо. Все ваши данные будут удалены."
          confirmLabel="Удалить"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
          loading={deleteLoading}
        />
      )}
    </ScrollView>
  );
}
