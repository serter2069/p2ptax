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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../stores/authStore';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { useBreakpoints } from '../../hooks/useBreakpoints';

interface MyRequest {
  id: string;
  description: string;
  city: string;
  status: string;
  createdAt: string;
  _count: { responses: number };
}

interface ThreadItem {
  id: string;
  unreadCount?: number;
}

function getDisplayName(user: { email: string; username?: string | null } | null): string {
  if (!user) return '';
  if (user.username) return user.username;
  const local = user.email.split('@')[0] ?? '';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'];
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} в ${hours}:${mins}`;
}

export default function DashboardHub() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isMobile } = useBreakpoints();
  const [requestCount, setRequestCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [threadCount, setThreadCount] = useState(0);
  const [recentRequests, setRecentRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setLoadError('');
    try {
      const [requests, threads] = await Promise.all([
        api.get<MyRequest[]>('/requests/my'),
        api.get<ThreadItem[]>('/threads').catch(() => [] as ThreadItem[]),
      ]);
      setRequestCount(requests.length);
      setActiveCount(requests.filter((r) => r.status === 'OPEN').length);
      setThreadCount(Array.isArray(threads) ? threads.length : 0);
      setRecentRequests(requests.slice(0, 3));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось загрузить данные. Проверьте соединение.';
      setLoadError(msg);
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

  const displayName = getDisplayName(user);
  const isClient = user?.role !== 'SPECIALIST';

  const statsSection = (
    <View style={styles.statsRow}>
      <TouchableOpacity
        style={styles.statCard}
        onPress={() => router.push('/(dashboard)/requests')}
        activeOpacity={0.7}
      >
        <Text style={styles.statValue}>{requestCount}</Text>
        <Text style={styles.statLabel}>Всего запросов</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.statCard}
        onPress={() => router.push('/(dashboard)/requests')}
        activeOpacity={0.7}
      >
        <Text style={styles.statValue}>{activeCount}</Text>
        <Text style={styles.statLabel}>Активных</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.statCard}
        onPress={() => router.push('/(dashboard)/messages')}
        activeOpacity={0.7}
      >
        <Text style={styles.statValue}>{threadCount}</Text>
        <Text style={styles.statLabel}>Диалогов</Text>
      </TouchableOpacity>
    </View>
  );

  const quickActions = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Быстрые действия</Text>
      <View style={styles.actionsRow}>
        {isClient ? (
          <>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(dashboard)/requests/new')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="document-text-outline" size={22} color={Colors.brandPrimary} />
              </View>
              <Text style={styles.actionLabel}>Создать запрос</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/specialists' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="search-outline" size={22} color={Colors.brandPrimary} />
              </View>
              <Text style={styles.actionLabel}>Найти специалиста</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(dashboard)/city-requests')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="location-outline" size={22} color={Colors.brandPrimary} />
              </View>
              <Text style={styles.actionLabel}>Запросы города</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(dashboard)/responses')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="checkmark-circle-outline" size={22} color={Colors.brandPrimary} />
              </View>
              <Text style={styles.actionLabel}>Мои отклики</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(dashboard)/messages')}
          activeOpacity={0.7}
        >
          <View style={styles.actionIconWrap}>
            <Ionicons name="chatbubble-outline" size={22} color={Colors.brandPrimary} />
          </View>
          <Text style={styles.actionLabel}>Мои сообщения</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const recentSection = isClient ? (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Последние запросы</Text>
      {recentRequests.length === 0 ? (
        <View style={styles.emptyRecent}>
          <Text style={styles.emptyRecentText}>Создайте первый запрос</Text>
          <Button
            onPress={() => router.push('/(dashboard)/requests/new')}
            variant="primary"
            style={styles.emptyBtn}
          >
            Создать запрос
          </Button>
        </View>
      ) : (
        recentRequests.map((req) => (
          <TouchableOpacity
            key={req.id}
            style={styles.recentCard}
            onPress={() => router.push(`/(dashboard)/requests/${req.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.recentTop}>
              <Text style={styles.recentTitle} numberOfLines={1}>
                {req.description.slice(0, 60)}
              </Text>
              <View style={[styles.recentStatus, req.status !== 'OPEN' && styles.recentStatusClosed]}>
                <Text style={[styles.recentStatusText, req.status !== 'OPEN' && styles.recentStatusTextClosed]}>
                  {req.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
                </Text>
              </View>
            </View>
            <View style={styles.recentBottom}>
              <Text style={styles.recentCity}>{req.city}</Text>
              <Text style={styles.recentDate}>{formatDate(req.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  ) : null;

  // --- Desktop/tablet ---
  if (!isMobile) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollWide}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
          }
        >
          <View style={styles.wideContainer}>
            <Text style={styles.wideGreeting}>
              {`\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C, ${displayName}`}
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color={Colors.brandPrimary} style={{ marginTop: Spacing['3xl'] }} />
            ) : loadError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{loadError}</Text>
                <TouchableOpacity onPress={() => fetchData()} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>Повторить</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {statsSection}
                {quickActions}
                {recentSection}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Mobile ---
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View style={styles.container}>
          {/* Welcome */}
          <Text style={styles.welcome}>
            {`\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C, ${displayName}`}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brandPrimary} style={{ marginTop: Spacing['3xl'] }} />
          ) : loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{loadError}</Text>
              <TouchableOpacity onPress={() => fetchData()} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Повторить</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {statsSection}
              {quickActions}
              {recentSection}

              {/* Navigation cards — mobile only */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Навигация</Text>

                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push('/(dashboard)/requests')}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardIcon}>
                    <Ionicons name="document-text-outline" size={24} color={Colors.brandPrimary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Мои запросы</Text>
                    <Text style={styles.cardSub}>
                      Всего: {requestCount} | Активных: {activeCount}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push('/(dashboard)/messages')}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardIcon}>
                    <Ionicons name="chatbubble-outline" size={24} color={Colors.brandPrimary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Мои диалоги</Text>
                    <Text style={styles.cardSub}>
                      Диалогов: {threadCount}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {user?.role === 'SPECIALIST' && (
                  <>
                    <TouchableOpacity
                      style={styles.card}
                      onPress={() => router.push('/(dashboard)/profile')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.cardIcon}>
                        <Ionicons name="person-outline" size={24} color={Colors.brandPrimary} />
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Мой профиль</Text>
                        <Text style={styles.cardSub}>Ник, города, услуги</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.card}
                      onPress={() => router.push('/(dashboard)/city-requests')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.cardIcon}>
                        <Ionicons name="map-outline" size={24} color={Colors.brandPrimary} />
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Запросы в моих городах</Text>
                        <Text style={styles.cardSub}>Найти клиентов рядом</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.card}
                      onPress={() => router.push('/(dashboard)/responses')}
                      activeOpacity={0.75}
                    >
                      <View style={styles.cardIcon}>
                        <Ionicons name="checkmark-circle-outline" size={24} color={Colors.brandPrimary} />
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Мои отклики</Text>
                        <Text style={styles.cardSub}>Запросы, на которые вы откликнулись</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push('/(dashboard)/settings')}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardIcon}>
                    <Ionicons name="settings-outline" size={24} color={Colors.brandPrimary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Настройки</Text>
                    <Text style={styles.cardSub}>Уведомления, аккаунт</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
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
    paddingVertical: Spacing['2xl'],
  },
  container: {
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  welcome: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  // Sections
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    minWidth: 100,
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  // Quick actions
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  actionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.statusBg.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  // Recent requests
  recentCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  recentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recentTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  recentStatus: {
    backgroundColor: Colors.statusBg.info,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  recentStatusClosed: {
    backgroundColor: Colors.statusBg.warning,
  },
  recentStatusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  recentStatusTextClosed: {
    color: Colors.textMuted,
  },
  recentBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentCity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  recentDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  emptyRecent: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyRecentText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  emptyBtn: {
    minWidth: 180,
  },
  // Nav cards (mobile)
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
  logoutText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusError,
    fontWeight: Typography.fontWeight.medium,
  },
  errorBox: {
    marginTop: Spacing['2xl'],
    padding: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorBoxText: {
    fontSize: Typography.fontSize.base,
    color: Colors.statusError,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
  },
  retryBtnText: {
    fontSize: Typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.semibold,
  },
  // Desktop / tablet
  scrollWide: {
    flexGrow: 1,
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['3xl'],
  },
  wideContainer: {
    gap: Spacing['2xl'],
    maxWidth: 800,
  },
  wideGreeting: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
});
