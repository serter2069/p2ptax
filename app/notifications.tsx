import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/Colors';
import { Header } from '../components/Header';
import { notifications as notificationsApi } from '../lib/api/endpoints';
import { Container, EmptyState, Heading, Screen, Text } from '../components/ui';

type NotifType = 'NEW_MESSAGE' | 'REQUEST_UPDATE' | 'REVIEW' | 'SYSTEM' | string;

interface NotifItem {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  NEW_MESSAGE: { icon: 'message-circle', color: Colors.brandPrimary },
  REQUEST_UPDATE: { icon: 'file-text', color: Colors.statusSuccess },
  REVIEW: { icon: 'star', color: Colors.amber },
  SYSTEM: { icon: 'info', color: Colors.textMuted },
};

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} дн назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}

function routeForNotif(n: NotifItem): string | null {
  const data = (n.data ?? {}) as Record<string, any>;
  if (n.type === 'NEW_MESSAGE') {
    const threadId = data.threadId ?? data.thread_id;
    if (threadId) return `/chat/${threadId}`;
    return '/(tabs)/messages';
  }
  if (n.type === 'REQUEST_UPDATE') {
    const requestId = data.requestId ?? data.request_id;
    if (requestId) return `/(dashboard)/my-requests/${requestId}`;
    return '/(tabs)/requests';
  }
  if (n.type === 'REVIEW') {
    return '/(tabs)/profile';
  }
  return null;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      setError(null);
      const res = await notificationsApi.list(1);
      const data = (res as any).data ?? res;
      const list: NotifItem[] = Array.isArray(data) ? data : (data.items ?? []);
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? 'Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchList();
  }, [fetchList]);

  const handleMarkAll = useCallback(async () => {
    if (markingAll) return;
    try {
      setMarkingAll(true);
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  }, [markingAll]);

  const handleItemPress = useCallback(async (n: NotifItem) => {
    if (!n.isRead) {
      try {
        await notificationsApi.markRead(n.id);
        setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, isRead: true } : it)));
      } catch {
        // non-blocking
      }
    }
    const target = routeForNotif(n);
    if (target) router.push(target as any);
  }, []);

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <Screen bg={Colors.white}>
      <Header variant="back" backTitle="Уведомления" onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />}
      >
        <Container>
          <View style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Heading level={2}>Уведомления</Heading>
              {unreadCount > 0 ? (
                <Pressable
                  onPress={handleMarkAll}
                  disabled={markingAll}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  {markingAll ? (
                    <ActivityIndicator size="small" color={Colors.brandPrimary} />
                  ) : (
                    <Feather name="check-circle" size={14} color={Colors.brandPrimary} />
                  )}
                  <Text variant="caption" weight="medium" style={{ color: Colors.brandPrimary }}>
                    Прочитать все
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator color={Colors.brandPrimary} />
              </View>
            ) : error ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: Spacing.md }}>
                <Feather name="alert-circle" size={28} color={Colors.statusError} />
                <Text align="center" style={{ color: Colors.statusError }}>{error}</Text>
                <Pressable onPress={fetchList}>
                  <Text weight="medium" style={{ color: Colors.brandPrimary }}>Повторить</Text>
                </Pressable>
              </View>
            ) : items.length === 0 ? (
              <EmptyState
                icon={<View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="bell-off" size={28} color={Colors.textMuted} />
                </View>}
                title="Пока тихо"
                description="Когда появятся новые сообщения или обновления по заявкам — вы увидите их здесь."
              />
            ) : (
          items.map((n) => {
            const meta = TYPE_ICON[n.type] ?? TYPE_ICON.SYSTEM;
            return (
              <Pressable
                key={n.id}
                onPress={() => handleItemPress(n)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: Spacing.md,
                  padding: Spacing.md,
                  borderRadius: BorderRadius.card,
                  borderWidth: 1,
                  borderColor: n.isRead ? Colors.border : Colors.brandPrimary,
                  backgroundColor: n.isRead ? Colors.bgCard : (Colors as any).brandPrimary + '0D',
                  ...Shadows.sm,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: (meta.color as string) + '1A',
                  }}
                >
                  <Feather name={meta.icon as any} size={16} color={meta.color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      variant="caption"
                      weight={n.isRead ? 'medium' : 'bold'}
                      numberOfLines={1}
                      style={{ flex: 1, color: Colors.textPrimary }}
                    >
                      {n.title}
                    </Text>
                    {!n.isRead ? (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandPrimary }} />
                    ) : null}
                  </View>
                  <Text
                    variant="caption"
                    numberOfLines={2}
                    style={{ color: Colors.textSecondary, lineHeight: 18 }}
                  >
                    {n.body}
                  </Text>
                  <Text variant="caption" style={{ marginTop: 2 }}>
                    {formatTimeAgo(n.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
          </View>
        </Container>
      </ScrollView>
    </Screen>
  );
}
