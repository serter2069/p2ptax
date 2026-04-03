import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { api, ApiError } from '../../lib/api';
import { isAdmin } from '../../lib/adminEmails';
import { Header } from '../../components/Header';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';

const NOTIF_KEY = '@p2ptax_email_notif';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [emailNotif, setEmailNotif] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Account section */}
          <Text style={styles.sectionTitle}>Аккаунт</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {user?.email ?? '—'}
              </Text>
            </View>
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
});
