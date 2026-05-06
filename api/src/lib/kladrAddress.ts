/**
 * Нормализация KLADR-csv адресов из Dadata.
 *
 * Вход: ",105064, Москва г, Земляной вал ул, 9, ," — машинный формат
 * (тип сущности после имени, постиндекс отдельным полем, пустые ячейки
 * через запятую).
 *
 * Выход: { primary: string, secondary?: string } — человеко-читаемая
 * строка для UI: "г. Москва, ул. Земляной вал, 9, 105064". Если в
 * исходнике перечислены несколько зданий через ` ; ` — возвращаем
 * первое как primary, второе (и далее одной строкой) как secondary.
 */

export interface FormattedAddress {
  primary: string;
  secondary: string | null;
}

const TYPE_RULES: Array<{ test: RegExp; before?: string; after?: string }> = [
  { test: /^г$/i, before: "г. " },
  { test: /^г\.$/i, before: "г. " },
  { test: /^пгт\.?$/i, before: "пгт " },
  { test: /^с\.?$/i, before: "с. " },
  { test: /^рп$/i, before: "рп " },
  { test: /^р-?н$/i, after: " р-н" },
  { test: /^обл\.?$/i, after: " обл." },
  { test: /^респ\.?$/i, after: " респ." },
  { test: /^край$/i, after: " край" },
  { test: /^ул$/i, before: "ул. " },
  { test: /^ул\.$/i, before: "ул. " },
  { test: /^пр-кт$/i, before: "пр-т " },
  { test: /^просп\.?$/i, before: "пр-т " },
  { test: /^пер$/i, before: "пер. " },
  { test: /^пер\.$/i, before: "пер. " },
  { test: /^б-р$/i, before: "б-р " },
  { test: /^ш$/i, before: "ш. " },
  { test: /^наб$/i, before: "наб. " },
  { test: /^пл$/i, before: "пл. " },
  { test: /^проезд$/i, before: "проезд " },
  { test: /^тупик$/i, before: "тупик " },
];

// Признаки "Word + Type" — например "Земляной вал ул", "Большая Тульская ул".
// Возвращаем "ул. Земляной вал".
function rewriteSuffix(part: string): string {
  // Пытаемся выделить последнее слово как тип (если соответствует правилу).
  const m = part.match(/^(.+?)\s+([А-Яа-яёЁ.\-]+)$/);
  if (!m) return part;
  const [, body, type] = m;
  for (const rule of TYPE_RULES) {
    if (rule.test.test(type)) {
      if (rule.before) return `${rule.before}${body}`.trim();
      if (rule.after) return `${body}${rule.after}`.trim();
    }
  }
  return part;
}

function isPostcode(s: string): boolean {
  return /^\d{6}$/.test(s.trim());
}

function formatOne(raw: string): string {
  if (!raw) return "";
  // Разбиваем по запятым, отсеиваем пустые и одиночные пробелы.
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let postcode: string | null = null;
  const others: string[] = [];
  for (const p of parts) {
    if (isPostcode(p) && !postcode) {
      postcode = p;
    } else {
      others.push(rewriteSuffix(p));
    }
  }

  // Постиндекс кладём в конец — для UI важнее город/улица.
  const tail = postcode ? `, ${postcode}` : "";
  return others.join(", ") + tail;
}

export function formatKladrAddress(raw: string | null | undefined): FormattedAddress | null {
  if (!raw) return null;
  // У Dadata multi-address разделяется ` ; ` (с пробелами и запятыми вокруг).
  const segments = raw
    .split(/\s*;\s*/)
    .map((s) => s.replace(/(^,)|(,$)/g, "").trim())
    .filter((s) => s.length > 0);

  if (segments.length === 0) return null;
  const formatted = segments.map(formatOne).filter((s) => s.length > 0);
  if (formatted.length === 0) return null;
  return {
    primary: formatted[0],
    secondary: formatted.length > 1 ? formatted.slice(1).join(" · ") : null,
  };
}
