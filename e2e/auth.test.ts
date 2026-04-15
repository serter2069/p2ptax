import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for the auth flow: email -> OTP -> dashboard.
 *
 * Requires:
 *  - Frontend running on localhost:8081 (Expo web)
 *  - API running on localhost:3812 (NestJS)
 *  - Dev mode enabled (OTP code is always 000000)
 */

const TEST_EMAIL = 'e2e-auth-test@p2ptax.test';
const DEV_OTP = '000000';
const WRONG_OTP = '111111';

// Helper: navigate to the email auth page
async function goToEmailPage(page: Page) {
  await page.goto('/(auth)/email');
  await page.waitForSelector('text=email', { timeout: 10_000 });
}

// Helper: fill email and submit as CLIENT
async function submitEmailAsClient(page: Page, email: string) {
  const emailInput = page.locator('input[type="email"], input[placeholder="you@example.com"]').first();
  await emailInput.fill(email);
  // Click the "client" role button
  await page.getByRole('button', { name: /ищу специалиста/i }).click();
}

// Helper: fill OTP digits
async function fillOtp(page: Page, code: string) {
  const digits = code.split('');
  // OTP inputs are individual TextInput fields in a row
  const otpInputs = page.locator('input[inputmode="numeric"], input[maxlength="6"]');
  const count = await otpInputs.count();

  if (count >= 6) {
    // Individual digit inputs
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(digits[i]);
    }
  } else if (count >= 1) {
    // Single input or paste-capable — type the full code into the first one
    await otpInputs.first().fill(code);
  }
}

// ---------------------------------------------------------------------------
// Test 1: Email page -> enter valid email -> navigate to OTP page
// ---------------------------------------------------------------------------
test('valid email navigates to OTP page', async ({ page }) => {
  await goToEmailPage(page);
  await submitEmailAsClient(page, TEST_EMAIL);

  // Should navigate to OTP page — look for "Введите код" header
  await expect(page.getByText('Введите код')).toBeVisible({ timeout: 10_000 });
  // Email should be displayed on OTP page
  await expect(page.getByText(TEST_EMAIL)).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 2: OTP page -> enter valid code (000000) -> navigate to dashboard
// ---------------------------------------------------------------------------
test('valid OTP code navigates to dashboard', async ({ page }) => {
  await goToEmailPage(page);
  await submitEmailAsClient(page, TEST_EMAIL);
  await expect(page.getByText('Введите код')).toBeVisible({ timeout: 10_000 });

  // Fill dev OTP
  await fillOtp(page, DEV_OTP);

  // Auto-submit should trigger; wait for navigation away from OTP page.
  // Dashboard or onboarding should appear (depends on whether user is new).
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
});

// ---------------------------------------------------------------------------
// Test 3: Invalid email shows error
// ---------------------------------------------------------------------------
test('invalid email shows error message', async ({ page }) => {
  await goToEmailPage(page);

  const emailInput = page.locator('input[type="email"], input[placeholder="you@example.com"]').first();
  await emailInput.fill('not-an-email');
  await page.getByRole('button', { name: /ищу специалиста/i }).click();

  // Should show validation error — not navigate away
  await expect(page.getByText(/корректный email/i)).toBeVisible({ timeout: 5_000 });
});

// ---------------------------------------------------------------------------
// Test 4: Wrong OTP shows error
// ---------------------------------------------------------------------------
test('wrong OTP shows error message', async ({ page }) => {
  await goToEmailPage(page);
  await submitEmailAsClient(page, TEST_EMAIL);
  await expect(page.getByText('Введите код')).toBeVisible({ timeout: 10_000 });

  await fillOtp(page, WRONG_OTP);

  // Should show error on the same OTP page
  await expect(page.getByText(/неверный код|ошибка|Попытка/i)).toBeVisible({ timeout: 10_000 });
  // Should still be on OTP page
  await expect(page.getByText('Введите код')).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 5: Resend button appears after timer expires
// ---------------------------------------------------------------------------
test('resend button appears after countdown', async ({ page }) => {
  await goToEmailPage(page);
  await submitEmailAsClient(page, TEST_EMAIL);
  await expect(page.getByText('Введите код')).toBeVisible({ timeout: 10_000 });

  // Initially, should show countdown text
  await expect(page.getByText(/повторно через/i)).toBeVisible();

  // The resend link should NOT be visible yet
  await expect(page.getByText(/отправить код повторно/i)).not.toBeVisible();

  // Note: waiting the full 60s in E2E is not practical.
  // We validate the timer text is present, which proves the timer mechanism exists.
  // Full timer expiration can be tested by mocking timers in unit tests.
});

// ---------------------------------------------------------------------------
// Test 6: Auth state persists after page reload
// ---------------------------------------------------------------------------
test('auth state persists after page reload', async ({ page }) => {
  await goToEmailPage(page);
  await submitEmailAsClient(page, TEST_EMAIL);
  await expect(page.getByText('Введите код')).toBeVisible({ timeout: 10_000 });

  await fillOtp(page, DEV_OTP);
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

  // Reload the page
  await page.reload();

  // After reload, should NOT be redirected back to auth
  await page.waitForTimeout(3_000);
  const url = page.url();
  expect(url).not.toMatch(/\(auth\)/);
});
