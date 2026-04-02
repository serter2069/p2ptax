import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';

interface MyRequest {
  id: string;
  status: string;
  _count: { responses: number };
}

interface ThreadItem {
  id: string;
  unreadCount?: number;
}

export default function DashboardHub() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [requestCount, setRequestCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [threadCount, setThreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [requests, threads] = await Promise.all([
        api.get<MyRequest[]>('/requests/my'),
        api.get<ThreadItem[]>('/threads').catch(() => [] as ThreadItem[]),
      ]);
      setRequestCount(requests.length);
      setActiveCount(requests.filter((r) => r.status === 'OPEN').length);
      setThreadCount(Array.isArray(threads) ? threads.length : 0);
    } catch {
      // silently fail, show 0
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Check if SPECIALIST has filled their profile; redirect to profile setup if not.
  // Only runs once on mount, not on refresh, to avoid re-redirecting after profile is saved.
  useEffect(() => {
    if (!user || user.role !== 'SPECIALIST') return;

    async function checkSpecialistProfile() {
      try {
        await api.get('/specialists/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          router.replace('/(dashboard)/profile');
        }
        // Any other error (network, 500, etc.) — silently ignore, stay on dashboard
      }
    }

    checkSpecialistProfile();
  }, [user, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleRefresh() {
    setRefreshing(true);
    fetchData(true);
  }

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title="Личный кабинет"
        rightAction={
          <TouchableOpacity onPress={handleLogout} hitSlop={12}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        <View style={styles.container}>
          {/* Welcome */}
          <Text style={styles.welcome}>
            {user?.email ?? 'Заказчик'}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={{ marginTop: Spacing['3xl'] }} />
          ) : (
            <>
              {/* Requests card */}
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/(dashboard)/requests')}
                activeOpacity={0.75}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>{'📋'}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Мои запросы</Text>
                  <Text style={styles.cardSub}>
                    Всего: {requestCount} | Активных: {activeCount}
                  </Text>
                </View>
                <Text style={styles.cardArrow}>{'>'}</Text>
              </TouchableOpacity>

              {/* Threads card */}
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/(dashboard)/messages')}
                activeOpacity={0.75}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>{'💬'}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Мои диалоги</Text>
                  <Text style={styles.cardSub}>
                    Диалогов: {threadCount}
                  </Text>
                </View>
                <Text style={styles.cardArrow}>{'>'}</Text>
              </TouchableOpacity>

              {/* Profile card — specialists only */}
              {user?.role === 'SPECIALIST' && (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push('/(dashboard)/profile')}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardIcon}>
                    <Text style={styles.cardEmoji}>{'👤'}</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Мой профиль</Text>
                    <Text style={styles.cardSub}>Ник, города, услуги</Text>
                  </View>
                  <Text style={styles.cardArrow}>{'>'}</Text>
                </TouchableOpacity>
              )}

              {/* Settings card */}
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/(dashboard)/settings')}
                activeOpacity={0.75}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>{'⚙️'}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Настройки</Text>
                  <Text style={styles.cardSub}>Уведомления, аккаунт</Text>
                </View>
                <Text style={styles.cardArrow}>{'>'}</Text>
              </TouchableOpacity>

              {/* Quick create — clients only */}
              {user?.role !== 'SPECIALIST' && (
                <Button
                  onPress={() => router.push('/(dashboard)/requests/new')}
                  variant="primary"
                  style={styles.createBtn}
                >
                  Создать запрос
                </Button>
              )}
            </>
          )}
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
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  welcome: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  cardEmoji: {
    fontSize: Typography.fontSize.title,
  },
  cardContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  cardSub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  cardArrow: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  createBtn: {
    width: '100%',
    marginTop: Spacing.md,
  },
  logoutText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    fontWeight: Typography.fontWeight.medium,
  },
});
