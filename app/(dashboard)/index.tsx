import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../stores/authStore';
import { api, ApiError } from '../../lib/api';
import { Colors } from '../../constants/Colors';
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

  // SPECIALIST home is /specialist/dashboard (UC-12); redirect there.
  useEffect(() => {
    if (!user || user.role !== 'SPECIALIST') return;
    router.replace('/specialist/dashboard');
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
    <View className="flex-row gap-3 flex-wrap">
      <Pressable
        className="bg-bgCard rounded-xl border border-border p-5 min-w-[100px] flex-1 items-center gap-1 shadow-sm"
        onPress={() => router.push('/(dashboard)/my-requests')}
      >
        {loading ? (
          <View className="w-8 h-6 rounded bg-bgSecondary" />
        ) : (
          <Text className="text-2xl font-bold text-brandPrimary">{requestCount}</Text>
        )}
        <Text className="text-xs text-textMuted text-center">Всего запросов</Text>
      </Pressable>
      <Pressable
        className="bg-bgCard rounded-xl border border-border p-5 min-w-[100px] flex-1 items-center gap-1 shadow-sm"
        onPress={() => router.push('/(dashboard)/my-requests')}
      >
        {loading ? (
          <View className="w-8 h-6 rounded bg-bgSecondary" />
        ) : (
          <Text className="text-2xl font-bold text-brandPrimary">{activeCount}</Text>
        )}
        <Text className="text-xs text-textMuted text-center">Активных</Text>
      </Pressable>
      <Pressable
        className="bg-bgCard rounded-xl border border-border p-5 min-w-[100px] flex-1 items-center gap-1 shadow-sm"
        onPress={() => router.push('/(dashboard)/messages')}
      >
        {loading ? (
          <View className="w-8 h-6 rounded bg-bgSecondary" />
        ) : (
          <Text className="text-2xl font-bold text-brandPrimary">{threadCount}</Text>
        )}
        <Text className="text-xs text-textMuted text-center">Диалогов</Text>
      </Pressable>
    </View>
  );

  const quickActions = (
    <View className="gap-3">
      <Text className="text-base font-semibold text-textPrimary">Быстрые действия</Text>
      <View className="flex-row gap-3 flex-wrap">
        {isClient ? (
          <>
            <Pressable
              className="bg-bgCard rounded-xl border border-border p-4 flex-1 min-w-[100px] items-center gap-2 shadow-sm"
              onPress={() => router.push('/(dashboard)/my-requests/new')}
            >
              <View className="w-11 h-11 rounded-full bg-bgSecondary items-center justify-center">
                <Feather name="file-text" size={22} color={Colors.brandPrimary} />
              </View>
              <Text className="text-sm font-medium text-textPrimary text-center">Создать запрос</Text>
            </Pressable>
            <Pressable
              className="bg-bgCard rounded-xl border border-border p-4 flex-1 min-w-[100px] items-center gap-2 shadow-sm"
              onPress={() => router.push('/specialists' as any)}
            >
              <View className="w-11 h-11 rounded-full bg-bgSecondary items-center justify-center">
                <Feather name="search" size={22} color={Colors.brandPrimary} />
              </View>
              <Text className="text-sm font-medium text-textPrimary text-center">Найти специалиста</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              className="bg-bgCard rounded-xl border border-border p-4 flex-1 min-w-[100px] items-center gap-2 shadow-sm"
              onPress={() => router.push('/(dashboard)/city-requests')}
            >
              <View className="w-11 h-11 rounded-full bg-bgSecondary items-center justify-center">
                <Feather name="map-pin" size={22} color={Colors.brandPrimary} />
              </View>
              <Text className="text-sm font-medium text-textPrimary text-center">Запросы города</Text>
            </Pressable>
            <Pressable
              className="bg-bgCard rounded-xl border border-border p-4 flex-1 min-w-[100px] items-center gap-2 shadow-sm"
              onPress={() => router.push('/(dashboard)/responses')}
            >
              <View className="w-11 h-11 rounded-full bg-bgSecondary items-center justify-center">
                <Feather name="check-circle" size={22} color={Colors.brandPrimary} />
              </View>
              <Text className="text-sm font-medium text-textPrimary text-center">Мои отклики</Text>
            </Pressable>
          </>
        )}
        <Pressable
          className="bg-bgCard rounded-xl border border-border p-4 flex-1 min-w-[100px] items-center gap-2 shadow-sm"
          onPress={() => router.push('/(dashboard)/messages')}
        >
          <View className="w-11 h-11 rounded-full bg-bgSecondary items-center justify-center">
            <Feather name="message-circle" size={22} color={Colors.brandPrimary} />
          </View>
          <Text className="text-sm font-medium text-textPrimary text-center">Мои сообщения</Text>
        </Pressable>
      </View>
    </View>
  );

  const welcomeSection = isClient && recentRequests.length === 0 && !loading && !loadError ? (
    <View className="bg-bgCard rounded-xl border border-border p-6 gap-4 shadow-sm">
      <Text className="text-xl font-bold text-textPrimary">Добро пожаловать!</Text>
      <Text className="text-base text-textSecondary -mt-2">Вот как это работает:</Text>

      <View className="gap-4">
        <View className="flex-row items-start gap-3">
          <View className="w-7 h-7 rounded-full bg-brandPrimary items-center justify-center shrink-0 mt-0.5">
            <Text className="text-sm font-bold text-white">1</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-semibold text-textPrimary">Опишите проблему</Text>
            <Text className="text-sm text-textSecondary leading-5">Расскажите о своей налоговой ситуации</Text>
          </View>
        </View>

        <View className="flex-row items-start gap-3">
          <View className="w-7 h-7 rounded-full bg-brandPrimary items-center justify-center shrink-0 mt-0.5">
            <Text className="text-sm font-bold text-white">2</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-semibold text-textPrimary">Получите ответы</Text>
            <Text className="text-sm text-textSecondary leading-5">Специалисты из вашего города предложат решения</Text>
          </View>
        </View>

        <View className="flex-row items-start gap-3">
          <View className="w-7 h-7 rounded-full bg-brandPrimary items-center justify-center shrink-0 mt-0.5">
            <Text className="text-sm font-bold text-white">3</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-semibold text-textPrimary">Выберите подходящего</Text>
            <Text className="text-sm text-textSecondary leading-5">Сравните и выберите специалиста</Text>
          </View>
        </View>
      </View>

      <Button
        onPress={() => router.push('/(dashboard)/my-requests/new')}
        variant="primary"
        style={{ width: '100%', marginTop: 8 }}
      >
        Создать первый запрос
      </Button>
    </View>
  ) : null;

  const recentSection = isClient ? (
    <View className="gap-3">
      <Text className="text-base font-semibold text-textPrimary">Последние запросы</Text>
      {recentRequests.length === 0 ? (
        <View className="bg-bgCard rounded-lg border border-border p-6 items-center gap-3">
          <Text className="text-base text-textMuted">Создайте первый запрос</Text>
          <Button
            onPress={() => router.push('/(dashboard)/my-requests/new')}
            variant="primary"
            style={{ minWidth: 180 }}
          >
            Создать запрос
          </Button>
        </View>
      ) : (
        recentRequests.map((req) => (
          <Pressable
            key={req.id}
            className="bg-bgCard rounded-lg border border-border p-4 gap-2"
            onPress={() => router.push(`/(dashboard)/my-requests/${req.id}`)}
          >
            <View className="flex-row justify-between items-center gap-2">
              <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={1}>
                {req.description.slice(0, 60)}
              </Text>
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: req.status === 'OPEN' ? Colors.bgSecondary : '#FEF3C7' }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: req.status === 'OPEN' ? Colors.brandPrimary : Colors.textMuted }}
                >
                  {req.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-textSecondary">{req.city}</Text>
              <Text className="text-xs text-textMuted">{formatDate(req.createdAt)}</Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  ) : null;

  // --- Desktop/tablet ---
  if (!isMobile) {
    return (
      <View className="flex-1 bg-bgPrimary">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 32, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
          }
        >
          <View className="gap-6 max-w-[800px]">
            <Text className="text-2xl font-bold text-textPrimary">
              {`Добро пожаловать, ${displayName}`}
            </Text>

            {loadError ? (
              <View className="mt-6 p-5 bg-bgCard rounded-lg border border-border items-center gap-3">
                <Text className="text-base text-statusError text-center">{loadError}</Text>
                <Pressable
                  className="py-2 px-5 rounded-lg"
                  style={{ backgroundColor: Colors.brandPrimary }}
                  onPress={() => fetchData()}
                >
                  <Text className="text-sm text-white font-semibold">Повторить</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {statsSection}
                {!loading && quickActions}
                {!loading && welcomeSection}
                {!loading && recentSection}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- Mobile ---
  return (
    <View className="flex-1 bg-bgPrimary">
      <Header
        title="Личный кабинет"
        rightAction={
          <Pressable onPress={handleLogout} hitSlop={12}>
            <Text className="text-sm font-medium" style={{ color: Colors.statusError }}>Выйти</Text>
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <View className="w-full max-w-[430px] px-5 gap-4">
          {/* Welcome */}
          <Text className="text-lg font-bold text-textPrimary">
            {`Добро пожаловать, ${displayName}`}
          </Text>

          {loadError ? (
            <View className="mt-6 p-5 bg-bgCard rounded-lg border border-border items-center gap-3">
              <Text className="text-base text-statusError text-center">{loadError}</Text>
              <Pressable
                className="py-2 px-5 rounded-lg"
                style={{ backgroundColor: Colors.brandPrimary }}
                onPress={() => fetchData()}
              >
                <Text className="text-sm text-white font-semibold">Повторить</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {statsSection}
              {!loading && quickActions}
              {!loading && recentSection}

              {/* Navigation cards — mobile only */}
              <View className="gap-3">
                <Text className="text-base font-semibold text-textPrimary">Навигация</Text>

                <Pressable
                  className="flex-row items-center bg-bgCard rounded-xl p-5 border border-border shadow-md"
                  onPress={() => router.push('/(dashboard)/my-requests')}
                >
                  <View className="w-12 h-12 rounded-lg bg-bgSecondary items-center justify-center mr-4">
                    <Feather name="file-text" size={24} color={Colors.brandPrimary} />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-base font-semibold text-textPrimary">Мои запросы</Text>
                    <Text className="text-sm text-textMuted">
                      Всего: {requestCount} | Активных: {activeCount}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.textMuted} />
                </Pressable>

                <Pressable
                  className="flex-row items-center bg-bgCard rounded-xl p-5 border border-border shadow-md"
                  onPress={() => router.push('/(dashboard)/messages')}
                >
                  <View className="w-12 h-12 rounded-lg bg-bgSecondary items-center justify-center mr-4">
                    <Feather name="message-circle" size={24} color={Colors.brandPrimary} />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-base font-semibold text-textPrimary">Мои диалоги</Text>
                    <Text className="text-sm text-textMuted">
                      Диалогов: {threadCount}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.textMuted} />
                </Pressable>

                {user?.role === 'SPECIALIST' && (
                  <>
                    <Pressable
                      className="flex-row items-center bg-bgCard rounded-xl p-5 border border-border shadow-md"
                      onPress={() => router.push('/(dashboard)/profile')}
                    >
                      <View className="w-12 h-12 rounded-lg bg-bgSecondary items-center justify-center mr-4">
                        <Feather name="user" size={24} color={Colors.brandPrimary} />
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-base font-semibold text-textPrimary">Мой профиль</Text>
                        <Text className="text-sm text-textMuted">Ник, города, услуги</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={Colors.textMuted} />
                    </Pressable>

                    <Pressable
                      className="flex-row items-center bg-bgCard rounded-xl p-5 border border-border shadow-md"
                      onPress={() => router.push('/(dashboard)/city-requests')}
                    >
                      <View className="w-12 h-12 rounded-lg bg-bgSecondary items-center justify-center mr-4">
                        <Feather name="map" size={24} color={Colors.brandPrimary} />
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-base font-semibold text-textPrimary">Запросы в моих городах</Text>
                        <Text className="text-sm text-textMuted">Найти клиентов рядом</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={Colors.textMuted} />
                    </Pressable>

                    <Pressable
                      className="flex-row items-center bg-bgCard rounded-xl p-5 border border-border shadow-md"
                      onPress={() => router.push('/(dashboard)/responses')}
                    >
                      <View className="w-12 h-12 rounded-lg bg-bgSecondary items-center justify-center mr-4">
                        <Feather name="check-circle" size={24} color={Colors.brandPrimary} />
                      </View>
                      <View className="flex-1 gap-1">
                        <Text className="text-base font-semibold text-textPrimary">Мои отклики</Text>
                        <Text className="text-sm text-textMuted">Запросы, на которые вы откликнулись</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={Colors.textMuted} />
                    </Pressable>
                  </>
                )}

                <Pressable
                  className="flex-row items-center bg-bgCard rounded-xl p-5 border border-border shadow-md"
                  onPress={() => router.push('/(dashboard)/settings')}
                >
                  <View className="w-12 h-12 rounded-lg bg-bgSecondary items-center justify-center mr-4">
                    <Feather name="settings" size={24} color={Colors.brandPrimary} />
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-base font-semibold text-textPrimary">Настройки</Text>
                    <Text className="text-sm text-textMuted">Уведомления, аккаунт</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
