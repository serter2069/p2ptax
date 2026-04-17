import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import EmptyState from "@/components/EmptyState";
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

export default function SpecialistThreads() {
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = useCallback(async () => {
    try {
      const data = await apiGet<{ items: ThreadItem[] }>("/api/threads");
      setThreads(data.items);
    } catch (error) {
      console.error("Threads fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchThreads();
  }, [fetchThreads]);

  const filtered =
    filter === "unread"
      ? threads.filter((t) => t.unreadCount > 0)
      : threads;

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
        <Text className="text-xl font-bold text-slate-900 mt-4 mb-3">
          Мои диалоги
        </Text>

        {/* Filter chips */}
        <View className="flex-row gap-2 mb-4">
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

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ResponsiveContainer>
          {filtered.length === 0 ? (
            threads.length === 0 ? (
              <EmptyState
                icon="comments-o"
                title="Вы ещё не писали клиентам"
                subtitle="Найдите подходящую заявку и напишите первое сообщение"
                actionLabel="Смотреть заявки"
                onAction={() => router.push("/(specialist-tabs)/requests" as never)}
              />
            ) : (
              <EmptyState
                icon="check-circle"
                title="Нет непрочитанных"
                subtitle="Все сообщения прочитаны"
              />
            )
          ) : (
            filtered.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onPress={() => router.push(`/threads/${thread.id}` as never)}
              />
            ))
          )}
          <View className="h-8" />
        </ResponsiveContainer>
      </ScrollView>
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
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        active ? "bg-blue-900 border-blue-900" : "bg-white border-slate-200"
      }`}
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
  const name = [thread.otherUser.firstName, thread.otherUser.lastName]
    .filter(Boolean)
    .join(" ") || "Клиент";

  const initials = (
    (thread.otherUser.firstName?.[0] || "") +
    (thread.otherUser.lastName?.[0] || "")
  ).toUpperCase() || "К";

  const preview = thread.lastMessage
    ? thread.lastMessage.text.length > 60
      ? thread.lastMessage.text.slice(0, 60) + "..."
      : thread.lastMessage.text
    : "Нет сообщений";

  const timeStr = thread.lastMessage
    ? formatTime(thread.lastMessage.createdAt)
    : "";

  const isClosed = thread.request.status === "CLOSED";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 border-b border-slate-100"
    >
      {/* Avatar */}
      <View className="w-12 h-12 rounded-full bg-blue-900 items-center justify-center mr-3">
        <Text className="text-white text-base font-bold">{initials}</Text>
        {thread.unreadCount > 0 && (
          <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-600 items-center justify-center px-1">
            <Text className="text-[10px] font-bold text-white">
              {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 mr-2">
        <View className="flex-row items-center gap-2">
          <Text
            className={`text-base flex-1 ${
              thread.unreadCount > 0
                ? "font-bold text-slate-900"
                : "font-medium text-slate-900"
            }`}
            numberOfLines={1}
          >
            {name}
          </Text>
          {isClosed && (
            <View className="bg-slate-200 px-1.5 py-0.5 rounded">
              <Text className="text-[10px] text-slate-400">Заявка закрыта</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
          {thread.request.title}
        </Text>
        <Text
          className={`text-sm mt-0.5 ${
            thread.unreadCount > 0 ? "font-medium text-slate-900" : "text-slate-400"
          }`}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>

      {/* Time */}
      {timeStr ? (
        <Text className="text-xs text-slate-400">{timeStr}</Text>
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
