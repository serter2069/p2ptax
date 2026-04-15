/**
 * Date formatting utilities with Russian locale support.
 * Pure JS Date operations — no external libraries.
 */

function toDate(date: string | Date): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Russian plural form selector.
 * Rules: 1 → 0, 2-4 → 1, 5-20 → 2, 21 → 0, 22-24 → 1, etc.
 */
function pluralize(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod100 >= 11 && mod100 <= 19) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

/** Returns DD.MM.YYYY (e.g., "14.04.2026") */
export function formatDate(date: string | Date): string {
  const d = toDate(date);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Returns DD.MM.YYYY HH:MM */
export function formatDateTime(date: string | Date): string {
  const d = toDate(date);
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Returns HH:MM (e.g., "14:32") */
export function formatTime(date: string | Date): string {
  const d = toDate(date);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Returns relative time in Russian:
 * - "только что" (< 1 min)
 * - "X мин назад" / "X минуту назад" / "X минуты назад" (< 60 min)
 * - "X ч назад" / "X час назад" / "X часа назад" (< 24h)
 * - "вчера" (yesterday)
 * - DD.MM.YYYY (older)
 */
export function formatRelative(date: string | Date): string {
  const d = toDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return 'только что';

  if (diffMin < 60) {
    const form = pluralize(diffMin, ['минуту', 'минуты', 'минут']);
    return `${diffMin} ${form} назад`;
  }

  if (diffHours < 24) {
    const form = pluralize(diffHours, ['час', 'часа', 'часов']);
    return `${diffHours} ${form} назад`;
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return 'вчера';
  }

  return formatDate(d);
}

/** Returns "с YYYY г." (e.g., "с 2024 г.") */
export function formatMemberSince(year: number): string {
  return `с ${year} г.`;
}
