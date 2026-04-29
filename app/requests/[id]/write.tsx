import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTypedRouter } from "@/lib/navigation";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import { Send, Paperclip, X, UserCheck, ChevronLeft } from "lucide-react-native";
import { api, ApiError, API_URL } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/ui/EmptyState";
import { colors, radiusValue, fontSizeValue, BREAKPOINT } from "@/lib/theme";

interface PendingFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

const CHAT_FILE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB — must match api/src/routes/upload.ts (chatFileUpload)
const TOKEN_KEY = "p2ptax_access_token";

function chatUploadErrorMessage(status: number): string {
  if (status === 413) return "Файл слишком большой. Максимум 10 МБ.";
  if (status === 429) return "Слишком много загрузок. Попробуйте через минуту.";
  if (status === 0) return "Нет связи с сервером.";
  return "Не удалось загрузить файл. Попробуйте ещё раз.";
}

function generateUploadToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface RequestSummary {
  id: string;
  title: string;
  description: string;
  status: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
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
  const router = useRouter()
  const nav = useTypedRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready } = useRequireAuth();
  const { isSpecialistUser, user } = useAuth();
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
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // Authed but wrong role: redirect to client-facing requests screen.
  useEffect(() => {
    if (ready && !isSpecialistUser) {
      nav.replaceRoutes.login();
    }
  }, [ready, isSpecialistUser, nav]);

  useEffect(() => {
    if (ready && isSpecialistUser) {
      load();
    }
  }, [ready, isSpecialistUser, load]);

  const handleAttachFile = useCallback(async () => {
    if (pendingFile) {
      Alert.alert("Лимит файлов", "Можно прикрепить только один файл к первому сообщению");
      return;
    }
    setUploadError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const fileSize = asset.size ?? 0;
      if (fileSize > CHAT_FILE_MAX_BYTES) {
        Alert.alert("Файл слишком большой", "Максимальный размер файла — 10 МБ");
        return;
      }
      setPendingFile({
        uri: asset.uri,
        name: asset.name,
        size: fileSize,
        mimeType: asset.mimeType ?? "application/octet-stream",
      });
    } catch (e) {
      console.error("document picker error:", e);
    }
  }, [pendingFile]);

  const handleRemoveFile = useCallback(() => {
    setPendingFile(null);
    setUploadError(null);
  }, []);

  const uploadPendingFile = useCallback(
    async (file: PendingFile): Promise<string> => {
      const uploadToken = generateUploadToken();
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob);
      formData.append("uploadToken", uploadToken);
      // NOTE: no threadId — the upload endpoint stores under chat-files/_pending/
      // and threads.ts links it to the first message when the thread is created.

      const token = await AsyncStorage.getItem(TOKEN_KEY);
      let res: Response;
      try {
        res = await fetch(`${API_URL}/api/upload/chat-file`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
      } catch {
        throw new ApiError(0, chatUploadErrorMessage(0));
      }

      if (!res.ok) {
        throw new ApiError(res.status, chatUploadErrorMessage(res.status));
      }

      const data = (await res.json()) as { uploadToken: string };
      return data.uploadToken;
    },
    []
  );

  const handleSend = async () => {
    if (message.length < MIN_CHARS || sending) return;
    if (rateLimit && rateLimit.writesToday >= DAILY_LIMIT) return;

    setSending(true);
    setSubmitError(null);
    setUploadError(null);

    try {
      let uploadToken: string | undefined;
      if (pendingFile) {
        try {
          uploadToken = await uploadPendingFile(pendingFile);
        } catch (uploadErr) {
          if (uploadErr instanceof ApiError) {
            setUploadError(uploadErr.message);
          } else {
            setUploadError(chatUploadErrorMessage(0));
          }
          setSending(false);
          return;
        }
      }

      const result = await api<{ id: string }>("/api/threads", {
        method: "POST",
        body: {
          requestId: id,
          firstMessage: message,
          ...(uploadToken ? { uploadToken } : {}),
        },
      });
      nav.replaceAny(`/threads/${result.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const existingThreadId =
            typeof err.data?.threadId === "string" ? err.data.threadId : null;
          if (existingThreadId) {
            const goToThread = () =>
              nav.replaceAny(`/threads/${existingThreadId}`);
            Alert.alert(
              "Вы уже откликнулись",
              "Перейдём к существующему диалогу.",
              [{ text: "OK", onPress: goToThread }],
              { onDismiss: goToThread }
            );
          } else {
            setSubmitError("Заявка закрыта — сообщение отправить невозможно");
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
            onAction={() => router.replace("/onboarding/name" as never)}
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
            Прочитайте заявку и напишите первое сообщение
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
          {request && (
            <View
              className="bg-white rounded-2xl border border-border p-4 mb-4"
              style={{
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                Заявка клиента
              </Text>
              <Text className="text-base font-semibold text-text-base mb-2 leading-snug">
                {request.title}
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-3">
                <View className="bg-surface2 border border-border px-2.5 py-1 rounded-lg">
                  <Text className="text-xs text-text-mute">{request.city.name}</Text>
                </View>
                <View className="bg-surface2 border border-border px-2.5 py-1 rounded-lg">
                  <Text className="text-xs text-text-mute">{request.fns.name}</Text>
                </View>
              </View>
              <Text className="text-sm text-text-mute leading-5" numberOfLines={3}>
                {request.description}
              </Text>
            </View>
          )}

          {/* Message textarea */}
          <Text className="text-sm font-semibold text-text-base mb-2">
            Ваше сообщение
          </Text>
          {/* Outer View owns all visual styling — prevents double-input on web (NativeWind wraps
              TextInput in an extra div when className is used; keeping className off TextInput
              and border/bg on the parent View avoids the double-box artifact). */}
          <View
            style={{
              minHeight: 140,
              borderWidth: 1,
              borderColor: isLimitReached ? colors.border : colors.borderLight,
              borderRadius: radiusValue.md,
              backgroundColor: isLimitReached ? colors.background : colors.surface,
              opacity: isLimitReached ? 0.5 : 1,
            }}
          >
            <TextInput
              accessibilityLabel="Ваше сообщение"
              value={message}
              maxLength={MAX_CHARS}
              onChangeText={(t) => {
                if (t.length <= MAX_CHARS) setMessage(t);
              }}
              placeholder="Здравствуйте! Я специалист по... Могу помочь с вашей ситуацией. Расскажите подробнее..."
              placeholderTextColor={colors.placeholder}
              multiline
              editable={!isLimitReached}
              style={{
                flex: 1,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: fontSizeValue.base,
                color: colors.text,
                textAlignVertical: "top",
                borderWidth: 0,
                backgroundColor: "transparent",
                // appearance:none + outlineStyle:none kill the default
                // browser <textarea> chrome that creates the double-border
                // artifact when the outer View owns the visible border.
                ...(Platform.OS === "web" ? {
                  borderColor: "transparent",
                  outlineStyle: "none" as never,
                  outlineWidth: 0,
                  appearance: "none" as never,
                } : {}),
              }}
            />
          </View>

          {/* Counter + min-length hint */}
          <View className="flex-row justify-between items-center mt-1 mb-1">
            {message.length > 0 && message.length < MIN_CHARS ? (
              <Text className="text-xs text-danger">Минимум 10 символов</Text>
            ) : (
              <View />
            )}
            <Text
              className={`text-xs ml-auto ${
                message.length >= MAX_CHARS ? "text-danger" : "text-text-mute"
              }`}
            >
              {message.length}/{MAX_CHARS}
            </Text>
          </View>

          {/* File attachment row */}
          <View className="mt-3">
            {pendingFile ? (
              <View className="flex-row items-center justify-between bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
                <View className="flex-1 mr-2">
                  <Text className="text-sm text-slate-900" numberOfLines={1}>
                    {pendingFile.name}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {(pendingFile.size / 1024).toFixed(0)} КБ
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Удалить файл"
                  onPress={handleRemoveFile}
                  hitSlop={8}
                  className="p-1"
                >
                  <X size={18} color={colors.text} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityLabel="Прикрепить файл"
                onPress={handleAttachFile}
                disabled={isLimitReached || sending}
                className="flex-row items-center self-start px-3 py-2 rounded-xl border border-slate-200 bg-white"
                style={{ opacity: isLimitReached || sending ? 0.5 : 1 }}
              >
                <Paperclip size={16} color={colors.text} />
                <Text className="text-sm text-slate-700 ml-2">Прикрепить файл</Text>
              </Pressable>
            )}
            {uploadError && (
              <Text className="text-xs text-red-500 mt-2">{uploadError}</Text>
            )}
          </View>

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
