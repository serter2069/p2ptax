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
import { api } from "@/lib/api";

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

function getInitials(user: { firstName: string | null; lastName: string | null }): string {
  const f = user.firstName?.[0] || "";
  const l = user.lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

export default function ClientMessages() {
  const router = useRouter();

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await api<{ items: ThreadItem[] }>("/api/threads");
      setThreads(res.items);
    } catch (e) {
      console.error("fetch client threads error:", e);
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

  const renderThread = useCallback(
    ({ item }: { item: ThreadItem }) => {
      const hasUnread = item.unreadCount > 0;

      return (
        <Pressable
          onPress={() => router.push(`/threads/${item.id}` as never)}
          className="flex-row items-center py-3 border-b border-slate-100"
        >
          {/* Avatar */}
          <View className="w-10 h-10 rounded-full bg-blue-900 items-center justify-center">
            <Text className="text-white text-sm font-bold">
              {getInitials(item.otherUser)}
            </Text>
            {hasUnread && (
              <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-600 items-center justify-center px-1">
                <Text className="text-[10px] font-bold text-white">
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 ml-3">
            <Text
              className={`text-base ${hasUnread ? "font-bold" : "font-semibold"} text-slate-900`}
              numberOfLines={1}
            >
              {displayName(item.otherUser)}
            </Text>
            {item.lastMessage && (
              <Text
                className={`text-sm mt-0.5 ${hasUnread ? "font-semibold text-slate-700" : "text-slate-400"}`}
                numberOfLines={1}
              >
                {truncate(item.lastMessage.text, 60)}
              </Text>
            )}
          </View>

          {/* Time */}
          {item.lastMessage && (
            <Text className="text-xs text-slate-400 ml-2">
              {formatTime(item.lastMessage.createdAt)}
            </Text>
          )}
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
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderHome />
      <ResponsiveContainer>
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderThread}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#1e3a8a"
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="comments-o"
              title="Сообщений пока нет"
              subtitle="Здесь появятся сообщения от специалистов"
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
