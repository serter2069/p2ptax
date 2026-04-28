import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import { Send } from "lucide-react-native";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, radiusValue, fontSizeValue, BREAKPOINT } from "@/lib/theme";

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
  const { isAuthenticated, user, isSpecialistUser, isLoading: authLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;

  const [request, setRequest] = useState<RequestSummary | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    if (!authLoading) {
      if (!isAuthenticated || !isSpecialistUser) {
        nav.replaceRoutes.login();
        return;
      }
      load();
    }
  }, [authLoading, isAuthenticated, isSpecialistUser, load, router]);

  const handleSend = async () => {
    if (message.length < MIN_CHARS || sending) return;
    if (rateLimit && rateLimit.writesToday >= DAILY_LIMIT) return;

    setSending(true);
    setSubmitError(null);

    try {
      const result = await api<{ id: string }>("/api/threads", {
        method: "POST",
        body: { requestId: id, firstMessage: message },
      });
      nav.replaceAny(`/threads/${result.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setSubmitError("Заявка закрыта — сообщение отправить невозможно");
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

  if (loading || authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
        <HeaderBack title="Написать клиенту" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top", "bottom"]}>
      <HeaderBack title="Написать клиенту" />

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
            <Text className="text-xs text-text-mute ml-auto">
              {message.length}/{MAX_CHARS}
            </Text>
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
