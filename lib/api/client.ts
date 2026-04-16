import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from './storage';
import { toast } from '../toast';

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://localhost:3812/api' : 'https://p2ptax.smartlaunchhub.com/api');

// ---------------------------------------------------------------------------
// Auth event bus — mirrors lib/api.ts pattern
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

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer token
// ---------------------------------------------------------------------------
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — 401 refresh + retry with queue
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string | null) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// ---------------------------------------------------------------------------
// Response interceptor — error toasts + label normalization.
// Runs LAST on errors (axios invokes response error interceptors in reverse
// registration order, so the refresh interceptor below runs first; only when
// refresh gives up or the error is not a 401 do we arrive here).
// ---------------------------------------------------------------------------
client.interceptors.response.use(
  undefined,
  (error: AxiosError) => {
    const status = error.response?.status;

    // Normalize 401 errors so downstream code never sees a stale message from
    // a previous response. Bug: before this, error.message sometimes carried
    // the "Not Found" text from the preceding 404 request on the same axios
    // instance (axios reuses the Error object in the refresh-retry path),
    // leading the UI to say "404" for what was really an auth failure.
    if (status === 401) {
      const data = error.response?.data as { message?: string } | undefined;
      error.message = data?.message || 'Unauthorized';
      // 401 toast is intentionally suppressed — the refresh interceptor
      // (registered after this one, therefore runs first) handles UX: it
      // either retries the request or emits the unauthorized event which
      // triggers logout.
      return Promise.reject(error);
    }

    if (status && status >= 500) {
      toast.error('Ошибка сервера, попробуйте позже');
    } else if (status && status >= 400) {
      const data = error.response?.data as { message?: string } | undefined;
      const message = data?.message || 'Произошла ошибка запроса';
      toast.error(message);
    } else if (!error.response && error.message !== 'canceled') {
      // Network error (no response at all)
      toast.error('Нет соединения с сервером');
    }

    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Response interceptor — 401 refresh + retry with queue
// ---------------------------------------------------------------------------
client.interceptors.response.use(
  undefined,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: async (token) => {
            if (token) {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${token}`,
              };
            }
            try {
              resolve(client(originalRequest));
            } catch (retryErr) {
              reject(retryErr);
            }
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      // Use raw axios to avoid interceptors
      const { data } = await axios.post<{ accessToken: string; refreshToken?: string }>(
        `${BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );

      await setAccessToken(data.accessToken);
      if (data.refreshToken) {
        await setRefreshToken(data.refreshToken);
      }

      processQueue(null, data.accessToken);

      // Retry the original request with new token
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${data.accessToken}`,
      };
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      emitUnauthorized();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export { client, BASE_URL };
