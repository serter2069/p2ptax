/**
 * /api/consultant/* — налоговый консультант на базе TaxLLM.
 *
 * DB:
 *   consultant_threads(id, user_id, title, archived_from_user, context_overflowed_at)
 *   consultant_messages(id, thread_id, role, content, sources_json, usage_json, debug_json)
 *
 * UX:
 *   - One «active» thread per user at a time.
 *   - Estimated context overflow → archive + new thread (transparently).
 *   - User soft-delete via /threads/:id/archive — admin still sees it.
 */

import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { askTaxLLM, streamTaxLLM } from "../lib/taxllm";
import type { TaxLLMSource } from "../lib/taxllm";
import {
  listTemplates,
  findTemplate,
  suggestTemplatesFor,
} from "../lib/consultant-templates";

const router = Router();
router.use(authMiddleware);

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 120,
  keyGenerator: (req) => (req.user as { userId?: string } | undefined)?.userId ?? req.ip ?? "anon",
  standardHeaders: true,
  legacyHeaders: false,
});

const estimateTokens = (s: string) => Math.ceil((s?.length ?? 0) / 3);
const CONTEXT_OVERFLOW_TOKENS = 18_000;

async function getOrCreateActiveThread(userId: string) {
  const existing = await prisma.consultantThread.findFirst({
    where: { userId, archivedFromUser: false, contextOverflowedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return prisma.consultantThread.create({ data: { userId } });
}

function summariseTitle(firstQuestion: string): string {
  const cleaned = firstQuestion.replace(/\s+/g, " ").trim();
  return cleaned.length > 80 ? cleaned.slice(0, 78) + "…" : cleaned;
}

// ─────────────────────── GET /threads — список тредов

router.get("/threads", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const includeArchived = req.query.includeArchived === "true";
  const threads = await prisma.consultantThread.findMany({
    where: includeArchived ? { userId } : { userId, archivedFromUser: false },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      archivedFromUser: true,
      contextOverflowedAt: true,
      _count: { select: { messages: true } },
    },
  });
  return res.json({
    threads: threads.map((t) => ({
      id: t.id,
      title: t.title,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      messageCount: t._count.messages,
      archivedFromUser: t.archivedFromUser,
      contextFull: !!t.contextOverflowedAt,
    })),
  });
});

// ─────────────────────── GET /threads/:id/messages

router.get("/threads/:id/messages", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const thread = await prisma.consultantThread.findUnique({ where: { id: String(req.params.id) } });
  if (!thread || thread.userId !== userId) return res.status(404).json({ error: "thread_not_found" });
  const messages = await prisma.consultantMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
  });
  return res.json({
    threadId: thread.id,
    title: thread.title,
    contextFull: !!thread.contextOverflowedAt,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      kind: m.kind ?? "text",
      attachmentFilename: m.attachmentFilename ?? null,
      content: m.content,
      createdAt: m.createdAt,
      sources: m.sourcesJson ? JSON.parse(m.sourcesJson) : [],
      usage: m.usageJson ? JSON.parse(m.usageJson) : null,
      debug: m.debugJson ? JSON.parse(m.debugJson) : null,
    })),
  });
});

// ─────────────────────── POST /threads/new

router.post("/threads/new", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const t = await prisma.consultantThread.create({ data: { userId } });
  return res.json({ threadId: t.id });
});

// ─────────────────────── POST /threads/:id/archive (soft-delete)

router.post("/threads/:id/archive", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const thread = await prisma.consultantThread.findUnique({ where: { id: String(req.params.id) } });
  if (!thread || thread.userId !== userId) return res.status(404).json({ error: "thread_not_found" });
  await prisma.consultantThread.update({
    where: { id: thread.id },
    data: { archivedFromUser: true },
  });
  return res.json({ ok: true });
});

// ─────────────────────── POST /chat — main endpoint

interface ChatBody {
  message?: string;
  threadId?: string;
  // FE-only: если юзер выбрал свою ИФНС в шапке консультанта, она шлётся
  // как отдельное поле. В БД сохраняем оригинал message, а в TaxLLM
  // отправляем склейку — чтобы в истории чата юзер видел свой чистый
  // вопрос, а бот всё равно учитывал регион.
  userContext?: string | null;
}

