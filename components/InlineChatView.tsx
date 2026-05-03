import { useState, useCallback, useRef } from "react";
import { dialog } from "@/lib/dialog";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FileText, ChevronRight, MessageCircle } from "lucide-react-native";
import MessageBubble from "@/components/MessageBubble";
import ChatComposer, { type PendingFile } from "@/components/ChatComposer";
import Lightbox, { type LightboxFile } from "@/components/files/Lightbox";
import ChatThreadHeader from "@/components/chat-inline/ChatThreadHeader";
import ClearThreadModal from "@/components/chat-inline/ClearThreadModal";
import { displayName, nameInInstrumental } from "@/components/chat-inline/chatHelpers";
import { apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import { useThreadMessages, type MessageItem } from "@/lib/hooks/useThreadMessages";
import { useLightbox } from "@/lib/hooks/useLightbox";
import { track } from "@/lib/analytics";

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
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    thread,
    loading,
    error,
    hasMoreOlder,
    loadingOlder,
    setMessages,
    loadData,
    loadOlder,
  } = useThreadMessages(threadId);

  const { lightbox, handleFilePress, handleImagePress, closeLightbox } = useLightbox();

  const isClosed = thread?.request?.status === "CLOSED";
  const myId = user?.id;

  const otherUser = thread?.otherUser ?? null;
  const otherName = otherUser ? displayName(otherUser) : "Чат";

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && pendingFiles.length === 0) || sending || !threadId) return;

    const uploadTokens: string[] = pendingFiles
      .filter((f) => f.status === "done" && f.uploadedToken)
      .map((f) => f.uploadedToken as string);

    const stillBusy = pendingFiles.some(
      (f) => f.status === "uploading" || f.status === "pending"
    );
    if (stillBusy) {
      dialog.alert({ title: "Подождите", message: "Файл ещё загружается" });
      return;
    }

    setSending(true);
    try {
      const res = await apiPost<{ message: MessageItem }>(`/api/messages/${threadId}`, {
        text: trimmed,
        ...(uploadTokens.length > 0 ? { uploadTokens } : {}),
      });
      track("thread_message_send", {
        threadId,
        hasFiles: uploadTokens.length > 0,
        textLength: trimmed.length,
      });
      setMessages((prev) => [...prev, res.message]);
      setText("");
      setPendingFiles([]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка отправки";
      dialog.alert({ title: "Ошибка", message: msg });
    } finally {
      setSending(false);
    }
  }, [text, pendingFiles, sending, threadId, setMessages]);

  const handleClearThread = useCallback(() => {
    setMenuVisible(false);
    setShowClearModal(true);
  }, []);

  const handleClearConfirm = useCallback(async () => {
    setShowClearModal(false);
    setClearingThread(true);
    try {
      await apiDelete(`/api/messages/${threadId}/clear`);
      setMessages([]);
    } catch {
      dialog.alert({ title: "Ошибка", message: "Не удалось очистить переписку" });
    } finally {
      setClearingThread(false);
    }
  }, [threadId, setMessages]);

  const handleOtherUserPress = useCallback(() => {
    if (!thread) return;
    if (thread.clientId === myId && thread.specialistId) {
      router.push(`/profile/${thread.specialistId}` as never);
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

  // S1 fix — render-time defensive sort: ascending by createdAt.
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

  const canViewSpecialistProfile = thread && myId && thread.clientId === myId;

  return (
    <View className="flex-1 bg-white">
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
            <View className="flex-1 items-center justify-center py-16 px-6">
              {/* On-brand empty state: soft accent circle (80×80) with the
                  brand-color MessageCircle icon (32×32). Replaces the prior
                  off-brand lucide/FontAwesome grey "comments-o" stock icon.
                  Matches RequestsFeed empty-state design language. */}
              <View
                className="rounded-full items-center justify-center"
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: colors.accentSoft,
                }}
              >
                <MessageCircle size={32} color={colors.accent} strokeWidth={2} />
              </View>
              <Text
                className="text-lg font-bold text-center mt-4"
                style={{ color: colors.text }}
              >
                Начните общение
              </Text>
              <Text
                className="text-sm mt-2 text-center max-w-xs"
                style={{ color: colors.textMuted, lineHeight: 20 }}
              >
                Напишите первое сообщение, чтобы начать диалог
              </Text>
            </View>
          }
        />

        {isClosed && (
          <View className="border-t px-4 py-3" style={{ backgroundColor: colors.yellowSoft, borderTopColor: colors.warning }}>
            <Text className="text-sm text-center" style={{ color: colors.primary }}>
              Запрос закрыт. Чат доступен только для чтения.
            </Text>
          </View>
        )}

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

      <Lightbox
        files={
          lightbox
            ? ([{ url: lightbox.url, filename: lightbox.filename, mimeType: lightbox.mimeType }] satisfies LightboxFile[])
            : []
        }
        visible={lightbox !== null}
        onClose={closeLightbox}
      />

      <ClearThreadModal
        visible={showClearModal}
        onCancel={() => setShowClearModal(false)}
        onConfirm={handleClearConfirm}
      />
    </View>
  );
}
