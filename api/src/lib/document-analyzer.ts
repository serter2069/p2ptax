/**
 * Анализатор распознанного документа от ИФНС.
 *
 * Принимает OCR-текст и возвращает структуру:
 *   {
 *     docType: "demand" | "act" | "decision" | "notice" | "letter" | "other",
 *     date, number, fns, summary, suggestedTemplateId, deadline
 *   }
 *
 * Под капотом — один вызов TaxLLM с force_rag=false (intent-router пропустим
 * через clarify-обход, поэтому лучше зовём напрямую через ask_openrouter
 * — но у нас в p2ptax-api есть только askTaxLLM. Проще — отдельный JSON-
 * промпт через TaxLLM /chat с force_rag, чтобы получить классификацию).
 *
 * Отдельный простой LLM-вызов в OpenRouter мы могли бы сделать прямо
 * отсюда, но это добавит новый endpoint + ключ. Выгоднее использовать
 * существующий TaxLLM /chat: он уже знает контекст РФ, отвечает по-русски,
 * и стоимость одного запроса ~$0.0002.
 */

import { askTaxLLM } from "./taxllm";

export type TaxDocumentType =
  | "demand" // требование о представлении пояснений / документов
  | "act" // акт камеральной/выездной проверки
  | "decision" // решение по результатам проверки / о привлечении к отв-сти
  | "notice" // уведомление (об уплате, о вызове и т.п.)
  | "letter" // письмо ФНС / Минфина
  | "other";

export interface AnalyzedDocument {
  docType: TaxDocumentType;
  docTypeRu: string;
  date: string | null;
  number: string | null;
  fns: string | null;
  summary: string;
  // Какой шаблон лучше всего подходит под этот документ для ответа.
  suggestedTemplateId: string | null;
  deadline: string | null;
  rawJson: string;
}

const DOC_TYPE_TO_TEMPLATE: Record<TaxDocumentType, string | null> = {
  demand: "response_to_demand",
  act: "objection_to_act",
  decision: "complaint_higher_authority",
  notice: null, // обычно не требует формального ответного документа
  letter: null,
  other: null,
};

const DOC_TYPE_RU: Record<TaxDocumentType, string> = {
  demand: "Требование о представлении пояснений/документов",
  act: "Акт налоговой проверки",
  decision: "Решение налогового органа",
  notice: "Уведомление",
  letter: "Письмо",
  other: "Иной документ ИФНС",
};

const ANALYZER_PROMPT = (ocrText: string) => `Это распознанный текст документа от налогового органа РФ.
Проанализируй и верни СТРОГО JSON-объект (без markdown-кодоблока, без
комментариев, ТОЛЬКО валидный JSON):

{
  "docType": "demand" | "act" | "decision" | "notice" | "letter" | "other",
  "date": "DD.MM.YYYY" или null,
  "number": "..." или null,
  "fns": "название/номер ИФНС, если указано" или null,
  "summary": "1-3 предложения: что налоговый орган требует/сообщает/решил",
  "deadline": "срок ответа в днях или конкретной датой" или null
}

Расшифровка docType:
— demand: требование (о пояснениях, о представлении документов, ст.88 НК РФ)
— act: акт налоговой проверки (камеральной/выездной)
— decision: решение по проверке / о привлечении к ответственности
— notice: уведомление (об уплате, о вызове, об исчисленной сумме)
— letter: письмо разъяснительного характера
— other: всё прочее, что не подходит

Текст документа:
"""
${ocrText.slice(0, 6000)}
"""`;

const JSON_BLOCK_RE = /\{[\s\S]*\}/;

export async function analyzeDocument(ocrText: string): Promise<AnalyzedDocument> {
  // Если OCR-текст совсем пустой — возвращаем заглушку без LLM-вызова.
  if (!ocrText || ocrText.trim().length < 30) {
    return {
      docType: "other",
      docTypeRu: DOC_TYPE_RU.other,
      date: null,
      number: null,
      fns: null,
      summary: "Не удалось распознать текст документа. Загрузите более чёткое изображение или введите ключевые поля вручную.",
      suggestedTemplateId: null,
      deadline: null,
      rawJson: "",
    };
  }

  const llm = await askTaxLLM(ANALYZER_PROMPT(ocrText), { forceRag: true });
  const raw = llm.answer || "";
  const match = raw.match(JSON_BLOCK_RE);
  if (!match) {
    return {
      docType: "other",
      docTypeRu: DOC_TYPE_RU.other,
      date: null,
      number: null,
      fns: null,
      summary: raw.slice(0, 400) || "Анализ не удался.",
      suggestedTemplateId: null,
      deadline: null,
      rawJson: raw,
    };
  }

  let parsed: Partial<AnalyzedDocument> & { docType?: string } = {};
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return {
      docType: "other",
      docTypeRu: DOC_TYPE_RU.other,
      date: null,
      number: null,
      fns: null,
      summary: raw.slice(0, 400),
      suggestedTemplateId: null,
      deadline: null,
      rawJson: raw,
    };
  }

  const docType = (
    ["demand", "act", "decision", "notice", "letter", "other"] as TaxDocumentType[]
  ).includes(parsed.docType as TaxDocumentType)
    ? (parsed.docType as TaxDocumentType)
    : "other";

  return {
    docType,
    docTypeRu: DOC_TYPE_RU[docType],
    date: parsed.date ?? null,
    number: parsed.number ?? null,
    fns: parsed.fns ?? null,
    summary: (parsed.summary as string) ?? "",
    suggestedTemplateId: DOC_TYPE_TO_TEMPLATE[docType],
    deadline: parsed.deadline ?? null,
    rawJson: match[0],
  };
}
