import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Avatar from "@/components/ui/Avatar";
import { apiGet } from "@/lib/api";
import { colors } from "@/lib/theme";

interface ThreadItem {
  id: string;
  otherUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  request: {
    id: string;
    title: string;
    status: string;
  };
  lastMessage: {
    text: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  createdAt: string;
}

function displayName(user: { firstName: string | null; lastName: string | null }): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Специалист";
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString("ru-RU", { weekday: "short" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function sortThreads(threads: ThreadItem[]): ThreadItem[] {
  return [...threads].sort((a, b) => {
    // Unread threads float to top
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    // Then by last message date descending
    const aTime = a.lastMessage
      ? new Date(a.lastMessage.createdAt).getTime()
      : new Date(a.createdAt).getTime();
    const bTime = b.lastMessage
      ? new Date(b.lastMessage.createdAt).getTime()
      : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export default function ClientMessages() {
  const router = useRouter();

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    setError(null);
    try {
      const res = await apiGet<{ items: ThreadItem[] }>("/api/threads");
      setThreads(res.items);
    } catch (e) {
      console.error("fetch client threads error:", e);
      setError("Не удалось загрузить сообщения");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchThreads();
  }, [fetchThreads]);

  const sorted = sortThreads(threads);

  const renderThread = useCallback(
    ({ item }: { item: ThreadItem }) => {
      const hasUnread = item.unreadCount > 0;
      const name = displayName(item.otherUser);

      return (
        <Pressable
          accessibilityLabel={`Чат с ${name}`}
          onPress={() => router.push(`/threads/${item.id}` as never)}
          className="flex-row items-center py-3 border-b border-slate-100 active:bg-slate-50"
        >
          {/* Avatar with unread badge */}
          <View className="relative mr-3">
            <Avatar
              name={name}
              imageUrl={item.otherUser.avatarUrl ?? undefined}
              size="md"
            />
            {hasUnread && (
              <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-600 items-center justify-center px-1">
                <Text className="text-[10px] font-bold text-white">
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center justify-between gap-2">
              <Text
                className={`text-base flex-1 flex-shrink ${
                  hasUnread ? "font-bold text-slate-900" : "font-semibold text-slate-900"
                }`}
                numberOfLines={1}
              >
                {name}
              </Text>
              {item.lastMessage && (
                <Text className="text-xs text-slate-400 flex-shrink-0">
                  {formatTime(item.lastMessage.createdAt)}
                </Text>
              )}
            </View>

            {/* Request title */}
            <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
              {item.request.title}
            </Text>

            {/* Last message preview */}
            {item.lastMessage ? (
              <Text
                className={`text-sm mt-0.5 ${
                  hasUnread ? "font-semibold text-slate-700" : "text-slate-400"
                }`}
                numberOfLines={1}
              >
                {item.lastMessage.text}
              </Text>
            ) : (
              <Text className="text-sm mt-0.5 text-slate-300 italic" numberOfLines={1}>
                Нет сообщений
              </Text>
            )}
          </View>
        </Pressable>
      );
    },
    [router]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <HeaderHome />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <HeaderHome />
        <View className="flex-1 items-center justify-center">
          <ErrorState message={error} onRetry={fetchThreads} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderHome />
      <ResponsiveContainer>
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={renderThread}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="comments-o"
              title="Нет сообщений"
              subtitle="Когда специалисты откликнутся на ваши заявки, сообщения появятся здесь"
              actionLabel="Найти специалиста"
              onAction={() => router.push("/specialists" as never)}
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
