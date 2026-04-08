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
import { useBreakpoints } from '../../hooks/useBreakpoints';

interface ResponseItem {
  id: string;
}

interface ThreadItem {
  id: string;
}

interface SpecialistProfile {
  id: string;
  displayName?: string;
}

function getDisplayName(user: { email: string; username?: string | null } | null): string {
  if (!user) return '';
  if (user.username) return user.username;
  const local = user.email.split('@')[0] ?? '';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default function SpecialistDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isMobile } = useBreakpoints();
  const [responseCount, setResponseCount] = useState(0);
  const [threadCount, setThreadCount] = useState(0);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setLoadError('');
    try {
      const [responses, threads] = await Promise.all([
        api.get<ResponseItem[]>('/requests/my-responses').catch(() => [] as ResponseItem[]),
        api.get<ThreadItem[]>('/threads').catch(() => [] as ThreadItem[]),
      ]);

      setResponseCount(Array.isArray(responses) ? responses.length : 0);
      setThreadCount(Array.isArray(threads) ? threads.length : 0);

      // Check specialist profile
      try {
        await api.get<SpecialistProfile>('/specialists/me');
        setHasProfile(true);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setHasProfile(false);
        } else {
          setHasProfile(false);
        }
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось загрузить данные. Проверьте соединение.';
      setLoadError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  // Profile status chip
  const profileChip = hasProfile !== null ? (
    <TouchableOpacity
      style={[styles.profileChip, hasProfile ? styles.profileChipFilled : styles.profileChipEmpty]}
      onPress={() => router.push('/(dashboard)/profile')}
      activeOpacity={0.7}
    >
      <Ionicons
        name={hasProfile ? 'checkmark-circle' : 'alert-circle'}
        size={16}
        color={hasProfile ? Colors.statusSuccess : Colors.statusWarning}
      />
      <Text style={[styles.profileChipText, hasProfile ? styles.profileChipTextFilled : styles.profileChipTextEmpty]}>
        {hasProfile ? 'Профиль заполнен' : 'Заполните профиль'}
      </Text>
      {!hasProfile && (
        <Ionicons name="chevron-forward" size={14} color={Colors.statusWarning} />
      )}
    </TouchableOpacity>
  ) : null;

  const statsSection = (
    <View style={styles.statsRow}>
      <TouchableOpacity
        style={styles.statCard}
        onPress={() => router.push('/(dashboard)/responses')}
        activeOpacity={0.7}
      >
        <Text style={styles.statValue}>{responseCount}</Text>
        <Text style={styles.statLabel}>Мои ответы</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.statCard}
        onPress={() => router.push('/(dashboard)/messages')}
        activeOpacity={0.7}
      >
        <Text style={styles.statValue}>{threadCount}</Text>
        <Text style={styles.statLabel}>Активные диалоги</Text>
      </TouchableOpacity>
    </View>
  );

  const quickActions = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Быстрые действия</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(dashboard)/city-requests')}
          activeOpacity={0.7}
        >
          <View style={styles.actionIconWrap}>
            <Ionicons name="search-outline" size={22} color={Colors.brandPrimary} />
          </View>
          <Text style={styles.actionLabel}>Смотреть запросы</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(dashboard)/profile')}
          activeOpacity={0.7}
        >
          <View style={styles.actionIconWrap}>
            <Ionicons name="person-outline" size={22} color={Colors.brandPrimary} />
          </View>
          <Text style={styles.actionLabel}>Мой профиль</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(dashboard)/messages')}
          activeOpacity={0.7}
        >
          <View style={styles.actionIconWrap}>
            <Ionicons name="chatbubble-outline" size={22} color={Colors.brandPrimary} />
          </View>
          <Text style={styles.actionLabel}>Мои диалоги</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const content = loading ? (
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
      {profileChip}
      {statsSection}
      {quickActions}
    </>
  );

  // Desktop/tablet
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
              {`Кабинет специалиста`}
            </Text>
            <Text style={styles.wideSubGreeting}>
              {`Добро пожаловать, ${displayName}`}
            </Text>
            {content}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Mobile
  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title="Кабинет специалиста"
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
          <Text style={styles.welcome}>
            {`Добро пожаловать, ${displayName}`}
          </Text>
          {content}
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
  // Profile chip
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  profileChipFilled: {
    backgroundColor: Colors.statusBg.success,
  },
  profileChipEmpty: {
    backgroundColor: Colors.statusBg.warning,
  },
  profileChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  profileChipTextFilled: {
    color: Colors.statusSuccess,
  },
  profileChipTextEmpty: {
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
  wideSubGreeting: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: -Spacing.lg,
  },
});
