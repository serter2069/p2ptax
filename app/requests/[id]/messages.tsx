import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { MessageCircle } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { api, ApiError } from "@/lib/api";
import { colors } from "@/lib/theme";

interface ThreadItem {
  id: string;
  otherUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
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

export default function RequestMessages() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter()
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await api<{ items: ThreadItem[] }>(`/api/threads?request_id=${id}`);
      setThreads(res.items);
    } catch (e) {
      if (e instanceof ApiError) {
        setError("Не удалось загрузить сообщения");
      } else {
        setError("Проверьте соединение с интернетом и попробуйте снова");
      }
      console.error("fetch request threads error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

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
      const name = displayName(item.otherUser);
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Чат с ${name}`}
          onPress={() => nav.any(`/threads/${item.id}`)}
          className="flex-row items-center py-3 border-b border-border"
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          {/* Avatar */}
          <View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
            <Text className="text-white text-sm font-bold">
              {getInitials(item.otherUser)}
            </Text>
            {hasUnread && (
              <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-danger items-center justify-center px-1">
                <Text className="text-xs font-bold text-white">
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 ml-3">
            <Text
              className={`text-base ${hasUnread ? "font-bold" : "font-semibold"} text-text-base`}
              numberOfLines={1}
            >
              {name}
            </Text>
            {item.lastMessage ? (
              <Text
                className={`text-sm mt-0.5 ${hasUnread ? "font-semibold text-text-base" : "text-text-mute"}`}
                numberOfLines={1}
              >
                {truncate(item.lastMessage.text, 60)}
              </Text>
            ) : (
              <Text className="text-sm mt-0.5 text-text-mute" numberOfLines={1}>
                Нет сообщений
              </Text>
            )}
          </View>

          {/* Time */}
          {item.lastMessage && (
            <Text className="text-xs text-text-mute ml-2">
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
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Сообщения" />
        <ResponsiveContainer>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-center py-3 border-b border-border">
              <View className="w-10 h-10 rounded-full bg-surface2" />
              <View className="flex-1 ml-3">
                <View className="h-4 bg-surface2 rounded mb-2" style={{ width: "55%" }} />
                <View className="h-3 bg-surface2 rounded" style={{ width: "80%" }} />
              </View>
              <View className="h-3 bg-surface2 rounded ml-2" style={{ width: 32 }} />
            </View>
          ))}
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Сообщения" />
        <View className="flex-1 items-center justify-center">
          <ErrorState
            message={error}
            onRetry={() => {
              setLoading(true);
              fetchThreads();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <HeaderBack title="Сообщения" />
      <ResponsiveContainer>
        <FlatList
          data={threads}
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
              icon={MessageCircle}
              title="Пока нет сообщений"
              subtitle="Специалисты увидят вашу заявку и напишут вам первыми"
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: isDesktop ? 24 : 0 }}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
