/**
 * Thread display helpers — extracted from app/(tabs)/messages.tsx.
 *
 * Pure functions used by the unified inbox (and consumers like
 * ThreadCard) to render thread rows consistently.
 */

export interface ThreadUserLike {
  firstName: string | null;
  lastName: string | null;
  /** Soft-deleted user — UI must render "Аккаунт удалён" instead of name. */
  isDeleted?: boolean;
}

export interface ThreadLike {
  lastMessage: { createdAt: string } | null;
  createdAt: string;
}

export function displayName(user: ThreadUserLike, fallback: string): string {
  if (user.isDeleted) return "Аккаунт удалён";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : fallback;
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString("ru-RU", { weekday: "short" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function sortThreads<T extends ThreadLike>(threads: T[]): T[] {
  return [...threads].sort((a, b) => {
    const aTime = a.lastMessage
      ? new Date(a.lastMessage.createdAt).getTime()
      : a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.lastMessage
      ? new Date(b.lastMessage.createdAt).getTime()
      : b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}
