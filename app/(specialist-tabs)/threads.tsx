import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { apiGet } from "@/lib/api";

type FilterType = "all" | "unread";

interface ThreadItem {
  id: string;
  request: { id: string; title: string; status: string };
  otherUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  lastMessage: { text: string; createdAt: string } | null;
  unreadCount: number;
  createdAt: string;
}

export default function SpecialistMyThreads() {
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setError(null);
      const data = await apiGet<{ items: ThreadItem[] }>("/api/threads");
      setThreads(data.items);
    } catch (err) {
      console.error("Threads fetch error:", err);
      setError("Не удалось загрузить диалоги");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchThreads();
  }, [fetchThreads]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchThreads();
  }, [fetchThreads]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchThreads();
  }, [fetchThreads]);

  const filtered =
    filter === "unread"
      ? threads.filter((t) => t.unreadCount > 0)
      : threads;

  const FilterBar = (
    <ResponsiveContainer>
      <Text className="text-xl font-bold text-slate-900 mt-4 mb-3">
        Мои диалоги
      </Text>
      <View className="flex-row gap-2 mb-3">
        <FilterChip
          label="Все"
          active={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <FilterChip
          label="Непрочитанные"
          active={filter === "unread"}
          onPress={() => setFilter("unread")}
        />
      </View>
    </ResponsiveContainer>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderHome />

      {loading ? (
        <View className="flex-1">
          {FilterBar}
          <ResponsiveContainer>
            <LoadingState variant="skeleton" lines={5} />
            <LoadingState variant="skeleton" lines={5} />
            <LoadingState variant="skeleton" lines={5} />
          </ResponsiveContainer>
        </View>
      ) : error ? (
        <View className="flex-1">
          {FilterBar}
          <ResponsiveContainer>
            <ErrorState
              message="Не удалось загрузить диалоги"
              onRetry={handleRetry}
            />
          </ResponsiveContainer>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={<>{FilterBar}</>}
          ListEmptyComponent={
            <ResponsiveContainer>
              {threads.length === 0 ? (
                <EmptyState
                  icon="comments-o"
                  title="Вы ещё не написали ни одному клиенту"
                  subtitle="Откликнитесь на заявку — клиент увидит ваше сообщение и сможет ответить"
                  actionLabel="Смотреть заявки"
                  onAction={() =>
                    router.push("/(specialist-tabs)/requests" as never)
                  }
                />
              ) : (
                <EmptyState
                  icon="check-circle-o"
                  title="Нет непрочитанных"
                  subtitle="Все сообщения прочитаны"
                />
              )}
            </ResponsiveContainer>
          }
          ListFooterComponent={<View className="h-8" />}
          renderItem={({ item }) => (
            <ResponsiveContainer>
              <ThreadCard
                thread={item}
                onPress={() => router.push(`/threads/${item.id}` as never)}
              />
            </ResponsiveContainer>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        active ? "bg-blue-900 border-blue-900" : "bg-white border-slate-200"
      }`}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <Text
        className={`text-sm font-medium ${
          active ? "text-white" : "text-slate-900"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ThreadCard({
  thread,
  onPress,
}: {
  thread: ThreadItem;
  onPress: () => void;
}) {
  const name =
    [thread.otherUser.firstName, thread.otherUser.lastName]
      .filter(Boolean)
      .join(" ") || "Клиент";

  const initials =
    (
      (thread.otherUser.firstName?.[0] ?? "") +
      (thread.otherUser.lastName?.[0] ?? "")
    )
      .toUpperCase()
      .slice(0, 2) || "К";

  const preview = thread.lastMessage
    ? thread.lastMessage.text.length > 60
      ? thread.lastMessage.text.slice(0, 60) + "..."
      : thread.lastMessage.text
    : "Нет сообщений";

  const timeStr = thread.lastMessage
    ? formatTime(thread.lastMessage.createdAt)
    : "";

  const isClosed = thread.request.status === "CLOSED";
  const hasUnread = thread.unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Чат с ${name}`}
      onPress={onPress}
      className="flex-row items-center py-3 border-b border-slate-100 active:bg-slate-50"
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      {/* Avatar with unread badge */}
      <View className="relative mr-3">
        <View className="w-12 h-12 rounded-full bg-blue-900 items-center justify-center">
          <Text className="text-white text-base font-bold">{initials}</Text>
        </View>
        {hasUnread && (
          <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-600 items-center justify-center px-1">
            <Text className="text-[10px] font-bold text-white">
              {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 mr-2">
        <View className="flex-row items-center gap-2 mb-0.5">
          <Text
            className={`flex-1 text-base ${
              hasUnread
                ? "font-bold text-slate-900"
                : "font-medium text-slate-900"
            }`}
            numberOfLines={1}
          >
            {name}
          </Text>
          {isClosed && (
            <View className="bg-slate-100 px-2 py-0.5 rounded">
              <Text className="text-[10px] font-medium text-slate-400">
                Заявка закрыта
              </Text>
            </View>
          )}
        </View>

        <Text className="text-xs text-slate-400 mb-0.5" numberOfLines={1}>
          {thread.request.title}
        </Text>

        <Text
          className={`text-sm ${
            hasUnread ? "font-medium text-slate-700" : "text-slate-400"
          }`}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>

      {/* Timestamp */}
      {timeStr ? (
        <Text className="text-xs text-slate-400 self-start mt-1">{timeStr}</Text>
      ) : null}
    </Pressable>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (diffHours < 24 * 7) {
    return date.toLocaleDateString("ru-RU", { weekday: "short" });
  }

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}
