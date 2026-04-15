import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
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
import { Colors } from '../../../constants/Colors';

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

  function renderItem({ item }: { item: ThreadItem }) {
    const other = getOtherParticipant(item);
    const unread = isUnread(item);
    const displayName = getDisplayName(other);
    const initials = getInitials(other);

    const previewText = item.lastMessage
      ? (item.lastMessage.senderId === user?.userId ? 'Вы: ' : '') +
        truncate(item.lastMessage.content, 45)
      : 'Нет сообщений';

    return (
      <Pressable
        className="flex-row items-center w-full max-w-[430px] px-4 py-3 bg-bgPrimary"
        onPress={() => router.push(`/(dashboard)/messages/${item.id}`)}
      >
        <View className="relative mr-3">
          <Avatar name={initials} size="md" />
          {unread && (
            <View
              className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-bgPrimary"
              style={{ backgroundColor: Colors.brandPrimary }}
            />
          )}
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`flex-1 text-base mr-2 text-textPrimary ${unread ? 'font-semibold' : 'font-normal'}`}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <View className="flex-row items-center shrink-0">
              {unread && (
                <View
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: Colors.brandPrimary }}
                />
              )}
              {item.lastMessage && (
                <Text
                  className={`text-xs shrink-0 ${unread ? 'font-medium text-brandPrimary' : 'text-textMuted'}`}
                >
                  {formatTime(item.lastMessage.createdAt)}
                </Text>
              )}
            </View>
          </View>
          <Text
            className={`text-sm ${unread ? 'font-medium text-textSecondary' : 'text-textMuted'}`}
            numberOfLines={1}
          >
            {previewText}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View className="flex-1 bg-bgPrimary">
      {isMobile && <Header title="Диалоги" showBack />}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 32,
            alignItems: 'center',
            ...(threads.length === 0 ? { flex: 1, justifyContent: 'center' } : {}),
          }}
          ItemSeparatorComponent={() => (
            <View
              className="h-px w-full max-w-[430px]"
              style={{ backgroundColor: Colors.border, marginLeft: 72 }}
            />
          )}
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
    </View>
  );
}
