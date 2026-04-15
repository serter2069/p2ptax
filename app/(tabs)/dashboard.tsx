import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { dashboard, requests, threads } from '../../lib/api/endpoints';
import { Colors } from '../../constants/Colors';
import { useUnreadNotifications } from '../../lib/hooks/useUnreadNotifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DashboardStats {
  totalRequests: number;
  maxRequests: number;
  activeRequests: number;
  totalResponses: number;
  acceptedResponses: number;
  completedRequests?: number;
}

interface RequestItem {
  id: string;
  title: string;
  city: string;
  status: string;
  service?: string;
  fnsName?: string;
  createdAt: string;
  _count?: { responses: number; messages?: number };
}

interface ThreadItem {
  id: string;
  participant1: { id: string; name: string };
  participant2: { id: string; name: string };
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
    readAt: string | null;
  } | null;
  createdAt: string;
}

interface StatusChangeItem {
  requestId: string;
  requestTitle: string;
  newStatus: 'COMPLETED' | 'CANCELLED';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Новая', color: Colors.brandPrimary },
  CLOSING_SOON: { label: 'В работе', color: Colors.statusWarning },
  CLOSED: { label: 'Закрыта', color: Colors.statusNeutral },
  CANCELLED: { label: 'Отменена', color: Colors.statusError },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'сейчас';
  if (diffMin < 60) return `${diffMin} мин`;
  if (diffMin < 1440) {
    const hours = Math.floor(diffMin / 60);
    return `${hours} ч`;
  }
  if (diffMin < 2880) return 'вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View className="flex-1 items-center gap-0.5 rounded-xl border border-borderLight bg-white p-3">
      <Text className="text-2xl font-bold" style={{ color }}>
        {value}
      </Text>
      <Text className="text-xs text-textMuted">{label}</Text>
    </View>
  );
}

function QuickActions() {
  return (
    <View className="flex-row gap-2">
      <Pressable
        className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brandPrimary"
        onPress={() => router.push('/(dashboard)/my-requests/new')}
      >
        <Feather name="plus" size={16} color={Colors.white} />
        <Text className="text-sm font-semibold text-white">Новая заявка</Text>
      </Pressable>
      <Pressable
        className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-borderLight bg-white"
        onPress={() => router.navigate('/(tabs)/requests')}
      >
        <Feather name="list" size={16} color={Colors.brandPrimary} />
        <Text className="text-sm font-medium text-brandPrimary">Мои заявки</Text>
      </Pressable>
      <Pressable
        className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-borderLight bg-white"
        onPress={() => router.navigate('/(tabs)/messages')}
      >
        <Feather name="message-circle" size={16} color={Colors.brandPrimary} />
        <Text className="text-sm font-medium text-brandPrimary">Сообщения</Text>
      </Pressable>
    </View>
  );
}

function RequestRow({
  item,
  onPress,
}: {
  item: RequestItem;
  onPress: () => void;
}) {
  const cfg = STATUS_MAP[item.status] ?? STATUS_MAP.OPEN;
  const responseCount = item._count?.responses ?? 0;
  const statusText = responseCount > 0 && item.status === 'OPEN'
    ? `${responseCount} отклика`
    : cfg.label;

  return (
    <Pressable
      className="flex-row items-center justify-between rounded-xl border border-borderLight bg-white p-3"
      onPress={onPress}
    >
      <View className="mr-2 flex-1">
        <Text className="text-sm font-medium text-textPrimary" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="mt-0.5 text-xs text-textMuted">{formatDate(item.createdAt)}</Text>
      </View>
      <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: cfg.color + '20' }}>
        <Text className="text-xs font-semibold" style={{ color: cfg.color }}>
          {statusText}
        </Text>
      </View>
    </Pressable>
  );
}

