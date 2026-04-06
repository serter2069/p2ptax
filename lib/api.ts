import { secureStorage } from '../stores/storage';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://localhost:3812/api' : 'https://p2ptax.smartlaunchhub.com/api');

export const TOKEN_KEY = '@p2ptax_token';

// Simple event emitter for auth events
type AuthEventListener = () => void;
const unauthorizedListeners: AuthEventListener[] = [];

export function onUnauthorized(listener: AuthEventListener): () => void {
  unauthorizedListeners.push(listener);
  return () => {
    const idx = unauthorizedListeners.indexOf(listener);
    if (idx !== -1) unauthorizedListeners.splice(idx, 1);
  };
}

function emitUnauthorized() {
  unauthorizedListeners.forEach((l) => l());
}

// Token storage helpers
export async function getToken(): Promise<string | null> {
  try {
    return await secureStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await secureStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await secureStorage.removeItem(TOKEN_KEY);
}

const REFRESH_TOKEN_KEY = '@p2ptax_refresh_token';

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await secureStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  await secureStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export async function clearRefreshToken(): Promise<void> {
  await secureStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Refresh in-flight guard to avoid concurrent refresh calls
let refreshPromise: Promise<boolean> | null = null;

export async function tryRefreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;

      const url = `${BASE_URL}/auth/refresh`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) return false;

      const data = await response.json() as { accessToken: string; refreshToken?: string };
      await setToken(data.accessToken);
      if (data.refreshToken) {
        await setRefreshToken(data.refreshToken);
      }
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Core fetch helper
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    // Attempt token refresh before giving up
    const refreshed = await tryRefreshTokens();
    if (refreshed) {
      // Retry original request with new token
      const newToken = await getToken();
      const retryHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (newToken) {
        retryHeaders['Authorization'] = `Bearer ${newToken}`;
      }
      const retryResponse = await fetch(url, {
        method,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (retryResponse.status === 401) {
        await clearToken();
        emitUnauthorized();
        throw new ApiError(401, 'Unauthorized');
      }
      if (!retryResponse.ok) {
        let retryMessage = `HTTP ${retryResponse.status}`;
        try {
          const json = await retryResponse.json();
          retryMessage = json?.message ?? json?.error ?? retryMessage;
        } catch {
          // ignore parse error
        }
        throw new ApiError(retryResponse.status, retryMessage);
      }
      if (retryResponse.status === 204) {
        return undefined as T;
      }
      return retryResponse.json() as Promise<T>;
    }
    await clearToken();
    emitUnauthorized();
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    // 429 Too Many Requests — throttler fires a raw "ThrottlerException: Too Many Requests"
    // message that is not user-friendly. Replace it here centrally for all screens.
    if (response.status === 429) {
      throw new ApiError(429, 'Слишком много попыток. Попробуйте через 5 минут.');
    }
    let message = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      message = json?.message ?? json?.error ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(response.status, message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Multipart upload helper (for avatar etc.)
async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    const refreshed = await tryRefreshTokens();
    if (refreshed) {
      const newToken = await getToken();
      const retryHeaders: Record<string, string> = { Accept: 'application/json' };
      if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(url, { method: 'POST', headers: retryHeaders, body: formData });
      if (!retryResponse.ok) throw new ApiError(retryResponse.status, `HTTP ${retryResponse.status}`);
      return retryResponse.json() as Promise<T>;
    }
    await clearToken();
    emitUnauthorized();
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try { const json = await response.json(); message = json?.message ?? message; } catch {}
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path);
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('POST', path, body);
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PATCH', path, body);
  },
  del<T>(path: string): Promise<T> {
    return request<T>('DELETE', path);
  },
  upload<T>(path: string, formData: FormData): Promise<T> {
    return uploadFile<T>(path, formData);
  },
};
