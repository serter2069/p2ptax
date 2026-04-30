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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, usePathname } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { File, FileImage, Download, ChevronLeft, X } from "lucide-react-native";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import { api, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, BREAKPOINT } from "@/lib/theme";
import ThreadsList, { ThreadSummary } from "@/components/requests/ThreadsList";
import SpecialistRecommendations, { SpecialistCard } from "@/components/requests/SpecialistRecommendations";
import EmptyState from "@/components/ui/EmptyState";

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
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  const [request, setRequest] = useState<RequestDetailData | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [recommendations, setRecommendations] = useState<SpecialistCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

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

                {/* Unified FNS · service chip (city is already inside FNS name) */}
                <View className="flex-row flex-wrap gap-2 mb-5">
                  <View className="bg-white border border-border rounded-lg px-2.5 py-1">
                    <Text className="text-xs font-medium text-text-base">
                      {request.fns.name}
                      {request.service ? ` · ${request.service.name}` : ""}
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

                {/* Threads */}
                <ThreadsList
                  threads={threads}
                  requestId={id}
                  threadsCount={request.threadsCount}
                  unreadMessages={request.unreadMessages}
                  onOpenThread={(threadId) => nav.dynamic.thread(threadId)}
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
                  <Text className="text-xs font-bold text-text-base mb-3 uppercase tracking-wide">
                    Действия
                  </Text>
                  {isActive ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Закрыть запрос"
                      onPress={handleCloseRequest}
                      disabled={closing}
                      className="flex-row items-center justify-center rounded-xl py-3 px-4"
                      style={({ pressed }) => [
                        {
                          backgroundColor: colors.danger,
                          minHeight: 44,
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
                          <Text className="text-white font-semibold text-sm ml-2">
                            Закрыть запрос
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <View
                      className="rounded-xl py-3 px-4 items-center"
                      style={{
                        backgroundColor: colors.surface2,
                        borderWidth: 1,
                        borderColor: colors.border,
                        minHeight: 44,
                        justifyContent: "center",
                      }}
                    >
                      <Text className="text-sm font-medium text-text-base">Запрос закрыт</Text>
                    </View>
                  )}
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

            {/* Unified FNS · service chip (city is already inside FNS name) */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="bg-white border border-border rounded-lg px-2.5 py-1">
                <Text className="text-xs text-text-base">
                  {request.fns.name}
                  {request.service ? ` · ${request.service.name}` : ""}
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
              <Text className="text-xs font-bold text-text-base mb-3 uppercase tracking-wide">
                Действия
              </Text>
              {isActive ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Закрыть запрос"
                  onPress={handleCloseRequest}
                  disabled={closing}
                  className="flex-row items-center justify-center rounded-xl py-3 px-4"
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.danger,
                      minHeight: 44,
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
                      <Text className="text-white font-semibold text-base ml-2">
                        Закрыть запрос
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <View
                  className="rounded-xl py-3 px-4 items-center"
                  style={{
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 44,
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-sm font-medium text-text-base">Запрос закрыт</Text>
                </View>
              )}
            </View>

            <ThreadsList
              threads={threads}
              requestId={id}
              threadsCount={request.threadsCount}
              unreadMessages={request.unreadMessages}
              onOpenThread={(threadId) => nav.any(`/threads/${threadId}`)}
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
