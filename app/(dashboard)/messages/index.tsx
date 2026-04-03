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
import { useAuth } from '../../../stores/authStore';
import { api, ApiError } from '../../../lib/api';
import { Avatar } from '../../../components/Avatar';
import { Header } from '../../../components/Header';
import { EmptyState } from '../../../components/EmptyState';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/Colors';

interface ThreadParticipant {
  id: string;
  email: string;
  role: string;
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

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export default function MessagesScreen() {
  const router = useRouter();
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

  function renderItem({ item }: { item: ThreadItem }) {
    const other = getOtherParticipant(item);
    const unread = isUnread(item);

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/(dashboard)/messages/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          <Avatar name={other.email} size="md" />
          {unread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.info}>
          <View style={styles.infoTop}>
            <Text style={[styles.email, unread && styles.emailBold]} numberOfLines={1}>
              {other.email}
            </Text>
            {item.lastMessage && (
              <Text style={styles.time}>
                {formatTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <Text
            style={[styles.preview, unread && styles.previewBold]}
            numberOfLines={1}
          >
            {item.lastMessage
              ? (item.lastMessage.senderId === user?.userId ? 'Вы: ' : '') +
                item.lastMessage.content
              : 'Нет сообщений'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Диалоги" showBack />

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
                title="Нет диалогов"
                subtitle="Диалоги появятся, когда специалист ответит на ваш запрос"
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
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.brandPrimary,
    borderWidth: 2,
    borderColor: Colors.bgPrimary,
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
  email: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  emailBold: {
    fontWeight: Typography.fontWeight.semibold,
  },
  time: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    flexShrink: 0,
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
    marginLeft: 72, // align with text, after avatar
  },
});
