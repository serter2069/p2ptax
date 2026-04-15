import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { notifications as notifApi } from '../lib/api/endpoints';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/Colors';

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
    <Pressable onPress={onPress} style={[s.item, !item.isRead && s.itemUnread]}>
      <View style={[s.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <Feather name={iconName} size={18} color={iconColor} />
      </View>
      <View style={s.itemBody}>
        <View style={s.itemTop}>
          <Text style={[s.itemTitle, !item.isRead && s.itemTitleBold]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={s.itemTime}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={s.itemText} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.isRead && <View style={s.unreadDot} />}
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
      // Mark as read
      if (!item.isRead) {
        notifApi.markRead(item.id).catch(() => {});
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
      }
      // Navigate based on type
      const data = item.data || {};
      if (item.type === 'NEW_MESSAGE' && data.threadId) {
        router.push(`/chat/${data.threadId}`);
      } else if (
        (item.type === 'NEW_RESPONSE' || item.type === 'REQUEST_UPDATE') &&
        data.requestId
      ) {
        router.push(`/request/${data.requestId}`);
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
      <View style={s.centered}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={s.pageTitle}>Уведомления</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={s.centered}>
          <View style={s.emptyIconWrap}>
            <Feather name="bell-off" size={36} color={Colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>Нет уведомлений</Text>
          <Text style={s.emptyText}>
            Здесь будут появляться уведомления о новых сообщениях, откликах и отзывах
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={s.pageTitle}>Уведомления</Text>
        {hasUnread ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={s.markAllText}>Прочитать все</Text>
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
            return <Text style={s.sectionHeader}>{d.title}</Text>;
          }
          return <NotificationItem item={d.item} onPress={() => handlePress(d.item)} />;
        }}
        contentContainerStyle={s.list}
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
              style={{ paddingVertical: Spacing.lg }}
            />
          ) : null
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  pageTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  markAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  sectionHeader: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemUnread: {
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemTitleBold: {
    fontWeight: Typography.fontWeight.bold,
  },
  itemTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  itemText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandPrimary,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
