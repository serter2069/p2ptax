import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Switch, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/Colors';
import { useAuth } from '../../lib/auth/AuthContext';
import { users } from '../../lib/api/endpoints';
import {
  Button,
  Card,
  Container,
  Heading,
  Screen,
  Text,
} from '../../components/ui';

function SettingRow({ label, value, danger, icon, onPress }: { label: string; value?: string; danger?: boolean; icon?: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.bgSecondary,
      }}
    >
      {icon && <Feather name={icon as any} size={18} color={danger ? Colors.statusError : Colors.textMuted} />}
      <Text
        variant="caption"
        style={{ flex: 1, color: danger ? Colors.statusError : Colors.textPrimary }}
      >
        {label}
      </Text>
      {value && <Text variant="caption" style={{ marginRight: Spacing.sm }}>{value}</Text>}
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

function ToggleRow({ label, icon, enabled, onToggle, saving }: { label: string; icon: string; enabled: boolean; onToggle: (next: boolean) => void; saving?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.bgSecondary,
      }}
    >
      <Feather name={icon as any} size={18} color={Colors.textMuted} />
      <Text variant="caption" style={{ flex: 1, color: Colors.textPrimary }}>{label}</Text>
      {saving && <ActivityIndicator size="small" color={Colors.textMuted} style={{ marginRight: Spacing.sm }} />}
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: Colors.borderLight, true: Colors.brandPrimary }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      variant="caption"
      weight="semibold"
      style={{ color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}
    >
      {children}
    </Text>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [emailNotif, setEmailNotif] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    users.getMe()
      .then((res: any) => {
        const me = res.data as { notifyNewMessages?: boolean };
        if (typeof me?.notifyNewMessages === 'boolean') setEmailNotif(me.notifyNewMessages);
      })
      .catch(() => { /* default stays true */ })
      .finally(() => setLoading(false));
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleEmailToggle = (next: boolean) => {
    setEmailNotif(next);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    saveTimerRef.current = setTimeout(() => {
      users.updateSettings({ notifyNewMessages: next })
        .catch(() => setEmailNotif(!next))
        .finally(() => setSaving(false));
    }, 400);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace('/(auth)/email');
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.lg }}>
        <Container>
          <View style={{ gap: Spacing.lg }}>
            <Heading level={3}>Настройки</Heading>

            <View style={{ gap: Spacing.sm }}>
              <SectionLabel>Уведомления</SectionLabel>
              <Card padding="sm" variant="outlined" style={{ padding: 0, overflow: 'hidden' }}>
                <ToggleRow
                  label="Email-уведомления"
                  icon="mail"
                  enabled={emailNotif}
                  onToggle={handleEmailToggle}
                  saving={saving}
                />
              </Card>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <SectionLabel>Аккаунт</SectionLabel>
              <Card padding="sm" variant="outlined" style={{ padding: 0, overflow: 'hidden' }}>
                <SettingRow label="Email" value={user?.email ?? '—'} icon="mail" />
              </Card>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <SectionLabel>Информация</SectionLabel>
              <Card padding="sm" variant="outlined" style={{ padding: 0, overflow: 'hidden' }}>
                <SettingRow label="Политика конфиденциальности" icon="shield" onPress={() => router.push('/terms' as any)} />
                <SettingRow label="Условия использования" icon="file-text" onPress={() => router.push('/terms' as any)} />
                <SettingRow label="Версия" value="1.0.0" icon="info" />
              </Card>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <Pressable
                onPress={() => setShowLogout(!showLogout)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.sm,
                  height: 48,
                  backgroundColor: Colors.statusBg.error,
                  borderRadius: BorderRadius.btn,
                }}
              >
                <Feather name="log-out" size={18} color={Colors.statusError} />
                <Text variant="caption" weight="semibold" style={{ color: Colors.statusError }}>Выйти из аккаунта</Text>
              </Pressable>
              {showLogout && (
                <Card variant="outlined" style={{ borderColor: Colors.statusBg.error }}>
                  <View style={{ gap: Spacing.md }}>
                    <Text variant="caption" align="center" style={{ color: Colors.textSecondary }}>
                      Вы уверены, что хотите выйти?
                    </Text>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Button variant="secondary" onPress={() => setShowLogout(false)} fullWidth>Отмена</Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button variant="danger" onPress={handleLogout} fullWidth>Выйти</Button>
                      </View>
                    </View>
                  </View>
                </Card>
              )}

              <Pressable
                onPress={() => setShowDelete(!showDelete)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.sm,
                  height: 48,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: Colors.statusBg.error,
                  borderRadius: BorderRadius.btn,
                }}
              >
                <Feather name="trash-2" size={18} color={Colors.statusError} />
                <Text variant="caption" weight="semibold" style={{ color: Colors.statusError }}>Удалить аккаунт</Text>
              </Pressable>
              {showDelete && (
                <Card variant="outlined" style={{ borderColor: Colors.statusBg.error }}>
                  <View style={{ gap: Spacing.md }}>
                    <Text variant="caption" align="center" style={{ color: Colors.textSecondary }}>
                      Это действие необратимо. Все данные будут удалены.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Button variant="secondary" onPress={() => setShowDelete(false)} fullWidth>Отмена</Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button variant="danger" onPress={() => { /* TODO: implement delete */ }} fullWidth>Удалить</Button>
                      </View>
                    </View>
                  </View>
                </Card>
              )}
            </View>
          </View>
        </Container>
      </ScrollView>
    </Screen>
  );
}
