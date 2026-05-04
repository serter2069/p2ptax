import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { dialog } from "@/lib/dialog";
import { ChevronLeft, UserCheck } from "lucide-react-native";
import LoadingState from "@/components/ui/LoadingState";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";
import ChatComposer, { type PendingFile } from "@/components/ChatComposer";
import { api, ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import { useNoIndex } from "@/components/seo/NoIndex";

interface RequestSummary {
  id: string;
  title: string;
  status: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
  };
}

interface RateLimitInfo {
  writesToday: number;
  limit: number;
}

const MAX_CHARS = 2000;
const MIN_CHARS = 10;
const DAILY_LIMIT = 20;

const SAFE_EDGES =
  Platform.OS === "web" ? (["top"] as const) : (["top", "bottom"] as const);

/**
 * Specialist composes the first message to a client. Renders the same
 * chat scaffold as /threads/:id (ChatThreadHeader-like stub + ChatComposer)
 * so the screen reads as a real chat — there is no separate 'fill out a
 * form' interface. On send: POST /api/threads creates the thread and we
 * router.replace to /threads/<new id>, keeping the same composer/messages
 * components — the user sees a seamless transition into the live chat.
 */
export default function SpecialistConfirmWrite() {
  useNoIndex();
  const router = useRouter();
  const nav = useTypedRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const { isAuthenticated, isSpecialistUser, user, token } = useAuth();

  const isStrandedSpecialist =
    isSpecialistUser && !user?.specialistProfileCompletedAt;

  const [request, setRequest] = useState<RequestSummary | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<PendingFile[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const [req, rl] = await Promise.all([
        api<RequestSummary>(`/api/requests/${id}/public`),
        api<RateLimitInfo>("/api/threads/rate-limit"),
      ]);
      setRequest(req);
      setRateLimit(rl);
    } catch {
      setSubmitError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (ready && isAuthenticated && !isSpecialistUser) {
      nav.replaceRoutes.tabsMyRequests();
    }
  }, [ready, isAuthenticated, isSpecialistUser, nav]);

  useEffect(() => {
    if (ready && isSpecialistUser) {
      load();
    }
  }, [ready, isSpecialistUser, load]);

  const isLimitReached =
    rateLimit !== null && rateLimit.writesToday >= DAILY_LIMIT;

  const handleSend = async () => {
    if (sending || isLimitReached) return;
    if (message.trim().length < MIN_CHARS) {
      dialog.alert({
        title: "Сообщение слишком короткое",
        message: `Минимум ${MIN_CHARS} символов.`,
      });
      return;
    }

    const uploading = attachedFiles.some(
      (f) => f.status === "uploading" || f.status === "pending"
    );
    if (uploading) {
      dialog.alert({ title: "Подождите", message: "Файл ещё загружается" });
      return;
    }

    setSending(true);
    setSubmitError(null);

    try {
      const doneFile = attachedFiles.find((f) => f.status === "done");
      const uploadToken = doneFile?.uploadedToken;

      const result = await api<{ id: string }>("/api/threads", {
        method: "POST",
        body: {
          requestId: id,
          firstMessage: message,
          ...(uploadToken ? { uploadToken } : {}),
        },
      });
      // Drop into the actual chat — same components, now with a real
      // thread id and message history loading.
      nav.replaceAny(`/threads/${result.id}?requestId=${id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const existingThreadId =
            typeof err.data?.threadId === "string"
              ? err.data.threadId
              : null;
          if (existingThreadId) {
            const goToThread = () =>
              nav.replaceAny(
                `/threads/${existingThreadId}?requestId=${id}`
              );
            void dialog
              .alert({
                title: "Вы уже откликнулись",
                message: "Перейдём к существующему диалогу.",
              })
              .then(goToThread);
          } else {
            setSubmitError(
              "Запрос закрыт — сообщение отправить невозможно"
            );
          }
        } else if (err.status === 429) {
          setSubmitError(
            "Лимит новых диалогов на сегодня исчерпан (20 в день). Попробуйте завтра."
          );
          if (rateLimit) {
            setRateLimit({ ...rateLimit, writesToday: DAILY_LIMIT });
          }
        } else {
          setSubmitError(
            "Не удалось отправить сообщение. Попробуйте ещё раз."
          );
        }
      } else {
        setSubmitError(
          "Не удалось отправить сообщение. Попробуйте ещё раз."
        );
      }
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/requests/${id}/detail` as never);
    }
  };

  const headerBar = (
    <View
      className="flex-row items-center px-3 border-b border-border bg-white"
      style={{ height: 52 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Назад"
        onPress={handleBack}
        className="flex-row items-center"
        style={{ minHeight: 44, paddingHorizontal: 6 }}
      >
        <ChevronLeft size={22} color={colors.text} />
        <Text className="text-text-base ml-1">Назад</Text>
      </Pressable>
    </View>
  );

  if (!ready || !isSpecialistUser || loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
        {headerBar}
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isStrandedSpecialist) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
        {headerBar}
        <View className="flex-1 justify-center">
          <EmptyState
            icon={UserCheck}
            title="Завершите профиль специалиста"
            subtitle="Перед тем как написать клиенту, нужно указать ИФНС, услуги и описание."
            actionLabel="Завершить"
            onAction={() =>
              router.replace(
                "/profile?firstTime=true&focus=specialist" as never
              )
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
        {headerBar}
        <View className="flex-1 justify-center">
          <EmptyState
            title="Запрос не найден"
            subtitle={submitError ?? "Попробуйте обновить страницу"}
            actionLabel="Назад"
            onAction={handleBack}
          />
        </View>
      </SafeAreaView>
    );
  }

  const clientName =
    [request.user.firstName, request.user.lastName].filter(Boolean).join(" ") ||
    "Клиент";

  // ChatThreadHeader-like stub (we don't have a thread id yet; renders the
  // counterpart's avatar + name + 'переписываетесь по запросу' subtitle).
  const chatHeader = (
    <View
      className="flex-row items-center px-4 py-3 border-b border-border bg-white"
      style={{ gap: 12 }}
    >
      <Avatar
        name={clientName}
        imageUrl={request.user.avatarUrl ?? undefined}
        size="sm"
      />
      <View style={{ flex: 1 }}>
        <Text
          className="text-base font-semibold"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {clientName}
        </Text>
        <Text
          className="text-xs"
          style={{ color: colors.textSecondary }}
          numberOfLines={1}
        >
          по запросу «{request.title}»
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
      {headerBar}
      {chatHeader}

      {/* Empty messages area — same visual layout as /threads/:id but
          without history. The first user-typed message becomes message
          #1 in the new thread once `handleSend` resolves. */}
      <ScrollView
        className="flex-1 bg-surface2"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View className="items-center">
          <Text
            className="text-sm text-center"
            style={{ color: colors.textSecondary, maxWidth: 400 }}
          >
            Это будет ваш первый диалог с клиентом по этому запросу. После
            отправки сообщения вы перейдёте в чат.
          </Text>
          {rateLimit !== null && (
            <Text
              className="text-xs mt-3 text-center"
              style={{
                color: isLimitReached ? colors.danger : colors.textMuted,
              }}
            >
              {isLimitReached
                ? "Лимит новых диалогов на сегодня исчерпан (20 в день)"
                : `Сегодня отправлено ${rateLimit.writesToday} из ${rateLimit.limit}`}
            </Text>
          )}
          {submitError && (
            <View
              className="mt-4 rounded-xl px-4 py-3 border"
              style={{
                borderColor: colors.danger,
                backgroundColor: colors.dangerSoft,
              }}
            >
              <Text className="text-sm" style={{ color: colors.danger }}>
                {submitError}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <ChatComposer
        value={message}
        onChangeText={setMessage}
        files={attachedFiles}
        onFilesChange={setAttachedFiles}
        onSend={handleSend}
        sending={sending}
        disabled={isLimitReached}
        authToken={token}
        maxLength={MAX_CHARS}
        placeholder={`Здравствуйте, ${request.user.firstName ?? ""}…`.trim() + ` (минимум ${MIN_CHARS} символов)`}
      />
    </SafeAreaView>
  );
}
