// Shared Russian-locale date formatting utilities.
// All functions accept Date | string and return a formatted string.

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** "15.04.2026" */
export function formatDateShort(date: Date | string): string {
  return toDate(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** "15 апреля 2026" */
export function formatDateLong(date: Date | string): string {
  return toDate(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "2026" */
export function formatYear(date: Date | string): string {
  return toDate(date).toLocaleDateString("ru-RU", {
    year: "numeric",
  });
}
