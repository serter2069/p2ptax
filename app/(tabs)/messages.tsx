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
import MessengerEmptyPane from "@/components/MessengerEmptyPane";
import ErrorState from "@/components/ui/ErrorState";
import Avatar from "@/components/ui/Avatar";
import InlineChatView from "@/components/InlineChatView";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiGet } from "@/lib/api";
import { colors, overlay } from "@/lib/theme";

/**
 * Unified Inbox — iter11 UI layer (PR 2/3).
 *
 * Replaces (client-tabs)/messages + (specialist-tabs)/threads.
 * Backend `/api/threads` is role-aware: returns client-side threads when
 * user.isSpecialist=false, specialist-side threads when true. The screen
 * shape is the same — only the "other participant" label differs.
 *
 * TODO PR3 (post iter11): unify backend to return a single list that
 * merges both perspectives for specialists who also create their own
 * tax-help requests, grouped by request (SA requirement).
 */

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
  /**
   * Iter11 PR 3 — `/api/threads/my` tags each row with the caller's
   * perspective so a dual-role USER (both client and specialist on the
   * same request) can distinguish the two conversations in one inbox.
   */
  perspective?: "as_client" | "as_specialist";
}

/**
 * Shape returned by `GET /api/threads/my` (Iter11 PR 3). Grouped per
 * request; we flatten client-side for the existing list renderer.
 */
interface ThreadsMyGroup {
  request: ThreadItem["request"];
  threads: ThreadItem[];
}

function displayName(
  user: { firstName: string | null; lastName: string | null },
  fallback: string
): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : fallback;
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

