import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { apiGet, apiPost, ApiError } from "@/lib/api";

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
}

export default function SpecialistConfirmWrite() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequest() {
      try {
        const data = await apiGet<RequestDetail>(`/api/requests/${id}/public`);
        setRequest(data);
      } catch (err) {
        setError("Не удалось загрузить заявку");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchRequest();
  }, [id]);

  const handleSend = async () => {
    if (message.length < 10 || sending) return;

    setSending(true);
    setError(null);

    try {
      const result = await apiPost<{ id: string }>("/api/threads", {
        requestId: id,
        firstMessage: message,
      });
      router.replace(`/threads/${result.id}` as never);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          if (err.message === "Заявка закрыта") {
            setError("Заявка закрыта");
          } else {
            // Thread already exists — parse threadId from response
            try {
              const parsed = JSON.parse(
                (err as unknown as { message: string }).message
              );
              if (parsed.threadId) {
                router.replace(`/threads/${parsed.threadId}` as never);
                return;
              }
            } catch {
              // Try extracting threadId from error message
            }
            setError("Вы уже писали по этой заявке");
          }
        } else if (err.status === 429) {
          setError("Лимит 20 сообщений в день");
        } else {
          setError(err.message);
        }
      } else {
        setError("Ошибка отправки");
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <HeaderBack title="Написать клиенту" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderBack title="Написать клиенту" />
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <ResponsiveContainer>
          {/* Request summary */}
          {request && (
            <View className="bg-slate-50 rounded-xl p-4 mt-4 border border-slate-200">
              <Text className="text-base font-semibold text-slate-900 mb-2">
                {request.title}
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-2">
                <View className="bg-white px-2 py-0.5 rounded border border-slate-200">
                  <Text className="text-xs text-slate-400">{request.city.name}</Text>
                </View>
                <View className="bg-white px-2 py-0.5 rounded border border-slate-200">
                  <Text className="text-xs text-slate-400">{request.fns.name}</Text>
                </View>
              </View>
              <Text className="text-sm text-slate-400" numberOfLines={3}>
                {request.description}
              </Text>
            </View>
          )}

          {/* Message input */}
          <Text className="text-sm font-medium text-slate-900 mt-6 mb-2">
            Ваше сообщение
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Здравствуйте! Могу помочь с..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={1000}
            style={{
              minHeight: 120,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              borderRadius: 12,
              padding: 12,
              fontSize: 16,
              color: "#0f172a",
              backgroundColor: "#f9fafb",
              textAlignVertical: "top",
            }}
          />
          <Text className="text-xs text-slate-400 mt-1 text-right">
            {message.length}/1000
          </Text>

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          )}

          {/* Actions */}
          <Pressable
            onPress={handleSend}
            disabled={message.length < 10 || sending}
            className={`rounded-xl py-3 items-center mt-4 ${
              message.length < 10 || sending ? "bg-blue-900 opacity-50" : "bg-blue-900"
            }`}
          >
            {sending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-semibold">Отправить</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="rounded-xl py-3 items-center mt-2 bg-slate-100"
          >
            <Text className="text-slate-900 text-base font-semibold">Отмена</Text>
          </Pressable>

          <View className="h-8" />
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
