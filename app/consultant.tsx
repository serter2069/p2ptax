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
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { Stack, useRouter } from "expo-router";
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
  Copy,
  Check,
  RefreshCw,
  Bug,
  Users,
  MapPin,
  Paperclip,
  Image as ImageIcon,
  FileSearch,
} from "lucide-react-native";
import { colors, spacing } from "@/lib/theme";
import { apiGet, apiPost, ApiError, API_URL, getAccessToken } from "@/lib/api";
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
  kind?: "text" | "document" | "upload";
  attachmentFilename?: string | null;
  content: string;
  createdAt: string;
  sources?: Source[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number };
  // Backend кладёт сюда { generation: { templateId, userInput } } для document-сообщений,
  // чтобы FE мог восстановить исходный ввод при «Перегенерировать».
  debug?: Record<string, unknown> | null;
};

type SuggestedAction = { id: string; label: string };

// CTA, которые backend отдаёт в done-event для tax-режима.
// type определяет иконку и href, label — что написано на пилюле.
type ConsultantAction = { type: string; label: string; href: string };

// Сохранённая ФНС юзера — подмешивается в каждый chat/stream-запрос
// как контекст. Значительно улучшает релевантность ответов про
// территориальные особенности (адрес инспекции, региональные ставки).
type SavedFns = {
  cityId: string;
  citySlug: string;
  cityName: string;
  fnsId: string;
  fnsName: string;
  fnsCode?: string | null;
  fnsAddress?: string | null;
};
const FNS_STORAGE_KEY = "p2ptax_consultant_fns";

type CityRow = { id: string; slug: string; name: string; officesCount: number };
type IfnsRow = { id: string; name: string; code?: string | null; address?: string | null };

type TemplateMeta = {
  id: string;
  label: string;
  description: string;
  userInputLabel: string;
  userInputPlaceholder: string;
};

const TAXLLM_DOCS_BASE = "https://taxllm.smartlaunchhub.com/docs";

