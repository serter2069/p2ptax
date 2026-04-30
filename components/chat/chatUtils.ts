/**
 * Shared utility functions and types for the chat components.
 */

import { API_URL } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface PendingFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface OtherUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isDeleted?: boolean;
}

export interface ThreadInfo {
  id: string;
  requestId: string;
  clientId: string;
  specialistId: string;
  request: { id: string; title: string; status: string };
  client: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; isDeleted?: boolean };
  specialist: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; isDeleted?: boolean };
  otherUser: OtherUser;
}

// ─── Upload helper ────────────────────────────────────────────────────────────

export async function uploadChatFile(file: PendingFile, threadId: string): Promise<string> {
  const uploadToken = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const formData = new FormData();
  formData.append("file", { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
  formData.append("uploadToken", uploadToken);
  formData.append("threadId", threadId);
  const token = await AsyncStorage.getItem("p2ptax_access_token");
  const res = await fetch(`${API_URL}/api/upload/chat-file`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error("Ошибка загрузки файла");
  return ((await res.json()) as { uploadToken: string }).uploadToken;
}

export function displayName(user: { firstName: string | null; lastName: string | null; isDeleted?: boolean }): string {
  if (user.isDeleted) return "Аккаунт удалён";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Пользователь";
}

/**
 * Russian instrumental case for a single name token.
 * Pragmatic suffix rules — covers common Russian first/last names.
 */
export function tokenInInstrumental(token: string): string {
  if (!token) return token;
  const lower = token.toLowerCase();
  // Female surnames
  if (/(?:ова|ева|ёва|ина|ына)$/.test(lower)) return token.slice(0, -1) + "ой";
  if (/ская$/.test(lower)) return token.slice(0, -2) + "ой";
  // Male surnames
  if (/(?:ов|ев|ёв|ин|ын)$/.test(lower)) return token + "ым";
  if (/(?:ский|цкий)$/.test(lower)) return token.slice(0, -2) + "им";
  // Names ending in -ей, -й, -ий, -ия, -я, -а
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

export function nameInInstrumental(name: string): string {
  return name ? name.split(/\s+/).map(tokenInInstrumental).join(" ") : name;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
