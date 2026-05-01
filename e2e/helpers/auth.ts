import { type Page } from "@playwright/test";

const API_BASE = "http://localhost:3812";
const TOKEN_KEY = "p2ptax_access_token";
const REFRESH_KEY = "p2ptax_refresh_token";

/**
 * Authenticate via API (POST request-otp + verify-otp with dev code 000000),
 * then inject tokens into the page's localStorage so AuthContext picks them
 * up on next navigation.
 *
 * @react-native-async-storage/async-storage on web uses window.localStorage
 * via its LegacyAsyncStorageWebImpl (the default export calls getLegacyStorage()).
 *
 * Rate-limit bypass:
 *   All requests from `page.request` use `x-smoke-test: metromap` to bypass
 *   the per-IP rate limiters. We also install a `page.route()` interceptor so
 *   that AuthContext's native `fetch()` calls to /api/* (e.g. /api/auth/me,
 *   /api/auth/refresh) also carry the smoke header — without it, the global
 *   apiLimiter (200/15min) can 429 those calls during test runs, causing
 *   AuthContext to wipe localStorage and treat the session as expired.
 *
 * Usage:
 *   await page.goto("/");  // any page on the same origin
 *   await page.waitForLoadState("domcontentloaded");
 *   await loginViaApi(page, "user@example.com");
 *   await page.goto("/requests/new");  // AuthContext reads from localStorage on mount
 */
/**
 * Generate a unique test email to avoid OTP collisions when tests run in parallel.
 * Pass a base address; the function appends a timestamp+random suffix.
 */
export function uniqueTestEmail(base = "serter20692"): string {
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}+e2e-${Date.now()}-${rand}@gmail.com`;
}

export async function loginViaApi(
  page: Page,
  email: string,
  devCode = "000000"
): Promise<{ accessToken: string; refreshToken: string }> {
  // 0. Install route interceptor to add smoke-test header to all /api/* requests
  //    made by the page itself (e.g. AuthContext's fetch to /api/auth/me).
  //    This prevents the global apiLimiter from 429-ing auth bootstrap calls.
  await page.route(`${API_BASE}/api/**`, async (route) => {
    const request = route.request();
    const headers = {
      ...request.headers(),
      "x-smoke-test": "metromap",
    };
    await route.continue({ headers });
  });

  // 1. Request OTP — bypass rate limit in tests via smoke-test header
  const reqRes = await page.request.post(`${API_BASE}/api/auth/request-otp`, {
    data: { email },
    headers: { "x-smoke-test": "metromap" },
  });
  if (!reqRes.ok()) {
    throw new Error(
      `request-otp failed: ${reqRes.status()} ${await reqRes.text()}`
    );
  }

  // 2. Verify OTP with dev code — bypass rate limit in tests via smoke-test header
  const verifyRes = await page.request.post(`${API_BASE}/api/auth/verify-otp`, {
    data: { email, code: devCode },
    headers: { "x-smoke-test": "metromap" },
  });
  if (!verifyRes.ok()) {
    throw new Error(
      `verify-otp failed: ${verifyRes.status()} ${await verifyRes.text()}`
    );
  }
  const { accessToken, refreshToken } = (await verifyRes.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  // 3. Inject tokens into window.localStorage (used by AsyncStorage legacy web impl)
  await page.evaluate(
    ({ tokenKey, refreshKey, access, refresh }) => {
      window.localStorage.setItem(tokenKey, access);
      window.localStorage.setItem(refreshKey, refresh);
    },
    {
      tokenKey: TOKEN_KEY,
      refreshKey: REFRESH_KEY,
      access: accessToken,
      refresh: refreshToken,
    }
  );

  return { accessToken, refreshToken };
}