export default function UnifiedInbox() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { isSpecialistUser } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const otherPartyFallback = isSpecialistUser ? "Клиент" : "Специалист";

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchThreads = useCallback(async () => {
    setError(null);
    try {
      // Iter11 PR 3 — unified inbox endpoint. Returns grouped-by-request;
      // we flatten to the existing list shape, keeping `perspective` tag.
      const res = await apiGet<{ groups: ThreadsMyGroup[] }>("/api/threads/my");
      const flat = res.groups.flatMap((g) => g.threads);
      setThreads(flat);
    } catch (e) {
      console.error("fetch threads error:", e);
      setError("Не удалось загрузить сообщения");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetchThreads();
  }, [ready, fetchThreads]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchThreads();
  }, [fetchThreads]);

  const sorted = sortThreads(threads);
  const filtered =
    filter === "unread" ? sorted.filter((t) => t.unreadCount > 0) : sorted;
  const unreadTotal = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  const renderThread = useCallback(
    ({
      item,
      onSelect,
      selected,
    }: {
      item: ThreadItem;
      onSelect?: () => void;
      selected?: boolean;
    }) => {
      const hasUnread = item.unreadCount > 0;
      const name = displayName(item.otherUser, otherPartyFallback);

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
          className="flex-row items-center px-4 border-b border-border active:bg-surface2"
          style={({ pressed }) => [
            {
              backgroundColor: selected
                ? colors.accentSoft
                : hasUnread
                  ? overlay.accent10
                  : colors.surface,
              minHeight: 72,
              borderLeftWidth: hasUnread ? 3 : 0,
              borderLeftColor: hasUnread ? colors.primary : "transparent",
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 3,
              elevation: 2,
            },
            pressed && { opacity: 0.75 },
          ]}
        >
          <View
            className="relative mr-3 my-3.5"
            style={{
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Avatar
              name={name}
              imageUrl={item.otherUser.avatarUrl ?? undefined}
              size="md"
            />
            <View
              className="absolute bottom-0 right-0 rounded-full bg-success"
              style={{
                width: 12,
                height: 12,
                borderWidth: 2,
                borderColor: colors.white,
              }}
            />
            {hasUnread && (
              <View
                className="absolute -top-1 -right-1 rounded-full bg-accent items-center justify-center px-1"
                style={{ minWidth: 18, height: 18 }}
              >
                <Text className="text-xs font-bold text-white">
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-1 min-w-0 py-3.5">
            <View className="flex-row items-center justify-between gap-2">
              <Text
                className={`text-base flex-1 flex-shrink ${
                  hasUnread
                    ? "font-bold text-text-base"
                    : "font-semibold text-text-base"
                }`}
                numberOfLines={1}
              >
                {name}
              </Text>
              {item.lastMessage && (
                <Text
                  className={`text-xs flex-shrink-0 ${
                    hasUnread ? "text-accent font-semibold" : "text-text-dim"
                  }`}
                >
                  {formatTime(item.lastMessage.createdAt)}
                </Text>
              )}
            </View>

            <Text className="text-xs text-text-dim mt-0.5" numberOfLines={1}>
              {item.request.title}
            </Text>

            {item.lastMessage ? (
              <Text
                className={`text-sm mt-1 ${hasUnread ? "font-semibold text-text-base" : "text-text-mute"}`}
                numberOfLines={2}
              >
                {item.lastMessage.text}
              </Text>
            ) : (
              <Text
                className="text-sm mt-1 italic text-text-dim"
                numberOfLines={1}
              >
                Нет сообщений
              </Text>
            )}
          </View>
        </Pressable>
      );
    },
    [router, otherPartyFallback]
  );

  if (!ready || loading) {
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

  const emptyState = (
    <EmptyState
      icon={MessageSquare}
      title={isSpecialistUser ? "Пока нет диалогов" : "Нет сообщений"}
      subtitle={
        isSpecialistUser
          ? "Напишите по публичной заявке — переписка появится здесь"
          : "Когда специалисты напишут по вашим заявкам, сообщения появятся здесь"
      }
      actionLabel={isSpecialistUser ? "Смотреть заявки" : "Найти специалиста"}
      onAction={() =>
        router.push(
          isSpecialistUser
            ? ("/(tabs)/public-requests" as never)
            : ("/specialists" as never)
        )
      }
    />
  );

  // Desktop: 2-column layout
  if (isDesktop) {
    const isWide = width >= 1024;
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
                    Сообщения
                  </Text>
                  {unreadTotal > 0 && (
                    <View
                      className="bg-accent rounded-full items-center justify-center"
                      style={{
                        minWidth: 24,
                        height: 24,
                        paddingHorizontal: 6,
                      }}
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
                    tintColor={colors.primary}
                  />
                }
                contentContainerStyle={{ flexGrow: 1 }}
                ListEmptyComponent={emptyState}
              />
            </View>
            <View className="flex-1">
              {selectedThreadId ? (
                <InlineChatView threadId={selectedThreadId} />
              ) : (
                <MessengerEmptyPane
                  title="Выберите диалог слева"
                  hint={
                    sorted.length > 0
                      ? `У вас ${sorted.length} ${sorted.length === 1 ? "диалог" : sorted.length < 5 ? "диалога" : "диалогов"}. Нажмите любой, чтобы открыть переписку.`
                      : isSpecialistUser
                        ? "Напишите по публичной заявке, чтобы начать переписку с клиентом."
                        : "Когда специалисты напишут по заявкам, переписки появятся слева."
                  }
                  leftHint="Список диалогов"
                  primary={
                    isSpecialistUser
                      ? {
                          label: "Публичные заявки",
                          onPress: () =>
                            router.push("/(tabs)/public-requests" as never),
                          icon: "sparkles",
                        }
                      : {
                          label: "Создать новую заявку",
                          onPress: () => router.push("/requests/new" as never),
                          icon: "plus",
                        }
                  }
                  secondary={
                    isSpecialistUser
                      ? undefined
                      : {
                          label: "Найти специалиста",
                          onPress: () => router.push("/specialists" as never),
                          icon: "sparkles",
                        }
                  }
                />
              )}
            </View>
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
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderThread({ item })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-2xl font-bold text-text-base flex-1">
                Сообщения
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
          </View>
        }
        ListEmptyComponent={emptyState}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      />
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
      style={{ height: 36, justifyContent: "center" }}
    >
      <Text
        className={`text-sm font-medium ${active ? "text-white" : "text-text-base"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
