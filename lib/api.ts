import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3812";

const TOKEN_KEY = "p2ptax_access_token";
const REFRESH_KEY = "p2ptax_refresh_token";

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  noAuth?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;

    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_KEY);
      return false;
    }

    const data = await res.json();
    await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
    await AsyncStorage.setItem(REFRESH_KEY, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function getValidToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, noAuth = false } = options;

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (!noAuth) {
    const token = await getValidToken();
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  let res = await fetch(`${API_URL}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 interceptor: try refresh once
  if (res.status === 401 && !noAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshTokens();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      const newToken = await getValidToken();
      if (newToken) {
        reqHeaders["Authorization"] = `Bearer ${newToken}`;
      }
      res = await fetch(`${API_URL}${path}`, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(res.status, errorData.error || "Request failed", errorData);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Convenience methods
export const apiGet = <T>(path: string) => api<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body });
export const apiPatch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body });
export const apiDelete = <T>(path: string) =>
  api<T>(path, { method: "DELETE" });

// Avatar upload constants & helpers (shared between settings + onboarding)
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB — must match api/src/routes/upload.ts
export const AVATAR_TOO_LARGE_TITLE = "Файл слишком большой";
export const AVATAR_TOO_LARGE_MESSAGE = "Максимальный размер аватара — 5 МБ.";

/**
 * Map an avatar upload failure (HTTP status / network) to a user-facing message in Russian.
 * status 0 = network error / no response.
 */
export function avatarUploadErrorMessage(status: number): string {
  if (status === 413) return "Файл слишком большой. Максимум 5 МБ.";
  if (status === 429) return "Слишком много загрузок. Попробуйте через минуту.";
  if (status === 0) return "Нет связи с сервером.";
  return "Не удалось загрузить аватар. Попробуйте ещё раз.";
}

/**
 * Upload an avatar file (web). Performs client-side size pre-check, throws ApiError on
 * server error (with mapped Russian message), or a network ApiError(0, ...) on fetch failure.
 * Returns { url, key } — url is a 7-day presigned URL for immediate display,
 * key is the storage key that should be persisted in the DB (never expires).
 * The upload endpoint already saves key to user.avatarUrl in the DB, but the
 * profile PATCH also sends the key so the user profile stays in sync.
 */
export async function uploadAvatarFile(file: File): Promise<{ url: string; key: string }> {
  if (file.size > AVATAR_MAX_BYTES) {
    throw new ApiError(413, avatarUploadErrorMessage(413));
  }

  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/upload/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new ApiError(0, avatarUploadErrorMessage(0));
  }

  if (!res.ok) {
    throw new ApiError(res.status, avatarUploadErrorMessage(res.status));
  }

  const data = (await res.json()) as { url: string; key: string };
  const url = data.url && data.url.startsWith("http") ? data.url : `${API_URL}${data.url}`;
  return { url, key: data.key };
}

/**
 * Upload an avatar from a native URI (expo-document-picker / expo-image-picker asset).
 * Uses the {uri, name, type} FormData form accepted by React Native's fetch polyfill.
 * Returns the absolute URL of the uploaded avatar.
 */
export async function uploadAvatarNative(
  uri: string,
  name: string,
  mimeType: string,
  size: number,
): Promise<string> {
  if (size > AVATAR_MAX_BYTES) {
    throw new ApiError(413, avatarUploadErrorMessage(413));
  }

  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  // React Native fetch accepts {uri, name, type} as a Blob substitute
  formData.append("file", { uri, name, type: mimeType } as unknown as Blob);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/upload/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new ApiError(0, avatarUploadErrorMessage(0));
  }

  if (!res.ok) {
    throw new ApiError(res.status, avatarUploadErrorMessage(res.status));
  }

  const data = (await res.json()) as { url: string };
  return data.url.startsWith("http") ? data.url : `${API_URL}${data.url}`;
}