router.post("/chat", chatLimiter, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = req.body as ChatBody;
  const message = (body.message ?? "").trim();
  if (!message) return res.status(400).json({ error: "message_required" });
  if (message.length > 4000) return res.status(400).json({ error: "message_too_long" });

  let thread = body.threadId
    ? await prisma.consultantThread.findUnique({ where: { id: body.threadId } })
    : null;
  if (thread && thread.userId !== userId) thread = null;
  if (!thread || thread.archivedFromUser || thread.contextOverflowedAt) {
    thread = await getOrCreateActiveThread(userId);
  }

  const prevMessages = await prisma.consultantMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true, kind: true },
  });
  const prevTokens = prevMessages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
  let autoRolled = false;
  if (prevTokens + estimateTokens(message) > CONTEXT_OVERFLOW_TOKENS) {
    await prisma.consultantThread.update({
      where: { id: thread.id },
      data: { contextOverflowedAt: new Date() },
    });
    thread = await prisma.consultantThread.create({ data: { userId } });
    autoRolled = true;
  }

  await prisma.consultantMessage.create({
    data: { threadId: thread.id, role: "user", content: message },
  });

  // История диалога для TaxLLM: последние 10 user/assistant сообщений
  // (без document-карточек — там полные тексты документов раздуют контекст
  // и не помогают для уточнений). Если только что произошёл autoRoll —
  // история пустая, тред новый.
  const history = autoRolled
    ? []
    : prevMessages
        .filter((m) => (m.kind ?? "text") === "text")
        .slice(-10)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  let llm;
  try {
    llm = await askTaxLLM(message, {
      conversationId: `p2ptax-${userId}-${thread.id}`,
      history,
    });
  } catch (e: unknown) {
    const errorText = e instanceof Error ? e.message : String(e);
    await prisma.consultantMessage.create({
      data: {
        threadId: thread.id,
        role: "assistant",
        content: "Сервис консультанта временно недоступен. Попробуйте через минуту.",
        debugJson: JSON.stringify({ error: errorText.slice(0, 500) }),
      },
    });
    return res.status(502).json({ error: "taxllm_unavailable", detail: errorText.slice(0, 200) });
  }

  const assistant = await prisma.consultantMessage.create({
    data: {
      threadId: thread.id,
      role: "assistant",
      content: llm.answer,
      sourcesJson: JSON.stringify(llm.sources ?? []),
      usageJson: JSON.stringify(llm.usage ?? {}),
      debugJson: llm.debug ? JSON.stringify(llm.debug) : null,
    },
  });

  if (!thread.title) {
    await prisma.consultantThread.update({
      where: { id: thread.id },
      data: { title: summariseTitle(message), updatedAt: new Date() },
    });
  } else {
    await prisma.consultantThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });
  }

  // Авто-предложение шаблонов: ищем триггеры в вопросе+ответе.
  const suggestedActions = suggestTemplatesFor(`${message}\n\n${llm.answer}`);

  return res.json({
    threadId: thread.id,
    autoRolled,
    message: {
      id: assistant.id,
      role: "assistant",
      content: assistant.content,
      kind: "text",
      createdAt: assistant.createdAt,
      sources: llm.sources ?? [],
      usage: llm.usage ?? {},
      debug: llm.debug,
    },
    suggestedActions,
  });
});

// ─────────────────────── POST /chat/stream — то же что /chat, но NDJSON-стрим
//
// Протокол:
//   {"type":"start", "threadId":"…", "tempId":"…", "autoRolled":false}
//   {"type":"meta",  "sources":[…], "intent":"tax|casual|clarify"}
//   {"type":"token", "text":"…"}      ← многократно
//   {"type":"done",  "messageId":"…", "suggestedActions":[…], "usage":{…}}
//   {"type":"error", "message":"…"}
//
// Клиент держит fetch().body.getReader(), парсит NDJSON по \n и наращивает
// текст ассистента. Сам p2ptax-api по приходу done сохраняет полное
// сообщение в БД + считает suggestedActions.

