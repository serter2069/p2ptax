/**
 * chatHelpers.ts — shared display utilities for the inline chat view.
 * Extracted from InlineChatView.tsx to keep that file under 500 LOC.
 */

export function displayName(user: {
  firstName: string | null;
  lastName: string | null;
  isDeleted?: boolean;
}): string {
  if (user.isDeleted) return "Аккаунт удалён";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Пользователь";
}

/**
 * Russian instrumental-case helper for a single name token.
 * Pragmatic suffix rules — handles common cases for "переписываетесь с <Name>".
 *
 * Rules covered:
 *   мужские имена: -ей → -еем (Алексей → Алексеем), -й → -ем, -а/я → -ой/ей,
 *                   consonant → +ом (Иван → Иваном)
 *   мужские фамилии: -ов/ев/ёв/ин/ын → +ым
 *   женские: -а → -ой, -я → -ей
 *   фамилии на -ова/ева/ина/ына → -овой/евой/иной/ыной
 * Unknowns return the original token.
 */
function tokenInInstrumental(token: string): string {
  if (!token) return token;
  const lower = token.toLowerCase();

  // Female surnames: -ова/ева/ёва/ина/ына → -овой/евой/ёвой/иной/ыной
  if (/(?:ова|ева|ёва|ина|ына)$/.test(lower)) {
    return token.slice(0, -1) + "ой";
  }
  // Female surnames: -ская → -ской
  if (/ская$/.test(lower)) {
    return token.slice(0, -2) + "ой";
  }
  // Male surnames: -ов/ев/ёв/ин/ын → +ым
  if (/(?:ов|ев|ёв|ин|ын)$/.test(lower)) {
    return token + "ым";
  }
  // Male surnames: -ский/цкий → -ским/цким
  if (/(?:ский|цкий)$/.test(lower)) {
    return token.slice(0, -2) + "им";
  }
  // First names ending -ей (Алексей, Андрей, Сергей) → -еем
  if (/ей$/.test(lower)) {
    return token.slice(0, -2) + "еем";
  }
  // -ай/-ой/-уй → -аем/-оем/-уем
  if (/[аоу]й$/.test(lower)) {
    return token.slice(0, -1) + "ем";
  }
  // -ий → -ием (Юрий → Юрием)
  if (/ий$/.test(lower)) {
    return token.slice(0, -2) + "ием";
  }
  // Generic -й → -ем
  if (/й$/.test(lower)) {
    return token.slice(0, -1) + "ем";
  }
  // -ия (female): Юлия → Юлией
  if (/ия$/.test(lower)) {
    return token.slice(0, -1) + "ей";
  }
  // -я (female/male soft)
  if (/я$/.test(lower)) {
    return token.slice(0, -1) + "ей";
  }
  // Hissing stem + -а (Саша → Сашей)
  if (/[жшщчц]а$/.test(lower)) {
    return token.slice(0, -1) + "ей";
  }
  // Generic -а (Анна → Анной)
  if (/а$/.test(lower)) {
    return token.slice(0, -1) + "ой";
  }
  // Soft sign -ь (Игорь → Игорем)
  if (/ь$/.test(lower)) {
    return token.slice(0, -1) + "ем";
  }
  // Consonant-final male names (Иван → Иваном)
  if (/[бвгджзйклмнпрстфхцчшщ]$/.test(lower)) {
    return token + "ом";
  }

  return token;
}

export function nameInInstrumental(fullName: string): string {
  if (!fullName) return fullName;
  return fullName
    .split(/\s+/)
    .map((part) => tokenInInstrumental(part))
    .join(" ");
}
