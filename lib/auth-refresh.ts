import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Single-flight refresh manager.
 *
 * Backend rotates refresh tokens on every /api/auth/refresh — the row in
 * `refresh_tokens` is deleted and a fresh one is issued. So if TWO refresh
 * requests fire in parallel (proactive 12-min timer in AuthContext + 401
 * interceptor in lib/api.ts), the second call comes in with the now-deleted
 * token and gets 401, which the frontend has historically interpreted as
 * "log the user out". That's the random "вышло из аккаунта" symptom.
 *
 * This module collapses both call paths into one. While a refresh is in
 * flight, every other caller awaits the same Promise. Result is also
 * cached for a short window so back-to-back requests don't re-hit the
 * server unnecessarily.
 */

const TOKEN_KEY = "p2ptax_access_token";
const REFRESH_KEY = "p2ptax_refresh_token";

export interface RefreshUserPayload {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isSpecialist: boolean;
  isAvailable: boolean;
  role: string;
  specialistProfileCompletedAt: string | null;
}

export interface RefreshResult {
  ok: boolean;
  /** New access token, present iff ok=true */
  accessToken?: string;
  /** Fresh user payload from /refresh, present iff ok=true */
  user?: RefreshUserPayload;
}

let inflight: Promise<RefreshResult> | null = null;
/** Cache the last successful result for 3s to coalesce burst-callers. */
let lastSuccess: { at: number; result: RefreshResult } | null = null;
const SUCCESS_TTL_MS = 3000;

function getApiUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3812";
}

async function doRefresh(): Promise<RefreshResult> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
  if (!refreshToken) {
    return { ok: false };
  }
  try {
    const res = await fetch(`${getApiUrl()}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Only treat 401 as "log out". 5xx / network blips must keep the
      // user signed in — they'll re-try on the next action.
      if (res.status === 401) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_KEY);
        return { ok: false };
      }
      // Transient — leave tokens in place, signal "not refreshed".
      return { ok: false };
    }

    const data = await res.json();
    await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
    await AsyncStorage.setItem(REFRESH_KEY, data.refreshToken);

    return {
      ok: true,
      accessToken: data.accessToken,
      user: data.user,
    };
  } catch {
    // Network error — keep tokens, retry on next action.
    return { ok: false };
  }
}

/**
 * Public refresh entry point. Coalesces concurrent callers and caches
 * the most recent successful result for SUCCESS_TTL_MS so back-to-back
 * requests don't double-hit the server (which would race-401 the
 * second one anyway).
 */
export async function refreshAuthSession(): Promise<RefreshResult> {
  if (lastSuccess && Date.now() - lastSuccess.at < SUCCESS_TTL_MS) {
    return lastSuccess.result;
  }
  if (inflight) {
    return inflight;
  }
  inflight = (async () => {
    try {
      const result = await doRefresh();
      if (result.ok) {
        lastSuccess = { at: Date.now(), result };
      }
      return result;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
