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
import { useBreakpoints } from '../../hooks/useBreakpoints';

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
  const { isMobile } = useBreakpoints();
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
  useEffect(() => {
    if (!user || user.role !== 'SPECIALIST') return;

    async function checkSpecialistProfile() {
      try {
        await api.get('/specialists/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          router.replace('/(dashboard)/specialist-profile');
        }
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

  // --- Desktop/tablet: welcome + stats view (sidebar handles navigation) ---
  if (!isMobile) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollWide}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.brandPrimary}
            />
          }
        >
          <View style={styles.wideContainer}>
            <Text style={styles.wideGreeting}>
              Добро пожаловать,
            </Text>
            <Text style={styles.wideEmail}>
              {user?.email ?? ''}
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color={Colors.brandPrimary} style={{ marginTop: Spacing['3xl'] }} />
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{requestCount}</Text>
                  <Text style={styles.statLabel}>Всего запросов</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{activeCount}</Text>
                  <Text style={styles.statLabel}>Активных запросов</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{threadCount}</Text>
                  <Text style={styles.statLabel}>Диалогов</Text>
                </View>
              </View>
            )}

            {!loading && user?.role !== 'SPECIALIST' && (
              <Button
                onPress={() => router.push('/(dashboard)/requests/new')}
                variant="primary"
                style={styles.wideCreateBtn}
              >
                Создать запрос
              </Button>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Mobile: original hub navigation cards ---
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
  // Mobile
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
  // Desktop / tablet
  scrollWide: {
    flexGrow: 1,
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['3xl'],
  },
  wideContainer: {
    gap: Spacing['2xl'],
  },
  wideGreeting: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  wideEmail: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginTop: -Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing['2xl'],
    minWidth: 160,
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  statValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  wideCreateBtn: {
    alignSelf: 'flex-start',
    minWidth: 200,
  },
});
