import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Linking,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { dialog } from "@/lib/dialog";
import { File, FileImage, Download, ChevronLeft, MessageSquare } from "lucide-react-native";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import ThreadsList, { ThreadSummary } from "@/components/requests/ThreadsList";
import { api, apiPost, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, BREAKPOINT } from "@/lib/theme";
import { getShortServiceName } from "@/lib/services";
import { formatDateLong } from "@/lib/formatDate";
import { track } from "@/lib/analytics";

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
  service?: { id: string; name: string } | null;
  files: FileItem[];
  threadsCount: number;
  unreadMessages: number;
  isOwner: boolean;
  hasExistingThread: boolean;
  existingThreadId: string | null;
  client: { name: string } | null;
}

// ─── Shared file list ─────────────────────────────────────────────────────────

function FileList({
  files,
  onPress,
  requestId,
}: {
  files: FileItem[];
  onPress: (f: FileItem) => void;
  requestId?: string;
}) {
  if (files.length === 0) return null;
  return (
    <Card className="mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider">
          Прикреплённые документы
        </Text>
        {requestId && files.length > 1 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Скачать все файлы"
            onPress={() =>
              Linking.openURL(`/api/requests/${requestId}/files.zip`).catch(() => {})
            }
            className="flex-row items-center"
            hitSlop={6}
          >
            <Download size={12} color={colors.primary} />
            <Text className="text-xs text-accent ml-1 font-medium">Скачать все</Text>
          </Pressable>
        )}
      </View>
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
    </Card>
  );
}

// ─── Close confirmation modal ─────────────────────────────────────────────────

