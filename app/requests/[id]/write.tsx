import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";

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
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

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
      if (!isAuthenticated || user?.role !== "SPECIALIST") {
        router.replace("/auth/email" as never);
        return;
      }
      load();
    }
  }, [authLoading, isAuthenticated, user, load, router]);

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
      router.replace(`/threads/${result.id}` as never);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setSubmitError("Заявка закрыта — отклик невозможен");
        } else if (err.status === 429) {
          setSubmitError(
            "Лимит откликов на сегодня исчерпан (20 в день). Попробуйте завтра."
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
      <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
        <HeaderBack title="Написать клиенту" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <HeaderBack title="Написать клиенту" />

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <ResponsiveContainer>
          {/* Subtitle */}
          <Text className="text-sm text-slate-500 mt-4 mb-3">
            Прочитайте заявку и напишите первое сообщение
          </Text>

          {/* Rate limit info */}
          {rateLimit !== null && (
            <View
              className={`rounded-xl px-4 py-3 mb-4 border ${
                isLimitReached
                  ? "bg-red-50 border-red-200"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isLimitReached ? "text-red-600" : "text-slate-600"
                }`}
              >
                {isLimitReached
                  ? "Лимит откликов на сегодня исчерпан (20 в день). Попробуйте завтра."
                  : `Вы отправили ${rateLimit.writesToday} из ${rateLimit.limit} обращений сегодня`}
              </Text>
            </View>
          )}

          {/* Request summary card */}
          {request && (
            <View
              className="bg-white rounded-2xl border border-slate-100 p-4 mb-4"
              style={{
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Заявка клиента
              </Text>
              <Text className="text-base font-semibold text-slate-900 mb-2 leading-snug">
                {request.title}
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-3">
                <View className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                  <Text className="text-xs text-slate-600">{request.city.name}</Text>
                </View>
                <View className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                  <Text className="text-xs text-slate-600">{request.fns.name}</Text>
                </View>
              </View>
              <Text className="text-sm text-slate-500 leading-5" numberOfLines={3}>
                {request.description}
              </Text>
            </View>
          )}

          {/* Message textarea */}
          <Text className="text-sm font-semibold text-slate-900 mb-2">
            Ваше сообщение
          </Text>
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
              minHeight: 140,
              borderWidth: 1,
              borderColor: isLimitReached ? colors.border : colors.borderLight,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: colors.text,
              backgroundColor: isLimitReached ? colors.background : colors.surface,
              textAlignVertical: "top",
              opacity: isLimitReached ? 0.5 : 1,
            }}
          />

          {/* Counter + min-length hint */}
          <View className="flex-row justify-between items-center mt-1 mb-1">
            {message.length > 0 && message.length < MIN_CHARS ? (
              <Text className="text-xs text-red-500">Минимум 10 символов</Text>
            ) : (
              <View />
            )}
            <Text className="text-xs text-slate-400 ml-auto">
              {message.length}/{MAX_CHARS}
            </Text>
          </View>

          {/* Submit error */}
          {submitError && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
              <Text className="text-sm text-red-600">{submitError}</Text>
            </View>
          )}

          {/* Action buttons */}
          <View className="mt-5 gap-3">
            <Button
              label="Отправить сообщение"
              onPress={handleSend}
              disabled={!canSubmit}
              loading={sending}
              icon="send"
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
