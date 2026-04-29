/**
 * Russian language helpers — pluralization + name declension.
 *
 * Pragmatic suffix-based rules. Returns original string for unknown patterns.
 * No external dependencies on purpose (no `petrovich`).
 */

/**
 * Russian plural form selector (one / few / many).
 *
 * Examples:
 *   pluralizeRu(1, ['заявка', 'заявки', 'заявок']) -> 'заявка'
 *   pluralizeRu(2, ['заявка', 'заявки', 'заявок']) -> 'заявки'
 *   pluralizeRu(5, ['заявка', 'заявки', 'заявок']) -> 'заявок'
 *   pluralizeRu(0, ['заявка', 'заявки', 'заявок']) -> 'заявок'
 */
export function pluralizeRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

// Small dictionary of irregular first names (genitive case).
const GENITIVE_EXCEPTIONS: Record<string, string> = {
  лев: "льва",
  пётр: "петра",
  петр: "петра",
  павел: "павла",
  александр: "александра",
};

/**
 * Russian first-name in genitive case for "от Сергея / для Анны" style messages.
 *
 * Handled (pragmatic):
 *   - exceptions dictionary (Лев, Пётр, Павел, Александр)
 *   - male -ей  -> -ея   (Алексей -> Алексея, Андрей -> Андрея, Сергей -> Сергея)
 *   - male -й   -> -я    (Юрий -> Юрия — soft i; Николай -> Николая)
 *   - male -ь   -> -я    (Игорь -> Игоря)
 *   - male consonant -> +а (Иван -> Ивана, Виктор -> Виктора)
 *   - female -ия -> -ии  (Юлия -> Юлии, Мария -> Марии)
 *   - female -я  -> -и   (Илья m / Аня f -> Ильи / Ани)
 *   - female -а  -> -ы   (Анна -> Анны, Никита m -> Никиты)
 *
 * Unknown patterns return original.
 */
export function firstNameInGenitive(name: string): string {
  if (!name) return name;
  const trimmed = name.trim();
  if (!trimmed) return name;

  const lower = trimmed.toLowerCase();
  if (GENITIVE_EXCEPTIONS[lower]) {
    // Preserve original capitalization on first letter.
    const out = GENITIVE_EXCEPTIONS[lower];
    return trimmed[0] === trimmed[0].toUpperCase()
      ? out[0].toUpperCase() + out.slice(1)
      : out;
  }

  // Male names ending -ей -> -ея (Алексей, Андрей, Сергей)
  if (/ей$/.test(lower)) {
    return trimmed.slice(0, -2) + "ея";
  }
  // Male names ending -ий -> -ия (Юрий -> Юрия, Дмитрий -> Дмитрия)
  if (/ий$/.test(lower)) {
    return trimmed.slice(0, -2) + "ия";
  }
  // Male names ending -й -> -я (Николай -> Николая, Виталий handled above)
  if (/й$/.test(lower)) {
    return trimmed.slice(0, -1) + "я";
  }
  // Female -ия -> -ии (Юлия -> Юлии, Мария -> Марии)
  if (/ия$/.test(lower)) {
    return trimmed.slice(0, -1) + "и";
  }
  // -я (Илья -> Ильи, Аня -> Ани)
  if (/я$/.test(lower)) {
    return trimmed.slice(0, -1) + "и";
  }
  // -а (Анна -> Анны, Никита -> Никиты, Саша -> Саши for hissing)
  if (/[жшщч]а$/.test(lower)) {
    // hissing consonant + а -> -и (Саша -> Саши)
    return trimmed.slice(0, -1) + "и";
  }
  if (/а$/.test(lower)) {
    return trimmed.slice(0, -1) + "ы";
  }
  // Male soft -ь -> -я (Игорь -> Игоря)
  if (/ь$/.test(lower)) {
    return trimmed.slice(0, -1) + "я";
  }
  // Male consonant -> +а (Иван -> Ивана, Виктор -> Виктора)
  if (/[бвгджзклмнпрстфхцчшщ]$/.test(lower)) {
    return trimmed + "а";
  }

  return trimmed;
}

/**
 * Russian first+last name in instrumental for "переписываетесь с <Имя Фамилия>".
 *
 * Mirrors the inline implementation in components/InlineChatView.tsx so other
 * call sites can reuse it without depending on that component.
 *
 * Rules (pragmatic):
 *   мужские имена: -ей -> -еем, -й -> -ем, -consonant -> +ом
 *   мужские фамилии: -ов/ев/ёв/ин/ын -> +ым; -ский/цкий -> -ским/цким
 *   женские: -а -> -ой, -ия/-я -> -ией/-ей, -ова/ева/ина/ына -> -овой/евой/иной/ыной
 *   женские фамилии: -ская -> -ской
 */
function tokenInInstrumental(token: string): string {
  if (!token) return token;
  const lower = token.toLowerCase();

  if (/(?:ова|ева|ёва|ина|ына)$/.test(lower)) return token.slice(0, -1) + "ой";
  if (/ская$/.test(lower)) return token.slice(0, -2) + "ой";
  if (/(?:ов|ев|ёв|ин|ын)$/.test(lower)) return token + "ым";
  if (/(?:ский|цкий)$/.test(lower)) return token.slice(0, -2) + "им";

  if (/ей$/.test(lower)) return token.slice(0, -2) + "еем";
  if (/[аоу]й$/.test(lower)) return token.slice(0, -1) + "ем";
  if (/ий$/.test(lower)) return token.slice(0, -2) + "ием";
  if (/й$/.test(lower)) return token.slice(0, -1) + "ем";

  if (/ия$/.test(lower)) return token.slice(0, -1) + "ей";
  if (/я$/.test(lower)) return token.slice(0, -1) + "ей";

  if (/[жшщчц]а$/.test(lower)) return token.slice(0, -1) + "ей";
  if (/а$/.test(lower)) return token.slice(0, -1) + "ой";

  if (/ь$/.test(lower)) return token.slice(0, -1) + "ем";

  if (/[бвгджзйклмнпрстфхцчшщ]$/.test(lower)) return token + "ом";

  return token;
}

export function nameInInstrumental(fullName: string): string {
  if (!fullName) return fullName;
  return fullName
    .split(/\s+/)
    .map((part) => tokenInInstrumental(part))
    .join(" ");
}
