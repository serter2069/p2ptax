/**
 * /consultant — налоговый ассистент (TaxLLM via /api/consultant/*).
 *
 * Поведение:
 *   - При открытии запрашиваем активный тред юзера и подтягиваем переписку.
 *   - Каждое сообщение → POST /api/consultant/chat — backend сам решает
 *     актуален ли текущий тред или надо роллить новый при переполнении.
 *   - Кнопки «Новый чат» (создаёт чистый тред) и «Очистить» (soft-delete:
 *     скрываем у юзера, админ продолжает видеть).
 *   - Под каждым ответом — источники со ссылкой на /docs на TaxLLM сервере
 *     для просмотра полного текста статьи.
 */
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { Bot, Send, RotateCcw, Trash2, ExternalLink } from "lucide-react-native";
import { colors, spacing } from "@/lib/theme";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Source = {
  source: string;
  label: string;
  short: string;
  punkt?: string | null;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: Source[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };
};

const TAXLLM_DOCS_BASE = "https://taxllm.smartlaunchhub.com/docs";

export default function ConsultantScreen() {
  const { isAuthenticated } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView | null>(null);

  // Load active thread + its messages on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const r = await apiGet<{ threads: Array<{ id: string; messageCount: number }> }>(
          "/api/consultant/threads",
        );
        if (r.threads.length > 0) {
          const active = r.threads[0];
          setThreadId(active.id);
          if (active.messageCount > 0) {
            const m = await apiGet<{ messages: Message[] }>(
              `/api/consultant/threads/${active.id}/messages`,
            );
            setMessages(m.messages);
          }
        }
      } catch {
        // empty state — first visit
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  async function send() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    try {
      const r = await apiPost<{
        threadId: string;
        autoRolled: boolean;
        message: Message;
      }>("/api/consultant/chat", { message, threadId });
      // If backend rolled to a new thread (context overflow), reflect it
      if (threadId && r.threadId !== threadId && r.autoRolled) {
        // Drop old turns from the visible list — backend started fresh
        setMessages([optimistic, r.message]);
      } else {
        setMessages((prev) => [...prev, r.message]);
      }
      setThreadId(r.threadId);
    } catch (e) {
      const errMsg =
        e instanceof ApiError && e.status === 502
          ? "Сервис консультанта временно недоступен. Попробуйте через минуту."
          : e instanceof ApiError && e.status === 429
          ? "Слишком много запросов — подождите немного."
          : "Не удалось получить ответ. Попробуйте ещё раз.";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: errMsg,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function startNewThread() {
    try {
      const r = await apiPost<{ threadId: string }>("/api/consultant/threads/new", {});
      setThreadId(r.threadId);
      setMessages([]);
    } catch {}
  }

  async function clearForUser() {
    if (!threadId) return;
    try {
      await apiPost(`/api/consultant/threads/${threadId}/archive`, {});
      setThreadId(null);
      setMessages([]);
    } catch {}
  }

  function openSource(s: Source) {
    const url = `${TAXLLM_DOCS_BASE}/${encodeURIComponent(s.source)}`;
    if (Platform.OS === "web") window.open(url, "_blank");
    else Linking.openURL(url);
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
        <Text style={{ color: colors.textSecondary }}>Войдите, чтобы пользоваться консультантом.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Налоговый консультант" }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: spacing.sm,
          }}
        >
          <Bot size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
              Налоговый консультант
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              На базе НК РФ и писем ФНС. Бесплатно для всех пользователей.
            </Text>
          </View>
          <Pressable
            onPress={startNewThread}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.sm,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: colors.surface2,
              gap: 4,
            }}
          >
            <RotateCcw size={14} color={colors.textSecondary} />
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Новый чат</Text>
          </Pressable>
          {messages.length > 0 && (
            <Pressable
              onPress={clearForUser}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: spacing.sm,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: colors.surface2,
                gap: 4,
              }}
            >
              <Trash2 size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Очистить</Text>
            </Pressable>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, maxWidth: 800, alignSelf: "center", width: "100%" }}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : messages.length === 0 ? (
            <EmptyState onPick={(q) => setInput(q)} />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} m={m} onSourcePress={openSource} />)
          )}
          {sending && (
            <View style={{ alignItems: "flex-start" }}>
              <View
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: colors.surface2,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Ищу в источниках…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Composer */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: spacing.sm,
            maxWidth: 800,
            alignSelf: "center",
            width: "100%",
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Спросите про налог, ставку, льготу или порядок отчётности…"
            placeholderTextColor={colors.textMuted}
            multiline
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: colors.text,
              maxHeight: 140,
              minHeight: 44,
              ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
            }}
            editable={!sending}
            onKeyPress={(e: any) => {
              if (Platform.OS === "web" && e.nativeEvent.key === "Enter" && (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey)) {
                send();
              }
            }}
          />
          <Pressable
            onPress={send}
            disabled={sending || !input.trim()}
            style={{
              backgroundColor: input.trim() && !sending ? colors.primary : colors.surface2,
              paddingHorizontal: 14,
              height: 44,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={18} color={input.trim() && !sending ? colors.white : colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const samples = [
    "Какая ставка налога на прибыль организаций?",
    "Какие условия применения УСН доходы минус расходы?",
    "Когда подаётся декларация 3-НДФЛ?",
    "Какие доходы освобождаются от НДФЛ?",
  ];
  return (
    <View style={{ paddingVertical: spacing.xl, alignItems: "center", gap: spacing.md }}>
      <Bot size={42} color={colors.primary} />
      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
        Задайте налоговый вопрос
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", maxWidth: 460 }}>
        Ассистент работает на статьях НК РФ и письмах ФНС. Все ответы — со ссылками на конкретные пункты статей.
      </Text>
      <View style={{ marginTop: spacing.md, gap: spacing.xs, alignSelf: "stretch" }}>
        {samples.map((q) => (
          <Pressable
            key={q}
            onPress={() => onPick(q)}
            style={{
              padding: spacing.md,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.text }}>{q}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ m, onSourcePress }: { m: Message; onSourcePress: (s: Source) => void }) {
  const isUser = m.role === "user";
  return (
    <View style={{ alignItems: isUser ? "flex-end" : "flex-start" }}>
      <View
        style={{
          maxWidth: "92%",
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: isUser ? colors.primary : colors.surface2,
          borderWidth: isUser ? 0 : 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            lineHeight: 20,
            color: isUser ? colors.white : colors.text,
          }}
          selectable
        >
          {m.content}
        </Text>
      </View>
      {!isUser && m.sources && m.sources.length > 0 && (
        <View style={{ marginTop: 6, flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
          {m.sources.map((s, i) => (
            <Pressable
              key={`${s.source}-${i}`}
              onPress={() => onSourcePress(s)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: colors.accentSoft,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.accentSoftInk, fontWeight: "500" }}>
                {s.short || s.label}
                {s.punkt ? `, п.${s.punkt}` : ""}
              </Text>
              <ExternalLink size={11} color={colors.accentSoftInk} />
            </Pressable>
          ))}
        </View>
      )}
      {!isUser && m.usage?.total_tokens && (
        <Text style={{ marginTop: 4, fontSize: 11, color: colors.textMuted }}>
          {m.usage.total_tokens} токенов · ~$
          {((m.usage.cost ?? 0) as number).toFixed(4)}
        </Text>
      )}
    </View>
  );
}
