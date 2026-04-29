/**
 * Russian language helpers — backend mirror of frontend lib/ru.ts.
 *
 * Pragmatic suffix-based rules. Returns original string for unknown patterns.
 * No external dependencies on purpose.
 */

export function pluralizeRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

const GENITIVE_EXCEPTIONS: Record<string, string> = {
  лев: "льва",
  пётр: "петра",
  петр: "петра",
  павел: "павла",
  александр: "александра",
};

/**
 * Russian first-name in genitive case for "от Сергея / для Анны" style messages.
 * See lib/ru.ts in the frontend for the full rule list.
 */
export function firstNameInGenitive(name: string): string {
  if (!name) return name;
  const trimmed = name.trim();
  if (!trimmed) return name;

  const lower = trimmed.toLowerCase();
  if (GENITIVE_EXCEPTIONS[lower]) {
    const out = GENITIVE_EXCEPTIONS[lower];
    return trimmed[0] === trimmed[0].toUpperCase()
      ? out[0].toUpperCase() + out.slice(1)
      : out;
  }

  if (/ей$/.test(lower)) return trimmed.slice(0, -2) + "ея";
  if (/ий$/.test(lower)) return trimmed.slice(0, -2) + "ия";
  if (/й$/.test(lower)) return trimmed.slice(0, -1) + "я";
  if (/ия$/.test(lower)) return trimmed.slice(0, -1) + "и";
  if (/я$/.test(lower)) return trimmed.slice(0, -1) + "и";
  if (/[жшщч]а$/.test(lower)) return trimmed.slice(0, -1) + "и";
  if (/а$/.test(lower)) return trimmed.slice(0, -1) + "ы";
  if (/ь$/.test(lower)) return trimmed.slice(0, -1) + "я";
  if (/[бвгджзклмнпрстфхцчшщ]$/.test(lower)) return trimmed + "а";

  return trimmed;
}
