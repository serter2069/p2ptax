import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderHome from "@/components/HeaderHome";
import EmptyState from "@/components/ui/EmptyState";
import { MessageSquare } from "lucide-react-native";
import ErrorState from "@/components/ui/ErrorState";
import Avatar from "@/components/ui/Avatar";
import InlineChatView from "@/components/InlineChatView";
import { apiGet } from "@/lib/api";

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
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

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
    ({ item, onSelect, selected }: { item: ThreadItem; onSelect?: () => void; selected?: boolean }) => {
      const hasUnread = item.unreadCount > 0;
      const name = displayName(item.otherUser);

      const handlePress = () => {
        if (onSelect) {
          onSelect();
        } else {
          router.push(`/threads/${item.id}` as never);
        }
      };

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Чат с ${name}`}
          onPress={handlePress}
          className="flex-row items-center py-3 border-b border-slate-100 active:bg-slate-50"
          style={({ pressed }) => [
            { backgroundColor: selected ? "#eff6ff" : "white" },
            pressed && { opacity: 0.7 },
          ]}
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
                  hasUnread ? "font-bold" : "font-semibold"
                }`}
                style={{ color: "#0f172a" }}
                numberOfLines={1}
              >
                {name}
              </Text>
              {item.lastMessage && (
                <Text className="text-xs flex-shrink-0" style={{ color: "#94a3b8" }}>
                  {formatTime(item.lastMessage.createdAt)}
                </Text>
              )}
            </View>

            {/* Request title */}
            <Text className="text-xs mt-0.5" style={{ color: "#94a3b8" }} numberOfLines={1}>
              {item.request.title}
            </Text>

            {/* Last message preview */}
            {item.lastMessage ? (
              <Text
                className={`text-sm mt-0.5 ${hasUnread ? "font-semibold" : ""}`}
                style={{ color: hasUnread ? "#334155" : "#94a3b8" }}
                numberOfLines={1}
              >
                {item.lastMessage.text}
              </Text>
            ) : (
              <Text className="text-sm mt-0.5 italic" style={{ color: "#cbd5e1" }} numberOfLines={1}>
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
          <ActivityIndicator size="large" color="#2256c2" />
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

  // Desktop: 2-column layout
  if (isDesktop) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <HeaderHome />
        <View className="flex-1 flex-row">
          {/* Thread list panel */}
          <View style={{ width: 300, borderRightWidth: 1, borderRightColor: "#e2e8f0" }}>
            <FlatList
              data={sorted}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) =>
                renderThread({
                  item,
                  onSelect: () => setSelectedThreadId(item.id),
                  selected: item.id === selectedThreadId,
                })
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#2256c2"
                />
              }
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 12 }}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-16 px-4">
                  <Text className="text-sm text-center" style={{ color: "#94a3b8" }}>Нет сообщений</Text>
                </View>
              }
            />
          </View>
          {/* Chat panel */}
          <View className="flex-1">
            {selectedThreadId ? (
              <InlineChatView threadId={selectedThreadId} />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-sm" style={{ color: "#94a3b8" }}>Выберите диалог</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Mobile: full-screen list
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderHome />
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderThread({ item })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2256c2"
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={MessageSquare}
            title="Нет сообщений"
            subtitle="Когда специалисты откликнутся на ваши заявки, сообщения появятся здесь"
            actionLabel="Найти специалиста"
            onAction={() => router.push("/specialists" as never)}
          />
        }
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}
      />
    </SafeAreaView>
  );
}
