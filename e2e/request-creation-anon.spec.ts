import { test, expect } from "@playwright/test";

const TEST_EMAIL = "serter20692+e2eanon@gmail.com";
const DEV_OTP = "000000";
const LONG_DESCRIPTION =
  "Получил требование из налоговой инспекции о предоставлении документов по декларации 3-НДФЛ за прошлый год. Срок ответа — 10 рабочих дней.";

/**
 * Anonymous request creation flow:
 * fill form → submit → InlineOtpFlow appears → authenticate → success
 */
test.describe("Request creation (anonymous user)", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure unauthenticated state
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("fill form, submit, inline OTP appears, authenticate, success", async ({ page }) => {
    await page.goto("/requests/new");
    await page.waitForLoadState("networkidle");
    // Wait for the form to fully load (cities/services fetched)
    await page.waitForTimeout(2_000);

    // --- Fill Title ---
    const titleInput = page.getByPlaceholder("Кратко опишите суть проблемы");
    await expect(titleInput).toBeVisible({ timeout: 10_000 });
    await titleInput.fill("Требование налоговой о документах");

    // --- Fill City/FNS via typeahead ---
    const typeaheadInput = page.getByPlaceholder("Введите город или ИФНС, например: Москва или №46");
    await expect(typeaheadInput).toBeVisible({ timeout: 5_000 });
    await typeaheadInput.fill("Москва");
    // Wait for dropdown results
    await page.waitForTimeout(1_200);

    // Pick the first city result.
    // The dropdown button for "Москва" can be intercepted by a sibling label div,
    // so we scroll it into view and dispatch a click event directly.
    await page.waitForTimeout(1_200);
    const moscowBtn = page.locator('[aria-label="Москва"]').first();
    await moscowBtn.scrollIntoViewIfNeeded();
    await moscowBtn.dispatchEvent("click");
    await page.waitForTimeout(1_200);

    // After city selection, FNS chips for that city appear — pick the first one
    const fnsButtons = page.locator('[aria-label*="№"], [aria-label*="ИФНС"]');
    const fnsCount = await fnsButtons.count();
    if (fnsCount > 0) {
      await fnsButtons.first().scrollIntoViewIfNeeded();
      await fnsButtons.first().dispatchEvent("click");
      await page.waitForTimeout(500);
    }

    // --- Fill Description ---
    const descInput = page.getByPlaceholder(/Подробно опишите ситуацию/);
    await expect(descInput).toBeVisible({ timeout: 5_000 });
    await descInput.fill(LONG_DESCRIPTION);

    // --- Submit ---
    const submitBtn = page.getByRole("button", { name: /Отправить запрос/i });
    await submitBtn.click();

    // InlineOtpFlow should appear (or error if form still invalid)
    const otpBlock = page.getByTestId("inline-otp-block");
    await expect(otpBlock).toBeVisible({ timeout: 15_000 });

    // --- Enter email in OTP block ---
    const emailInput = otpBlock.getByLabel("Email адрес");
    await emailInput.fill(TEST_EMAIL);
    await page.getByTestId("inline-otp-request").click();

    // Wait for code stage
    const codeInput = page.getByLabel("6-значный код");
    await expect(codeInput).toBeVisible({ timeout: 10_000 });

    // --- Enter dev OTP ---
    await codeInput.fill(DEV_OTP);
    const verifyBtn = page.getByRole("button", { name: /Подтвердить/i });
    await verifyBtn.click();

    // After OTP verify:
    // - Existing users with a role → redirected to the request detail page directly
    // - New users (role=null) → redirected to /otp for role selection, then to request detail
    // Both outcomes mean authentication succeeded.
    await page.waitForTimeout(3_000);
    const finalUrl = page.url();
    const authSuccess =
      finalUrl.includes("/requests/") ||
      finalUrl.includes("/my-requests") ||
      finalUrl.includes("/dashboard") ||
      finalUrl.includes("/(tabs)") ||
      // New user role picker
      (finalUrl.includes("/otp") && finalUrl.includes("returnTo"));

    if (finalUrl.includes("/otp") && finalUrl.includes("returnTo")) {
      // Handle role picker for new users
      const rolePickerVisible = await page.locator("text=/Кто вы/i").isVisible({ timeout: 5_000 });
      if (rolePickerVisible) {
        await page.getByRole("button", { name: /Мне нужна помощь/i }).click();
        await page.waitForTimeout(3_000);
      }
    }

    expect(authSuccess).toBe(true);
  });

  test("form validation: submit without required fields shows errors", async ({ page }) => {
    await page.goto("/requests/new");
    await page.waitForLoadState("networkidle");

    // Click submit without filling anything
    const submitBtn = page.getByRole("button", { name: /Отправить запрос/i });
    await submitBtn.click();

    // OTP block must NOT appear — form is invalid
    const otpBlock = page.getByTestId("inline-otp-block");
    await expect(otpBlock).not.toBeVisible();

    // Title validation error must appear
    const titleError = page.locator("text=/Минимум 3 символа/");
    await expect(titleError).toBeVisible({ timeout: 5_000 });
  });
});
