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
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MessageBubble from "@/components/MessageBubble";
import { Avatar } from "@/components/ui";
import Input from "@/components/ui/Input";
import { API_URL, api, apiPost, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, radiusValue } from "@/lib/theme";


interface FileAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface PendingFile {
  uri: string;
  name: string;
  size: number;
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
}

interface ThreadInfo {
  id: string;
  requestId: string;
  clientId: string;
  specialistId: string;
  request: { id: string; title: string; status: string };
  client: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  specialist: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  otherUser: OtherUser;
}

function displayName(user: { firstName: string | null; lastName: string | null }): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Пользователь";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface InlineChatViewProps {
  threadId: string;
}

export default function InlineChatView({ threadId }: InlineChatViewProps) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const desktopStyle = isDesktop
    ? { maxWidth: 520, width: "100%" as const, alignSelf: "center" as const }
    : undefined;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [thread, setThread] = useState<ThreadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isClosed = thread?.request?.status === "CLOSED";
  const myId = user?.id;

  const otherUser = thread?.otherUser ?? null;
  const otherName = otherUser ? displayName(otherUser) : "Чат";

  const fetchMessages = useCallback(async () => {
    if (!threadId) return;
    try {
      const res = await api<{ messages: MessageItem[] }>(`/api/messages/${threadId}`);
      setMessages(res.messages);
    } catch (e) {
      console.error("fetch messages error:", e);
    }
  }, [threadId]);

  const fetchThread = useCallback(async () => {
    if (!threadId) return;
    try {
      const res = await api<ThreadInfo>(`/api/threads/${threadId}`);
      setThread(res);
    } catch (e) {
      console.error("fetch thread error:", e);
    }
  }, [threadId]);

  const markAsRead = useCallback(async () => {
    if (!threadId) return;
    try {
      await apiPatch(`/api/messages/${threadId}/read`, {});
    } catch (e) {
      console.error("mark read error:", e);
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

  const handleAttachFile = useCallback(async () => {
    if (pendingFiles.length >= 3) {
      Alert.alert("Лимит файлов", "Можно прикрепить не более 3 файлов");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const fileSize = asset.size ?? 0;
      if (fileSize > 10 * 1024 * 1024) {
        Alert.alert("Файл слишком большой", "Максимальный размер файла — 10 МБ");
        return;
      }
      setPendingFiles((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.name,
          size: fileSize,
          mimeType: asset.mimeType ?? "application/octet-stream",
        },
      ]);
    } catch (e) {
      console.error("document picker error:", e);
    }
  }, [pendingFiles.length]);

  const handleRemovePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadChatFile = useCallback(async (file: PendingFile, tid: string): Promise<string> => {
    const uploadToken = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
    formData.append("uploadToken", uploadToken);
    formData.append("threadId", tid);
    const token = await AsyncStorage.getItem("p2ptax_access_token");
    const res = await fetch(`${API_URL}/api/upload/chat-file`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error("Ошибка загрузки файла");
    const data = (await res.json()) as { uploadToken: string };
    return data.uploadToken;
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && pendingFiles.length === 0) || sending || !threadId) return;
    setSending(true);
    try {
      let uploadToken: string | undefined;
      if (pendingFiles.length > 0) {
        setUploading(true);
        uploadToken = await uploadChatFile(pendingFiles[0], threadId);
        setUploading(false);
      }

      const res = await apiPost<{ message: MessageItem }>(`/api/messages/${threadId}`, {
        text: trimmed,
        ...(uploadToken ? { uploadToken } : {}),
      });
      setMessages((prev) => [...prev, res.message]);
      setText("");
      setPendingFiles([]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e: unknown) {
      setUploading(false);
      const msg = e instanceof Error ? e.message : "Ошибка отправки";
      Alert.alert("Ошибка", msg);
    } finally {
      setSending(false);
    }
  }, [text, pendingFiles, sending, threadId, uploadChatFile]);

  const handleFilePress = useCallback((file: FileAttachment) => {
    const fullUrl = file.url.startsWith("http") ? file.url : `${API_URL}${file.url}`;
    Linking.openURL(fullUrl).catch(() => {
      Alert.alert("Ошибка", "Не удалось открыть файл");
    });
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: MessageItem }) => (
      <MessageBubble
        text={item.text}
        createdAt={item.createdAt}
        isOwn={item.senderId === myId}
        files={item.files}
        onFilePress={handleFilePress}
      />
    ),
    [myId, handleFilePress]
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center px-4 py-3 border-b border-border bg-white">
          <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} className="mr-3 w-11 h-11 items-center justify-center">
            <FontAwesome name="chevron-left" size={18} color={colors.primary} />
          </Pressable>
          <Text className="text-base font-semibold" style={{ color: colors.text }}>Чат</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center px-4 py-3 border-b border-border bg-white">
          <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} className="mr-3 w-11 h-11 items-center justify-center">
            <FontAwesome name="chevron-left" size={18} color={colors.primary} />
          </Pressable>
          <Text className="text-base font-semibold" style={{ color: colors.text }}>Чат</Text>
        </View>
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

  return (
    <View className="flex-1 bg-white" style={desktopStyle}>
      {/* Header with avatar + other party name + request title */}
      <View className="flex-row items-center px-4 py-3 border-b border-border bg-white">
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} className="mr-3 w-11 h-11 items-center justify-center" style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <FontAwesome name="chevron-left" size={18} color={colors.primary} />
        </Pressable>
        {otherUser ? (
          <Avatar
            name={displayName(otherUser)}
            imageUrl={otherUser.avatarUrl ?? undefined}
            size="sm"
          />
        ) : (
          <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.border }}>
            <FontAwesome name="user" size={16} color={colors.textSecondary} />
          </View>
        )}
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold" style={{ color: colors.text }} numberOfLines={1}>
            {otherName}
          </Text>
          {thread?.request?.title ? (
            <Text className="text-xs" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {thread.request.title}
            </Text>
          ) : null}
        </View>
      </View>

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
              Заявка закрыта. Чат доступен только для чтения.
            </Text>
          </View>
        )}

        {/* Pending files preview strip */}
        {pendingFiles.length > 0 && (
          <View className="flex-row flex-wrap px-3 py-2 border-t border-border bg-surface2">
            {pendingFiles.map((f, i) => (
              <View
                key={i}
                className="flex-row items-center bg-white border border-border rounded-lg px-2 py-1 mr-2 mb-1"
              >
                <FontAwesome name="file-o" size={13} color={colors.primary} />
                <Text className="text-xs mx-1 max-w-[90px]" style={{ color: colors.text }} numberOfLines={1}>
                  {f.name}
                </Text>
                <Text className="text-xs mr-1" style={{ color: colors.textSecondary }}>{formatFileSize(f.size)}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleRemovePendingFile(i)}
                  accessibilityLabel={`Удалить файл ${f.name}`}
                  style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                >
                  <FontAwesome name="times" size={11} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Input bar */}
        {!isClosed && (
          <View className="flex-row items-end border-t border-border px-3 py-2 bg-white">
            {/* Attach button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Прикрепить файл (PDF, JPG, PNG — до 10 МБ, не более 3)"
              onPress={handleAttachFile}
              disabled={pendingFiles.length >= 3 || sending}
              className="w-11 h-11 items-center justify-center mr-1"
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <FontAwesome
                name="paperclip"
                size={20}
                color={pendingFiles.length >= 3 ? colors.border : colors.textSecondary}
              />
            </Pressable>

            {/* Text input */}
            <Input
              accessibilityLabel="Введите сообщение"
              placeholder="Введите сообщение..."
              value={text}
              onChangeText={setText}
              multiline
              style={{ flex: 1 }}
              containerStyle={{ borderRadius: radiusValue.xl, minHeight: 40, maxHeight: 120 }}
            />

            {/* Send button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Отправить сообщение"
              onPress={handleSend}
              disabled={(!text.trim() && pendingFiles.length === 0) || sending}
              className="w-11 h-11 items-center justify-center ml-2"
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              {sending || uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <FontAwesome
                  name="send"
                  size={20}
                  color={(text.trim() || pendingFiles.length > 0) ? colors.primary : colors.textSecondary}
                />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
