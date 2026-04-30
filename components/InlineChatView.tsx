import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FileText, ChevronRight } from "lucide-react-native";
import MessageBubble from "@/components/MessageBubble";
import ChatComposer, { type PendingFile } from "@/components/ChatComposer";
import Lightbox, { type LightboxFile } from "@/components/files/Lightbox";
import ChatThreadHeader from "@/components/chat-inline/ChatThreadHeader";
import ClearThreadModal from "@/components/chat-inline/ClearThreadModal";
import { displayName, nameInInstrumental } from "@/components/chat-inline/chatHelpers";
import { API_URL, api, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";


interface FileAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// LightboxItem kept for internal state only; wired to <Lightbox> via LightboxFile.
interface LightboxItem {
  url: string;
  filename: string;
  mimeType: string;
}

interface MessageSender {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface MessageItem {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: MessageSender;
  files: FileAttachment[];
}

interface OtherUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  /** Soft-deleted account — render "Аккаунт удалён" instead of the name. */
  isDeleted?: boolean;
}

interface ThreadInfo {
  id: string;
  requestId: string;
  clientId: string;
  specialistId: string;
  request: { id: string; title: string; status: string };
  client: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; isDeleted?: boolean };
  specialist: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; isDeleted?: boolean };
  otherUser: OtherUser;
}

interface InlineChatViewProps {
  threadId: string;
}

/** Slim header shown only during loading / error states (no thread data yet). */
function MinimalChatHeader({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-border bg-white">
      {!isDesktop && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          onPress={() => router.back()}
          className="mr-3 w-11 h-11 items-center justify-center"
        >
          <FontAwesome name="chevron-left" size={18} color={colors.primary} />
        </Pressable>
      )}
      <Text className="text-base font-semibold" style={{ color: colors.text }}>Чат</Text>
    </View>
  );
}