router.post("/chat/stream", chatLimiter, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = req.body as ChatBody;
  const message = (body.message ?? "").trim();
  const userContext = (body.userContext ?? "").trim();
  if (!message) return res.status(400).json({ error: "message_required" });
  if (message.length > 4000) return res.status(400).json({ error: "message_too_long" });

  let thread = body.threadId
    ? await prisma.consultantThread.findUnique({ where: { id: body.threadId } })
    : null;
  if (thread && thread.userId !== userId) thread = null;
  if (!thread || thread.archivedFromUser || thread.contextOverflowedAt) {
    thread = await getOrCreateActiveThread(userId);
  }

  const prevMessages = await prisma.consultantMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true, kind: true },
  });
  const prevTokens = prevMessages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
  let autoRolled = false;
  if (prevTokens + estimateTokens(message) > CONTEXT_OVERFLOW_TOKENS) {
    await prisma.consultantThread.update({
      where: { id: thread.id },
      data: { contextOverflowedAt: new Date() },
    });
    thread = await prisma.consultantThread.create({ data: { userId } });
    autoRolled = true;
  }

  await prisma.consultantMessage.create({
    data: { threadId: thread.id, role: "user", content: message },
  });

  const history = autoRolled
    ? []
    : prevMessages
        .filter((m) => (m.kind ?? "text") === "text")
        .slice(-10)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // SSE-style headers — отключаем буферизацию nginx и выставляем
  // chunked + ndjson, чтобы прокси не накапливал ответ.
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const send = (obj: unknown) => {
    res.write(JSON.stringify(obj) + "\n");
  };

  const tempId = `tmp-${Date.now()}`;
  send({ type: "start", threadId: thread.id, tempId, autoRolled });

  // ФНС-контекст подмешиваем только в TaxLLM, в БД остаётся чистый message.
  const taxllmMessage = userContext
    ? `[Контекст пользователя — ${userContext}]\n\n${message}`
    : message;

  let upstream: globalThis.Response;
  try {
    upstream = await streamTaxLLM(taxllmMessage, {
      conversationId: `p2ptax-${userId}-${thread.id}`,
      history,
    });
  } catch (e: unknown) {
    const errorText = e instanceof Error ? e.message : String(e);
    await prisma.consultantMessage.create({
      data: {
        threadId: thread.id,
        role: "assistant",
        content: "Сервис консультанта временно недоступен. Попробуйте через минуту.",
        debugJson: JSON.stringify({ error: errorText.slice(0, 500) }),
      },
    });
    send({ type: "error", message: "taxllm_unavailable" });
    return res.end();
  }

  // Читаем NDJSON от TaxLLM построчно, агрегируем answer + sources + usage,
  // ретранслируем чанки клиенту в том же формате.
  const reader = upstream.body?.getReader();
  if (!reader) {
    send({ type: "error", message: "no_stream_body" });
    return res.end();
  }
  const decoder = new TextDecoder();
  let buf = "";
  let answer = "";
  let sources: TaxLLMSource[] = [];
  let usage: Record<string, unknown> = {};
  let debug: Record<string, unknown> | null = null;
  let intent = "tax";

  try {
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
        let chunk: { type?: string; text?: string; sources?: TaxLLMSource[]; usage?: Record<string, unknown>; debug?: Record<string, unknown>; intent?: string; message?: string; answer?: string };
        try {
          chunk = JSON.parse(line);
        } catch {
          continue;
        }
        if (chunk.type === "meta") {
          sources = chunk.sources ?? [];
          if (chunk.debug) debug = chunk.debug;
          if (chunk.intent) intent = chunk.intent;
          send({ type: "meta", sources, intent });
        } else if (chunk.type === "token" && chunk.text) {
          answer += chunk.text;
          send({ type: "token", text: chunk.text });
        } else if (chunk.type === "done") {
          if (chunk.usage) usage = chunk.usage;
          if (chunk.answer) answer = chunk.answer;
        } else if (chunk.type === "error") {
          send({ type: "error", message: chunk.message ?? "unknown" });
        }
      }
    }
  } catch (e) {
    send({ type: "error", message: e instanceof Error ? e.message : String(e) });
    return res.end();
  }

  // Записываем готовое сообщение в БД и считаем suggestedActions.
  const assistant = await prisma.consultantMessage.create({
    data: {
      threadId: thread.id,
      role: "assistant",
      content: answer,
      sourcesJson: JSON.stringify(sources),
      usageJson: JSON.stringify(usage),
      debugJson: debug ? JSON.stringify({ ...debug, intent }) : JSON.stringify({ intent }),
    },
  });
  await prisma.consultantThread.update({
    where: { id: thread.id },
    data: thread.title
      ? { updatedAt: new Date() }
      : { title: summariseTitle(message), updatedAt: new Date() },
  });

  const suggestedActions =
    intent === "tax" ? suggestTemplatesFor(`${message}\n\n${answer}`) : [];

  // CTA-пилюли «Создать запрос на P2PTax» + «Найти специалиста». Показываем
  // только в tax-режиме (на casual/clarify «найти специалиста по как-дела»
  // выглядит абсурдно). create_request приоритетнее когда юзер сам в
  // ответе пушит «обратитесь к специалисту» — этот флаг детектим по
  // тексту ответа.
  const actions: Array<{ type: string; label: string; href: string }> = [];
  if (intent === "tax") {
    actions.push({
      type: "create_request",
      label: "Создать запрос на P2PTax",
      href: "/requests/new",
    });
    actions.push({
      type: "find_specialist",
      label: "Найти специалиста",
      href: "/specialists",
    });
  }

  send({
    type: "done",
    messageId: assistant.id,
    createdAt: assistant.createdAt,
    suggestedActions,
    actions,
    usage,
    intent,
  });
  res.end();
});