function MessagePreview({
  initials,
  name,
  snippet,
  time,
  unread,
  onPress,
}: {
  initials: string;
  name: string;
  snippet: string;
  time: string;
  unread?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3"
      onPress={onPress}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
        <Text className="text-sm font-bold text-brandPrimary">{initials}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-sm ${unread ? 'font-bold text-textPrimary' : 'font-medium text-textPrimary'}`}
          >
            {name}
          </Text>
          <Text className="text-xs text-textMuted">{time}</Text>
        </View>
        <Text
          className={`text-xs ${unread ? 'font-medium text-textSecondary' : 'text-textMuted'}`}
          numberOfLines={1}
        >
          {snippet}
        </Text>
      </View>
      {unread && <View className="h-2.5 w-2.5 rounded-full bg-brandPrimary" />}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function LoadingDashboard() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 24 }}>
      {/* Greeting skeleton */}
      <View className="gap-2">
        <View className="h-6 w-3/5 rounded-md bg-bgSurface" />
        <View className="h-4 w-2/5 rounded-md bg-bgSurface" />
      </View>

      {/* Stats skeleton */}
      <View className="flex-row gap-2">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-1 items-center gap-1 rounded-xl border border-borderLight p-3">
            <View className="h-7 w-10 rounded bg-bgSurface" />
            <View className="h-3 w-12 rounded bg-bgSurface" />
          </View>
        ))}
      </View>

      {/* Actions skeleton */}
      <View className="h-10 w-full rounded-xl bg-bgSurface" />

      {/* Request cards skeleton */}
      <View className="gap-3">
        <View className="h-5 w-2/5 rounded bg-bgSurface" />
        {[1, 2].map((i) => (
          <View key={i} className="gap-2 rounded-xl border border-borderLight p-4">
            <View className="h-4 w-4/5 rounded bg-bgSurface" />
            <View className="h-3 w-3/5 rounded bg-bgSurface" />
            <View className="h-3 w-2/5 rounded bg-bgSurface" />
          </View>
        ))}
      </View>

      <View className="items-center pt-2">
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyDashboard({ userName }: { userName: string }) {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xl font-bold text-textPrimary">
          {getGreeting()}{userName ? `, ${userName}` : ''}!
        </Text>
        <Text className="text-sm text-textMuted">Добро пожаловать в Налоговик</Text>
      </View>

      <View className="items-center gap-3 py-10">
        <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-borderLight bg-bgSurface">
          <Feather name="file-text" size={36} color={Colors.brandPrimary} />
        </View>
        <Text className="text-lg font-semibold text-textPrimary">Пока нет заявок</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">
          Создайте первую заявку, чтобы найти налогового специалиста для решения вашей задачи
        </Text>
        <Pressable
          className="mt-2 h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary"
          onPress={() => router.push('/(dashboard)/my-requests/new')}
        >
          <Feather name="plus" size={18} color={Colors.white} />
          <Text className="text-base font-semibold text-white">Создать первую заявку</Text>
        </Pressable>
      </View>

      {/* How it works */}
      <View className="gap-3">
        <Text className="text-base font-semibold text-textPrimary">Как это работает</Text>
        {[
          { num: '1', title: 'Опишите задачу', desc: 'Укажите тип услуги, город и ФНС' },
          { num: '2', title: 'Получите сообщения', desc: 'Специалисты напишут вам в чат' },
          { num: '3', title: 'Выберите лучшего', desc: 'Общайтесь, сравните и договоритесь' },
        ].map((h) => (
          <View
            key={h.num}
            className="flex-row items-start gap-3 rounded-xl border border-borderLight bg-white p-3"
          >
            <View className="h-7 w-7 items-center justify-center rounded-full bg-brandPrimary">
              <Text className="text-sm font-bold text-white">{h.num}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-textPrimary">{h.title}</Text>
              <Text className="text-xs text-textMuted">{h.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function DashboardTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<RequestItem[]>([]);
  const [recentThreads, setRecentThreads] = useState<ThreadItem[]>([]);
  const [dismissedStatusChanges, setDismissedStatusChanges] = useState<string[]>([]);
  const { unreadCount: notifUnreadCount } = useUnreadNotifications();

  const fetchData = useCallback(async () => {
    try {
      setError(false);
      const [statsRes, requestsRes, threadsRes] = await Promise.all([
        dashboard.getStats().catch(() => null),
        requests.getMyRequests().catch(() => null),
        threads.getThreads().catch(() => null),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (requestsRes?.data) {
        setRecentRequests((requestsRes.data as RequestItem[]).slice(0, 3));
      }
      if (threadsRes?.data) {
        setRecentThreads((threadsRes.data as ThreadItem[]).slice(0, 3));
      }

      // If all three failed, show error state
      if (!statsRes?.data && !requestsRes?.data && !threadsRes?.data) {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const unreadCount = recentThreads.filter(
    (t) =>
      t.lastMessage &&
      t.lastMessage.senderId !== user?.userId &&
      !t.lastMessage.readAt,
  ).length;

  const userName = user?.username || user?.email?.split('@')[0] || '';

  // Loading state
  if (loading) return <LoadingDashboard />;

  // Empty state — no requests at all
  const isEmpty = recentRequests.length === 0 && recentThreads.length === 0;
  if (isEmpty && !error) return <EmptyDashboard userName={userName} />;

  // Error state
  if (error && recentRequests.length === 0) {
    return (
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 16, gap: 16, flex: 1, justifyContent: 'center', alignItems: 'center' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brandPrimary} />
        }
      >
        <Feather name="wifi-off" size={48} color={Colors.textMuted} />
        <Text className="text-lg font-semibold text-textPrimary">Ошибка загрузки</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">
          Не удалось загрузить данные. Потяните вниз, чтобы попробовать снова.
        </Text>
      </ScrollView>
    );
  }

  // Populated state (default / unread / status change)
  const hasUnread = unreadCount > 0;

  // Status change notifications (from recently completed/cancelled requests)
  const completedRequests = recentRequests.filter(
    (r) => r.status === 'CLOSED' || r.status === 'CANCELLED',
  );
  const statusChanges: StatusChangeItem[] = completedRequests
    .filter((r) => !dismissedStatusChanges.includes(r.id))
    .map((r) => ({
      requestId: r.id,
      requestTitle: r.title,
      newStatus: r.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
    }));

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brandPrimary} />
      }
    >
      {/* Greeting — proto: just title, bell icon in circle */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">
            {getGreeting()}{userName ? `, ${userName}` : ''}!
          </Text>
          <Text className="text-sm text-textMuted">
            {hasUnread
              ? `У вас ${unreadCount} непрочитанных сообщения`
              : 'Ваши заявки и сообщения'}
          </Text>
        </View>
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full bg-bgSurface"
          onPress={() => router.push('/notifications')}
        >
          <Feather name="bell" size={20} color={Colors.textPrimary} />
          {notifUnreadCount > 0 && (
            <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-statusError" />
          )}
        </Pressable>
      </View>

      {/* Status change notification banner (proto: STATUS_CHANGE state) */}
      {statusChanges.map((sc) => (
        <View key={sc.requestId} className="gap-2 rounded-xl border border-borderLight bg-bgSurface p-4">
          <View className="flex-row items-center gap-2">
            <View
              className="h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: (sc.newStatus === 'COMPLETED' ? Colors.statusSuccess : Colors.statusError) + '18' }}
            >
              <Feather
                name={sc.newStatus === 'COMPLETED' ? 'check-circle' : 'x-circle'}
                size={18}
                color={sc.newStatus === 'COMPLETED' ? Colors.statusSuccess : Colors.statusError}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-textPrimary">
                {sc.newStatus === 'COMPLETED' ? 'Заявка завершена' : 'Заявка отменена'}
              </Text>
              <Text className="text-xs text-textMuted" numberOfLines={1}>{sc.requestTitle}</Text>
            </View>
            <Pressable onPress={() => setDismissedStatusChanges((prev) => [...prev, sc.requestId])}>
              <Feather name="x" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
          {sc.newStatus === 'COMPLETED' && (
            <Pressable
              className="h-9 flex-row items-center justify-center gap-1.5 rounded-lg border border-borderLight bg-white"
              onPress={() => router.push(`/(dashboard)/my-requests/${sc.requestId}`)}
            >
              <Feather name="star" size={14} color={Colors.statusWarning} />
              <Text className="text-sm font-medium text-textPrimary">Оставить отзыв</Text>
            </Pressable>
          )}
        </View>
      ))}

      {/* Stats — separate visual for unread (proto: UNREAD_MESSAGES state) */}
      <View className="flex-row gap-2">
        <StatCard
          label="Активные"
          value={stats?.activeRequests ?? 0}
          color={Colors.brandPrimary}
        />
        <StatCard
          label="Отклики"
          value={stats?.totalResponses ?? 0}
          color={Colors.statusSuccess}
        />
        <StatCard
          label="Завершены"
          value={stats?.completedRequests ?? 0}
          color={Colors.textMuted}
        />
      </View>

      {/* Quick actions */}
      <QuickActions />

      {/* Unread messages banner (proto: UNREAD_MESSAGES state) */}
      {hasUnread && (
        <Pressable
          className="flex-row items-center gap-3 rounded-xl bg-bgSurface p-4"
          onPress={() => router.navigate('/(tabs)/messages')}
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brandPrimary">
            <Feather name="message-circle" size={20} color={Colors.white} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-textPrimary">
              {unreadCount} новых сообщения
            </Text>
            <Text className="text-xs text-textMuted">
              Специалисты ответили на ваши заявки
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.textMuted} />
        </Pressable>
      )}

      {/* Active requests */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Активные заявки</Text>
          {recentRequests.length > 0 && (
            <Pressable onPress={() => router.navigate('/(tabs)/requests')}>
              <Text className="text-sm font-medium text-brandPrimary">Все заявки</Text>
            </Pressable>
          )}
        </View>
        {recentRequests.length > 0 ? (
          recentRequests.map((req) => (
            <RequestRow
              key={req.id}
              item={req}
              onPress={() => router.push(`/(dashboard)/my-requests/${req.id}`)}
            />
          ))
        ) : (
          <View className="items-center gap-2 py-6">
            <Feather name="file-text" size={24} color={Colors.textMuted} />
            <Text className="text-sm text-textMuted">Нет активных заявок</Text>
          </View>
        )}
      </View>

      {/* Recent messages */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Новые сообщения</Text>
          {recentThreads.length > 0 && (
            <Pressable onPress={() => router.navigate('/(tabs)/messages')}>
              <Text className="text-sm font-medium text-brandPrimary">Все сообщения</Text>
            </Pressable>
          )}
        </View>
        {recentThreads.length > 0 ? (
          recentThreads.map((thread) => {
            const other =
              thread.participant1.id === user?.userId
                ? thread.participant2
                : thread.participant1;
            const isUnread =
              thread.lastMessage &&
              thread.lastMessage.senderId !== user?.userId &&
              !thread.lastMessage.readAt;

            return (
              <MessagePreview
                key={thread.id}
                initials={getInitials(other.name)}
                name={other.name}
                snippet={thread.lastMessage?.content ?? 'Нет сообщений'}
                time={
                  thread.lastMessage
                    ? formatMessageTime(thread.lastMessage.createdAt)
                    : ''
                }
                unread={!!isUnread}
                onPress={() => router.push(`/chat/${thread.id}`)}
              />
            );
          })
        ) : (
          <View className="items-center gap-2 py-6">
            <Feather name="message-circle" size={24} color={Colors.textMuted} />
            <Text className="text-sm text-textMuted">Нет сообщений</Text>
          </View>
        )}
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}
