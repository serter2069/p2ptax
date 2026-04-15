import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../stores/authStore';
import { threads as threadsApi } from '../../lib/api/endpoints';
import { Colors } from '../../constants/Colors';
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
// Skeleton block for loading state
// ---------------------------------------------------------------------------
function SkeletonBlock({ className: cls }: { className: string }) {
  return <View className={`bg-bgSurface opacity-70 ${cls}`} />;
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
    ? lastMsg.content || 'Вложение'
    : 'Нет сообщений';

  const time = lastMsg ? formatTime(lastMsg.createdAt) : formatTime(thread.createdAt);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3 shadow-sm"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
        <Text className="text-sm font-bold text-brandPrimary">{getInitials(other.name)}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between">
          <Text
            className={`flex-1 mr-2 text-base text-textPrimary ${isUnread ? 'font-bold' : 'font-medium'}`}
            numberOfLines={1}
          >
            {other.name}
          </Text>
          <Text className="text-xs text-textMuted">{time}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text
            className={`flex-1 text-sm ${isUnread ? 'font-medium text-textPrimary' : 'text-textMuted'}`}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {isUnread && (
            <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-brandPrimary px-1.5">
              <View className="h-2 w-2 rounded-full bg-white" />
            </View>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Loading state (skeleton)
// ---------------------------------------------------------------------------
function LoadingState() {
  return (
    <View className="flex-1 bg-bgPrimary p-4 gap-2">
      {/* Header skeleton */}
      <View className="flex-row items-center gap-2 mb-2">
        <SkeletonBlock className="h-6 w-2/5 rounded-md" />
        <SkeletonBlock className="h-7 w-7 rounded-full" />
      </View>

      {/* Search skeleton */}
      <SkeletonBlock className="h-10 w-full rounded-xl" />

      {/* Thread skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3">
          <SkeletonBlock className="h-11 w-11 rounded-full" />
          <View className="flex-1 gap-1.5">
            <View className="flex-row items-center justify-between">
              <SkeletonBlock className="h-3.5 w-1/2 rounded" />
              <SkeletonBlock className="h-3 w-10 rounded" />
            </View>
            <SkeletonBlock className="h-3 w-[70%] rounded" />
          </View>
        </View>
      ))}

      <View className="items-center pt-2">
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <View className="flex-1 bg-bgPrimary items-center justify-center px-5 gap-3">
      <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-borderLight bg-bgSurface">
        <Feather name="message-circle" size={36} color={Colors.brandPrimary} />
      </View>
      <Text className="text-lg font-semibold text-textPrimary">Нет сообщений</Text>
      <Text className="text-sm text-textMuted text-center max-w-[280px]">
        Когда специалист примет вашу заявку, вы сможете обсудить детали в чате
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 bg-bgPrimary items-center justify-center px-5 gap-3">
      <View
        className="h-[72px] w-[72px] items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.statusBg.error }}
      >
        <Feather name="wifi-off" size={36} color={Colors.statusError} />
      </View>
      <Text className="text-lg font-semibold text-textPrimary">Нет подключения</Text>
      <Text className="text-sm text-textMuted text-center max-w-[280px]">
        Не удалось загрузить сообщения. Проверьте интернет.
      </Text>
      <Pressable
        onPress={onRetry}
        className="flex-row items-center justify-center gap-2 h-11 rounded-xl bg-brandPrimary px-6 mt-2"
      >
        <Feather name="refresh-cw" size={16} color={Colors.white} />
        <Text className="text-sm font-semibold text-white">Попробовать снова</Text>
      </Pressable>
    </View>
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

  const totalUnread = useMemo(() => {
    if (!user?.userId) return 0;
    return threadsList.reduce((sum, t) => {
      const lm = t.lastMessage;
      if (lm && !lm.readAt && lm.senderId !== user.userId) return sum + 1;
      return sum;
    }, 0);
  }, [threadsList, user?.userId]);

  // --- Loading state ---
  if (loading) {
    return <LoadingState />;
  }

  // --- Error state ---
  if (error && threadsList.length === 0) {
    return <ErrorState onRetry={onRefresh} />;
  }

  // --- Empty state ---
  if (threadsList.length === 0) {
    return <EmptyState />;
  }

  return (
    <View className="flex-1 bg-bgPrimary pt-4">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 mb-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-bold text-textPrimary">Сообщения</Text>
          {totalUnread > 0 && (
            <View className="min-w-[24px] h-6 items-center justify-center rounded-full bg-brandPrimary px-1.5">
              <Text className="text-xs font-bold text-white">{totalUnread}</Text>
            </View>
          )}
        </View>
        <NotificationBell />
      </View>

      {/* Search */}
      <View className="flex-row items-center gap-2 h-10 mx-4 mb-2 px-3 rounded-xl border border-borderLight bg-white">
        <Feather name="search" size={16} color={Colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Поиск по сообщениям..."
          placeholderTextColor={Colors.textMuted}
          className="flex-1 text-sm text-textPrimary py-0"
          style={{ outlineStyle: 'none' } as any}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Search empty */}
      {filtered.length === 0 && search.length > 0 ? (
        <View className="items-center py-6">
          <Text className="text-sm text-textMuted">Ничего не найдено</Text>
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brandPrimary}
            />
          }
        />
      )}
    </View>
  );
}
