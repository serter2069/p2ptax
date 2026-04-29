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
import InboxFilterChips, {
  type InboxFilter,
  type InboxRoleFilter,
} from "@/components/messages/InboxFilterChips";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiGet } from "@/lib/api";
import { sortThreads } from "@/lib/threadDisplay";
import { colors, BREAKPOINT } from "@/lib/theme";

/**
 * Unified Inbox — iter11 UI layer (PR 2/3).
 *
 * Replaces (client-tabs)/messages + (specialist-tabs)/threads.
 * Backend `/api/threads` is role-aware: returns client-side threads when
 * user.isSpecialist=false, specialist-side threads when true. The screen
 * shape is the same — only the "other participant" label differs.
 *
 * `/api/threads/my` (PR3) is already unified: it merges both perspectives
 * for dual-role users, grouped by request, tagged with `perspective`.
 */

type ThreadItem = ThreadCardItem;

/**
 * Shape returned by `GET /api/threads/my` (Iter11 PR 3). Grouped per
 * request; we flatten client-side for the existing list renderer.
 */
interface ThreadsMyGroup {
  request: ThreadItem["request"];
  threads: ThreadItem[];
}

export default function UnifiedInbox() {
  const router = useRouter();
  const nav = useTypedRouter();
  const { ready } = useRequireAuth();
  const { isSpecialistUser, user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const params = useLocalSearchParams<{ thread?: string }>();

  const otherPartyFallback = isSpecialistUser ? "Клиент" : "Специалист";

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [roleFilter, setRoleFilter] = useState<InboxRoleFilter>("all");

  /**
   * Dual-role users (USER.isSpecialist === true) can have threads in both
   * `as_client` and `as_specialist` perspectives. Show the second filter
   * chip row only for them — single-role users would never see anything
   * but "all".
   */
  const isDualRole = user?.isSpecialist === true;

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

  // Auto-select thread from URL search param (restores state on navigation/reload)
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
  const afterUnread =
    filter === "unread" ? sorted.filter((t) => t.unreadCount > 0) : sorted;
  const filtered =
    roleFilter === "all"
      ? afterUnread
      : afterUnread.filter(
          (t) =>
            t.perspective ===
            (roleFilter === "client" ? "as_client" : "as_specialist")
        );
  const unreadTotal = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  const renderRow = useCallback(
    (item: ThreadItem, opts?: { onSelect?: () => void; selected?: boolean }) => (
      <ThreadCard
        item={item}
        onSelect={
          opts?.onSelect ?? (() => nav.any(`/threads/${item.id}`))
        }
        onUserPress={
          item.perspective === "as_client"
            ? () => nav.any(`/specialists/${item.otherUser.id}`)
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
          : "Создайте заявку, чтобы получать сообщения"
      }
      subtitle={
        isSpecialistUser
          ? "Напишите по публичной заявке — переписка появится здесь"
          : "Когда специалисты ответят на вашу заявку, сообщения появятся здесь"
      }
      actionLabel={
        isSpecialistUser ? "Посмотреть открытые заявки" : "Создать заявку"
      }
      onAction={() =>
        router.push(
          isSpecialistUser
            ? ("/(tabs)/public-requests" as never)
            : ("/requests/new" as never)
        )
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
          ? "Напишите по публичной заявке, чтобы начать переписку с клиентом."
          : "Когда специалисты напишут по заявкам, переписки появятся слева.";
    const emptyPanePrimary = isSpecialistUser
      ? { label: "Публичные заявки", onPress: () => nav.routes.tabsPublicRequests(), icon: "sparkles" as const }
      : { label: "Создать новую заявку", onPress: () => nav.routes.requestsNew(), icon: "plus" as const };
    const emptyPaneSecondary = isSpecialistUser
      ? undefined
      : { label: "Найти специалиста", onPress: () => nav.routes.specialists(), icon: "search" as const };
    return (
      <SafeAreaView className="flex-1 bg-white" edges={[]}>
        <View className="flex-1 items-center" style={{ width: "100%", overflow: "hidden" }}>
          <View
            className="flex-1 flex-row"
            style={{
              width: "100%",
              maxWidth: isWide ? 1200 : "100%",
              borderWidth: isWide ? 1 : 0,
              borderColor: colors.border,
              borderRadius: isWide ? 12 : 0,
              overflow: "hidden",
              marginTop: isWide ? 24 : 0,
              marginBottom: isWide ? 24 : 0,
            }}
          >
            {/* Wave 6 polish — widened from 320/360 to 360/400. At 320 the
                ThreadCard squeezes the name column hard: with avatar (44 + 12
                margin) + perspective badge (~70) + timestamp (~50) the name
                gets ~140-160px and "Алексей Воронов" truncates to "Алексей
                Во…". Bumping by 40px adds enough room for two-word names. */}
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
                <InboxFilterChips
                  variant="desktop"
                  filter={filter}
                  roleFilter={roleFilter}
                  isDualRole={isDualRole}
                  onFilterChange={setFilter}
                  onRoleFilterChange={setRoleFilter}
                  unreadTotal={unreadTotal}
                />
              </View>
              <FlatList
                data={filtered}
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
                <InlineChatView threadId={selectedThreadId} />
              ) : (
                <MessengerEmptyPane
                  title="Выберите диалог слева"
                  hint={emptyPaneHint}
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
    <SafeAreaView className="flex-1 bg-white" edges={isDesktop ? [] : ["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderRow(item)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
            <InboxFilterChips
              variant="mobile"
              filter={filter}
              roleFilter={roleFilter}
              isDualRole={isDualRole}
              onFilterChange={setFilter}
              onRoleFilterChange={setRoleFilter}
              unreadTotal={unreadTotal}
            />
          </View>
        }
        ListEmptyComponent={emptyState}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}
