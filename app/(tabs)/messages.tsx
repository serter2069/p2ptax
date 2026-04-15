import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../stores/authStore';
import { threads as threadsApi } from '../../lib/api/endpoints';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Colors';
import { NotificationBell } from '../../components/NotificationBell';

// ---------------------------------------------------------------------------
// Types matching backend response (ChatService.getThreads)
// ---------------------------------------------------------------------------
interface ThreadParticipant {
  id: string;
  email: string;
  role: string;
  name: string;
  specialistProfile?: {
    nick: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface ThreadLastMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
}

interface Thread {
  id: string;
  participant1: ThreadParticipant;
  participant2: ThreadParticipant;
  lastMessage: ThreadLastMessage | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  }
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Thread row component
// ---------------------------------------------------------------------------
function ThreadItem({
  thread,
  currentUserId,
  onPress,
}: {
  thread: Thread;
  currentUserId: string;
  onPress: () => void;
}) {
  const other =
    thread.participant1.id === currentUserId
      ? thread.participant2
      : thread.participant1;

  const lastMsg = thread.lastMessage;
  const isUnread =
    lastMsg && !lastMsg.readAt && lastMsg.senderId !== currentUserId;

  const preview = lastMsg
    ? lastMsg.content || '📎 Вложение'
    : 'Нет сообщений';

  const time = lastMsg ? formatTime(lastMsg.createdAt) : formatTime(thread.createdAt);

  return (
    <Pressable onPress={onPress} style={s.thread}>
      <View style={s.threadAvatar}>
        <Text style={s.threadAvatarText}>{getInitials(other.name)}</Text>
      </View>
      <View style={s.threadBody}>
        <View style={s.threadTop}>
          <Text
            style={[s.threadName, isUnread && s.threadNameBold]}
            numberOfLines={1}
          >
            {other.name}
          </Text>
          <Text style={s.threadTime}>{time}</Text>
        </View>
        <View style={s.threadBottom}>
          <Text
            style={[s.threadMsg, isUnread && s.threadMsgBold]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {isUnread && (
            <View style={s.unreadBadge}>
              <View style={s.unreadDot} />
            </View>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function MessagesTab() {
  const { user } = useAuth();
  const router = useRouter();

  const [threadsList, setThreadsList] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const fetchThreads = useCallback(async () => {
    try {
      setError(false);
      const res = await threadsApi.getThreads();
      setThreadsList(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetch threads every time tab gains focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchThreads();
    }, [fetchThreads]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchThreads();
  }, [fetchThreads]);

  const filtered = useMemo(() => {
    if (!search.trim()) return threadsList;
    const q = search.toLowerCase();
    return threadsList.filter((t) => {
      const other =
        t.participant1.id === user?.userId ? t.participant2 : t.participant1;
      return (
        other.name.toLowerCase().includes(q) ||
        (t.lastMessage?.content ?? '').toLowerCase().includes(q)
      );
    });
  }, [threadsList, search, user?.userId]);

  // --- Loading state ---
  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  // --- Error state ---
  if (error && threadsList.length === 0) {
    return (
      <View style={s.centered}>
        <View style={s.errorIconWrap}>
          <Feather name="wifi-off" size={36} color={Colors.statusError} />
        </View>
        <Text style={s.emptyTitle}>Нет подключения</Text>
        <Text style={s.emptyText}>
          Не удалось загрузить сообщения. Проверьте интернет.
        </Text>
        <Pressable style={s.retryBtn} onPress={onRefresh}>
          <Feather name="refresh-cw" size={16} color={Colors.white} />
          <Text style={s.retryBtnText}>Попробовать снова</Text>
        </Pressable>
      </View>
    );
  }

  // --- Empty state ---
  if (threadsList.length === 0) {
    return (
      <View style={s.centered}>
        <View style={s.emptyIconWrap}>
          <Feather name="message-circle" size={36} color={Colors.brandPrimary} />
        </View>
        <Text style={s.emptyTitle}>Нет сообщений</Text>
        <Text style={s.emptyText}>
          Когда специалист примет вашу заявку, вы сможете обсудить детали в чате
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
        <Text style={[s.pageTitle, { marginBottom: 0, paddingHorizontal: 0 }]}>Сообщения</Text>
        <NotificationBell />
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по сообщениям..."
          placeholderTextColor={Colors.textMuted}
          style={s.searchInput}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Search empty */}
      {filtered.length === 0 && search.length > 0 ? (
        <View style={s.searchEmpty}>
          <Text style={s.searchEmptyText}>Ничего не найдено</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThreadItem
              thread={item}
              currentUserId={user?.userId ?? ''}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          )}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brandPrimary}
            />
          }
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      )}
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
    paddingTop: Spacing.lg,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  pageTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 40,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    paddingVertical: 0,
    outlineStyle: 'none' as any,
  },
  searchEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  searchEmptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  // List
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },

  // Thread row
  thread: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  threadAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  threadAvatarText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  threadBody: { flex: 1, gap: 2 },
  threadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  threadNameBold: { fontWeight: Typography.fontWeight.bold },
  threadTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  threadBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  threadMsg: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  threadMsgBold: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brandPrimary,
  },

  // Empty
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

  // Error
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.statusBg.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 44,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.btn,
    paddingHorizontal: Spacing['2xl'],
    marginTop: Spacing.sm,
  },
  retryBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});
