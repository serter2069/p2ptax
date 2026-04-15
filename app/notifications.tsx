import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { notifications as notifApi } from '../lib/api/endpoints';
import { Colors } from '../constants/Colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Notification {
  id: string;
  type: 'NEW_MESSAGE' | 'NEW_RESPONSE' | 'REQUEST_UPDATE' | 'REVIEW' | 'SYSTEM';
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TYPE_ICONS: Record<Notification['type'], React.ComponentProps<typeof Feather>['name']> = {
  NEW_MESSAGE: 'message-circle',
  NEW_RESPONSE: 'user-check',
  REQUEST_UPDATE: 'file-text',
  REVIEW: 'star',
  SYSTEM: 'bell',
};

const TYPE_COLORS: Record<Notification['type'], string> = {
  NEW_MESSAGE: Colors.brandPrimary,
  NEW_RESPONSE: Colors.statusSuccess,
  REQUEST_UPDATE: Colors.statusWarning,
  REVIEW: '#F59E0B',
  SYSTEM: Colors.textMuted,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Только что';
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function groupKey(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - itemDay.getTime();
  if (diff === 0) return 'Сегодня';
  if (diff <= 86400000) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// ---------------------------------------------------------------------------
// Notification Item
// ---------------------------------------------------------------------------
function NotificationItem({
  item,
  onPress,
}: {
  item: Notification;
  onPress: () => void;
}) {
  const iconName = TYPE_ICONS[item.type] || 'bell';
  const iconColor = TYPE_COLORS[item.type] || Colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 py-3 border-b border-borderLight ${!item.isRead ? 'bg-bgSecondary -mx-4 px-4 rounded-lg' : ''}`}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: iconColor + '18' }}
      >
        <Feather name={iconName} size={18} color={iconColor} />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row justify-between items-center">
          <Text
            className={`text-base flex-1 mr-2 text-textPrimary ${!item.isRead ? 'font-bold' : 'font-medium'}`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-xs text-textMuted">{formatDate(item.createdAt)}</Text>
        </View>
        <Text className="text-sm text-textSecondary leading-5" numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.isRead && (
        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: Colors.brandPrimary }} />
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = useCallback(async (p = 1, append = false) => {
    try {
      const res = await notifApi.list(p);
      const data = res.data as { items: Notification[]; total: number };
      if (append) {
        setItems((prev) => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setTotal(data.total);
      setPage(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications(1);
    }, [fetchNotifications]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(1);
  }, [fetchNotifications]);

  const onEndReached = useCallback(() => {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    fetchNotifications(page + 1, true);
  }, [loadingMore, items.length, total, page, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    try {
      await notifApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  }, []);

  const handlePress = useCallback(
    async (item: Notification) => {
      if (!item.isRead) {
        notifApi.markRead(item.id).catch(() => {});
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
      }
      const data = item.data || {};
      if (item.type === 'NEW_MESSAGE' && data.threadId) {
        router.push(`/chat/${data.threadId}`);
      } else if (
        (item.type === 'NEW_RESPONSE' || item.type === 'REQUEST_UPDATE') &&
        data.requestId
      ) {
        router.push(`/(dashboard)/my-requests/${data.requestId}`);
      } else if (item.type === 'REVIEW') {
        router.push('/(tabs)/dashboard');
      }
    },
    [router],
  );

  // Group items by date
  const sections: { title: string; data: Notification[] }[] = [];
  let currentGroup = '';
  for (const item of items) {
    const g = groupKey(item.createdAt);
    if (g !== currentGroup) {
      currentGroup = g;
      sections.push({ title: g, data: [] });
    }
    sections[sections.length - 1].data.push(item);
  }

  // Flatten with section headers for FlatList
  type ListItem = { type: 'header'; title: string; key: string } | { type: 'item'; item: Notification; key: string };
  const flatData: ListItem[] = [];
  for (const section of sections) {
    flatData.push({ type: 'header', title: section.title, key: `h-${section.title}` });
    for (const item of section.data) {
      flatData.push({ type: 'item', item, key: item.id });
    }
  }

  const hasUnread = items.some((n) => !n.isRead);

  if (loading) {
    return (
      <View className="flex-1 bg-bgPrimary items-center justify-center p-5 gap-3">
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-bgPrimary">
        <View className="flex-row items-center justify-between px-4 pt-5 pb-3">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text className="text-lg font-bold text-textPrimary">Уведомления</Text>
          <View style={{ width: 22 }} />
        </View>
        <View className="flex-1 items-center justify-center p-5 gap-3">
          <View
            className="w-[72px] h-[72px] rounded-full items-center justify-center border border-border"
            style={{ backgroundColor: Colors.bgSurface }}
          >
            <Feather name="bell-off" size={36} color={Colors.textMuted} />
          </View>
          <Text className="text-lg font-semibold text-textPrimary">Нет уведомлений</Text>
          <Text className="text-sm text-textMuted text-center max-w-[280px]">
            Здесь будут появляться уведомления о новых сообщениях, откликах и отзывах
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bgPrimary">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-5 pb-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text className="text-lg font-bold text-textPrimary">Уведомления</Text>
        {hasUnread ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text className="text-sm font-semibold text-brandPrimary">Прочитать все</Text>
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <FlatList
        data={flatData}
        keyExtractor={(d) => d.key}
        renderItem={({ item: d }) => {
          if (d.type === 'header') {
            return (
              <Text className="text-xs font-semibold text-textMuted uppercase tracking-wider mt-4 mb-2">
                {d.title}
              </Text>
            );
          }
          return <NotificationItem item={d.item} onPress={() => handlePress(d.item)} />;
        }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brandPrimary}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color={Colors.brandPrimary}
              style={{ paddingVertical: 16 }}
            />
          ) : null
        }
      />
    </View>
  );
}
