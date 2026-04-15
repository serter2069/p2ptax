import { secureStorage } from '../stores/storage';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://localhost:3812/api' : 'https://p2ptax.smartlaunchhub.com/api');

export const TOKEN_KEY = '@p2ptax_token';

// ---------------------------------------------------------------------------
// Standardized API error
// ---------------------------------------------------------------------------
export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  /** HTTP status code (e.g. 400, 401, 404) */
  readonly status: number;
  /** Machine-readable error code (e.g. VALIDATION_ERROR, NOT_FOUND) */
  readonly code: string;
  /** Per-field validation errors (populated for VALIDATION_ERROR) */
  readonly details: FieldError[];

  constructor(status: number, code: string, message: string, details: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Auth event bus
// ---------------------------------------------------------------------------
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

// Detect web runtime (browser) — used for cookie credentials
const isWebRuntime = typeof window !== 'undefined' && typeof document !== 'undefined';

// ---------------------------------------------------------------------------
// Parse the standardized error response from the API:
// { error: { code, message, details } }
// Falls back gracefully if the response is not in the expected shape.
// ---------------------------------------------------------------------------
async function parseApiError(response: Response): Promise<ApiError> {
  const status = response.status;
  try {
    const json = await response.json();
    // Standardized format: { error: { code, message, details } }
    if (json?.error && typeof json.error === 'object') {
      const { code, message, details } = json.error;
      return new ApiError(
        status,
        code ?? 'INTERNAL_ERROR',
        message ?? `HTTP ${status}`,
        Array.isArray(details) ? details : [],
      );
    }
    // Legacy fallback: { message } or { statusCode, message }
    const msg = json?.message ?? json?.error ?? `HTTP ${status}`;
    return new ApiError(status, 'INTERNAL_ERROR', Array.isArray(msg) ? msg.join(', ') : msg);
  } catch {
    return new ApiError(status, 'INTERNAL_ERROR', `HTTP ${status}`);
  }
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
    credentials: isWebRuntime ? 'include' : 'same-origin',
  });

  // 401 → auto-refresh → retry → if fails → logout
  if (response.status === 401) {
    const refreshed = await tryRefreshTokens();
    if (refreshed) {
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
        credentials: isWebRuntime ? 'include' : 'same-origin',
      });
      if (retryResponse.status === 401) {
        await clearToken();
        emitUnauthorized();
        throw new ApiError(401, 'UNAUTHORIZED', 'Необходима авторизация');
      }
      if (!retryResponse.ok) {
        throw await parseApiError(retryResponse);
      }
      if (retryResponse.status === 204) {
        return undefined as T;
      }
      return retryResponse.json() as Promise<T>;
    }
    await clearToken();
    emitUnauthorized();
    throw new ApiError(401, 'UNAUTHORIZED', 'Необходима авторизация');
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
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
      if (retryResponse.status === 401) {
        await clearToken();
        emitUnauthorized();
        throw new ApiError(401, 'UNAUTHORIZED', 'Необходима авторизация');
      }
      if (!retryResponse.ok) {
        throw await parseApiError(retryResponse);
      }
      return retryResponse.json() as Promise<T>;
    }
    await clearToken();
    emitUnauthorized();
    throw new ApiError(401, 'UNAUTHORIZED', 'Необходима авторизация');
  }

  if (!response.ok) {
    throw await parseApiError(response);
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
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PUT', path, body);
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
