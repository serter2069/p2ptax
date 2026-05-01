import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import { Send, UserCheck, ChevronLeft } from "lucide-react-native";
import { api, ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/ui/EmptyState";
import RequestPreviewCard, { RequestPreviewData } from "@/components/requests/RequestPreviewCard";
import MessageComposer from "@/components/requests/MessageComposer";
import FileUploadZone, { type PendingFile } from "@/components/ui/FileUploadZone";
import { FileUploadChips } from "@/components/ui/FileUploadZone";
import { colors, BREAKPOINT } from "@/lib/theme";



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

export default function SpecialistConfirmWrite() {
  const router = useRouter();
  const nav = useTypedRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const { isAuthenticated, isSpecialistUser, user, token } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;

  // Wave 2/G — hard gate for stranded specialists. They can browse, but
  // before they can write to a client they MUST finish onboarding (ИФНС,
  // services, description). Otherwise the message goes out from a profile
  // that's invisible in the catalog.
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

  // Authed but wrong role: redirect to client-facing requests screen (#P1)
  useEffect(() => {
    const { isAuthenticated } = useAuth();
    if (ready && isAuthenticated && !isSpecialistUser) {
      nav.replaceRoutes.tabsMyRequests();
      return;
    }
    // Anon: useRequireAuth handles redirect to /login with returnTo
  }, [ready, isSpecialistUser, nav]);

  useEffect(() => {
    if (ready && isSpecialistUser) {
      load();
    }
  }, [ready, isSpecialistUser, load]);

  const handleSend = async () => {
    if (message.length < MIN_CHARS || sending) return;
    if (rateLimit && rateLimit.writesToday >= DAILY_LIMIT) return;

    // Block send if any file is still uploading.
    const uploading = attachedFiles.some(
      (f) => f.status === "uploading" || f.status === "pending"
    );
    if (uploading) {
      Alert.alert("Подождите", "Файл ещё загружается");
      return;
    }

    setSending(true);
    setSubmitError(null);

    try {
      // FileUploadZone uploads immediately on pick → take the token from the
      // first done file (write screen supports one attachment in first message).
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
            Alert.alert(
              "Вы уже откликнулись",
              "Перейдём к существующему диалогу.",
              [{ text: "OK", onPress: goToThread }],
              { onDismiss: goToThread }
            );
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

  const isLimitReached = rateLimit !== null && rateLimit.writesToday >= DAILY_LIMIT;
  const canSubmit = message.length >= MIN_CHARS && !isLimitReached && !sending;

  const backRow = (
    <View className="px-4 pt-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Назад"
        onPress={() => router.back()}
        className="flex-row items-center mb-2"
        style={{ minHeight: 44 }}
      >
        <ChevronLeft size={20} color={colors.text} />
        <Text className="text-text-base ml-1">Назад</Text>
      </Pressable>
      <Text className="text-2xl font-extrabold text-text-base mb-3">Написать клиенту</Text>
    </View>
  );

  if (!ready || !isSpecialistUser || loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
        {backRow}
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isStrandedSpecialist) {
    return (
      <SafeAreaView className="flex-1 bg-surface2" edges={["top", "bottom"]}>
        {backRow}
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
    <SafeAreaView className="flex-1 bg-surface2" edges={["top", "bottom"]}>
      {backRow}

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: isDesktop ? 48 : 24 }}
      >
        <ResponsiveContainer>
          {/* Subtitle */}
          <Text className="text-sm text-text-mute mt-4 mb-3">
            Прочитайте запрос и напишите первое сообщение
          </Text>

          {/* Rate limit info */}
          {rateLimit !== null && (
            <View
              className={`rounded-xl px-4 py-3 mb-4 border ${
                isLimitReached
                  ? "bg-danger-soft border-red-200"
                  : "bg-surface2 border-border"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isLimitReached ? "text-danger" : "text-text-mute"
                }`}
              >
                {isLimitReached
                  ? "Лимит новых диалогов на сегодня исчерпан (20 в день). Попробуйте завтра."
                  : `Вы отправили ${rateLimit.writesToday} из ${rateLimit.limit} обращений сегодня`}
              </Text>
            </View>
          )}

          {/* Request summary card */}
          {request && <RequestPreviewCard request={request} />}

          {/* Message textarea */}
          <MessageComposer
            value={message}
            onChange={setMessage}
            placeholder="Здравствуйте! Я специалист по... Могу помочь с вашей ситуацией. Расскажите подробнее..."
            maxLength={MAX_CHARS}
            minLength={MIN_CHARS}
            disabled={isLimitReached}
          />

          {/* File attachment — chips above the upload button */}
          <FileUploadChips
            files={attachedFiles}
            onRemove={(fileId) =>
              setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId))
            }
          />
          <FileUploadZone
            files={attachedFiles}
            onFilesChange={setAttachedFiles}
            uploadEndpoint="/api/upload/chat-file"
            authToken={token}
            maxFiles={1}
            compact
            disabled={isLimitReached || sending}
          />

          {/* Submit error */}
          {submitError && (
            <View className="bg-danger-soft border border-red-200 rounded-xl px-4 py-3 mt-3">
              <Text className="text-sm text-danger">{submitError}</Text>
            </View>
          )}

          {/* Action buttons */}
          <View className="mt-5 gap-3">
            <Button
              label="Отправить сообщение"
              onPress={handleSend}
              disabled={!canSubmit}
              loading={sending}
              icon={Send}
            />
            <Button
              variant="secondary"
              label="Отмена"
              onPress={() => router.back()}
            />
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
