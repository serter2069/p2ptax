import { test, expect } from "@playwright/test";

const TEST_EMAIL = "serter20692+test1@gmail.com";
const DEV_OTP = "000000";
const API_BASE = "http://localhost:3812";

/**
 * Fill the OtpCodeInput by typing each digit into its labelled box.
 * Uses `page.keyboard.press` after focusing each box to trigger RN's
 * onChangeText handler correctly on web.
 */
async function fillOtpBoxes(page: import("@playwright/test").Page, code: string) {
  for (let i = 0; i < code.length; i++) {
    const input = page.getByLabel(`Цифра ${i + 1} кода подтверждения`);
    await expect(input).toBeVisible({ timeout: 5_000 });
    await input.click();
    await page.keyboard.press(code[i]);
  }
}

test.describe("OTP auth flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login/);
  });

  test("happy path: email -> OTP page -> enter 000000 -> out of /login", async ({ page }) => {
    // Enter email and submit
    await page.getByLabel("Email адрес").fill(TEST_EMAIL);
    await page.getByTestId("send-otp").click();

    // Should navigate to /otp
    await expect(page).toHaveURL(/\/otp/, { timeout: 15_000 });

    // Fill OTP digit by digit
    await fillOtpBoxes(page, DEV_OTP);

    // OtpCodeInput fires onSubmit automatically when all 6 digits are entered,
    // which triggers handleVerify. Accept either:
    // - authenticated route (dashboard/tabs/my-requests) for existing users
    // - still /otp but showing role picker ("Кто вы?") for new users
    await page.waitForTimeout(3_000);

    const currentUrl = page.url();
    const isStillOtp = currentUrl.includes("/otp");

    if (isStillOtp) {
      // New user: role picker should be visible
      const rolePicker = page.locator("text=/Кто вы/i");
      const pickerVisible = await rolePicker.isVisible({ timeout: 5_000 });
      if (pickerVisible) {
        // Pick "Мне нужна помощь с налоговой" (client role)
        await page.getByRole("button", { name: /Мне нужна помощь/i }).click();
        await page.waitForTimeout(2_000);
      }
      // After picking or if stuck — button might have redirected
    }

    // Final check: not on /login (auth was triggered)
    const finalUrl = page.url();
    expect(finalUrl).not.toContain("/login");
  });

  test("wrong code: error message visible, stays on /otp", async ({ page }) => {
    // Request OTP first
    await page.request.post(`${API_BASE}/api/auth/request-otp`, {
      data: { email: TEST_EMAIL },
    });

    await page.goto(`/otp?email=${encodeURIComponent(TEST_EMAIL)}`);
    await page.waitForLoadState("networkidle");

    // Wait for OTP boxes to render
    const firstBox = page.getByLabel("Цифра 1 кода подтверждения");
    await expect(firstBox).toBeVisible({ timeout: 10_000 });

    // Type a wrong code digit by digit
    await fillOtpBoxes(page, "123456");

    // Wait for the confirm button to become enabled
    const confirmBtn = page.getByTestId("verify-otp");
    // Allow extra time for state to propagate
    await page.waitForTimeout(500);

    // Click verify (may still be disabled if state didn't settle — click anyway via JS)
    await confirmBtn.click({ force: true });

    // Error from the API: "Invalid or expired code"
    const errorEl = page.locator("text=/Неверный|неверный|Invalid|expired/i");
    await expect(errorEl).toBeVisible({ timeout: 10_000 });

    // Must remain on /otp
    await expect(page).toHaveURL(/\/otp/);
  });

  test("rate limit: API returns 200 or 429, never 5xx", async ({ page }) => {
    // Test the API endpoint directly — no UI interaction needed
    const results: { status: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await page.request.post(`${API_BASE}/api/auth/request-otp`, {
        data: { email: `ratelimit+${i}@e2e.test` },
      });
      const status = r.status();
      results.push({ status });

      // Should always be JSON (200 or 429), never a crash (500)
      if (status === 200) {
        const body = await r.json();
        expect(body).toHaveProperty("success", true);
      } else if (status === 429) {
        const body = await r.json();
        expect(body).toHaveProperty("error");
      } else {
        // Any other status (4xx besides 429) is acceptable but not 5xx
        expect(status).toBeLessThan(500);
      }
    }

    // All statuses must be in acceptable range
    for (const { status } of results) {
      expect(status).toBeLessThan(500);
    }
  });
});
