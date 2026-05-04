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
  /**
   * Discriminator for ok=false. Lets callers distinguish a real
   * authentication failure (where they should clear tokens / log the
   * user out) from a transient blip (api restarting, network error,
   * 5xx — leave tokens alone, the user can retry on their next action).
   */
  reason?: "no-refresh-token" | "auth-rejected" | "transient";
}

let inflight: Promise<RefreshResult> | null = null;
/** Cache the last successful result for 3s to coalesce burst-callers. */
let lastSuccess: { at: number; result: RefreshResult } | null = null;
const SUCCESS_TTL_MS = 3000;

function getApiUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3812";
}

/**
 * Single attempt at hitting /api/auth/refresh.
 * Returns:
 *   { kind: "ok", … } — got a new access token + user payload
 *   { kind: "auth-rejected" } — server explicitly refused (401)
 *   { kind: "transient" }    — 5xx / network / no-response (api restarting,
 *                              CDN blip, etc.). Caller may retry.
 */
type RefreshAttempt =
  | { kind: "ok"; accessToken: string; refreshToken: string; user: RefreshUserPayload }
  | { kind: "auth-rejected" }
  | { kind: "transient" };

async function refreshAttempt(refreshToken: string): Promise<RefreshAttempt> {
  try {
    const res = await fetch(`${getApiUrl()}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.status === 401) return { kind: "auth-rejected" };
    if (!res.ok) return { kind: "transient" };
    const data = await res.json();
    return {
      kind: "ok",
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  } catch {
    return { kind: "transient" };
  }
}

async function doRefresh(): Promise<RefreshResult> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
  if (!refreshToken) {
    return { ok: false, reason: "no-refresh-token" };
  }

  // Retry an explicit 401 once after a 1.5s pause — the most common cause
  // of a single transient 401 right after `pm2 restart p2ptax-api` is the
  // jwt-verification middleware racing the api boot. A second attempt
  // either succeeds or confirms the token is genuinely invalid. Without
  // this retry, every routine api restart could log random users out.
  let attempt = await refreshAttempt(refreshToken);

  if (attempt.kind === "auth-rejected") {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    attempt = await refreshAttempt(refreshToken);
  }

  if (attempt.kind === "ok") {
    await AsyncStorage.setItem(TOKEN_KEY, attempt.accessToken);
    await AsyncStorage.setItem(REFRESH_KEY, attempt.refreshToken);
    return {
      ok: true,
      accessToken: attempt.accessToken,
      user: attempt.user,
    };
  }

  if (attempt.kind === "auth-rejected") {
    // Confirmed real auth failure — token genuinely invalid. Clear.
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_KEY);
    return { ok: false, reason: "auth-rejected" };
  }

  // Transient (5xx / network / restart in progress). Keep tokens — the
  // user can retry on their next action when the api is back up.
  return { ok: false, reason: "transient" };
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
