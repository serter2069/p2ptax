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
 *   - Шаблоны: backend в ответе на /chat возвращает suggestedActions
 *     (id+label). FE рендерит их как пилюли «Сгенерировать <…>» под
 *     последним ответом ассистента — юзер тыкает, открывается модалка с
 *     полем ввода, отправляет → /generate возвращает сообщение
 *     kind="document", FE рисует его как блок с кнопкой «Скачать».
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
  Modal,
} from "react-native";
import { Stack } from "expo-router";
import {
  Bot,
  Send,
  RotateCcw,
  Trash2,
  ExternalLink,
  FileDown,
  FileText,
  X,
  Sparkles,
} from "lucide-react-native";
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
  kind?: "text" | "document";
  attachmentFilename?: string | null;
  content: string;
  createdAt: string;
  sources?: Source[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };
};

type SuggestedAction = { id: string; label: string };

type TemplateMeta = {
  id: string;
  label: string;
  description: string;
  userInputLabel: string;
  userInputPlaceholder: string;
};

const TAXLLM_DOCS_BASE = "https://taxllm.smartlaunchhub.com/docs";

export default function ConsultantScreen() {
  const { isAuthenticated } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [genModal, setGenModal] = useState<{
    template: TemplateMeta;
    userInput: string;
    submitting: boolean;
  } | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  // Load active thread + its messages on mount, and fetch template catalog.
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [threadsR, templatesR] = await Promise.all([
          apiGet<{ threads: Array<{ id: string; messageCount: number }> }>(
            "/api/consultant/threads",
          ),
          apiGet<{ templates: TemplateMeta[] }>("/api/consultant/templates").catch(
            () => ({ templates: [] as TemplateMeta[] }),
          ),
        ]);
        setTemplates(templatesR.templates ?? []);
        if (threadsR.threads.length > 0) {
          const active = threadsR.threads[0];
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
    setSuggestedActions([]);
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
        suggestedActions?: SuggestedAction[];
      }>("/api/consultant/chat", { message, threadId });
      if (threadId && r.threadId !== threadId && r.autoRolled) {
        setMessages([optimistic, r.message]);
      } else {
        setMessages((prev) => [...prev, r.message]);
      }
      setThreadId(r.threadId);
      setSuggestedActions(r.suggestedActions ?? []);
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
      setSuggestedActions([]);
    } catch {}
  }

  async function clearForUser() {
    if (!threadId) return;
    try {
      await apiPost(`/api/consultant/threads/${threadId}/archive`, {});
      setThreadId(null);
      setMessages([]);
      setSuggestedActions([]);
    } catch {}
  }

  function openSource(s: Source) {
    const url = `${TAXLLM_DOCS_BASE}/${encodeURIComponent(s.source)}`;
    if (Platform.OS === "web") window.open(url, "_blank");
    else Linking.openURL(url);
  }

  function openGenModal(action: SuggestedAction) {
    const tpl = templates.find((t) => t.id === action.id);
    if (!tpl) return;
    setGenModal({ template: tpl, userInput: "", submitting: false });
  }

  async function submitGeneration() {
    if (!genModal) return;
    const userInput = genModal.userInput.trim();
    if (!userInput) return;
    setGenModal({ ...genModal, submitting: true });
    try {
      const r = await apiPost<{
        threadId: string;
        message: Message;
      }>("/api/consultant/generate", {
        threadId,
        templateId: genModal.template.id,
        userInput,
      });
      // Reflect both the user request and the generated document into chat history.
      setMessages((prev) => [
        ...prev,
        {
          id: `gen-req-${Date.now()}`,
          role: "user",
          content: `📄 Запрос на генерацию: ${genModal.template.label}\n\n${userInput}`,
          createdAt: new Date().toISOString(),
        },
        r.message,
      ]);
      setThreadId(r.threadId);
      setSuggestedActions([]);
      setGenModal(null);
    } catch (e) {
      const errMsg =
        e instanceof ApiError && e.status === 502
          ? "Сервис временно недоступен. Попробуйте позже."
          : e instanceof ApiError && e.status === 429
          ? "Слишком много запросов на генерацию — подождите."
          : "Не удалось сгенерировать документ.";
      setGenModal((prev) => (prev ? { ...prev, submitting: false } : prev));
      setMessages((prev) => [
        ...prev,
        {
          id: `gen-err-${Date.now()}`,
          role: "assistant",
          content: errMsg,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }

  function downloadDocument(m: Message) {
    const filename = m.attachmentFilename || "документ.txt";
    if (Platform.OS === "web") {
      const blob = new Blob([m.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      // Native: fall back to system share via mailto-ish — out of scope for MVP.
      Linking.openURL(
        `data:text/plain;charset=utf-8,${encodeURIComponent(m.content)}`,
      ).catch(() => {});
    }
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
            <EmptyState
              onPick={(q) => setInput(q)}
              templates={templates}
              onTemplate={(tpl) => setGenModal({ template: tpl, userInput: "", submitting: false })}
            />
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                m={m}
                onSourcePress={openSource}
                onDownload={downloadDocument}
              />
            ))
          )}
          {/* Suggested actions — рендерим под последним ответом */}
          {!sending && suggestedActions.length > 0 && (
            <View style={{ marginTop: 4, gap: 6 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Могу подготовить документ:
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {suggestedActions.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => openGenModal(a)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      gap: 6,
                    }}
                  >
                    <Sparkles size={14} color={colors.white} />
                    <Text style={{ fontSize: 13, color: colors.white, fontWeight: "600" }}>
                      Сгенерировать: {a.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
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

      {genModal && (
        <GenerateModal
          state={genModal}
          onChangeInput={(v) => setGenModal({ ...genModal, userInput: v })}
          onCancel={() => setGenModal(null)}
          onSubmit={submitGeneration}
        />
      )}
    </>
  );
}

function EmptyState({
  onPick,
  templates,
  onTemplate,
}: {
  onPick: (q: string) => void;
  templates: TemplateMeta[];
  onTemplate: (tpl: TemplateMeta) => void;
}) {
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
      {templates.length > 0 && (
        <View style={{ marginTop: spacing.lg, gap: spacing.xs, alignSelf: "stretch" }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
            Или сразу сгенерировать документ:
          </Text>
          {templates.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => onTemplate(t)}
              style={{
                padding: spacing.md,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <FileText size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  {t.label}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  {t.description}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function MessageBubble({
  m,
  onSourcePress,
  onDownload,
}: {
  m: Message;
  onSourcePress: (s: Source) => void;
  onDownload: (m: Message) => void;
}) {
  const isUser = m.role === "user";
  const isDocument = m.kind === "document";
  return (
    <View style={{ alignItems: isUser ? "flex-end" : "flex-start" }}>
      {isDocument ? (
        <View
          style={{
            maxWidth: "100%",
            width: "100%",
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <FileText size={18} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.text }}>
              {m.attachmentFilename || "Сгенерированный документ"}
            </Text>
            <Pressable
              onPress={() => onDownload(m)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: colors.primary,
                gap: 4,
              }}
            >
              <FileDown size={14} color={colors.white} />
              <Text style={{ fontSize: 12, color: colors.white, fontWeight: "600" }}>
                Скачать
              </Text>
            </Pressable>
          </View>
          <Text
            style={{
              fontFamily: Platform.OS === "web" ? "ui-monospace, monospace" : "Courier",
              fontSize: 12,
              lineHeight: 18,
              color: colors.text,
            }}
            selectable
          >
            {m.content}
          </Text>
        </View>
      ) : (
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
      )}
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

function GenerateModal({
  state,
  onChangeInput,
  onCancel,
  onSubmit,
}: {
  state: { template: TemplateMeta; userInput: string; submitting: boolean };
  onChangeInput: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={state.submitting ? () => {} : onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.lg,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 560,
            backgroundColor: colors.background,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <FileText size={20} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: colors.text }}>
              {state.template.label}
            </Text>
            <Pressable onPress={onCancel} disabled={state.submitting} hitSlop={8}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            {state.template.description}
          </Text>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
              {state.template.userInputLabel}
            </Text>
            <TextInput
              value={state.userInput}
              onChangeText={onChangeInput}
              placeholder={state.template.userInputPlaceholder}
              placeholderTextColor={colors.textMuted}
              multiline
              editable={!state.submitting}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.text,
                minHeight: 140,
                maxHeight: 280,
                backgroundColor: colors.surface,
                ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
              }}
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm }}>
            <Pressable
              onPress={onCancel}
              disabled={state.submitting}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: colors.surface2,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "600" }}>Отмена</Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              disabled={state.submitting || !state.userInput.trim()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: spacing.md,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor:
                  state.submitting || !state.userInput.trim() ? colors.surface2 : colors.primary,
              }}
            >
              {state.submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Sparkles size={14} color={colors.white} />
              )}
              <Text
                style={{
                  color:
                    state.submitting || !state.userInput.trim() ? colors.textMuted : colors.white,
                  fontWeight: "700",
                }}
              >
                {state.submitting ? "Генерирую…" : "Сгенерировать"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