function CloseConfirmModal({
  visible,
  onCancel,
  onConfirm,
  closing,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  closing: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onCancel}
      >
        <Pressable
          className="bg-white rounded-2xl p-6"
          style={{ maxWidth: 400, width: "90%", margin: 16 }}
          onPress={(e) => e.stopPropagation?.()}
        >
          <Text className="text-lg font-bold text-text-base mb-2">Закрыть запрос?</Text>
          <Text className="text-sm text-text-mute mb-6 leading-5">
            Запрос будет помечен как закрытый. Специалисты больше не смогут откликнуться.
            Вы сможете открыть его снова в любой момент.
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 border border-border rounded-xl py-3 items-center"
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text className="text-text-base font-semibold text-sm">Отмена</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={closing}
              className="flex-1 bg-danger rounded-xl py-3 items-center"
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              {closing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-semibold text-sm">Закрыть запрос</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Shared info block ────────────────────────────────────────────────────────

function RequestInfoBlock({ request }: { request: RequestDetailData }) {
  const createdDate = formatDateLong(request.createdAt);

  const serviceName = request.service ? getShortServiceName(request.service.name) : null;

  return (
    <>
      {/* Status + date */}
      <View className="flex-row items-center mb-3">
        <StatusBadge status={request.status} />
        <Text className="text-sm text-text-mute ml-3">{createdDate}</Text>
      </View>

      {/* FNS chip only (city removed per UX feedback) */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="bg-white border border-border px-3 py-1 rounded-lg">
          <Text className="text-sm text-text-base">
            {request.fns.name} ({request.fns.code})
          </Text>
        </View>
        {serviceName && (
          <View className="bg-accent-soft border border-accent-soft px-3 py-1 rounded-lg">
            <Text className="text-sm font-medium" style={{ color: colors.accentSoftInk }}>
              {serviceName}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Card className="mb-4">
        <Text className="text-xs font-semibold text-text-mute mb-2 uppercase tracking-wider">
          Описание
        </Text>
        <Text className="text-base text-text-base leading-6">{request.description}</Text>
      </Card>
    </>
  );
}

// ─── OwnerView ────────────────────────────────────────────────────────────────

function OwnerView({
  request,
  threads,
  onFilePress,
  onClose,
  onReopen,
  isDesktop,
}: {
  request: RequestDetailData;
  threads: ThreadSummary[];
  onFilePress: (f: FileItem) => void;
  onClose: () => void;
  onReopen: () => void;
  isDesktop: boolean;
}) {
  const nav = useTypedRouter();
  const isClosed = request.status === "CLOSED";

  const ActionPanel = () => (
    <View>
      {/* Close / Reopen button */}
      {isClosed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Открыть запрос снова"
          onPress={onReopen}
          className="border border-accent rounded-xl py-3 items-center mb-6"
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <Text className="text-accent font-semibold text-sm">Открыть запрос снова</Text>
        </Pressable>
      ) : (
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
    </View>
  );

  if (isDesktop) {
    // 2-column layout: left = main info + files, right = threads + actions
    return (
      <View className="flex-row gap-6">
        {/* Left column */}
        <View style={{ flex: 2 }}>
          <RequestInfoBlock request={request} />
          <FileList files={request.files} onPress={onFilePress} requestId={request.id} />
        </View>

        {/* Right column */}
        <View style={{ flex: 1 }}>
          <ActionPanel />
          <ThreadsList
            threads={threads}
            requestId={request.id}
            threadsCount={request.threadsCount}
            unreadMessages={request.unreadMessages}
            onOpenThread={(threadId) => nav.any(`/threads/${threadId}`)}
          />
        </View>
      </View>
    );
  }

  // Mobile: single column
  return (
    <>
      <RequestInfoBlock request={request} />
      <FileList files={request.files} onPress={onFilePress} requestId={request.id} />
      <ThreadsList
        threads={threads}
        requestId={request.id}
        threadsCount={request.threadsCount}
        unreadMessages={request.unreadMessages}
        onOpenThread={(threadId) => nav.any(`/threads/${threadId}`)}
      />
      <ActionPanel />
    </>
  );
}

// ─── SpecialistView ───────────────────────────────────────────────────────────

function SpecialistView({
  request,
  onFilePress,
}: {
  request: RequestDetailData;
  onFilePress: (f: FileItem) => void;
}) {
  const nav = useTypedRouter();
  const isClosed = request.status === "CLOSED";

  return (
    <>
      <RequestInfoBlock request={request} />

      {isClosed && (
        <View className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 mb-4 items-center">
          <Text className="text-sm text-text-base font-medium text-center">
            Запрос закрыт — откликнуться невозможно
          </Text>
        </View>
      )}

      {request.client && (
        <Card className="mb-4">
          <Text className="text-xs font-semibold text-text-mute mb-1 uppercase tracking-wider">Клиент</Text>
          <Text className="text-base text-text-base">{request.client.name}</Text>
        </Card>
      )}

      <FileList files={request.files} onPress={onFilePress} requestId={request.id} />

      {/* Single primary CTA. If a thread already exists, jump to chat;
          otherwise route to the dedicated compose screen at
          /requests/[id]/write where the specialist actually writes. */}
      {!isClosed && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Написать клиенту"
          onPress={() => {
            if (request.hasExistingThread && request.existingThreadId) {
              nav.any(`/threads/${request.existingThreadId}`);
            } else {
              nav.any(`/requests/${request.id}/write`);
            }
          }}
          className="bg-accent rounded-xl py-3.5 items-center mb-6 flex-row justify-center gap-2"
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <MessageSquare size={18} color="#fff" />
          <Text className="text-white font-semibold text-base ml-2">
            {request.hasExistingThread ? "Перейти к диалогу" : "Написать"}
          </Text>
        </Pressable>
      )}
    </>
  );
}

// ─── AnonymousView ────────────────────────────────────────────────────────────

function AnonymousView({ request, onLogin }: { request: Partial<RequestDetailData> & { title: string; description: string }; onLogin: () => void }) {
  return (
    <>
      <Card className="mb-4">
        <Text className="text-base font-semibold text-text-base mb-2">{request.title}</Text>
        <Text className="text-base text-text-mute leading-6">
          {request.description.slice(0, 200)}{request.description.length > 200 ? "…" : ""}
        </Text>
      </Card>
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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);

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
    // Seeded files (and any external attachment) keep their original
    // http(s) URL in the DB. Feeding /api/upload/signed-url an http URL
    // produces a presign for 'p2ptax/https:/example.com/...' which MinIO
    // rejects with NoSuchKey. Open external URLs directly; only presign
    // genuine MinIO keys.
    if (/^https?:\/\//i.test(file.url)) {
      await Linking.openURL(file.url).catch(() => {});
      return;
    }
    try {
      const res = await api<{ url: string }>(
        `/api/upload/signed-url/${encodeURIComponent(file.url.replace(/^\/p2ptax\//, ""))}`
      );
      await Linking.openURL(res.url);
    } catch {
      // ignore
    }
  }, []);

  const handleClose = useCallback(() => {
    setShowCloseConfirm(true);
  }, []);

  const confirmClose = useCallback(async () => {
    if (closing) return;
    setClosing(true);
    try {
      await apiPatch(`/api/requests/${id}/status`, { status: "CLOSED" });
      track("request_close", { ok: true, requestId: id });
      setRequest((prev) => prev ? { ...prev, status: "CLOSED" } : null);
      setShowCloseConfirm(false);
    } catch (err) {
      track("request_close", {
        ok: false,
        requestId: id,
        reason: err instanceof Error ? err.message : "unknown",
      });
      dialog.alert({ title: "Ошибка", message: "Не удалось закрыть заявку" });
    } finally {
      setClosing(false);
    }
  }, [id, closing]);

  const handleReopen = useCallback(async () => {
    try {
      await apiPatch(`/api/requests/${id}/status`, { status: "ACTIVE" });
      setRequest((prev) => prev ? { ...prev, status: "ACTIVE" } : null);
    } catch {
      dialog.alert({ title: "Ошибка", message: "Не удалось открыть заявку" });
    }
  }, [id]);

  // Desktop: cap at 960px to align with the rest of the app's content surfaces.
  // House rule: detail pages share the 960/24 layout with lists/feeds (see CLAUDE.md).
  const containerStyle = isDesktop
    ? { maxWidth: 960, alignSelf: "center" as const, width: "100%" as const, paddingHorizontal: 24 }
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
      {/* Close confirmation modal */}
      <CloseConfirmModal
        visible={showCloseConfirm}
        onCancel={() => setShowCloseConfirm(false)}
        onConfirm={confirmClose}
        closing={closing}
      />

      <ScrollView className="flex-1">
        <View style={containerStyle} className={isDesktop ? "py-6" : "px-4"}>
          {/* Title header — no "Назад" button (breadcrumb in AppHeader + sidebar nav) */}
          <View className="pt-4 pb-4">
            <Text
              className="text-xl font-bold text-text-base"
              numberOfLines={2}
            >
              {request.title}
            </Text>
          </View>

          {request.isOwner ? (
            <OwnerView
              request={request}
              threads={threads}
              onFilePress={handleFilePress}
              onClose={handleClose}
              onReopen={handleReopen}
              isDesktop={isDesktop}
            />
          ) : (
            <SpecialistView
              request={request}
              onFilePress={handleFilePress}
              // onThreadCreated kept for type compat; no longer used by the slimmed SpecialistView
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
