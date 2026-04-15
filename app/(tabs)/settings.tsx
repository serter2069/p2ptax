import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';
import { useAuth } from '../../stores/authStore';
import { Toggle } from '../../components/ui/Toggle';
import { users } from '../../lib/api/endpoints';

const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
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
    <Pressable
      onPress={onPress}
      style={[s.row, last && s.rowLast]}
    >
      <Feather
        name={icon as any}
        size={18}
        color={danger ? Colors.statusError : Colors.textMuted}
      />
      <Text style={[s.rowLabel, danger && { color: Colors.statusError }]}>{label}</Text>
      {value && <Text style={s.rowValue}>{value}</Text>}
      {onPress && (
        <Feather name="chevron-right" size={16} color={Colors.textMuted} />
      )}
    </Pressable>
  );
}

function ToggleRow({
  label,
  icon,
  value,
  onToggle,
  last,
}: {
  label: string;
  icon: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[s.row, last && s.rowLast]}>
      <Feather name={icon as any} size={18} color={Colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Toggle value={value} onValueChange={onToggle} label={label} />
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
        <Pressable onPress={onCancel} style={s.confirmBtnCancel} disabled={loading}>
          <Text style={s.confirmBtnCancelText}>Отмена</Text>
        </Pressable>
        <Pressable onPress={onConfirm} style={s.confirmBtnDanger} disabled={loading}>
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
  const { user, logout } = useAuth();
  const router = useRouter();

  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load saved notification settings
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await users.getSettings();
        if (!cancelled && res.data) {
          if (typeof res.data.emailNotifications === 'boolean') setEmailNotif(res.data.emailNotifications);
          if (typeof res.data.pushNotifications === 'boolean') setPushNotif(res.data.pushNotifications);
        }
      } catch {
        // Settings endpoint may not exist yet — use defaults
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleToggleEmail = useCallback(async (v: boolean) => {
    setEmailNotif(v);
    try {
      await users.updateSettings({ emailNotifications: v });
    } catch {
      setEmailNotif(!v); // revert on error
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

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await logout();
      router.replace('/');
    } catch {
      setLogoutLoading(false);
    }
  }, [logout, router]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await users.updateMe({ deleted: true });
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
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <Text style={s.pageTitle}>Настройки</Text>

      {/* Profile */}
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

      {/* Notifications */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Уведомления</Text>
        <SectionCard>
          <ToggleRow
            label="Email-уведомления"
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

      {/* Account */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Аккаунт</Text>
        <SectionCard>
          <SettingRow label="Изменить email" icon="mail" onPress={() => {}} />
          <SettingRow label="Изменить пароль" icon="lock" onPress={() => {}} last />
        </SectionCard>
      </View>

      {/* Info */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Информация</Text>
        <SectionCard>
          <SettingRow label="Политика конфиденциальности" icon="shield" onPress={() => {}} />
          <SettingRow label="Условия использования" icon="file-text" onPress={() => {}} last />
        </SectionCard>
      </View>

      {/* Danger zone */}
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

      {/* Version */}
      <Text style={s.version}>Версия {APP_VERSION}</Text>
    </ScrollView>
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

  // Version
  version: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
