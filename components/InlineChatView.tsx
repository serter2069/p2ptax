import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Alert,
  Image,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FileText, ChevronRight } from "lucide-react-native";
import MessageBubble from "@/components/MessageBubble";
import { Avatar } from "@/components/ui";
import Input from "@/components/ui/Input";
import PerspectiveBadge from "@/components/ui/PerspectiveBadge";
import { API_URL, api, apiPost, apiPatch, apiDelete } from "@/lib/api";
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

interface LightboxItem {
  url: string;
  filename: string;
  isImage: boolean;
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

function displayName(user: { firstName: string | null; lastName: string | null; isDeleted?: boolean }): string {
  if (user.isDeleted) return "Аккаунт удалён";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Пользователь";
}

/**
 * Inline Russian instrumental-case helper for first+last names.
 * Pragmatic suffix rules — handles common cases for "переписываетесь с <Name>".
 * Track U will replace this with a proper library-level helper (lib/ru.ts) later.
 *
 * Rules covered:
 *   мужские имена: -ей → -еем (Алексей → Алексеем), -й → -ем (Сергей → Сергеем), -а/я → -ой/ей,
 *                   -consonant → +ом (Иван → Иваном)
 *   мужские фамилии: -ов/ев/ёв/ин/ын → +ым (Воронов → Вороновым, Пушкин → Пушкиным)
 *   женские: -а → -ой, -я → -ей (Анна → Анной, Юлия → Юлией)
 *   фамилии на -ова/ева/ина/ына → -овой/евой/иной/ыной
 * Unknowns return original token.
 */
function tokenInInstrumental(token: string): string {
  if (!token) return token;
  const lower = token.toLowerCase();

  // Female surnames: -ова/ева/ёва/ина/ына → -овой/евой/ёвой/иной/ыной
  if (/(?:ова|ева|ёва|ина|ына)$/.test(lower)) {
    return token.slice(0, -1) + "ой";
  }
  // Female surnames: -ская → -ской
  if (/ская$/.test(lower)) {
    return token.slice(0, -2) + "ой";
  }
  // Male surnames: -ов/ев/ёв/ин/ын → +ым
  if (/(?:ов|ев|ёв|ин|ын)$/.test(lower)) {
    return token + "ым";
  }
  // Male surnames: -ский/цкий → -ским/цким
  if (/(?:ский|цкий)$/.test(lower)) {
    return token.slice(0, -2) + "им";
  }

  // First names ending -ей (Алексей, Андрей, Сергей*) → -еем
  // (Сергей → Сергеем — collapses with -ей rule)
  if (/ей$/.test(lower)) {
    return token.slice(0, -2) + "еем";
  }
  // -ай/-ой/-уй ends → -аем/-оем/-уем (rare but safer than -ем)
  if (/[аоу]й$/.test(lower)) {
    return token.slice(0, -1) + "ем";
  }
  // Generic -й → -ем (Николай → Николаем would match -ай above; Юрий → Юрием handled below)
  if (/ий$/.test(lower)) {
    return token.slice(0, -2) + "ием";
  }
  if (/й$/.test(lower)) {
    return token.slice(0, -1) + "ем";
  }

  // -ия (female): Юлия → Юлией, Мария → Марией
  if (/ия$/.test(lower)) {
    return token.slice(0, -1) + "ей";
  }
  // -я (female/male soft): Аня → Аней, Илья → Ильёй (not handled — return -ей as best-effort)
  if (/я$/.test(lower)) {
    return token.slice(0, -1) + "ей";
  }
  // -а (female or male like Никита): default to -ой
  // Special: hissing stems (ж/ш/щ/ч/ц + а) → -ей (Саша → Сашей). Approximate.
  if (/[жшщчц]а$/.test(lower)) {
    return token.slice(0, -1) + "ей";
  }
  if (/а$/.test(lower)) {
    return token.slice(0, -1) + "ой";
  }

  // Male names ending in soft sign -ь (Игорь → Игорем)
  if (/ь$/.test(lower)) {
    return token.slice(0, -1) + "ем";
  }

  // Male names ending in consonant (Иван, Петр) → +ом
  // Russian consonant set check (last letter)
  if (/[бвгджзйклмнпрстфхцчшщ]$/.test(lower)) {
    return token + "ом";
  }

  return token;
}

function nameInInstrumental(fullName: string): string {
  if (!fullName) return fullName;
  return fullName
    .split(/\s+/)
    .map((part) => tokenInInstrumental(part))
    .join(" ");
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
  const { user, isSpecialistUser } = useAuth();
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
  const [uploading, setUploading] = useState(false);
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
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
      console.error("load older messages error:", e);
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
      // ignore
    }
  }, [pendingFiles.length]);

  const handleRemovePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleWebFileDrop = useCallback(async (file: File) => {
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      Alert.alert("Файл слишком большой", "Максимум 10 МБ");
      return;
    }
    if (pendingFiles.length >= 3) {
      Alert.alert("Лимит файлов", "Можно прикрепить не более 3 файлов");
      return;
    }
    const pending: PendingFile = {
      uri: URL.createObjectURL(file),
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    };
    setPendingFiles((prev) => [...prev, pending]);
  }, [pendingFiles.length]);

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

    // Wave 2/G — hard gate: stranded specialists (isSpecialist=true,
    // specialistProfileCompletedAt=null) cannot send messages because
    // they're invisible in the catalog. Force them to finish onboarding
    // before the message leaves the client.
    if (isSpecialistUser && !user?.specialistProfileCompletedAt) {
      Alert.alert(
        "Завершите профиль",
        "Перед тем как писать клиенту, завершите профиль специалиста.",
        [
          { text: "Отмена", style: "cancel" },
          { text: "Завершить", onPress: () => router.push("/onboarding/name" as never) },
        ]
      );
      return;
    }

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
  }, [text, pendingFiles, sending, threadId, uploadChatFile, isSpecialistUser, user?.specialistProfileCompletedAt]);

  const handleFilePress = useCallback((file: FileAttachment) => {
    const fullUrl = file.url.startsWith("http") ? file.url : `${API_URL}${file.url}`;
    setLightbox({ url: fullUrl, filename: file.filename, isImage: false });
  }, []);

  const handleImagePress = useCallback((url: string, filename: string) => {
    const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
    setLightbox({ url: fullUrl, filename, isImage: true });
  }, []);

  const handleClearThread = useCallback(() => {
    setMenuVisible(false);
    setShowClearModal(true);
  }, []);

  const handleClearConfirm = useCallback(async () => {
    setShowClearModal(false);
    setClearingThread(true);
    try {
      await apiDelete(`/api/threads/${threadId}`);
      router.back();
    } catch (e) {
      setClearingThread(false);
      Alert.alert("Ошибка", "Не удалось очистить переписку");
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
        <View className="flex-row items-center px-4 py-3 border-b border-border bg-white">
          {!isDesktop && (
            <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} className="mr-3 w-11 h-11 items-center justify-center">
              <FontAwesome name="chevron-left" size={18} color={colors.primary} />
            </Pressable>
          )}
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
          {!isDesktop && (
            <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} className="mr-3 w-11 h-11 items-center justify-center">
              <FontAwesome name="chevron-left" size={18} color={colors.primary} />
            </Pressable>
          )}
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

  // Determine if current user is the client (can navigate to specialist profile)
  const canViewSpecialistProfile = thread && myId && thread.clientId === myId;

  return (
    <View className="flex-1 bg-white">
      {/* Header with avatar + other party name + perspective badge + counterparty hint */}
      <View className="flex-row items-center px-4 py-3 border-b border-border bg-white">
        {!isDesktop && (
          <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} className="mr-3 w-11 h-11 items-center justify-center" style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <FontAwesome name="chevron-left" size={18} color={colors.primary} />
          </Pressable>
        )}
        {/* Avatar + name: tappable → specialist profile (client view only) */}
        <Pressable
          accessibilityRole={canViewSpecialistProfile ? "link" : "none"}
          accessibilityLabel={canViewSpecialistProfile ? `Профиль специалиста ${otherName}` : undefined}
          onPress={canViewSpecialistProfile ? handleOtherUserPress : undefined}
          className="flex-row items-start flex-1 min-w-0"
          style={({ pressed }) => [pressed && canViewSpecialistProfile ? { opacity: 0.7 } : undefined]}
        >
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
          <View className="ml-3 flex-1 min-w-0" style={{ gap: 4 }}>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Text className="text-base font-semibold flex-shrink" style={{ color: colors.text }} numberOfLines={1}>
                {otherName}
              </Text>
              {thread && myId ? (
                thread.clientId === myId ? (
                  <PerspectiveBadge perspective="as_client" size="md" />
                ) : thread.specialistId === myId ? (
                  <PerspectiveBadge perspective="as_specialist" size="md" />
                ) : null
              ) : null}
            </View>
            {thread && myId ? (
              (() => {
                const myPerspective: "as_client" | "as_specialist" | null =
                  thread.clientId === myId
                    ? "as_client"
                    : thread.specialistId === myId
                      ? "as_specialist"
                      : null;
                if (!myPerspective) return null;
                const counterpartyFallback =
                  myPerspective === "as_client" ? "Специалистом" : "Клиентом";
                const namedCounterparty = otherUser && !otherUser.isDeleted
                  ? nameInInstrumental(displayName(otherUser))
                  : counterpartyFallback;
                return (
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    Вы переписываетесь с {namedCounterparty}
                  </Text>
                );
              })()
            ) : null}
          </View>
        </Pressable>

        {/* Three-dots menu button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Меню чата"
          onPress={() => setMenuVisible((v) => !v)}
          disabled={clearingThread}
          className="w-10 h-10 items-center justify-center ml-1"
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          {clearingThread ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={{ fontSize: 22, color: colors.textSecondary, lineHeight: 24 }}>
              {"⋯"}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Dropdown menu */}
      {menuVisible && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setMenuVisible(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 56,
              right: 12,
              backgroundColor: "#fff",
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              minWidth: 200,
              zIndex: 20,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Очистить переписку"
              onPress={handleClearThread}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderRadius: 10,
                },
                pressed && { backgroundColor: "#fef2f2" },
              ]}
            >
              <FontAwesome name="trash-o" size={16} color={colors.danger} />
              <Text style={{ color: colors.danger, fontSize: 15 }}>
                Очистить переписку
              </Text>
            </Pressable>
          </View>
        </Pressable>
      )}

      {/* Source request link strip — visible when thread was created from a request */}
      {thread?.requestId ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Открыть заявку ${thread.request?.title ?? ""}`}
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
            По заявке: {thread.request?.title || "Заявка"}
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
          <View
            className="flex-row items-end border-t border-border px-3 py-2 bg-white"
            style={dragOver ? { backgroundColor: colors.accentSoft } as object : undefined}
            {...(Platform.OS === "web" ? {
              onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); },
              onDragLeave: () => setDragOver(false),
              onDrop: (e: React.DragEvent) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleWebFileDrop(file);
              },
            } as object : {})}
          >
            {dragOver && Platform.OS === "web" && (
              <View
                className="absolute inset-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: "rgba(0,0,0,0.05)", zIndex: 10 }}
                pointerEvents="none"
              >
                <Text className="text-sm font-medium text-text-dim">Перетащите файл сюда</Text>
              </View>
            )}
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

      {/* Clear thread confirmation modal */}
      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 }}
          onPress={() => setShowClearModal(false)}
        >
          <Pressable
            onPress={() => {/* prevent dismiss on inner press */}}
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 360,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 16,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
              Очистить переписку?
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 24 }}>
              Вы и ваш собеседник не сможете получить к ней доступ. Она будет удалена с серверов.
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Отмена"
                onPress={() => setShowClearModal(false)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colors.surface2,
                    minHeight: 44,
                    justifyContent: "center",
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Отмена</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Очистить переписку"
                onPress={handleClearConfirm}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: colors.danger,
                    minHeight: 44,
                    justifyContent: "center",
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Очистить</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
