import { test, expect } from "@playwright/test";
import { loginViaApi, uniqueTestEmail } from "./helpers/auth";

// Use a unique email per test run to avoid OTP collisions when desktop+mobile
// projects run in parallel. A fresh user with role=null can still access /profile.
const TEST_EMAIL = uniqueTestEmail();

/**
 * Profile / Settings persistence tests.
 *
 * The settings form uses autosave-on-blur (no explicit Save button).
 * These tests verify:
 *  1. Auth via localStorage token injection navigates to an authenticated screen
 *  2. The /profile page renders the name input when authenticated
 *  3. Editing a name and blurring the field triggers autosave, then persists on reload
 *  4. The autosave indicator ("Сохраняем…" → "Сохранено") is visible
 */
test.describe("Profile settings persistence", () => {
  test("auth via localStorage injection: /profile renders name field", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await loginViaApi(page, TEST_EMAIL);

    // Navigate to dashboard first (triggers AuthContext to resolve with stored token)
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_500);

    // Then navigate to /profile
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_500);

    // Should be on /profile (auth gate passed)
    expect(page.url()).toContain("/profile");

    // Name input must be visible
    const nameField = page.getByLabel("Имя").first();
    await expect(nameField).toBeVisible({ timeout: 10_000 });
  });

  test("autosave on blur: Сохраняем → Сохранено indicator", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await loginViaApi(page, TEST_EMAIL);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_000);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_500);

    const nameField = page.getByLabel("Имя").first();
    await expect(nameField).toBeVisible({ timeout: 10_000 });

    // Generate a unique name to detect persistence
    const uniqueName = `E2E${Date.now().toString().slice(-4)}`;

    // Clear and fill name
    await nameField.click();
    await page.keyboard.press("Control+A");
    await nameField.fill(uniqueName);

    // Blur the field to trigger autosave
    await nameField.blur();

    // Autosave indicator should show "Сохраняем…" then "Сохранено"
    // Allow either state (save may be fast enough to miss "Сохраняем…")
    const savedIndicator = page.locator("text=/Сохранено/i");
    await expect(savedIndicator).toBeVisible({ timeout: 10_000 });

    // Reload and verify persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_500);

    const reloadedField = page.getByLabel("Имя").first();
    await expect(reloadedField).toBeVisible({ timeout: 10_000 });
    const reloadedValue = await reloadedField.inputValue();
    expect(reloadedValue).toBe(uniqueName);
  });

  test("edit name, value persists after reload (autosave)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await loginViaApi(page, TEST_EMAIL);

    // Reach the profile page
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_000);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_500);

    const nameField = page.getByLabel("Имя").first();
    await expect(nameField).toBeVisible({ timeout: 10_000 });

    // Generate a unique name to detect persistence
    const uniqueName = `E2E${Date.now().toString().slice(-4)}`;

    // Clear and fill name
    await nameField.click();
    await page.keyboard.press("Control+A");
    await nameField.fill(uniqueName);

    // Blur to trigger autosave (autosave fires on input blur)
    await nameField.blur();

    // Wait for "Сохранено" indicator to confirm save completed
    const savedIndicator = page.locator("text=/Сохранено/i");
    await expect(savedIndicator).toBeVisible({ timeout: 10_000 });

    // Reload and verify persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_500);

    const reloadedField = page.getByLabel("Имя").first();
    await expect(reloadedField).toBeVisible({ timeout: 10_000 });
    const reloadedValue = await reloadedField.inputValue();
    expect(reloadedValue).toBe(uniqueName);
  });
});
