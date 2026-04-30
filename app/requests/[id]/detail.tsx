import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { File, FileImage, Download, ChevronLeft, MessageSquare } from "lucide-react-native";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import ThreadsList, { ThreadSummary } from "@/components/requests/ThreadsList";
import { api, apiPost, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, BREAKPOINT } from "@/lib/theme";

import { FileItem } from "@/components/requests/detail/types";

interface RequestDetailData {
  viewType: "owner" | "specialist";
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  createdAt: string;
  lastActivityAt: string;
  extensionsCount: number;
  maxExtensions: number;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  files: FileItem[];
  threadsCount: number;
  unreadMessages: number;
  isOwner: boolean;
  hasExistingThread: boolean;
  existingThreadId: string | null;
  client: { name: string } | null;
}

// ─── Shared file list ─────────────────────────────────────────────────────────

function FileList({ files, onPress }: { files: FileItem[]; onPress: (f: FileItem) => void }) {
  if (files.length === 0) return null;
  return (
    <View
      className="bg-white rounded-2xl p-4 mb-4"
      style={{ shadowColor: colors.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
    >
      <Text className="text-xs font-semibold text-text-mute mb-3 uppercase tracking-wide">
        Прикреплённые документы
      </Text>
      {files.map((file) => (
        <Pressable
          accessibilityRole="button"
          key={file.id}
          accessibilityLabel={`Открыть файл ${file.filename}`}
          onPress={() => onPress(file)}
          className="flex-row items-center bg-surface2 rounded-xl p-3 mb-2"
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          {file.mimeType === "application/pdf"
            ? <File size={20} color={colors.primary} />
            : <FileImage size={20} color={colors.primary} />
          }
          <View className="ml-3 flex-1">
            <Text className="text-sm text-text-base" numberOfLines={1}>{file.filename}</Text>
            <Text className="text-xs text-text-mute">{(file.size / 1024).toFixed(0)} КБ</Text>
          </View>
          <Download size={14} color={colors.placeholder} />
        </Pressable>
      ))}
    </View>
  );
}

// ─── Shared info block ────────────────────────────────────────────────────────

function RequestInfoBlock({ request }: { request: RequestDetailData }) {
  const createdDate = new Date(request.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Status + date */}
      <View className="flex-row items-center mb-3">
        <StatusBadge status={request.status} />
        <Text className="text-sm text-text-mute ml-3">{createdDate}</Text>
      </View>

      {/* City + FNS chips */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="bg-white border border-border px-3 py-1 rounded-lg">
          <Text className="text-sm text-text-base">{request.city.name}</Text>
        </View>
        <View className="bg-white border border-border px-3 py-1 rounded-lg">
          <Text className="text-sm text-text-base">
            {request.fns.name} ({request.fns.code})
          </Text>
        </View>
      </View>

      {/* Description */}
      <View
        className="bg-white rounded-2xl p-4 mb-4"
        style={{ shadowColor: colors.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
      >
        <Text className="text-xs font-semibold text-text-mute mb-2 uppercase tracking-wide">
          Описание
        </Text>
        <Text className="text-base text-text-base leading-6">{request.description}</Text>
      </View>
    </>
  );
}

// ─── OwnerView ────────────────────────────────────────────────────────────────

function OwnerView({
  request,
  threads,
  onFilePress,
  onExtend,
  extending,
  onClose,
}: {
  request: RequestDetailData;
  threads: ThreadSummary[];
  onFilePress: (f: FileItem) => void;
  onExtend: () => void;
  extending: boolean;
  onClose: () => void;
}) {
  const nav = useTypedRouter();
  const canExtend =
    request.status === "CLOSING_SOON" &&
    request.extensionsCount < request.maxExtensions;

  return (
    <>
      <RequestInfoBlock request={request} />

      <FileList files={request.files} onPress={onFilePress} />

      {/* Extend button */}
      {canExtend && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Продлить заявку"
          onPress={onExtend}
          disabled={extending}
          className="bg-warning rounded-xl py-3 items-center mb-4"
          style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
        >
          {extending ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text className="text-white font-semibold text-base">
              Продлить заявку — Продлений: {request.extensionsCount}/{request.maxExtensions}
            </Text>
          )}
        </Pressable>
      )}

      {/* Extend limit banner */}
      {request.status === "CLOSING_SOON" && request.extensionsCount >= request.maxExtensions && (
        <View className="bg-warning-soft border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <Text className="text-sm text-warning text-center font-medium">
            Продление использовано ({request.extensionsCount}/{request.maxExtensions})
          </Text>
        </View>
      )}

      <ThreadsList
        threads={threads}
        requestId={request.id}
        threadsCount={request.threadsCount}
        unreadMessages={request.unreadMessages}
        onOpenThread={(threadId) => nav.any(`/threads/${threadId}`)}
      />

      {/* Close request button */}
      {request.status !== "CLOSED" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть заявку"
          onPress={onClose}
          className="border border-danger rounded-xl py-3 items-center mb-6"
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <Text className="text-danger font-semibold text-sm">Закрыть заявку</Text>
        </Pressable>
      )}
    </>
  );
}

// ─── SpecialistView ───────────────────────────────────────────────────────────

function SpecialistView({
  request,
  onFilePress,
  onThreadCreated,
}: {
  request: RequestDetailData;
  onFilePress: (f: FileItem) => void;
  onThreadCreated: (threadId: string) => void;
}) {
  const nav = useTypedRouter();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  const handleRespond = useCallback(async () => {
    if (sending) return;
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setMsgError("Сообщение слишком короткое (минимум 10 символов)");
      return;
    }
    setMsgError(null);
    setSending(true);
    try {
      const res = await apiPost<{ id: string }>("/api/threads", {
        requestId: request.id,
        firstMessage: trimmed,
      });
      onThreadCreated(res.id);
    } catch (e: unknown) {
      // Thread already exists — server returns threadId in 409
      if (e && typeof e === "object" && "threadId" in e) {
        onThreadCreated((e as { threadId: string }).threadId);
        return;
      }
      const msg = e instanceof Error ? e.message : "Не удалось отправить сообщение";
      setMsgError(msg);
    } finally {
      setSending(false);
    }
  }, [message, sending, request.id, onThreadCreated]);

  return (
    <>
      <RequestInfoBlock request={request} />

      {/* Client info */}
      {request.client && (
        <View
          className="bg-white rounded-2xl p-4 mb-4"
          style={{ shadowColor: colors.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
        >
          <Text className="text-xs font-semibold text-text-mute mb-1 uppercase tracking-wide">Клиент</Text>
          <Text className="text-base text-text-base">{request.client.name}</Text>
        </View>
      )}

      <FileList files={request.files} onPress={onFilePress} />

      {/* CTA: go to existing thread OR compose */}
      {request.hasExistingThread && request.existingThreadId ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Перейти к диалогу"
          onPress={() => nav.any(`/threads/${request.existingThreadId}`)}
          className="bg-accent rounded-xl py-3.5 items-center mb-6 flex-row justify-center gap-2"
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <MessageSquare size={18} color="#fff" />
          <Text className="text-white font-semibold text-base ml-2">Перейти к диалогу</Text>
        </Pressable>
      ) : (
        <View className="mb-6">
          <View
            className="bg-white rounded-2xl p-4 mb-3"
            style={{ shadowColor: colors.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
          >
            <Text className="text-xs font-semibold text-text-mute mb-2 uppercase tracking-wide">
              Откликнуться
            </Text>
            <TextInput
              value={message}
              onChangeText={(t) => { setMessage(t); setMsgError(null); }}
              placeholder="Напишите сообщение клиенту (минимум 10 символов)..."
              multiline
              numberOfLines={4}
              className="text-base text-text-base"
              style={{ minHeight: 96, textAlignVertical: "top" }}
              accessibilityLabel="Ваше сообщение"
            />
          </View>
          {msgError && (
            <Text className="text-danger text-sm mb-3 px-1">{msgError}</Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Отправить отклик"
            onPress={handleRespond}
            disabled={sending}
            className="bg-accent rounded-xl py-3.5 items-center"
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Отправить</Text>
            )}
          </Pressable>
        </View>
      )}
    </>
  );
}

// ─── AnonymousView ────────────────────────────────────────────────────────────

function AnonymousView({ request, onLogin }: { request: Partial<RequestDetailData> & { title: string; description: string }; onLogin: () => void }) {
  return (
    <>
      <View
        className="bg-white rounded-2xl p-4 mb-4"
        style={{ shadowColor: colors.text, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
      >
        <Text className="text-base font-semibold text-text-base mb-2">{request.title}</Text>
        <Text className="text-base text-text-mute leading-6">
          {request.description.slice(0, 200)}{request.description.length > 200 ? "…" : ""}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Войти, чтобы откликнуться"
        onPress={onLogin}
        className="bg-accent rounded-xl py-3.5 items-center mb-6"
        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
      >
        <Text className="text-white font-semibold text-base">Войти, чтобы откликнуться</Text>
      </Pressable>
    </>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [request, setRequest] = useState<RequestDetailData | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extending, setExtending] = useState(false);

  // Public fallback for anonymous / unauthenticated
  const [publicRequest, setPublicRequest] = useState<{ title: string; description: string } | null>(null);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (!isAuthenticated) {
        // Anonymous: load public endpoint
        const pub = await api<{ title: string; description: string }>(`/api/requests/${id}/public`);
        setPublicRequest(pub);
      } else {
        const [detail, threadsRes] = await Promise.all([
          api<RequestDetailData>(`/api/requests/${id}/detail`),
          api<{ items: ThreadSummary[] }>(`/api/threads?request_id=${id}`),
        ]);
        setRequest(detail);
        setThreads(threadsRes.items);
      }
    } catch (e) {
      setError("Не удалось загрузить запрос");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) fetchAll();
  }, [authLoading, fetchAll]);

  const handleFilePress = useCallback(async (file: FileItem) => {
    try {
      const res = await api<{ url: string }>(
        `/api/upload/signed-url/${encodeURIComponent(file.url.replace(/^\/p2ptax\//, ""))}`
      );
      await Linking.openURL(res.url);
    } catch {
      // ignore
    }
  }, []);

  const handleExtend = useCallback(async () => {
    if (extending || !request) return;
    setExtending(true);
    try {
      const res = await apiPost<{ extensionsCount: number; status: string }>(
        `/api/requests/${id}/extend`,
        {}
      );
      setRequest((prev) =>
        prev
          ? { ...prev, extensionsCount: res.extensionsCount, status: res.status as RequestDetailData["status"] }
          : null
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось продлить заявку";
      Alert.alert("Ошибка", msg);
    } finally {
      setExtending(false);
    }
  }, [id, extending, request]);

  const handleClose = useCallback(() => {
    Alert.alert(
      "Закрыть заявку",
      "Закрыть заявку? Специалисты больше не смогут откликнуться.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Закрыть",
          style: "destructive",
          onPress: async () => {
            try {
              await apiPatch(`/api/requests/${id}/status`, { status: "CLOSED" });
              setRequest((prev) => prev ? { ...prev, status: "CLOSED" } : null);
            } catch {
              Alert.alert("Ошибка", "Не удалось закрыть заявку");
            }
          },
        },
      ]
    );
  }, [id]);

  const containerStyle = isDesktop
    ? { maxWidth: 520, width: "100%" as const, alignSelf: "center" as const }
    : undefined;

  if (authLoading || loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-danger text-center">{error}</Text>
          <View className="mt-4">
            <Button label="Назад" onPress={() => router.back()} fullWidth={false} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Anonymous
  if (!isAuthenticated) {
    const pub = publicRequest ?? { title: "Заявка", description: "" };
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <ScrollView className="flex-1">
          <View style={containerStyle} className={isDesktop ? "" : "px-4"}>
            <View className="flex-row items-center pt-4 pb-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Назад"
                onPress={() => router.back()}
                className="flex-row items-center"
                style={{ minHeight: 44 }}
              >
                <ChevronLeft size={20} color={colors.text} />
                <Text className="text-text-base ml-1">Назад</Text>
              </Pressable>
            </View>
            <View className="py-4">
              <AnonymousView request={pub} onLogin={() => nav.any("/login")} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-danger text-center">Заявка не найдена</Text>
          <View className="mt-4">
            <Button label="Назад" onPress={() => router.back()} fullWidth={false} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── MOBILE + DESKTOP LAYOUT ───────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <ScrollView className="flex-1">
        <View style={containerStyle} className={isDesktop ? "" : "px-4"}>
          {/* Header */}
          <View className="flex-row items-center justify-between pt-4 pb-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Назад"
              onPress={() => router.back()}
              className="flex-row items-center"
              style={{ minHeight: 44 }}
            >
              <ChevronLeft size={20} color={colors.text} />
              <Text className="text-text-base ml-1">Назад</Text>
            </Pressable>
          </View>

          <View className="py-4">
            {request.isOwner ? (
              <OwnerView
                request={request}
                threads={threads}
                onFilePress={handleFilePress}
                onExtend={handleExtend}
                extending={extending}
                onClose={handleClose}
              />
            ) : (
              <SpecialistView
                request={request}
                onFilePress={handleFilePress}
                onThreadCreated={(threadId) => nav.any(`/threads/${threadId}`)}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
