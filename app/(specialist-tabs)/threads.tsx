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
import { useRouter } from "expo-router";
import HeaderHome from "@/components/HeaderHome";
import DesktopScreen from "@/components/layout/DesktopScreen";
import { MessageCircle, CheckCircle } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import InlineChatView from "@/components/InlineChatView";
import MessengerEmptyPane from "@/components/MessengerEmptyPane";
import { apiGet } from "@/lib/api";
import { colors } from "@/lib/theme";

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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const isWide = width >= 1024;
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

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

  const unreadTotal = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  // Two-pane desktop layout (>=640)
  if (isDesktop && !loading && !error) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <HeaderHome />
        <View className="flex-1 items-center">
          <View
            className="flex-1 flex-row w-full"
            style={{
              maxWidth: isWide ? 1200 : "100%",
              borderWidth: isWide ? 1 : 0,
              borderColor: colors.border,
              borderRadius: isWide ? 12 : 0,
              overflow: "hidden",
              marginTop: isWide ? 24 : 0,
              marginBottom: isWide ? 24 : 0,
            }}
          >
            {/* Left pane: scrollable thread list */}
            <View
              style={{
                maxWidth: 360,
                flex: 1,
                borderRightWidth: 1,
                borderRightColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View className="flex-row items-center gap-2 mb-3">
                  <Text className="text-xl font-bold text-text-base flex-1">
                    Мои диалоги
                  </Text>
                  {unreadTotal > 0 && (
                    <View
                      className="bg-accent rounded-full items-center justify-center"
                      style={{ minWidth: 24, height: 24, paddingHorizontal: 6 }}
                    >
                      <Text className="text-xs font-bold text-white">
                        {unreadTotal > 99 ? "99+" : unreadTotal}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row gap-2">
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
              </View>
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                }
                contentContainerStyle={{ flexGrow: 1 }}
                ListEmptyComponent={
                  threads.length === 0 ? (
                    <EmptyState
                      icon={MessageCircle}
                      title="Нет диалогов"
                      subtitle="Напишите по публичной заявке — переписка появится здесь"
                      actionLabel="Смотреть заявки"
                      onAction={() =>
                        router.push("/(specialist-tabs)/requests" as never)
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={CheckCircle}
                      title="Нет непрочитанных"
                      subtitle="Все сообщения прочитаны"
                    />
                  )
                }
                renderItem={({ item }) => (
                  <ThreadCard
                    thread={item}
                    selected={item.id === selectedThreadId}
                    onPress={() => setSelectedThreadId(item.id)}
                  />
                )}
              />
            </View>
            {/* Right pane: chat or empty */}
            <View className="flex-1">
              {selectedThreadId ? (
                <InlineChatView threadId={selectedThreadId} />
              ) : (
                <MessengerEmptyPane
                  title="Выберите диалог слева"
                  hint={
                    threads.length > 0
                      ? `У вас ${threads.length} ${threads.length === 1 ? "диалог" : threads.length < 5 ? "диалога" : "диалогов"}. Нажмите любой, чтобы открыть переписку.`
                      : "Напишите по публичной заявке, чтобы начать переписку с клиентом."
                  }
                  leftHint="Список диалогов"
                  primary={{
                    label: "Публичные заявки",
                    onPress: () =>
                      router.push("/(specialist-tabs)/requests" as never),
                    icon: "sparkles",
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Mobile fallback (unchanged behaviour)
  const FilterBar = (
    <DesktopScreen>
      <View className="flex-row items-center gap-2 mt-4 mb-3">
        <Text className="text-2xl font-bold text-text-base flex-1">
          Мои диалоги
        </Text>
        {unreadTotal > 0 && (
          <View
            className="bg-accent rounded-full items-center justify-center"
            style={{ minWidth: 24, height: 24, paddingHorizontal: 6 }}
          >
            <Text className="text-xs font-bold text-white">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </Text>
          </View>
        )}
      </View>
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
    </DesktopScreen>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <HeaderHome />

      {loading ? (
        <View className="flex-1">
          {FilterBar}
          <DesktopScreen>
            <LoadingState variant="skeleton" lines={5} />
            <LoadingState variant="skeleton" lines={5} />
            <LoadingState variant="skeleton" lines={5} />
          </DesktopScreen>
        </View>
      ) : error ? (
        <View className="flex-1">
          {FilterBar}
          <DesktopScreen>
            <ErrorState
              message="Не удалось загрузить диалоги"
              onRetry={handleRetry}
            />
          </DesktopScreen>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: isDesktop ? 48 : 32,
            paddingHorizontal: 16,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          ListHeaderComponent={<>{FilterBar}</>}
          ListEmptyComponent={
            <DesktopScreen>
              {threads.length === 0 ? (
                <EmptyState
                  icon={MessageCircle}
                  title="Вы ещё не написали ни одному клиенту"
                  subtitle="Напишите по заявке — клиент увидит ваше сообщение и сможет ответить"
                  actionLabel="Смотреть заявки"
                  onAction={() =>
                    router.push("/(specialist-tabs)/requests" as never)
                  }
                />
              ) : (
                <EmptyState
                  icon={CheckCircle}
                  title="Нет непрочитанных"
                  subtitle="Все сообщения прочитаны"
                />
              )}
            </DesktopScreen>
          }
          ListFooterComponent={<View className="h-8" />}
          renderItem={({ item }) => (
            <ThreadCardMobile
              thread={item}
              onPress={() => router.push(`/threads/${item.id}` as never)}
            />
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
      className={`px-4 rounded-full border ${
        active ? "bg-accent border-accent" : "bg-white border-border"
      }`}
      style={{ height: 36, justifyContent: "center" as const }}
    >
      <Text
        className={`text-sm font-medium ${
          active ? "text-white" : "text-text-base"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Left-pane row inside desktop two-pane layout
function ThreadCard({
  thread,
  onPress,
  selected,
}: {
  thread: ThreadItem;
  onPress: () => void;
  selected?: boolean;
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
      className="flex-row items-center"
      style={({ pressed }) => [
        {
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: selected
            ? colors.accentSoft
            : hasUnread
              ? colors.surface2
              : colors.surface,
          borderLeftWidth: hasUnread || selected ? 3 : 0,
          borderLeftColor:
            selected || hasUnread ? colors.primary : "transparent",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View className="relative mr-3">
        <View className="w-12 h-12 rounded-full bg-accent items-center justify-center">
          <Text className="text-white text-base font-bold">{initials}</Text>
        </View>
        {hasUnread && (
          <View
            className="absolute -top-0.5 -right-0.5 rounded-full bg-accent items-center justify-center"
            style={{ minWidth: 20, height: 20, paddingHorizontal: 4 }}
          >
            <Text className="text-xs font-bold text-white">
              {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1 min-w-0 mr-2">
        <View className="flex-row items-center gap-2 mb-0.5">
          <Text
            className="flex-1 text-base font-semibold text-text-base"
            numberOfLines={1}
          >
            {name}
          </Text>
          {isClosed && (
            <View className="bg-accent-soft rounded-full px-2 py-0.5">
              <Text className="text-xs font-medium text-accent">
                Закрыта
              </Text>
            </View>
          )}
        </View>

        <Text className="text-xs text-text-dim mb-1" numberOfLines={1}>
          {thread.request.title}
        </Text>

        <Text
          className={`text-sm mt-0.5 ${
            hasUnread ? "font-medium text-text-base" : "text-text-mute"
          }`}
          numberOfLines={2}
        >
          {preview}
        </Text>
      </View>

      {timeStr ? (
        <Text className="text-xs text-text-dim self-start mt-0.5">
          {timeStr}
        </Text>
      ) : null}
    </Pressable>
  );
}

// Mobile card retains the older "fat card with shadow" visual so screen
// reads well at phone widths.
function ThreadCardMobile({
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
      className="flex-row items-center bg-white border border-border rounded-xl p-4 mb-3"
      style={({ pressed }) => [
        {
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.09,
          shadowRadius: 8,
          elevation: 3,
          borderLeftWidth: hasUnread ? 3 : 0,
          borderLeftColor: hasUnread ? colors.primary : "transparent",
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View className="relative mr-3">
        <View className="w-12 h-12 rounded-full bg-accent items-center justify-center">
          <Text className="text-white text-base font-bold">{initials}</Text>
        </View>
        {hasUnread && (
          <View
            className="absolute -top-0.5 -right-0.5 rounded-full bg-accent items-center justify-center"
            style={{ minWidth: 20, height: 20, paddingHorizontal: 4 }}
          >
            <Text className="text-xs font-bold text-white">
              {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1 min-w-0 mr-2">
        <View className="flex-row items-center gap-2 mb-0.5">
          <Text
            className="flex-1 text-base font-semibold text-text-base"
            numberOfLines={1}
          >
            {name}
          </Text>
          {isClosed && (
            <View className="bg-accent-soft rounded-full px-2 py-0.5">
              <Text className="text-xs font-medium text-accent">
                Закрыта
              </Text>
            </View>
          )}
        </View>

        <Text className="text-xs text-text-dim mb-1" numberOfLines={1}>
          {thread.request.title}
        </Text>

        <Text
          className={`text-sm mt-0.5 ${
            hasUnread ? "font-medium text-text-base" : "text-text-mute"
          }`}
          numberOfLines={2}
        >
          {preview}
        </Text>
      </View>

      {timeStr ? (
        <Text className="text-xs text-text-dim self-start mt-0.5">
          {timeStr}
        </Text>
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