// ─────────────────────── GET /templates — каталог шаблонов

router.get("/templates", (_req: Request, res: Response) => {
  return res.json({ templates: listTemplates() });
});

// ─────────────────────── POST /generate — генерация формального документа

interface GenerateBody {
  threadId?: string;
  templateId?: string;
  userInput?: string;
}

const genLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => (req.user as { userId?: string } | undefined)?.userId ?? req.ip ?? "anon",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/generate", genLimiter, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = req.body as GenerateBody;
  const templateId = (body.templateId ?? "").trim();
  const userInput = (body.userInput ?? "").trim();
  if (!templateId) return res.status(400).json({ error: "template_required" });
  if (!userInput) return res.status(400).json({ error: "user_input_required" });
  if (userInput.length > 8000) return res.status(400).json({ error: "user_input_too_long" });

  const tpl = findTemplate(templateId);
  if (!tpl) return res.status(404).json({ error: "template_not_found" });

  // Тред: либо тот, что указан явно (если активен и принадлежит юзеру),
  // либо текущий активный.
  let thread = body.threadId
    ? await prisma.consultantThread.findUnique({ where: { id: String(body.threadId) } })
    : null;
  if (thread && thread.userId !== userId) thread = null;
  if (!thread || thread.archivedFromUser || thread.contextOverflowedAt) {
    thread = await getOrCreateActiveThread(userId);
  }

  // Сохраняем «запрос на генерацию» как user-сообщение в чате,
  // чтобы история выглядела связно: «сгенерируй ответ на требование» + ввод.
  const userMsgContent =
    `📄 Запрос на генерацию: ${tpl.label}\n\n${userInput}`;
  await prisma.consultantMessage.create({
    data: { threadId: thread.id, role: "user", content: userMsgContent },
  });

  const prompt = tpl.buildPrompt({ templateId, userInput });
  let llm;
  try {
    llm = await askTaxLLM(prompt, {
      conversationId: `p2ptax-${userId}-${thread.id}-gen-${tpl.id}`,
      forceRag: true, // /generate уже сам строит налоговый промпт — пропускаем intent-router
    });
  } catch (e: unknown) {
    const errorText = e instanceof Error ? e.message : String(e);
    await prisma.consultantMessage.create({
      data: {
        threadId: thread.id,
        role: "assistant",
        content: "Не удалось сгенерировать документ. Попробуйте ещё раз через минуту.",
        debugJson: JSON.stringify({ error: errorText.slice(0, 500), templateId }),
      },
    });
    return res.status(502).json({ error: "taxllm_unavailable", detail: errorText.slice(0, 200) });
  }

  const filename = tpl.filename({ templateId, userInput });
  // Сохраняем templateId+userInput в debugJson, чтобы FE при «перегенерировать»
  // мог восстановить состояние модалки и юзер мог поправить ввод.
  const debugPayload = {
    ...(llm.debug ?? {}),
    generation: { templateId, userInput },
  };
  const docMessage = await prisma.consultantMessage.create({
    data: {
      threadId: thread.id,
      role: "assistant",
      kind: "document",
      attachmentFilename: filename,
      content: llm.answer,
      sourcesJson: JSON.stringify(llm.sources ?? []),
      usageJson: JSON.stringify(llm.usage ?? {}),
      debugJson: JSON.stringify(debugPayload),
    },
  });

  await prisma.consultantThread.update({
    where: { id: thread.id },
    data: {
      updatedAt: new Date(),
      ...(thread.title ? {} : { title: summariseTitle(`${tpl.label}: ${userInput}`) }),
    },
  });

  return res.json({
    threadId: thread.id,
    message: {
      id: docMessage.id,
      role: "assistant",
      kind: "document",
      attachmentFilename: filename,
      content: docMessage.content,
      createdAt: docMessage.createdAt,
      sources: llm.sources ?? [],
      usage: llm.usage ?? {},
      debug: debugPayload,
    },
  });
});

export default router;
