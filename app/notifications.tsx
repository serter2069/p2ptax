import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/Colors';
import { Header } from '../components/Header';
import { notifications as notificationsApi } from '../lib/api/endpoints';

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
  REVIEW: { icon: 'star', color: '#F59E0B' },
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
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <Header variant="back" backTitle="Уведомления" onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandPrimary} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary }}>
            Уведомления
          </Text>
          {unreadCount > 0 && (
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
              <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium }}>
                Прочитать все
              </Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={Colors.brandPrimary} />
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: Spacing.md }}>
            <Feather name="alert-circle" size={28} color={Colors.statusError} />
            <Text style={{ color: Colors.statusError, textAlign: 'center' }}>{error}</Text>
            <Pressable onPress={fetchList}>
              <Text style={{ color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium }}>Повторить</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: Spacing.md }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="bell-off" size={28} color={Colors.textMuted} />
            </View>
            <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary }}>
              Пока тихо
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 260 }}>
              Когда появятся новые сообщения или обновления по заявкам — вы увидите их здесь.
            </Text>
          </View>
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
                      style={{
                        flex: 1,
                        fontSize: Typography.fontSize.sm,
                        fontWeight: n.isRead ? Typography.fontWeight.medium : Typography.fontWeight.bold,
                        color: Colors.textPrimary,
                      }}
                      numberOfLines={1}
                    >
                      {n.title}
                    </Text>
                    {!n.isRead && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandPrimary }} />
                    )}
                  </View>
                  <Text
                    style={{ fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 18 }}
                    numberOfLines={2}
                  >
                    {n.body}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2 }}>
                    {formatTimeAgo(n.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
