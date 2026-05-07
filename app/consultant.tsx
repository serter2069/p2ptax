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
  Paperclip,
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

// ─────────────────────── inline markdown
//
// Простой парсер только для **bold**, *italic* и `code`.
// TaxLLM не пишет таблиц и code-блоков, поэтому полный markdown-движок не
// нужен. Возвращает массив React-нод (Text-сегментов), готовых к встраиванию
// в обычный <Text>.

type InlineSegment = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

function parseInlineMarkdown(input: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  // Регэкс на (в порядке приоритета): **bold**, *italic*, `code`, plain.
  const re = /\*\*([^*\n]+?)\*\*|`([^`\n]+?)`|\*([^*\n]+?)\*/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, m.index) });
    }
    if (m[1] !== undefined) segments.push({ text: m[1], bold: true });
    else if (m[2] !== undefined) segments.push({ text: m[2], code: true });
    else if (m[3] !== undefined) segments.push({ text: m[3], italic: true });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < input.length) segments.push({ text: input.slice(lastIndex) });
  return segments.length > 0 ? segments : [{ text: input }];
}

// Определяем тип строки: bullet (— / -/ * / •), numbered (1. ...), plain.
function classifyLine(line: string): { kind: "bullet" | "numbered" | "plain"; body: string; marker?: string } {
  const trimmed = line.trimStart();
  const indent = line.length - trimmed.length;
  void indent;
  const bullet = trimmed.match(/^([-—•*])\s+(.+)$/);
  if (bullet) return { kind: "bullet", body: bullet[2], marker: "•" };
  const numbered = trimmed.match(/^(\d+[.)])\s+(.+)$/);
  if (numbered) return { kind: "numbered", body: numbered[2], marker: numbered[1] };
  return { kind: "plain", body: trimmed };
}

export default function ConsultantScreen() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const [actions, setActions] = useState<ConsultantAction[]>([]);
  const [uploading, setUploading] = useState(false);
  // streaming-статус для UI-индикатора в плейсхолдере: какая стадия
  // сейчас выполняется на сервере (analyzing / searching / drafting).
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [genModal, setGenModal] = useState<{
    template: TemplateMeta;
    userInput: string;
    submitting: boolean;
    // Если модалка открылась после OCR-загрузки, FE кладёт сюда
    // presigned URL и mime — модалка покажет миниатюру оригинального
    // файла рядом с полем ввода чтобы юзер видел и фото, и текст.
    attachment?: { url: string; mimeType: string; filename: string } | null;
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
    setActions([]);
    setStreamStatus(null);
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

    try {
      const token = await getAccessToken();
      const resp = await fetch(`${API_URL}/api/consultant/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, threadId }),
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
            stage?: string;
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
          } else if (evt.type === "status") {
            setStreamStatus(evt.text ?? null);
          } else if (evt.type === "meta") {
            receivedMeta = true;
            if (evt.intent) intent = evt.intent;
            updateAssistant({ sources: evt.sources ?? [] });
          } else if (evt.type === "token" && evt.text) {
            // первый токен — сбрасываем статусную линию (ответ пошёл)
            setStreamStatus(null);
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
          // Достаём presigned URL из user-сообщения для превью.
          const uploadDebug = data.userMessage?.debug as
            | { upload?: { presigned?: string; mimeType?: string } }
            | undefined;
          const presigned = uploadDebug?.upload?.presigned ?? null;
          const mimeType = uploadDebug?.upload?.mimeType ?? "";
          setGenModal({
            template: tpl,
            userInput: data.suggestedTemplate.prefilledInput ?? "",
            submitting: false,
            attachment: presigned
              ? {
                  url: presigned,
                  mimeType,
                  filename: data.userMessage?.attachmentFilename ?? "документ",
                }
              : null,
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

  async function pickAndUpload() {
    if (Platform.OS === "web") {
      if (!fileInputRef.current) return;
      fileInputRef.current.value = "";
      fileInputRef.current.click();
      return;
    }
    // iOS/Android — нативный picker через expo-document-picker.
    try {
      const Picker = await import("expo-document-picker");
      const result = await Picker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      // RN-fetch принимает {uri,name,type} как Blob-substitute.
      const file = {
        uri: asset.uri,
        name: asset.name ?? "document",
        type: asset.mimeType ?? "application/octet-stream",
      } as unknown as File;
      await uploadDocument(file);
    } catch (e) {
      pushLog({ event: "upload.picker_error", message: e instanceof Error ? e.message : String(e) });
    }
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
          {/* ФНС теперь хранится в /profile (User.consultantFnsId).
              Backend подмешивает контекст автоматически. Если у юзера
              не указана — внутри чата отрисуется баннер-подсказка. */}
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

        {/* Подсказка-баннер: укажите ИФНС в профиле для точных ответов.
            Показываем только если у юзера ещё не выбрана инспекция. */}
        {isAuthenticated && !user?.consultantFns && (
          <Pressable
            onPress={() => router.push("/profile")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 8,
              paddingHorizontal: spacing.lg,
              backgroundColor: colors.accentSoft,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ flex: 1, fontSize: 12, color: colors.accentSoftInk }}>
              Для более точных ответов укажите вашу налоговую инспекцию в профиле — бот будет учитывать регион и реквизиты.
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
              Указать →
            </Text>
          </Pressable>
        )}

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
                streamStatus={
                  m.id.startsWith("streaming-") && m.content === ""
                    ? streamStatus
                    : null
                }
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
              disabled={uploading || sending}
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
  streamStatus,
}: {
  m: Message;
  onSourcePress: (s: Source) => void;
  onDownload: (m: Message) => void;
  onCopy: (m: Message) => Promise<void> | void;
  onRegenerate: (m: Message) => void;
  /** Текст текущей стадии стрима, если это streaming-плейсхолдер. */
  streamStatus?: string | null;
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
            // тонкий индикатор + текст текущей стадии («Анализирую вопрос»,
            // «Ищу в Налоговом кодексе», «Расширенный поиск», «Готовлю
            // ответ»). Если stream-статуса нет — fallback на старый текст.
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {streamStatus ??
                  (m.sources && m.sources.length > 0
                    ? "Готовлю ответ по источникам…"
                    : "Ищу в источниках…")}
              </Text>
            </View>
          ) : (
            // Ответ ассистента: вырезаем инлайн [Источник:…], режем на
            // абзацы, в каждом параграфе разбираем строки на bullet/
            // numbered/plain и рендерим **bold**/*italic*/`code`.
            <AssistantContent text={stripInlineSources(m.content)} />
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
  state: {
    template: TemplateMeta;
    userInput: string;
    submitting: boolean;
    attachment?: { url: string; mimeType: string; filename: string } | null;
  };
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

          {/* Превью прикреплённого документа (после OCR-загрузки) — фото-
              миниатюра рядом с информацией о файле + ссылка «Открыть».
              Юзер видит и оригинал, и распознанный текст одновременно. */}
          {state.attachment && Platform.OS === "web" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 8,
                backgroundColor: colors.accentSoft,
              }}
            >
              {state.attachment.mimeType.startsWith("image/") ? (
                <img
                  src={state.attachment.url}
                  alt={state.attachment.filename}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 6,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={32} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: "700", color: colors.accentSoftInk }}
                  numberOfLines={2}
                >
                  {state.attachment.filename}
                </Text>
                <Text style={{ fontSize: 11, color: colors.accentSoftInk, marginTop: 2 }}>
                  Распознан и подставлен в поле ниже. Можете править перед генерацией.
                </Text>
                <a
                  href={state.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: colors.primary,
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  Открыть оригинал →
                </a>
              </View>
            </View>
          )}

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

/**
 * Рендерит ответ ассистента с поддержкой минимального markdown:
 * — параграфы (отступ между ними)
 * — bullet-списки (— / - / * / •)
 * — numbered-списки (1. / 2) ...)
 * — inline **bold**, *italic*, `code`
 *
 * Без таблиц, заголовков, code-блоков (TaxLLM их не пишет).
 */
function AssistantContent({ text }: { text: string }) {
  const paragraphs = splitParagraphs(text);
  return (
    <>
      {paragraphs.map((p, pi) => (
        <Paragraph key={pi} text={p} isLast={pi === paragraphs.length - 1} />
      ))}
    </>
  );
}

function Paragraph({ text, isLast }: { text: string; isLast: boolean }) {
  const lines = text.split(/\n/);
  // Если в параграфе только plain-строки без списков — рендерим как один
  // Text (так лучше работает selection и переносы).
  const hasListItems = lines.some((l) => {
    const c = classifyLine(l);
    return c.kind === "bullet" || c.kind === "numbered";
  });
  if (!hasListItems) {
    return (
      <Text
        selectable
        style={{
          fontSize: 14,
          lineHeight: 22,
          color: colors.text,
          marginBottom: isLast ? 0 : 10,
        }}
      >
        {parseInlineMarkdown(text).map((seg, si) => (
          <InlineSegmentText key={si} seg={seg} />
        ))}
      </Text>
    );
  }
  // Со списком — рендерим строки одна под другой.
  return (
    <View style={{ marginBottom: isLast ? 0 : 10, gap: 4 }}>
      {lines.map((line, li) => {
        const cls = classifyLine(line);
        if (cls.kind === "plain" && cls.body === "") return null;
        return (
          <View
            key={li}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 6,
              paddingLeft: cls.kind !== "plain" ? 4 : 0,
            }}
          >
            {cls.kind !== "plain" && (
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 22,
                  color: colors.textSecondary,
                  minWidth: cls.kind === "numbered" ? 22 : 14,
                }}
              >
                {cls.marker}
              </Text>
            )}
            <Text
              selectable
              style={{
                flex: 1,
                fontSize: 14,
                lineHeight: 22,
                color: colors.text,
              }}
            >
              {parseInlineMarkdown(cls.body).map((seg, si) => (
                <InlineSegmentText key={si} seg={seg} />
              ))}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function InlineSegmentText({ seg }: { seg: InlineSegment }) {
  const style: Record<string, unknown> = {};
  if (seg.bold) style.fontWeight = "700";
  if (seg.italic) style.fontStyle = "italic";
  if (seg.code) {
    style.fontFamily = Platform.OS === "web" ? "ui-monospace, monospace" : "Courier";
    style.backgroundColor = colors.surface2;
    style.fontSize = 13;
  }
  return <Text style={style}>{seg.text}</Text>;
}