// Чистим [Источник: Ст. 88 ч.1, п.1] из текста — пилюли источников всё
// равно отрисовываются под сообщением. Также склеиваем висящие пробелы
// и точки, которые остаются после вырезки.
function stripInlineSources(content: string): string {
  return content
    .replace(/\s*\[Источник:[^\]]*\]/giu, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Разбиваем текст на абзацы по двойному переводу строки или одинарному
// (TaxLLM иногда жмёт всё в один блок) — рендерим каждый параграф
// отдельным <Text>, чтобы получить нормальные отступы между абзацами.
function splitParagraphs(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, "\n");
  // Если есть двойные переводы — режем по ним. Иначе — каждое предложение,
  // оканчивающееся точкой+пробел перед заглавной — новый абзац (consequence
  // of grok который любит писать монолитом).
  if (/\n\s*\n/.test(cleaned)) {
    return cleaned.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  }
  return cleaned
    .split(/(?<=[.!?])\s+(?=[А-ЯA-ZЁ])/u)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function ConsultantScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [actions, setActions] = useState<ConsultantAction[]>([]);
  const [savedFns, setSavedFns] = useState<SavedFns | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fnsModal, setFnsModal] = useState<{
    cityQuery: string;
    cities: CityRow[];
    selectedCity: CityRow | null;
    ifnsQuery: string;
    ifnsList: IfnsRow[];
    loading: boolean;
  } | null>(null);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [genModal, setGenModal] = useState<{
    template: TemplateMeta;
    userInput: string;
    submitting: boolean;
  } | null>(null);
  // Дебаг-лог для repro: каждое сетевое событие складывается сюда (макс 30),
  // юзер копирует одной кнопкой и вставляет в чат с разрабом.
  const [logEntries, setLogEntries] = useState<Array<Record<string, unknown>>>([]);
  const [logCopied, setLogCopied] = useState(false);
  const pushLog = (entry: Record<string, unknown>) => {
    setLogEntries((prev) => [
      ...prev.slice(-29),
      { ts: new Date().toISOString(), ...entry },
    ]);
  };
  const scrollRef = useRef<ScrollView | null>(null);

  // Load active thread + its messages on mount, and fetch template catalog.
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [threadsR, templatesR, savedFnsRaw] = await Promise.all([
          apiGet<{ threads: Array<{ id: string; messageCount: number }> }>(
            "/api/consultant/threads",
          ),
          apiGet<{ templates: TemplateMeta[] }>("/api/consultant/templates").catch(
            () => ({ templates: [] as TemplateMeta[] }),
          ),
          AsyncStorage.getItem(FNS_STORAGE_KEY).catch(() => null),
        ]);
        setTemplates(templatesR.templates ?? []);
        if (savedFnsRaw) {
          try { setSavedFns(JSON.parse(savedFnsRaw) as SavedFns); } catch {}
        }
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

  async function persistFns(fns: SavedFns | null) {
    setSavedFns(fns);
    try {
      if (fns) await AsyncStorage.setItem(FNS_STORAGE_KEY, JSON.stringify(fns));
      else await AsyncStorage.removeItem(FNS_STORAGE_KEY);
    } catch {}
  }

  async function openFnsModal() {
    setFnsModal({
      cityQuery: "",
      cities: [],
      selectedCity: null,
      ifnsQuery: "",
      ifnsList: [],
      loading: true,
    });
    try {
      const r = await apiGet<{ items: CityRow[] }>("/api/cities?limit=1000");
      setFnsModal((prev) => prev ? { ...prev, cities: r.items, loading: false } : prev);
    } catch {
      setFnsModal((prev) => prev ? { ...prev, loading: false } : prev);
    }
  }

  async function selectCityInFnsModal(city: CityRow) {
    if (!fnsModal) return;
    setFnsModal({ ...fnsModal, selectedCity: city, ifnsQuery: "", ifnsList: [], loading: true });
    try {
      const r = await apiGet<{ items: IfnsRow[] }>(`/api/cities/${city.slug}/ifns?limit=100`);
      setFnsModal((prev) =>
        prev ? { ...prev, selectedCity: city, ifnsList: r.items, loading: false } : prev,
      );
    } catch {
      setFnsModal((prev) => prev ? { ...prev, loading: false } : prev);
    }
  }

  function selectIfnsInFnsModal(office: IfnsRow) {
    if (!fnsModal?.selectedCity) return;
    persistFns({
      cityId: fnsModal.selectedCity.id,
      citySlug: fnsModal.selectedCity.slug,
      cityName: fnsModal.selectedCity.name,
      fnsId: office.id,
      fnsName: office.name,
      fnsCode: office.code ?? null,
      fnsAddress: office.address ?? null,
    });
    setFnsModal(null);
  }

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  async function send() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setSuggestedActions([]);
    setActions([]);
    const userMsg: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    const assistantPlaceholderId = `streaming-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantPlaceholderId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      sources: [],
    };
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setSending(true);
    pushLog({ event: "chat.request", message, threadId, mode: "stream" });

    const updateAssistant = (patch: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantPlaceholderId ? { ...m, ...patch } : m)),
      );
    };
    const appendToken = (text: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantPlaceholderId ? { ...m, content: m.content + text } : m,
        ),
      );
    };

    // Если у юзера сохранена ФНС — шлём как отдельное поле userContext.
    // Backend сохраняет в БД оригинальный message (без контекста), а
    // TaxLLM получает склейку. Так в истории чата юзер видит чистый
    // свой вопрос, а бот всё равно отвечает с учётом региона.
    const userContext = savedFns
      ? `Моя ИФНС: ${savedFns.fnsName}` +
        (savedFns.fnsCode ? ` (код ${savedFns.fnsCode})` : "") +
        `, г. ${savedFns.cityName}` +
        (savedFns.fnsAddress ? `, адрес: ${savedFns.fnsAddress}` : "")
      : null;

    try {
      const token = await getAccessToken();
      const resp = await fetch(`${API_URL}/api/consultant/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, threadId, userContext }),
      });
      if (!resp.ok) {
        throw new ApiError(resp.status, `stream HTTP ${resp.status}`);
      }
      if (!resp.body) {
        throw new Error("no_stream_body");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let intent = "tax";
      let serverMessageId: string | null = null;
      let serverThreadId = threadId;
      let receivedMeta = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl = buf.indexOf("\n");
        while (nl !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          nl = buf.indexOf("\n");
          if (!line) continue;
          let evt: {
            type?: string;
            text?: string;
            sources?: Source[];
            intent?: string;
            threadId?: string;
            tempId?: string;
            autoRolled?: boolean;
            messageId?: string;
            createdAt?: string;
            usage?: Message["usage"];
            suggestedActions?: SuggestedAction[];
            actions?: ConsultantAction[];
            message?: string;
          };
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          if (evt.type === "start") {
            if (evt.threadId) serverThreadId = evt.threadId;
            if (evt.threadId && threadId && evt.threadId !== threadId && evt.autoRolled) {
              // backend autoRolled — старая переписка ушла в архив, в UI оставляем только текущий ход
              setMessages([userMsg, assistantPlaceholder]);
            }
          } else if (evt.type === "meta") {
            receivedMeta = true;
            if (evt.intent) intent = evt.intent;
            updateAssistant({ sources: evt.sources ?? [] });
          } else if (evt.type === "token" && evt.text) {
            appendToken(evt.text);
          } else if (evt.type === "done") {
            serverMessageId = evt.messageId ?? null;
            updateAssistant({
              id: evt.messageId ?? assistantPlaceholderId,
              createdAt: evt.createdAt ?? new Date().toISOString(),
              usage: evt.usage,
            });
            setSuggestedActions(evt.suggestedActions ?? []);
            setActions(evt.actions ?? []);
          } else if (evt.type === "error") {
            updateAssistant({
              content:
                evt.message === "taxllm_unavailable"
                  ? "Сервис консультанта временно недоступен. Попробуйте через минуту."
                  : "Не удалось получить ответ. Попробуйте ещё раз.",
            });
          }
        }
      }

      if (serverThreadId) setThreadId(serverThreadId);
      pushLog({
        event: "chat.response.stream",
        threadId: serverThreadId,
        intent,
        messageId: serverMessageId,
        receivedMeta,
      });
    } catch (e) {
      pushLog({
        event: "chat.error",
        status: e instanceof ApiError ? e.status : 0,
        message: e instanceof Error ? e.message : String(e),
      });
      const errMsg =
        e instanceof ApiError && e.status === 502
          ? "Сервис консультанта временно недоступен. Попробуйте через минуту."
          : e instanceof ApiError && e.status === 429
          ? "Слишком много запросов — подождите немного."
          : "Не удалось получить ответ. Попробуйте ещё раз.";
      updateAssistant({ content: errMsg });
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
      setActions([]);
    } catch {}
  }

  async function clearForUser() {
    if (!threadId) return;
    try {
      await apiPost(`/api/consultant/threads/${threadId}/archive`, {});
      setThreadId(null);
      setMessages([]);
      setSuggestedActions([]);
      setActions([]);
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
    pushLog({ event: "generate.request", templateId: genModal.template.id, userInputLen: userInput.length });
    try {
      const r = await apiPost<{
        threadId: string;
        message: Message;
      }>("/api/consultant/generate", {
        threadId,
        templateId: genModal.template.id,
        userInput,
      });
      pushLog({
        event: "generate.response",
        threadId: r.threadId,
        kind: r.message?.kind,
        attachmentFilename: r.message?.attachmentFilename,
        contentLen: r.message?.content?.length ?? 0,
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
      pushLog({
        event: "generate.error",
        status: e instanceof ApiError ? e.status : 0,
        message: e instanceof Error ? e.message : String(e),
      });
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
      // На native — пробуем data-url; если не подхватит, у юзера остаётся
      // selectable-текст и кнопка «Копировать».
      Linking.openURL(
        `data:text/plain;charset=utf-8,${encodeURIComponent(m.content)}`,
      ).catch(() => {});
    }
  }

  async function copyDocument(m: Message) {
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(m.content);
      }
      // На native — текст внутри карточки selectable, юзер копирует
      // длинным тапом. Отдельный clipboard-пакет ради этого не тащим.
    } catch {
      // best-effort
    }
  }

  function regenerate(m: Message) {
    const gen = (m.debug as { generation?: { templateId?: string; userInput?: string } } | undefined)?.generation;
    if (!gen?.templateId) return;
    const tpl = templates.find((t) => t.id === gen.templateId);
    if (!tpl) return;
    setGenModal({ template: tpl, userInput: gen.userInput ?? "", submitting: false });
  }

  async function uploadDocument(file: File) {
    if (uploading) return;
    setUploading(true);
    setSuggestedActions([]);
    setActions([]);
    pushLog({ event: "upload.request", filename: file.name, size: file.size, mime: file.type });

    // Optimistic upload-card в чате — пользователь сразу видит файл
    // и индикатор «распознаю». После ответа сервера заменим content.
    const tempId = `upload-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      role: "user",
      kind: "upload",
      attachmentFilename: file.name,
      content: `📎 ${file.name}`,
      createdAt: new Date().toISOString(),
    };
    const placeholderId = `upload-analyzing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      optimistic,
      {
        id: placeholderId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const token = await getAccessToken();
      const form = new FormData();
      form.append("file", file);
      if (threadId) form.append("threadId", threadId);
      const resp = await fetch(`${API_URL}/api/consultant/upload-document`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!resp.ok) {
        const errData = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new ApiError(resp.status, errData.error ?? `upload HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as {
        threadId: string;
        userMessage: Message;
        assistantMessage: Message;
        analysis: unknown;
        suggestedActions?: SuggestedAction[];
        suggestedTemplate?: { templateId: string; prefilledInput: string } | null;
        ocrFailed?: boolean;
      };
      pushLog({
        event: "upload.response",
        threadId: data.threadId,
        ocrFailed: data.ocrFailed,
        suggestedTemplate: data.suggestedTemplate?.templateId ?? null,
      });
      // Заменяем optimistic-сообщения реальными из БД (с серверными id и
      // OCR-результатами).
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === tempId) return data.userMessage;
          if (m.id === placeholderId) return data.assistantMessage;
          return m;
        }),
      );
      setThreadId(data.threadId);
      setSuggestedActions(data.suggestedActions ?? []);

      // Если классификатор уверенно определил тип документа — сразу
      // открываем модалку генерации с предзаполненным OCR-текстом
      // (опционально, юзер может закрыть). Это ключевая UX-фишка:
      // фотка → через минуту готовый драфт документа.
      if (data.suggestedTemplate?.templateId) {
        const tpl = templates.find((t) => t.id === data.suggestedTemplate?.templateId);
        if (tpl) {
          setGenModal({
            template: tpl,
            userInput: data.suggestedTemplate.prefilledInput ?? "",
            submitting: false,
          });
        }
      }
    } catch (e) {
      pushLog({
        event: "upload.error",
        status: e instanceof ApiError ? e.status : 0,
        message: e instanceof Error ? e.message : String(e),
      });
      const errMsg =
        e instanceof ApiError && e.status === 413
          ? "Файл слишком большой (максимум 25 МБ)."
          : e instanceof ApiError && e.status === 429
          ? "Слишком много загрузок — подождите минуту."
          : "Не удалось загрузить документ. Попробуйте ещё раз или введите текст вручную.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? { ...m, content: errMsg }
            : m,
        ),
      );
    } finally {
      setUploading(false);
    }
  }

  function pickAndUpload() {
    if (Platform.OS !== "web") return; // native pickers — отдельная задача
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  async function copyDebugLog() {
    const dump = {
      ts: new Date().toISOString(),
      url: typeof location !== "undefined" ? location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      threadId,
      messagesCount: messages.length,
      lastMessage: messages[messages.length - 1] ?? null,
      suggestedActions,
      templates: templates.map((t) => t.id),
      events: logEntries,
    };
    const text = JSON.stringify(dump, null, 2);
    try {
      if (Platform.OS === "web" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
    setLogCopied(true);
    setTimeout(() => setLogCopied(false), 2000);
    // eslint-disable-next-line no-console
    console.log("[consultant debug log]", dump);
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
            onPress={openFnsModal}
            accessibilityLabel="Указать мою ФНС"
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.sm,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: savedFns ? colors.accentSoft : colors.surface2,
              gap: 4,
              maxWidth: 240,
            }}
          >
            <MapPin
              size={14}
              color={savedFns ? colors.accentSoftInk : colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                color: savedFns ? colors.accentSoftInk : colors.textSecondary,
                flexShrink: 1,
              }}
            >
              {savedFns ? savedFns.fnsName : "Указать мою ИФНС"}
            </Text>
          </Pressable>
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
          <Pressable
            accessibilityLabel="Скопировать дебаг-лог"
            onPress={copyDebugLog}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.sm,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: logCopied ? colors.successSoft : colors.surface2,
              gap: 4,
            }}
          >
            <Bug size={14} color={logCopied ? colors.success : colors.textSecondary} />
            <Text style={{ fontSize: 12, color: logCopied ? colors.success : colors.textSecondary }}>
              {logCopied ? "Лог скопирован" : "Лог"}
            </Text>
          </Pressable>
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
                onCopy={copyDocument}
                onRegenerate={regenerate}
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
          {/* CTA-пилюли: «Создать запрос на P2PTax», «Найти специалиста».
              Бэкенд отдаёт их в done-event только для tax-режима. */}
          {!sending && actions.length > 0 && (
            <View style={{ marginTop: 8, gap: 6 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Или поручить специалисту:
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {actions.map((a) => {
                  const Icon = a.type === "create_request" ? FileText : Users;
                  return (
                    <Pressable
                      key={a.type}
                      onPress={() => router.push(a.href as never)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        backgroundColor: colors.surface,
                        gap: 6,
                      }}
                    >
                      <Icon size={14} color={colors.primary} />
                      <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>
                        {a.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
          {/* Старый пустой бабл "Ищу в источниках..." убран —
              streaming placeholder показывает прогресс сам:
              meta приходит с источниками, потом text растёт по чанкам.
              Inline-индикатор "Ищу..." теперь живёт в MessageBubble
              (когда content=="" и сообщение streaming). */}
        </ScrollView>

        {/* Composer — единая коробка с input + send-кнопкой,
            кнопка прибита к нижнему правому углу и строго совпадает по
            высоте с однострочным состоянием инпута. */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            maxWidth: 800,
            alignSelf: "center",
            width: "100%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              borderWidth: 1,
              borderColor: input.trim() ? colors.primary : colors.border,
              borderRadius: 12,
              backgroundColor: colors.surface,
              overflow: "hidden",
            }}
          >
            {/* 📎 Прикрепить документ от ИФНС — фото/скан/PDF.
                Сервер ocr-im OCR + классифицирует, и если узнаёт тип
                (требование/акт/решение) — сразу открывает модалку
                генерации с предзаполненным текстом. */}
            <Pressable
              onPress={pickAndUpload}
              disabled={uploading || sending || Platform.OS !== "web"}
              accessibilityLabel="Прикрепить документ от ИФНС"
              style={{
                width: 44,
                height: 44,
                margin: 4,
                borderRadius: 8,
                backgroundColor: colors.surface2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Paperclip size={18} color={colors.textSecondary} />
              )}
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Спросите про налог, или прикрепите фото/скан документа от ИФНС…"
              placeholderTextColor={colors.textMuted}
              multiline
              style={{
                flex: 1,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                lineHeight: 20,
                color: colors.text,
                maxHeight: 160,
                minHeight: 44,
                ...(Platform.OS === "web"
                  ? ({ outlineStyle: "none", border: "0" } as object)
                  : {}),
              }}
              editable={!sending}
              onKeyPress={(e: any) => {
                if (
                  Platform.OS === "web" &&
                  e.nativeEvent.key === "Enter" &&
                  (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey)
                ) {
                  send();
                }
              }}
            />
            <Pressable
              onPress={send}
              disabled={sending || !input.trim()}
              style={{
                width: 44,
                height: 44,
                margin: 4,
                borderRadius: 8,
                backgroundColor:
                  input.trim() && !sending ? colors.primary : colors.surface2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send
                size={18}
                color={input.trim() && !sending ? colors.white : colors.textMuted}
              />
            </Pressable>
          </View>
          {Platform.OS === "web" && (
            // Скрытый input для file picker — настоящий <input> в DOM,
            // ради него и держим fileInputRef. RN-подход с DocumentPicker
            // оставим на следующую итерацию для native.
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              style={{ display: "none" }}
              onChange={(e: any) => {
                const f: File | undefined = e?.target?.files?.[0];
                if (f) uploadDocument(f);
              }}
            />
          )}
          <Text style={{ marginTop: 6, fontSize: 11, color: colors.textMuted }}>
            ⌘/Ctrl + Enter — отправить
          </Text>
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

      {fnsModal && (
        <FnsPickerModal
          state={fnsModal}
          savedFns={savedFns}
          onCityQuery={(q) => setFnsModal((prev) => prev ? { ...prev, cityQuery: q } : prev)}
          onIfnsQuery={(q) => setFnsModal((prev) => prev ? { ...prev, ifnsQuery: q } : prev)}
          onPickCity={selectCityInFnsModal}
          onPickIfns={selectIfnsInFnsModal}
          onClear={() => { persistFns(null); setFnsModal(null); }}
          onCancel={() => setFnsModal(null)}
          onBack={() => setFnsModal((prev) => prev
            ? { ...prev, selectedCity: null, ifnsList: [], ifnsQuery: "" }
            : prev)}
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
  onCopy,
  onRegenerate,
}: {
  m: Message;
  onSourcePress: (s: Source) => void;
  onDownload: (m: Message) => void;
  onCopy: (m: Message) => Promise<void> | void;
  onRegenerate: (m: Message) => void;
}) {
  const isUser = m.role === "user";
  const isDocument = m.kind === "document";
  const isUpload = m.kind === "upload";
  const [copied, setCopied] = useState(false);
  const canRegenerate =
    isDocument &&
    !!(m.debug as { generation?: { templateId?: string } } | undefined)?.generation?.templateId;
  const uploadInfo = isUpload
    ? ((m.debug as { upload?: { presigned?: string; mimeType?: string } } | undefined)?.upload ?? null)
    : null;
  return (
    <View style={{ alignItems: isUser ? "flex-end" : "flex-start" }}>
      {isUpload ? (
        // Карточка прикреплённого файла (фото/скан/PDF). Если есть
        // presigned-url и это картинка — показываем превью.
        <View
          style={{
            maxWidth: "100%",
            width: "100%",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          {uploadInfo?.presigned && (uploadInfo?.mimeType ?? "").startsWith("image/") ? (
            <img
              src={uploadInfo.presigned}
              alt={m.attachmentFilename ?? "документ"}
              style={{
                width: 56,
                height: 56,
                objectFit: "cover",
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
              }}
            />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 6,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileSearch size={24} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }} numberOfLines={2}>
              {m.attachmentFilename ?? "Документ"}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
              {(uploadInfo?.mimeType ?? "").startsWith("image/")
                ? "Изображение, распознано через OCR"
                : "PDF, распознано постранично"}
            </Text>
          </View>
          {uploadInfo?.presigned && Platform.OS === "web" && (
            <a
              href={uploadInfo.presigned}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: colors.primary,
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Открыть
            </a>
          )}
        </View>
      ) : isDocument ? (
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
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 8,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <FileText size={18} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.text }} numberOfLines={1}>
              {m.attachmentFilename || "Сгенерированный документ"}
            </Text>
            {canRegenerate && (
              <Pressable
                onPress={() => onRegenerate(m)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: colors.surface2,
                  gap: 4,
                }}
              >
                <RefreshCw size={13} color={colors.text} />
                <Text style={{ fontSize: 12, color: colors.text, fontWeight: "600" }}>
                  Перегенерировать
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={async () => {
                await onCopy(m);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: colors.surface2,
                gap: 4,
              }}
            >
              {copied ? <Check size={13} color={colors.success} /> : <Copy size={13} color={colors.text} />}
              <Text style={{ fontSize: 12, color: copied ? colors.success : colors.text, fontWeight: "600" }}>
                {copied ? "Скопировано" : "Копировать"}
              </Text>
            </Pressable>
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
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: isUser ? colors.primary : colors.surface2,
            borderWidth: isUser ? 0 : 1,
            borderColor: colors.border,
          }}
        >
          {isUser ? (
            <Text style={{ fontSize: 14, lineHeight: 20, color: colors.white }} selectable>
              {m.content}
            </Text>
          ) : m.content === "" ? (
            // Стрим начался, но первый токен ещё не пришёл — показываем
            // тонкий индикатор внутри самого бабла, а не отдельным пустым
            // плейсхолдером. После meta-пакета у нас уже есть sources,
            // которые рисуются ниже — юзер видит «бот пошёл в Ст. 88».
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {m.sources && m.sources.length > 0
                  ? "Готовлю ответ по источникам…"
                  : "Ищу в источниках…"}
              </Text>
            </View>
          ) : (
            // Ответ ассистента: режем на абзацы, чистим инлайн [Источник:…]
            // (пилюли с источниками рендерятся ниже отдельно, дублирование
            // в самом тексте раздражает читателя).
            splitParagraphs(stripInlineSources(m.content)).map((p, i, arr) => (
              <Text
                key={i}
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: colors.text,
                  marginBottom: i < arr.length - 1 ? 10 : 0,
                }}
                selectable
              >
                {p}
              </Text>
            ))
          )}
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

function FnsPickerModal({
  state,
  savedFns,
  onCityQuery,
  onIfnsQuery,
  onPickCity,
  onPickIfns,
  onClear,
  onCancel,
  onBack,
}: {
  state: {
    cityQuery: string;
    cities: CityRow[];
    selectedCity: CityRow | null;
    ifnsQuery: string;
    ifnsList: IfnsRow[];
    loading: boolean;
  };
  savedFns: SavedFns | null;
  onCityQuery: (q: string) => void;
  onIfnsQuery: (q: string) => void;
  onPickCity: (c: CityRow) => void;
  onPickIfns: (i: IfnsRow) => void;
  onClear: () => void;
  onCancel: () => void;
  onBack: () => void;
}) {
  const lcCityQ = state.cityQuery.trim().toLowerCase();
  const filteredCities = lcCityQ
    ? state.cities.filter((c) => c.name.toLowerCase().includes(lcCityQ))
    : state.cities;
  const lcIfnsQ = state.ifnsQuery.trim().toLowerCase();
  const filteredIfns = lcIfnsQ
    ? state.ifnsList.filter(
        (o) =>
          o.name.toLowerCase().includes(lcIfnsQ) ||
          (o.code ?? "").toLowerCase().includes(lcIfnsQ),
      )
    : state.ifnsList;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
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
            maxHeight: "85%",
            backgroundColor: colors.background,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <MapPin size={20} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: colors.text }}>
              {state.selectedCity
                ? `Инспекция в г. ${state.selectedCity.name}`
                : "Выберите ваш город"}
            </Text>
            <Pressable onPress={onCancel} hitSlop={8}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {savedFns && !state.selectedCity && (
            <View
              style={{
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: colors.accentSoft,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.accentSoftInk }}>
                Сейчас сохранено: {savedFns.fnsName}, г. {savedFns.cityName}
              </Text>
            </View>
          )}

          {!state.selectedCity ? (
            <>
              <TextInput
                value={state.cityQuery}
                onChangeText={onCityQuery}
                placeholder="Начните вводить название города…"
                placeholderTextColor={colors.textMuted}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: colors.text,
                  backgroundColor: colors.surface,
                  ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
                }}
              />
              <ScrollView style={{ maxHeight: 360 }}>
                {state.loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : filteredCities.length === 0 ? (
                  <Text style={{ fontSize: 13, color: colors.textSecondary, padding: 8 }}>
                    Ничего не найдено
                  </Text>
                ) : (
                  filteredCities.slice(0, 200).map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => onPickCity(c)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: colors.text }}>{c.name}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        {c.officesCount}{" "}
                        {c.officesCount === 1
                          ? "инспекция"
                          : c.officesCount < 5
                          ? "инспекции"
                          : "инспекций"}
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </>
          ) : (
            <>
              <TextInput
                value={state.ifnsQuery}
                onChangeText={onIfnsQuery}
                placeholder="Поиск по номеру или названию…"
                placeholderTextColor={colors.textMuted}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: colors.text,
                  backgroundColor: colors.surface,
                  ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
                }}
              />
              <ScrollView style={{ maxHeight: 360 }}>
                {state.loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : filteredIfns.length === 0 ? (
                  <Text style={{ fontSize: 13, color: colors.textSecondary, padding: 8 }}>
                    Инспекций не найдено
                  </Text>
                ) : (
                  filteredIfns.map((o) => (
                    <Pressable
                      key={o.id}
                      onPress={() => onPickIfns(o)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600" }}>
                        {o.name}
                        {o.code ? ` (код ${o.code})` : ""}
                      </Text>
                      {o.address ? (
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                          {o.address}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </>
          )}

          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
            {state.selectedCity ? (
              <Pressable
                onPress={onBack}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.surface2,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>← Город</Text>
              </Pressable>
            ) : <View />}
            {savedFns ? (
              <Pressable
                onPress={onClear}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.surface2,
                }}
              >
                <Text style={{ color: colors.danger, fontWeight: "600" }}>
                  Сбросить
                </Text>
              </Pressable>
            ) : <View />}
          </View>
        </View>
      </View>
    </Modal>
  );
}
