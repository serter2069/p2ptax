import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { ChevronLeft } from "lucide-react-native";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import { type PendingFile } from "@/components/ChatComposer";
import { api, apiPatch, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, BREAKPOINT } from "@/lib/theme";
import { SpecialistCard } from "@/components/requests/SpecialistRecommendations";

import RequestHeader from "@/components/requests/detail/RequestHeader";
import RequestActions from "@/components/requests/detail/RequestActions";
import RequestDocuments from "@/components/requests/detail/RequestDocuments";
import RequestSpecialists from "@/components/requests/detail/RequestSpecialists";
import { RequestDetailData, FileItem } from "@/components/requests/detail/types";

const FIRST_MESSAGE_MIN = 10;
const FIRST_MESSAGE_MAX = 2000;

export default function MyRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const nav = useTypedRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const { isLoading: authLoading, isAuthenticated, isSpecialistUser, user, token } = useAuth();

  const [request, setRequest] = useState<RequestDetailData | null>(null);
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

      // Auth-gated: load recommendations only for authenticated users
      if (isAuthenticated) {
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
  }, [composerText, composerFiles, id, isAuthenticated, nav, pathname]);

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
  const serviceName = request.service?.name?.trim() || null;

  // Inline composer eligibility — specialist with completed profile, request open.
  const showInlineComposer =
    isActive &&
    isAuthenticated &&
    isSpecialistUser &&
    !!user?.specialistProfileCompletedAt;

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
                <RequestHeader
                  request={request}
                  createdDate={createdDate}
                  serviceName={serviceName}
                  isDesktop
                />

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

                <RequestDocuments
                  files={request.files}
                  onFilePress={handleFilePress}
                  isDesktop
                />

                <RequestSpecialists
                  recommendations={recommendations}
                  onOpenProfile={handleOpenSpecialistProfile}
                  onWrite={handleWriteSpecialist}
                  showInlineComposer={showInlineComposer}
                  composerText={composerText}
                  composerFiles={composerFiles}
                  composerSending={composerSending}
                  composerError={composerError}
                  authToken={token}
                  onComposerChangeText={setComposerText}
                  onComposerFilesChange={setComposerFiles}
                  onComposerSend={handleComposerSend}
                />
              </View>

              {/* RIGHT: actions + meta stats */}
              <View style={{ flex: 1, minWidth: 280, maxWidth: 360 }}>
                <RequestActions
                  request={request}
                  isActive={isActive}
                  closing={closing}
                  copied={copied}
                  togglingVisibility={togglingVisibility}
                  onClose={handleCloseRequest}
                  onCopyLink={handleCopyLink}
                  onToggleVisibility={handleToggleVisibility}
                  isDesktop
                />

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
            <RequestHeader
              request={request}
              createdDate={createdDate}
              serviceName={serviceName}
            />

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

            <RequestDocuments
              files={request.files}
              onFilePress={handleFilePress}
            />

            <RequestSpecialists
              recommendations={recommendations}
              onOpenProfile={handleOpenSpecialistProfile}
              onWrite={handleWriteSpecialist}
              showInlineComposer={showInlineComposer}
              composerText={composerText}
              composerFiles={composerFiles}
              composerSending={composerSending}
              composerError={composerError}
              authToken={token}
              onComposerChangeText={setComposerText}
              onComposerFilesChange={setComposerFiles}
              onComposerSend={handleComposerSend}
            />

            <RequestActions
              request={request}
              isActive={isActive}
              closing={closing}
              copied={copied}
              togglingVisibility={togglingVisibility}
              onClose={handleCloseRequest}
              onCopyLink={handleCopyLink}
              onToggleVisibility={handleToggleVisibility}
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
