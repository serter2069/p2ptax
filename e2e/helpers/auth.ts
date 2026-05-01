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
 * Usage:
 *   await page.goto("/");  // any page on the same origin
 *   await page.waitForLoadState("domcontentloaded");
 *   await loginViaApi(page, "user@example.com");
 *   await page.goto("/requests/new");  // AuthContext reads from localStorage on mount
 */
export async function loginViaApi(
  page: Page,
  email: string,
  devCode = "000000"
): Promise<{ accessToken: string; refreshToken: string }> {
  // 1. Request OTP
  const reqRes = await page.request.post(`${API_BASE}/api/auth/request-otp`, {
    data: { email },
  });
  if (!reqRes.ok()) {
    throw new Error(
      `request-otp failed: ${reqRes.status()} ${await reqRes.text()}`
    );
  }

  // 2. Verify OTP with dev code
  const verifyRes = await page.request.post(`${API_BASE}/api/auth/verify-otp`, {
    data: { email, code: devCode },
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
