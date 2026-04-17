import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderBack from "@/components/HeaderBack";
import MessageBubble from "@/components/MessageBubble";
import { api, apiPost, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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
}

interface ThreadInfo {
  id: string;
  requestId: string;
  clientId: string;
  specialistId: string;
  request: { id: string; title: string; status: string };
  client: { id: string; firstName: string | null; lastName: string | null };
  specialist: { id: string; firstName: string | null; lastName: string | null };
}

function displayName(user: { firstName: string | null; lastName: string | null }): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Пользователь";
}

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [thread, setThread] = useState<ThreadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isClosed = thread?.request?.status === "CLOSED";
  const myId = user?.id;

  const otherUserName = useCallback(() => {
    if (!thread || !myId) return "Чат";
    const other = thread.clientId === myId ? thread.specialist : thread.client;
    return displayName(other);
  }, [thread, myId]);

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api<{ messages: MessageItem[] }>(`/api/messages/${id}`);
      setMessages(res.messages);
    } catch (e) {
      console.error("fetch messages error:", e);
    }
  }, [id]);

  const fetchThread = useCallback(async () => {
    if (!id) return;
    try {
      // Fetch thread info from threads list filtered by this thread
      const res = await api<{ items: ThreadInfo[] }>(`/api/threads`);
      const found = res.items.find((t: ThreadInfo) => t.id === id);
      if (found) setThread(found);
    } catch (e) {
      console.error("fetch thread error:", e);
    }
  }, [id]);

  const markAsRead = useCallback(async () => {
    if (!id) return;
    try {
      await apiPatch(`/api/messages/${id}/read`, {});
    } catch (e) {
      console.error("mark read error:", e);
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
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
    };
    load();
  }, [fetchMessages, fetchThread, markAsRead]);

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
    if (!trimmed || sending || !id) return;
    setSending(true);
    try {
      const res = await apiPost<{ message: MessageItem }>(`/api/messages/${id}`, {
        text: trimmed,
      });
      setMessages((prev) => [...prev, res.message]);
      setText("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка отправки";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [text, sending, id]);

  const renderMessage = useCallback(
    ({ item }: { item: MessageItem }) => (
      <MessageBubble
        text={item.text}
        createdAt={item.createdAt}
        isOwn={item.senderId === myId}
      />
    ),
    [myId]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Чат" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && messages.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Чат" />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-red-600 text-center">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <HeaderBack title={otherUserName()} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: "flex-end" }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <FontAwesome name="comments-o" size={48} color="#94a3b8" />
              <Text className="text-sm text-slate-400 mt-3">Нет сообщений</Text>
            </View>
          }
        />

        {/* Closed banner */}
        {isClosed && (
          <View className="bg-amber-50 border-t border-amber-200 px-4 py-3">
            <Text className="text-sm text-amber-700 text-center">
              Заявка закрыта. Чат доступен только для чтения.
            </Text>
          </View>
        )}

        {/* Input bar */}
        {!isClosed && (
          <View className="flex-row items-end border-t border-slate-200 px-3 py-2 bg-white">
            <TextInput
              accessibilityLabel="Написать сообщение"
              value={text}
              onChangeText={setText}
              placeholder="Написать сообщение..."
              placeholderTextColor="#94a3b8"
              multiline
              style={{
                flex: 1,
                minHeight: 40,
                maxHeight: 120,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 16,
                color: "#0f172a",
                backgroundColor: "#f8fafc",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            />
            <Pressable
              accessibilityLabel="Отправить сообщение"
              onPress={handleSend}
              disabled={!text.trim() || sending}
              className="w-10 h-10 items-center justify-center ml-2"
            >
              {sending ? (
                <ActivityIndicator size="small" color="#1e3a8a" />
              ) : (
                <FontAwesome
                  name="send"
                  size={20}
                  color={text.trim() ? "#1e3a8a" : "#94a3b8"}
                />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
