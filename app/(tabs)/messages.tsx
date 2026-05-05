import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import EmptyState from "@/components/ui/EmptyState";
import { MessageSquare } from "lucide-react-native";
import MessengerEmptyPane from "@/components/MessengerEmptyPane";
import ErrorState from "@/components/ui/ErrorState";
import InlineChatView from "@/components/InlineChatView";
import ThreadCard, { type ThreadCardItem } from "@/components/messages/ThreadCard";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiGet } from "@/lib/api";
import { sortThreads } from "@/lib/threadDisplay";
import { colors, BREAKPOINT } from "@/lib/theme";
import { useNoIndex } from "@/components/seo/NoIndex";

/**
 * Unified Inbox — iter11 UI layer (PR 2/3).
 *
 * Replaces (client-tabs)/messages + (specialist-tabs)/threads.
 * `/api/threads/my` is unified: merges both perspectives for dual-role users,
 * grouped by request, tagged with `perspective`.
 */

type ThreadItem = ThreadCardItem;

interface ThreadsMyGroup {
  request: ThreadItem["request"];
  threads: ThreadItem[];
}

export default function UnifiedInbox() {
  useNoIndex();
  const router = useRouter();
  const nav = useTypedRouter();
  const { ready } = useRequireAuth();
  const { isSpecialistUser } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const params = useLocalSearchParams<{ thread?: string }>();

  const otherPartyFallback = isSpecialistUser ? "Клиент" : "Специалист";

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    setError(null);
    try {
      const res = await apiGet<{ groups: ThreadsMyGroup[] }>("/api/threads/my");
      const flat = res.groups.flatMap((g) => g.threads);
      setThreads(flat);
    } catch (e) {
      if (__DEV__) console.error("fetch threads error:", e);
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

  useEffect(() => {
    if (params.thread && threads.length > 0) {
      const found = threads.find((t) => t.id === params.thread);
      if (found) {
        setSelectedThreadId(params.thread);
      }
    }
  }, [params.thread, threads]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchThreads();
  }, [fetchThreads]);

  const sorted = sortThreads(threads);

  const renderRow = useCallback(
    (item: ThreadItem, opts?: { onSelect?: () => void; selected?: boolean }) => (
      <ThreadCard
        item={item}
        onSelect={
          opts?.onSelect ?? (() => nav.dynamic.thread(item.id))
        }
        onUserPress={
          item.perspective === "as_client"
            ? () => nav.dynamic.specialist(item.otherUser.id)
            : undefined
        }
        selected={opts?.selected}
        otherPartyFallback={otherPartyFallback}
      />
    ),
    [nav, otherPartyFallback]
  );

  if (!ready || loading || error) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={isDesktop ? [] : ["top"]}>
        <View className="flex-1 items-center justify-center">
          {error ? (
            <ErrorState message={error} onRetry={fetchThreads} />
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const emptyState = (
    <EmptyState
      icon={MessageSquare}
      title={
        isSpecialistUser
          ? "Пока нет диалогов с клиентами"
          : "Создайте запрос, чтобы получать сообщения"
      }
      subtitle={
        isSpecialistUser
          ? "Напишите по публичному запросу — переписка появится здесь"
          : "Когда специалисты ответят на ваш запрос, сообщения появятся здесь"
      }
      actionLabel={
        isSpecialistUser ? "Посмотреть открытые запросы" : "Создать запрос"
      }
      onAction={() =>
        isSpecialistUser
          ? nav.routes.tabsPublicRequests()
          : nav.routes.requestsNew()
      }
    />
  );

  // Desktop: 2-column layout
  if (isDesktop) {
    const isWide = width >= 1024;
    const emptyPaneHint =
      sorted.length > 0
        ? `У вас ${sorted.length} ${sorted.length === 1 ? "диалог" : sorted.length < 5 ? "диалога" : "диалогов"}. Нажмите любой, чтобы открыть переписку.`
        : isSpecialistUser
          ? "Напишите по публичному запросу, чтобы начать переписку с клиентом."
          : "Когда специалисты напишут по запросам, переписки появятся слева.";
    const emptyPanePrimary = isSpecialistUser
      ? { label: "Публичные запросы", onPress: () => nav.routes.tabsPublicRequests(), icon: "sparkles" as const }
      : { label: "Создать новый запрос", onPress: () => nav.routes.requestsNew(), icon: "plus" as const };
    const emptyPaneSecondary = isSpecialistUser
      ? undefined
      : { label: "Найти специалиста", onPress: () => nav.routes.specialists(), icon: "search" as const };
    return (
      <SafeAreaView className="flex-1 bg-white" edges={[]}>
        <View className="flex-1 items-center" style={{ width: "100%", overflow: "hidden" }}>
          <View
            className="flex-1 flex-row"
            // CHAT EXCEPTION: messages benefit from full width and full
            // viewport height — no maxWidth cap, no top/bottom gutters.
            style={{
              width: "100%",
              borderTopWidth: isWide ? 1 : 0,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: 360,
                maxWidth: 400,
                flexShrink: 0,
                borderRightWidth: 1,
                borderRightColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <FlatList
                data={sorted}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) =>
                  renderRow(item, {
                    onSelect: () => {
                      setSelectedThreadId(item.id);
                      router.setParams({ thread: item.id });
                    },
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
            <View className="flex-1" style={{ minWidth: 0 }}>
              {selectedThreadId ? (
                <InlineChatView
                  threadId={selectedThreadId}
                  onThreadRead={(tid) => {
                    setThreads((prev) =>
                      prev.map((t) =>
                        t.id === tid ? { ...t, unreadCount: 0 } : t
                      )
                    );
                  }}
                />
              ) : (
                <MessengerEmptyPane
                  title="Начните общение"
                  hint={
                    sorted.length > 0
                      ? `Выберите ${isSpecialistUser ? "запрос клиента" : "переписку со специалистом"} слева, чтобы открыть чат.`
                      : emptyPaneHint
                  }
                  primary={emptyPanePrimary}
                  secondary={emptyPaneSecondary}
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
    <SafeAreaView className="flex-1 bg-white" edges={[]}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderRow(item)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={emptyState}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}
