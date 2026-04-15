import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBreakpoints } from '../../../hooks/useBreakpoints';
import { useAuth } from '../../../stores/authStore';
import { api, ApiError } from '../../../lib/api';
import { Avatar } from '../../../components/Avatar';
import { Header } from '../../../components/Header';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

interface ThreadParticipant {
  id: string;
  email: string;
  role: string;
  name?: string;
}

interface LastMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
}

interface ThreadItem {
  id: string;
  participant1: ThreadParticipant;
  participant2: ThreadParticipant;
  lastMessage: LastMessage | null;
  createdAt: string;
}

function getDisplayName(participant: ThreadParticipant): string {
  // Backend returns name = displayName || nick || email prefix
  if (participant.name) return participant.name;
  const local = participant.email.split('@')[0] ?? '';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function getInitials(participant: ThreadParticipant): string {
  const displayName = participant.name || participant.email.split('@')[0] || '';
  return displayName.slice(0, 2).toUpperCase();
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');

  if (msgDay.getTime() === today.getTime()) {
    return `${hours}:${mins}`;
  }
  if (msgDay.getTime() === yesterday.getTime()) {
    return 'Вчера';
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export default function MessagesScreen() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const { user } = useAuth();
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchThreads = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api.get<ThreadItem[]>('/threads');
      setThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось загрузить диалоги.');
      }
      setThreads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
    const intervalId = setInterval(fetchThreads, 30_000);
    return () => clearInterval(intervalId);
  }, [fetchThreads]);

  function getOtherParticipant(thread: ThreadItem): ThreadParticipant {
    if (!user) return thread.participant1;
    return thread.participant1.id === user.userId
      ? thread.participant2
      : thread.participant1;
  }

  function isUnread(thread: ThreadItem): boolean {
    if (!user || !thread.lastMessage) return false;
    return (
      thread.lastMessage.senderId !== user.userId &&
      thread.lastMessage.readAt === null
    );
  }

  function renderItem({ item, index }: { item: ThreadItem; index: number }) {
    const other = getOtherParticipant(item);
    const unread = isUnread(item);
    const displayName = getDisplayName(other);
    const initials = getInitials(other);

    const previewText = item.lastMessage
      ? (item.lastMessage.senderId === user?.userId ? 'Вы: ' : '') +
        truncate(item.lastMessage.content, 45)
      : 'Нет сообщений';

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/(dashboard)/messages/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          <Avatar name={initials} size="md" />
          {unread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.info}>
          <View style={styles.infoTop}>
            <Text style={[styles.displayName, unread && styles.displayNameBold]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.timeRow}>
              {unread && <View style={styles.unreadBadge} />}
              {item.lastMessage && (
                <Text style={[styles.time, unread && styles.timeBold]}>
                  {formatTime(item.lastMessage.createdAt)}
                </Text>
              )}
            </View>
          </View>
          <Text
            style={[styles.preview, unread && styles.previewBold]}
            numberOfLines={1}
          >
            {previewText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {isMobile && <Header title="Диалоги" showBack />}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            threads.length === 0 && styles.listEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            error ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Ошибка загрузки"
                subtitle={error}
                ctaLabel="Повторить"
                onCtaPress={() => fetchThreads()}
              />
            ) : (
              <EmptyState
                icon="chatbubble-outline"
                title="Нет диалогов"
                subtitle="Начните диалог с специалистом — откликнитесь на запрос или напишите напрямую."
                ctaLabel="Найти специалиста"
                onCtaPress={() => router.push('/specialists' as any)}
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchThreads(true);
              }}
              tintColor={Colors.brandPrimary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 430,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgPrimary,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brandPrimary,
    borderWidth: 2,
    borderColor: Colors.bgPrimary,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandPrimary,
    marginRight: Spacing.xs,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  displayNameBold: {
    fontWeight: Typography.fontWeight.semibold,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  time: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    flexShrink: 0,
  },
  timeBold: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  preview: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  previewBold: {
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
    maxWidth: 430,
    marginLeft: 72,
  },
});
