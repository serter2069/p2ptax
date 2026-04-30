import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Switch,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { File, FileImage, Download, ChevronLeft, X, Link } from "lucide-react-native";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import ChatComposer, { type PendingFile } from "@/components/ChatComposer";
import { api, apiPatch, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, BREAKPOINT } from "@/lib/theme";
import ThreadsList, { ThreadSummary } from "@/components/requests/ThreadsList";
import SpecialistRecommendations, { SpecialistCard } from "@/components/requests/SpecialistRecommendations";
import EmptyState from "@/components/ui/EmptyState";

const FIRST_MESSAGE_MIN = 10;
const FIRST_MESSAGE_MAX = 2000;

interface FileItem {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface RequestDetailData {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  isPublic: boolean;
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
}

export default function MyRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const nav = useTypedRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const { isLoading: authLoading, isAuthenticated, isSpecialistUser, user, token } = useAuth();

  const [request, setRequest] = useState<RequestDetailData | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [recommendations, setRecommendations] = useState<SpecialistCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  // Inline message composer state — issue #1566 (specialist quick-reply).
  const [composerText, setComposerText] = useState("");
  const [composerFiles, setComposerFiles] = useState<PendingFile[]>([]);
  const [composerSending, setComposerSending] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const handleCopyLink = useCallback(async () => {
    const url =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.href
        : `https://p2ptax.ru/requests/${id}/detail`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // silent — clipboard not critical
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [id]);

  const handleToggleVisibility = useCallback(async (newValue: boolean) => {
    if (togglingVisibility) return;
    setTogglingVisibility(true);
    // Optimistic update
    setRequest((prev) => prev ? { ...prev, isPublic: newValue } : null);
    try {
      await apiPatch(`/api/requests/${id}`, { isPublic: newValue });
    } catch {
      // Revert on failure
      setRequest((prev) => prev ? { ...prev, isPublic: !newValue } : null);
    } finally {
      setTogglingVisibility(false);
    }
  }, [id, togglingVisibility]);

  const fetchAll = useCallback(async () => {
    try {
      // Public detail endpoint — no auth required
      const detail = await api<RequestDetailData>(`/api/requests/${id}/detail`);
      setRequest(detail);

      // Auth-gated: load threads and recommendations only for authenticated users
      if (isAuthenticated) {
        const threadsRes = await api<{ items: ThreadSummary[] }>(`/api/threads?request_id=${id}`);
        setThreads(threadsRes.items);

        // Load recommendations in background — non-blocking
        api<{ items: SpecialistCard[] }>(`/api/requests/${id}/recommendations`)
          .then((r) => setRecommendations(r.items))
          .catch(() => {/* silent — not critical */});
      }
    } catch (e) {
      setError("Не удалось загрузить запрос");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (id && !authLoading) fetchAll();
  }, [id, authLoading, fetchAll]);

  // For action buttons: redirect to login with returnTo when not authenticated
  const handleAuthRequired = useCallback((action: () => void) => {
    if (!isAuthenticated) {
      nav.replaceAny({ pathname: "/login", params: { returnTo: pathname } });
      return;
    }
    action();
  }, [isAuthenticated, nav, pathname]);

  // Inline composer send — creates a thread (mirrors /requests/:id/write).
  // Files are uploaded immediately on pick by FileUploadZone, so by send-time
  // each "done" file already has its uploadedToken (single-attachment first
  // message — limit enforced by maxFiles=1 below).
  const handleComposerSend = useCallback(async () => {
    if (!isAuthenticated) {
      nav.replaceAny({ pathname: "/login", params: { returnTo: pathname } });
      return;
    }
    const trimmed = composerText.trim();
    if (trimmed.length < FIRST_MESSAGE_MIN) {
      setComposerError(`Минимум ${FIRST_MESSAGE_MIN} символов`);
      return;
    }
    if (trimmed.length > FIRST_MESSAGE_MAX) {
      setComposerError(`Максимум ${FIRST_MESSAGE_MAX} символов`);
      return;
    }
    const stillBusy = composerFiles.some(
      (f) => f.status === "uploading" || f.status === "pending",
    );
    if (stillBusy) {
      setComposerError("Файл ещё загружается. Подождите.");
      return;
    }
    const failedFile = composerFiles.find((f) => f.status === "error");
    if (failedFile) {
      setComposerError(failedFile.errorMessage ?? "Не удалось загрузить файл");
      return;
    }
    const readyFile = composerFiles.find(
      (f) => f.status === "done" && f.uploadedToken,
    );
    const uploadToken = readyFile?.uploadedToken;

    setComposerSending(true);
    setComposerError(null);
    try {
      const result = await api<{ id: string }>("/api/threads", {
        method: "POST",
        body: {
          requestId: id,
          firstMessage: trimmed,
          ...(uploadToken ? { uploadToken } : {}),
        },
      });
      setComposerText("");
      setComposerFiles([]);
      nav.replaceAny(`/threads/${result.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const existingThreadId =
            typeof err.data?.threadId === "string" ? err.data.threadId : null;
          if (existingThreadId) {
            // Already wrote to this request — open the existing thread.
            nav.replaceAny(`/threads/${existingThreadId}`);
          } else {
            setComposerError("Запрос закрыт — сообщение отправить невозможно");
          }
        } else if (err.status === 429) {
          setComposerError(
            "Лимит новых диалогов на сегодня исчерпан (20 в день). Попробуйте завтра.",
          );
        } else if (err.status === 403) {
          setComposerError("Только специалисты могут начать диалог");
        } else {
          setComposerError("Не удалось отправить сообщение. Попробуйте ещё раз.");
        }
      } else {
        setComposerError("Не удалось отправить сообщение. Попробуйте ещё раз.");
      }
    } finally {
      setComposerSending(false);
    }
  }, [
    composerText,
    composerFiles,
    id,
    isAuthenticated,
    nav,
    pathname,
  ]);

  const handleCloseRequest = useCallback(async () => {
    if (closing) return;
    const doClose = async () => {
      setClosing(true);
      try {
        await apiPatch(`/api/requests/${id}/status`, { status: "CLOSED" });
        setRequest((prev) => prev ? { ...prev, status: "CLOSED" } : null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось закрыть запрос";
        if (Platform.OS === "web") {
          if (typeof window !== "undefined" && typeof window.alert === "function") {
            window.alert(`Ошибка: ${msg}`);
          }
        } else {
          Alert.alert("Ошибка", msg);
        }
      } finally {
        setClosing(false);
      }
    };

    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      if (window.confirm("Закрыть запрос? Специалисты больше не смогут откликнуться.")) {
        await doClose();
      }
    } else {
      Alert.alert(
        "Закрыть запрос",
        "Специалисты больше не смогут откликнуться на этот запрос.",
        [
          { text: "Отмена", style: "cancel" },
          { text: "Закрыть", style: "destructive", onPress: doClose },
        ]
      );
    }
  }, [id, closing]);

  const handleFilePress = useCallback(async (file: FileItem) => {
    try {
      const res = await api<{ url: string }>(
        `/api/upload/signed-url/${encodeURIComponent(file.url.replace(/^\/p2ptax\//, ""))}`
      );
      await Linking.openURL(res.url);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleWriteSpecialist = useCallback((specialistId: string) => {
    handleAuthRequired(() => nav.any(`/messages?specialist=${specialistId}`));
  }, [handleAuthRequired, nav]);

  const handleOpenSpecialistProfile = useCallback((specialistId: string) => {
    nav.dynamic.specialist(specialistId);
  }, [nav]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base text-danger text-center">
            {error || "Запрос не найден"}
          </Text>
          <View className="mt-4">
            <Button
              label="Назад"
              onPress={() => router.back()}
              fullWidth={false}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const createdDate = new Date(request.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isActive = request.status !== "CLOSED";

  // Service is shown in the chip only when actually selected — issue #1578.
  // Backend may return null/undefined or an object with empty name; treat all
  // those cases as "not selected" so the chip falls back to plain [ФНС].
  const serviceName = request.service?.name?.trim() || null;

  // Inline composer eligibility — specialist with completed profile, request open.
  // Non-specialists / unauth users / closed requests don't see the composer.
  const showInlineComposer =
    isActive &&
    isAuthenticated &&
    isSpecialistUser &&
    !!user?.specialistProfileCompletedAt;

  const inlineComposerSection = showInlineComposer ? (
    <View
      className="bg-white rounded-2xl mb-4 overflow-hidden"
      style={{
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xs font-semibold text-text-mute mb-1 uppercase tracking-wide">
          Написать клиенту
        </Text>
        <Text className="text-xs text-text-mute mb-2">
          Минимум {FIRST_MESSAGE_MIN} символов · можно прикрепить один файл (PDF, JPG, PNG до 10 МБ)
        </Text>
      </View>
      <ChatComposer
        value={composerText}
        onChangeText={setComposerText}
        files={composerFiles}
        onFilesChange={setComposerFiles}
        onSend={handleComposerSend}
        sending={composerSending}
        authToken={token}
        maxFiles={1}
        maxLength={FIRST_MESSAGE_MAX}
        placeholder="Напишите первое сообщение клиенту..."
        accessibilityLabel="Сообщение клиенту"
      />
      {composerError ? (
        <View className="px-4 py-2">
          <Text className="text-xs text-danger">{composerError}</Text>
        </View>
      ) : null}
    </View>
  ) : null;

  // ── DESKTOP LAYOUT ────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          <View
            style={{
              width: "100%",
              maxWidth: 1100,
              alignSelf: "center",
              paddingHorizontal: 32,
              paddingTop: 24,
            }}
          >
            {/* Back nav */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Назад"
              onPress={() => router.back()}
              className="flex-row items-center mb-6"
              style={{ minHeight: 44, alignSelf: "flex-start" }}
            >
              <ChevronLeft size={20} color={colors.text} />
              <Text className="text-text-base ml-1">Назад</Text>
            </Pressable>

            {/* 2-column grid */}
            <View className="flex-row gap-6" style={{ alignItems: "flex-start" }}>
              {/* LEFT: main info */}
              <View style={{ flex: 2, minWidth: 0 }}>
                {/* Status + date */}
                <View className="flex-row items-center mb-3 gap-3">
                  <StatusBadge status={request.status} />
                  <Text className="text-sm text-text-mute">{createdDate}</Text>
                </View>

                {/* Title */}
                <Text className="text-2xl font-extrabold text-text-base mb-4">
                  {request.title}
                </Text>

                {/* Unified FNS · service chip — issue #1578.
                    City already lives inside FNS name (e.g. "ИФНС №1 по г. Москве"),
                    so we never include it separately. Service is appended only
                    when it is actually selected. */}
                <View className="flex-row flex-wrap gap-2 mb-5">
                  <View className="bg-white border border-border rounded-lg px-2.5 py-1">
                    <Text className="text-xs font-medium text-text-base">
                      {request.fns.name}
                      {serviceName ? ` · ${serviceName}` : ""}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <View
                  className="bg-white rounded-2xl p-5 mb-4"
                  style={{
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Text className="text-xs font-semibold text-text-mute mb-3 uppercase tracking-wide">
                    Описание
                  </Text>
                  <Text className="text-base text-text-base leading-6">
                    {request.description}
                  </Text>
                </View>

                {/* Files */}
                <View
                  className="bg-white rounded-2xl p-5 mb-4"
                  style={{
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Text className="text-xs font-semibold text-text-mute mb-3 uppercase tracking-wide">
                    Прикреплённые документы
                  </Text>
                  {request.files.length === 0 ? (
                    <EmptyState title="Нет документов" subtitle="К этому запросу не прикреплены файлы" />
                  ) : (
                    request.files.map((file) => (
                      <Pressable
                        accessibilityRole="button"
                        key={file.id}
                        accessibilityLabel={`Открыть файл ${file.filename}`}
                        onPress={() => handleFilePress(file)}
                        className="flex-row items-center bg-surface2 rounded-xl p-3 mb-2"
                        style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                      >
                        {file.mimeType === "application/pdf"
                          ? <File size={20} color={colors.primary} />
                          : <FileImage size={20} color={colors.primary} />
                        }
                        <View className="ml-3 flex-1">
                          <Text className="text-sm text-text-base" numberOfLines={1}>
                            {file.filename}
                          </Text>
                          <Text className="text-xs text-text-mute">
                            {(file.size / 1024).toFixed(0)} КБ
                          </Text>
                        </View>
                        <Download size={14} color={colors.placeholder} />
                      </Pressable>
                    ))
                  )}
                </View>

                {/* Recommended specialists feed (horizontal scroll) — issue #1550 */}
                {recommendations.length > 0 && (
                  <View className="mb-4">
                    <SpecialistRecommendations
                      recommendations={recommendations}
                      onOpenProfile={handleOpenSpecialistProfile}
                      onWrite={handleWriteSpecialist}
                    />
                  </View>
                )}

                {/* Inline message composer — issue #1566. Shown only for
                    authenticated specialists with completed profile on
                    non-closed requests. */}
                {inlineComposerSection}

                {/* Threads */}
                <ThreadsList
                  threads={threads}
                  requestId={id}
                  threadsCount={request.threadsCount}
                  unreadMessages={request.unreadMessages}
                  onOpenThread={(threadId) =>
                    nav.any(`/threads/${threadId}?requestId=${id}`)
                  }
                  onOpenSpecialistProfile={handleOpenSpecialistProfile}
                />
              </View>

              {/* RIGHT: actions + meta stats */}
              <View style={{ flex: 1, minWidth: 280, maxWidth: 360 }}>
                {/* Actions card — visually prominent (border + stronger shadow) */}
                <View
                  className="bg-white rounded-2xl p-5 mb-4"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  <Text
                    className="uppercase tracking-wide mb-3"
                    style={{ fontSize: 13, fontWeight: "600", color: "#111" }}
                  >
                    Действия
                  </Text>
                  {isActive ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Закрыть запрос"
                      onPress={handleCloseRequest}
                      disabled={closing}
                      className="flex-row items-center justify-center rounded-xl px-4"
                      style={({ pressed }) => [
                        {
                          backgroundColor: colors.danger,
                          minHeight: 48,
                          paddingVertical: 14,
                          shadowColor: colors.danger,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 4,
                          elevation: 3,
                        },
                        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      {closing ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <>
                          <X size={16} color={colors.white} />
                          <Text
                            className="text-white ml-2"
                            style={{ fontSize: 15, fontWeight: "600" }}
                          >
                            Закрыть запрос
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <View
                      className="rounded-xl px-4 items-center"
                      style={{
                        backgroundColor: colors.surface2,
                        borderWidth: 1,
                        borderColor: colors.border,
                        minHeight: 48,
                        paddingVertical: 14,
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "500", color: "#111" }}>
                        Запрос закрыт
                      </Text>
                    </View>
                  )}

                  {/* Copy link */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Скопировать ссылку"
                    onPress={handleCopyLink}
                    className="flex-row items-center justify-center rounded-xl px-4 mt-2"
                    style={({ pressed }) => [
                      {
                        backgroundColor: colors.surface2,
                        borderWidth: 1,
                        borderColor: colors.border,
                        minHeight: 48,
                        paddingVertical: 14,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Link size={16} color={copied ? colors.success : colors.text} />
                    <Text
                      className="ml-2"
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: copied ? colors.success : "#111",
                      }}
                    >
                      {copied ? "Скопировано!" : "Скопировать ссылку"}
                    </Text>
                  </Pressable>

                  {/* Visibility toggle */}
                  <View className="flex-row items-center justify-between mt-4 pt-3"
                    style={{ borderTopWidth: 1, borderTopColor: colors.border }}
                  >
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center gap-2 mb-0.5">
                        <View
                          className="rounded px-1.5 py-0.5"
                          style={{
                            backgroundColor: request.isPublic ? "#D1FAE5" : "#F3F4F6",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: request.isPublic ? "#065F46" : "#6B7280",
                            }}
                          >
                            {request.isPublic ? "Доступно публично" : "Только для участников"}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                        {request.isPublic
                          ? "Запрос виден всем пользователям интернета"
                          : "Запрос виден только зарегистрированным пользователям"}
                      </Text>
                    </View>
                    <Switch
                      value={request.isPublic}
                      onValueChange={handleToggleVisibility}
                      disabled={togglingVisibility || !isActive}
                      trackColor={{ false: "#D1D5DB", true: "#6366F1" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Meta stats */}
                <View
                  className="bg-white rounded-2xl p-5 mb-4"
                  style={{
                    shadowColor: colors.text,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Text className="text-xs font-semibold text-text-mute mb-3 uppercase tracking-wide">
                    Статистика
                  </Text>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-text-mute">Диалогов</Text>
                    <Text className="text-sm text-text-base">{request.threadsCount}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-text-mute">Непрочитанных</Text>
                    <Text className="text-sm text-text-base">{request.unreadMessages}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <ScrollView className="flex-1">
        <View className="px-4">
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
            {/* Status + date */}
            <View className="flex-row items-center mb-3">
              <StatusBadge status={request.status} />
              <Text className="text-sm text-text-mute ml-3">{createdDate}</Text>
            </View>

            {/* Title */}
            <Text className="text-xl font-bold text-text-base mb-3">
              {request.title}
            </Text>

            {/* Unified FNS · service chip — issue #1578.
                City already lives inside FNS name (e.g. "ИФНС №1 по г. Москве"),
                so we never include it separately. Service is appended only
                when it is actually selected. */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="bg-white border border-border rounded-lg px-2.5 py-1">
                <Text className="text-xs text-text-base">
                  {request.fns.name}
                  {serviceName ? ` · ${serviceName}` : ""}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View
              className="bg-white rounded-2xl p-4 mb-4"
              style={{
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-xs font-semibold text-text-mute mb-2 uppercase tracking-wide">
                Описание
              </Text>
              <Text className="text-base text-text-base leading-6">
                {request.description}
              </Text>
            </View>

            {/* Files */}
            <View
              className="bg-white rounded-2xl p-4 mb-4"
              style={{
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text className="text-xs font-semibold text-text-mute mb-3 uppercase tracking-wide">
                Прикреплённые документы
              </Text>
              {request.files.length === 0 ? (
                <EmptyState title="Нет документов" subtitle="К этому запросу не прикреплены файлы" />
              ) : (
                request.files.map((file) => (
                  <Pressable
                    accessibilityRole="button"
                    key={file.id}
                    accessibilityLabel={`Открыть файл ${file.filename}`}
                    onPress={() => handleFilePress(file)}
                    className="flex-row items-center bg-surface2 rounded-xl p-3 mb-2"
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    {file.mimeType === "application/pdf"
                      ? <File size={20} color={colors.primary} />
                      : <FileImage size={20} color={colors.primary} />
                    }
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-text-base" numberOfLines={1}>
                        {file.filename}
                      </Text>
                      <Text className="text-xs text-text-mute">
                        {(file.size / 1024).toFixed(0)} КБ
                      </Text>
                    </View>
                    <Download size={14} color={colors.placeholder} />
                  </Pressable>
                ))
              )}
            </View>

            {/* Recommended specialists feed (horizontal scroll) — issue #1550.
                Placed under main info, before actions (per acceptance criteria). */}
            {recommendations.length > 0 && (
              <View className="mb-4">
                <SpecialistRecommendations
                  recommendations={recommendations}
                  onOpenProfile={handleOpenSpecialistProfile}
                  onWrite={handleWriteSpecialist}
                />
              </View>
            )}

            {/* Actions card — mobile (matches desktop, prominent border + shadow) */}
            <View
              className="bg-white rounded-2xl p-4 mb-4"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Text
                className="uppercase tracking-wide mb-3"
                style={{ fontSize: 13, fontWeight: "600", color: "#111" }}
              >
                Действия
              </Text>
              {isActive ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Закрыть запрос"
                  onPress={handleCloseRequest}
                  disabled={closing}
                  className="flex-row items-center justify-center rounded-xl px-4"
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.danger,
                      minHeight: 48,
                      paddingVertical: 14,
                      shadowColor: colors.danger,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 3,
                    },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  {closing ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      <X size={16} color={colors.white} />
                      <Text
                        className="text-white ml-2"
                        style={{ fontSize: 15, fontWeight: "600" }}
                      >
                        Закрыть запрос
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <View
                  className="rounded-xl px-4 items-center"
                  style={{
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 48,
                    paddingVertical: 14,
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "500", color: "#111" }}>
                    Запрос закрыт
                  </Text>
                </View>
              )}

              {/* Copy link */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Скопировать ссылку"
                onPress={handleCopyLink}
                className="flex-row items-center justify-center rounded-xl px-4 mt-2"
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 48,
                    paddingVertical: 14,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Link size={16} color={copied ? colors.success : colors.text} />
                <Text
                  className="ml-2"
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: copied ? colors.success : "#111",
                  }}
                >
                  {copied ? "Скопировано!" : "Скопировать ссылку"}
                </Text>
              </Pressable>

              {/* Visibility toggle */}
              <View className="flex-row items-center justify-between mt-4 pt-3"
                style={{ borderTopWidth: 1, borderTopColor: colors.border }}
              >
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-0.5">
                    <View
                      className="rounded px-1.5 py-0.5"
                      style={{
                        backgroundColor: request.isPublic ? "#D1FAE5" : "#F3F4F6",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: request.isPublic ? "#065F46" : "#6B7280",
                        }}
                      >
                        {request.isPublic ? "Доступно публично" : "Только для участников"}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    {request.isPublic
                      ? "Запрос виден всем пользователям интернета"
                      : "Запрос виден только зарегистрированным пользователям"}
                  </Text>
                </View>
                <Switch
                  value={request.isPublic}
                  onValueChange={handleToggleVisibility}
                  disabled={togglingVisibility || !isActive}
                  trackColor={{ false: "#D1D5DB", true: "#6366F1" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Inline message composer — issue #1566. Specialist-only,
                visible on non-closed requests for users with completed profile. */}
            {inlineComposerSection}

            <ThreadsList
              threads={threads}
              requestId={id}
              threadsCount={request.threadsCount}
              unreadMessages={request.unreadMessages}
              onOpenThread={(threadId) =>
                nav.any(`/threads/${threadId}?requestId=${id}`)
              }
              onOpenSpecialistProfile={handleOpenSpecialistProfile}
            />

            {/* Meta stats */}
            <View
              className="bg-white rounded-2xl p-4 mb-6"
              style={{
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-text-mute">Диалогов</Text>
                <Text className="text-sm text-text-base">{request.threadsCount}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-text-mute">Город</Text>
                <Text className="text-sm text-text-base">{request.city.name}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
