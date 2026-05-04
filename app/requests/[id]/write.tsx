import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { dialog } from "@/lib/dialog";
import LoadingState from "@/components/ui/LoadingState";
import { UserCheck, ChevronLeft } from "lucide-react-native";
import { api, ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/ui/EmptyState";
import RequestPreviewCard, { RequestPreviewData } from "@/components/requests/RequestPreviewCard";
import ChatComposer, { type PendingFile } from "@/components/ChatComposer";
import { colors } from "@/lib/theme";


interface RequestSummary extends RequestPreviewData {
  user: { id: string; firstName: string | null; lastName: string | null };
}

interface RateLimitInfo {
  writesToday: number;
  limit: number;
}

const MAX_CHARS = 2000;
const MIN_CHARS = 10;
const DAILY_LIMIT = 20;

/**
 * Specialist composes the first message to a client. Layout mirrors a
 * real chat (sticky composer at the bottom, scrollable history above)
 * so the specialist lands in something that already feels like the
 * conversation they're about to have. The form-style version was
 * jarring — it read as 'fill out a contact form' instead of 'start a
 * chat'. Send POSTs /api/threads and redirects to /threads/:id.
 */
export default function SpecialistConfirmWrite() {
  const router = useRouter();
  const nav = useTypedRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const { isAuthenticated, isSpecialistUser, user, token } = useAuth();

  // Stranded specialists must finish onboarding before they can write.
  const isStrandedSpecialist = isSpecialistUser && !user?.specialistProfileCompletedAt;

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

  const isLimitReached = rateLimit !== null && rateLimit.writesToday >= DAILY_LIMIT;
  const canSend =
    !sending &&
    !isLimitReached &&
    message.trim().length >= MIN_CHARS;

  const handleSend = async () => {
    if (!canSend) return;

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
      nav.replaceAny(`/threads/${result.id}?requestId=${id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const existingThreadId =
            typeof err.data?.threadId === "string" ? err.data.threadId : null;
          if (existingThreadId) {
            const goToThread = () =>
              nav.replaceAny(`/threads/${existingThreadId}?requestId=${id}`);
            void dialog
              .alert({
                title: "Вы уже откликнулись",
                message: "Перейдём к существующему диалогу.",
              })
              .then(goToThread);
          } else {
            setSubmitError("Запрос закрыт — сообщение отправить невозможно");
          }
        } else if (err.status === 429) {
          setSubmitError(
            "Лимит новых диалогов на сегодня исчерпан (20 в день). Попробуйте завтра."
          );
          if (rateLimit) {
            setRateLimit({ ...rateLimit, writesToday: DAILY_LIMIT });
          }
        } else {
          setSubmitError("Не удалось отправить сообщение. Попробуйте ещё раз.");
        }
      } else {
        setSubmitError("Не удалось отправить сообщение. Попробуйте ещё раз.");
      }
    } finally {
      setSending(false);
    }
  };

  const header = (
    <View
      className="flex-row items-center px-3 border-b border-border bg-white"
      style={{ height: 52 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Назад"
        onPress={() => router.back()}
        className="flex-row items-center"
        style={{ minHeight: 44, paddingHorizontal: 6 }}
      >
        <ChevronLeft size={22} color={colors.text} />
        <Text className="text-text-base ml-1">Назад</Text>
      </Pressable>
      <Text
        className="text-base font-semibold text-text-base ml-2 flex-1"
        numberOfLines={1}
      >
        {request?.user.firstName
          ? `Написать клиенту ${request.user.firstName}`
          : "Написать клиенту"}
      </Text>
    </View>
  );

  const SAFE_EDGES = Platform.OS === "web"
    ? (["top"] as const)
    : (["top", "bottom"] as const);

  if (!ready || !isSpecialistUser || loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
        {header}
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isStrandedSpecialist) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
        {header}
        <View className="flex-1 justify-center">
          <EmptyState
            icon={UserCheck}
            title="Завершите профиль специалиста"
            subtitle="Перед тем как написать клиенту, нужно указать ИФНС, услуги и описание."
            actionLabel="Завершить"
            onAction={() => router.replace("/profile?firstTime=true&focus=specialist" as never)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
      {header}

      <ScrollView
        className="flex-1 bg-surface2"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16 }}
      >
        {request && <RequestPreviewCard request={request} />}

        {rateLimit !== null && (
          <View
            className={`rounded-xl px-4 py-3 mb-3 border ${
              isLimitReached
                ? "bg-danger-soft border-red-200"
                : "bg-white border-border"
            }`}
          >
            <Text
              className={`text-xs ${
                isLimitReached ? "text-danger" : "text-text-mute"
              }`}
            >
              {isLimitReached
                ? "Лимит новых диалогов на сегодня исчерпан (20 в день). Попробуйте завтра."
                : `Сегодня отправлено ${rateLimit.writesToday} из ${rateLimit.limit}`}
            </Text>
          </View>
        )}

        {submitError && (
          <View className="bg-danger-soft border border-red-200 rounded-xl px-4 py-3">
            <Text className="text-sm text-danger">{submitError}</Text>
          </View>
        )}
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
        placeholder={`Здравствуйте! Я специалист… (минимум ${MIN_CHARS} символов)`}
      />
    </SafeAreaView>
  );
}