export default function InlineChatView({ threadId }: InlineChatViewProps) {
  const { user, isSpecialistUser, token } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const [menuVisible, setMenuVisible] = useState(false);
  const [clearingThread, setClearingThread] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const PAGE_SIZE = 50;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [thread, setThread] = useState<ThreadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isClosed = thread?.request?.status === "CLOSED";
  const myId = user?.id;

  const otherUser = thread?.otherUser ?? null;
  const otherName = otherUser ? displayName(otherUser) : "Чат";

  // Initial fetch / refresh: pulls the latest PAGE_SIZE messages.
  // Polling reuses this; older pages stay in `messages` only on the first poll
  // (refresh resets the paged window — acceptable trade-off for poll simplicity).
  const fetchMessages = useCallback(async () => {
    if (!threadId) return;
    try {
      const res = await api<{
        messages: MessageItem[];
        hasMore?: boolean;
        nextCursor?: string | null;
      }>(`/api/messages/${threadId}?limit=${PAGE_SIZE}`);
      setMessages(res.messages);
      setHasMoreOlder(Boolean(res.hasMore));
      setOldestMessageId(res.nextCursor ?? (res.messages[0]?.id ?? null));
    } catch (e) {
      // ignore
    }
  }, [threadId]);

  // Load one page of older messages, prepending to `messages`.
  const loadOlder = useCallback(async () => {
    if (!threadId || !oldestMessageId || loadingOlder || !hasMoreOlder) return;
    setLoadingOlder(true);
    try {
      const res = await api<{
        messages: MessageItem[];
        hasMore?: boolean;
        nextCursor?: string | null;
      }>(`/api/messages/${threadId}?limit=${PAGE_SIZE}&before=${encodeURIComponent(oldestMessageId)}`);
      if (res.messages.length > 0) {
        setMessages((prev) => [...res.messages, ...prev]);
      }
      setHasMoreOlder(Boolean(res.hasMore));
      setOldestMessageId(res.nextCursor ?? (res.messages[0]?.id ?? oldestMessageId));
    } catch (e) {
      if (__DEV__) console.error("load older messages error:", e);
    } finally {
      setLoadingOlder(false);
    }
  }, [threadId, oldestMessageId, loadingOlder, hasMoreOlder]);

  const fetchThread = useCallback(async () => {
    if (!threadId) return;
    try {
      const res = await api<ThreadInfo>(`/api/threads/${threadId}`);
      setThread(res);
    } catch (e) {
      // ignore
    }
  }, [threadId]);

  const markAsRead = useCallback(async () => {
    if (!threadId) return;
    try {
      await apiPatch(`/api/messages/${threadId}/read`, {});
    } catch (e) {
      // ignore
    }
  }, [threadId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchMessages(), fetchThread()]);
      await markAsRead();
    } catch {
      setError("Не удалось загрузить сообщения");
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, fetchThread, markAsRead]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && pendingFiles.length === 0) || sending || !threadId) return;

    // Wave 2/G — hard gate: stranded specialists (isSpecialist=true,
    // specialistProfileCompletedAt=null) cannot send messages because
    // they're invisible in the catalog. Force them to finish onboarding
    // before the message leaves the client.
    if (isSpecialistUser && !user?.specialistProfileCompletedAt) {
      if (Platform.OS === "web") {
        if (
          typeof window !== "undefined" &&
          typeof window.confirm === "function" &&
          window.confirm(
            "Завершите профиль\n\nПеред тем как писать клиенту, завершите профиль специалиста."
          )
        ) {
          router.push("/onboarding/name" as never);
        }
      } else {
        Alert.alert(
          "Завершите профиль",
          "Перед тем как писать клиенту, завершите профиль специалиста.",
          [
            { text: "Отмена", style: "cancel" },
            { text: "Завершить", onPress: () => router.push("/onboarding/name" as never) },
          ]
        );
      }
      return;
    }

    // Files are uploaded immediately on pick by FileUploadZone, so by send-time
    // each "done" file already has its uploadedToken. Send ALL ready file
    // tokens — the API accepts uploadTokens[] (bug #3 fix: previously only
    // the first file was attached, regardless of maxFiles).
    const uploadTokens: string[] = pendingFiles
      .filter((f) => f.status === "done" && f.uploadedToken)
      .map((f) => f.uploadedToken as string);

    // Block send if user attached a file that is still uploading or errored.
    const stillBusy = pendingFiles.some(
      (f) => f.status === "uploading" || f.status === "pending"
    );
    if (stillBusy) {
      if (Platform.OS === "web") {
        window.alert("Файл ещё загружается. Подождите.");
      } else {
        Alert.alert("Подождите", "Файл ещё загружается");
      }
      return;
    }

    setSending(true);
    try {
      const res = await apiPost<{ message: MessageItem }>(`/api/messages/${threadId}`, {
        text: trimmed,
        ...(uploadTokens.length > 0 ? { uploadTokens } : {}),
      });
      setMessages((prev) => [...prev, res.message]);
      setText("");
      setPendingFiles([]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка отправки";
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert(`Ошибка: ${msg}`);
        }
      } else {
        Alert.alert("Ошибка", msg);
      }
    } finally {
      setSending(false);
    }
  }, [text, pendingFiles, sending, threadId, isSpecialistUser, user?.specialistProfileCompletedAt]);

  const handleFilePress = useCallback((file: FileAttachment) => {
    const fullUrl = file.url.startsWith("http") ? file.url : `${API_URL}${file.url}`;
    setLightbox({ url: fullUrl, filename: file.filename, mimeType: file.mimeType });
  }, []);

  const handleImagePress = useCallback((url: string, filename: string) => {
    const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
    setLightbox({ url: fullUrl, filename, mimeType: "image/jpeg" });
  }, []);

  const handleClearThread = useCallback(() => {
    setMenuVisible(false);
    setShowClearModal(true);
  }, []);

  const handleClearConfirm = useCallback(async () => {
    setShowClearModal(false);
    setClearingThread(true);
    try {
      await apiDelete(`/api/messages/${threadId}/clear`);
      // Stay on the thread page — just clear local message list
      setMessages([]);
    } catch (e) {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert("Ошибка: Не удалось очистить переписку");
        }
      } else {
        Alert.alert("Ошибка", "Не удалось очистить переписку");
      }
    } finally {
      setClearingThread(false);
    }
  }, [threadId]);

  const handleOtherUserPress = useCallback(() => {
    if (!thread) return;
    // Navigate to specialist profile only when current user is the client
    if (thread.clientId === myId && thread.specialistId) {
      router.push(`/specialists/${thread.specialistId}` as never);
    }
  }, [thread, myId]);

  const renderMessage = useCallback(
    ({ item }: { item: MessageItem }) => (
      <MessageBubble
        text={item.text}
        createdAt={item.createdAt}
        isOwn={item.senderId === myId}
        files={item.files}
        onFilePress={handleFilePress}
        onImagePress={handleImagePress}
      />
    ),
    [myId, handleFilePress, handleImagePress]
  );

  // S1 fix — render-time defensive sort: ascending by createdAt (Date timestamp).
  // The API already returns ASC, but optimistic appends in handleSend + polling races
  // can interleave messages so a reply lands above older ones. Sorting here guarantees
  // chronological order regardless of how state was updated. Stable sort keeps within-ms ties.
  const sortedMessages = (() => {
    if (messages.length < 2) return messages;
    return [...messages].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
  })();

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <MinimalChatHeader isDesktop={isDesktop} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <MinimalChatHeader isDesktop={isDesktop} />
        <View className="flex-1 items-center justify-center px-4">
          <FontAwesome name="exclamation-circle" size={40} color={colors.danger} />
          <Text className="text-base text-center mt-3" style={{ color: colors.danger }}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Повторить"
            onPress={loadData}
            className="mt-4 px-6 py-3 rounded-xl"
            style={({ pressed }) => [{ backgroundColor: colors.primary }, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
          >
            <Text className="text-white text-sm font-semibold">Повторить</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Determine if current user is the client (can navigate to specialist profile)
  const canViewSpecialistProfile = thread && myId && thread.clientId === myId;

  return (
    <View className="flex-1 bg-white">
      {/* Header — extracted to ChatThreadHeader for LOC reduction */}
      <ChatThreadHeader
        isDesktop={isDesktop}
        otherUser={otherUser}
        otherName={otherName}
        thread={thread}
        myId={myId}
        menuVisible={menuVisible}
        clearingThread={clearingThread}
        canViewSpecialistProfile={Boolean(canViewSpecialistProfile)}
        nameInInstrumental={nameInInstrumental}
        displayName={displayName}
        onMenuToggle={() => setMenuVisible((v) => !v)}
        onOtherUserPress={handleOtherUserPress}
        onClearThread={handleClearThread}
      />

      {/* Source request link strip — visible when thread was created from a request */}
      {thread?.requestId ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Открыть запрос ${thread.request?.title ?? ""}`}
          onPress={() => router.push(`/requests/${thread.requestId}/detail` as never)}
          style={({ pressed }) => [
            {
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.surface2,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              gap: 8,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <FileText size={14} color={colors.accent} />
          <Text style={{ flex: 1, fontSize: 13, color: colors.text }} numberOfLines={1}>
            По запросу: {thread.request?.title || "Запрос"}
          </Text>
          <ChevronRight size={14} color={colors.textMuted} />
        </Pressable>
      ) : null}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={sortedMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: "flex-end" }}
          onContentSizeChange={() => {
            // Scroll to bottom only on initial load / new messages.
            // When loading older messages, prepended items would otherwise
            // jerk the list to the bottom. `loadingOlder` short-circuits that.
            if (!loadingOlder) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListHeaderComponent={
            hasMoreOlder ? (
              <View className="items-center py-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Загрузить старые сообщения"
                  onPress={loadOlder}
                  disabled={loadingOlder}
                  className="px-4 py-2 rounded-xl border border-slate-200"
                  style={({ pressed }) => [
                    { backgroundColor: "#f8fafc" },
                    pressed && { opacity: 0.7 },
                    loadingOlder && { opacity: 0.6 },
                  ]}
                >
                  {loadingOlder ? (
                    <ActivityIndicator size="small" color="#1e3a8a" />
                  ) : (
                    <Text className="text-sm font-medium" style={{ color: "#1e3a8a" }}>
                      Загрузить старые сообщения
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <FontAwesome name="comments-o" size={48} color={colors.textSecondary} />
              <Text className="text-base font-medium mt-4" style={{ color: colors.textSecondary }}>Начните общение</Text>
              <Text className="text-sm mt-1 text-center px-4" style={{ color: colors.textSecondary }}>
                Напишите сообщение, чтобы начать диалог
              </Text>
            </View>
          }
        />

        {/* Request closed banner */}
        {isClosed && (
          <View className="border-t px-4 py-3" style={{ backgroundColor: colors.yellowSoft, borderTopColor: colors.warning }}>
            <Text className="text-sm text-center" style={{ color: colors.primary }}>
              Запрос закрыт. Чат доступен только для чтения.
            </Text>
          </View>
        )}

        {/* Unified chat composer (text + files + drag-and-drop). */}
        {!isClosed && (
          <ChatComposer
            value={text}
            onChangeText={setText}
            files={pendingFiles}
            onFilesChange={setPendingFiles}
            onSend={handleSend}
            sending={sending}
            authToken={token}
          />
        )}
      </KeyboardAvoidingView>

      {/* File / Image lightbox — unified Lightbox component */}
      <Lightbox
        files={
          lightbox
            ? ([{ url: lightbox.url, filename: lightbox.filename, mimeType: lightbox.mimeType }] satisfies LightboxFile[])
            : []
        }
        visible={lightbox !== null}
        onClose={() => setLightbox(null)}
      />

      {/* Clear thread confirmation modal — extracted to ClearThreadModal */}
      <ClearThreadModal
        visible={showClearModal}
        onCancel={() => setShowClearModal(false)}
        onConfirm={handleClearConfirm}
      />
    </View>
  );
}
