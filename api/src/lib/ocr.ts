/**
 * Wrapper для self-hosted OCR API (FastAPI на localhost:11435 — крутится как
 * pm2 ocr-api, под капотом Qwen2.5-VL-7B через ollama).
 *
 * Используется консультантом для распознавания фото/сканов налоговых
 * документов от ИФНС (требований, актов, решений, постановлений).
 *
 * Поддерживаемые форматы: JPEG, PNG, WebP, GIF. PDF на этапе MVP не
 * поддерживается — большинство юзеров фотографируют бумагу телефоном,
 * и это нас покрывает.
 */

const OCR_URL = process.env.OCR_API_URL || "http://localhost:11435/ocr";

const RU_TAX_DOCUMENT_PROMPT = (
  "Извлеки ВЕСЬ текст с этого изображения российского налогового документа " +
  "(требование/акт/решение/уведомление/письмо ИФНС). Сохрани структуру: " +
  "шапка, реквизиты (дата, номер), основной текст, подписи, штампы. " +
  "Выдавай только распознанный текст, без своих комментариев. " +
  "Сохраняй переносы строк где они логически разделяют блоки документа. " +
  "Если в документе таблицы — отрисуй их через дефисы и трубки."
);

export interface OcrResult {
  text: string;
  model: string;
  elapsedSec: number;
}

/**
 * Распознаёт текст с изображения. mimeType должен быть image/*.
 * Принимает Buffer + filename (для multipart-границы) и опционально
 * кастомный prompt (по умолчанию заточенный под РФ-налоговую бумагу).
 */
export async function ocrImage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  customPrompt?: string,
): Promise<OcrResult> {
  if (!mimeType.startsWith("image/")) {
    throw new Error(`OCR supports image/* only, got ${mimeType}`);
  }

  const form = new FormData();
  // Node 22+ globalThis.Blob accepts Uint8Array — конвертируем Buffer.
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  form.append("file", blob, filename);
  form.append("prompt", customPrompt ?? RU_TAX_DOCUMENT_PROMPT);
  form.append("model", "qwen2.5vl");
  form.append("temperature", "0.0");

  const r = await fetch(OCR_URL, {
    method: "POST",
    body: form,
    // OCR на ~2K символов занимает 30-90 сек на нашем железе. Даём 5 минут.
    signal: AbortSignal.timeout(5 * 60_000),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`OCR ${r.status}: ${text.slice(0, 200)}`);
  }
  const data = (await r.json()) as { text: string; model: string; elapsed_sec: number };
  return { text: data.text || "", model: data.model || "qwen2.5vl", elapsedSec: data.elapsed_sec || 0 };
}
