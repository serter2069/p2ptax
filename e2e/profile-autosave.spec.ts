import { test, expect } from "@playwright/test";
import { loginViaApi } from "./helpers/auth";

// Use a user that has role=USER (went through role picker previously)
const TEST_EMAIL = "serter20692+test1@gmail.com";

/**
 * Profile / Settings persistence tests.
 *
 * The settings form uses a manual Save button (not autosave-on-blur).
 * These tests verify:
 *  1. Auth via localStorage token injection navigates to an authenticated screen
 *  2. The /profile page renders the name input when authenticated
 *  3. Saving a new name persists it across a page reload
 *
 * The autosave-on-blur test is .skip'd — that feature is not yet implemented.
 */
test.describe("Profile settings persistence", () => {
  // TODO: implement autosave-on-blur in ProfileTab, then enable this test
  test.skip("autosave on blur: Сохраняем → Сохранено indicator", async () => {
    // Steps when autosave is added:
    // 1. Edit "Имя" field
    // 2. Click elsewhere (blur the input)
    // 3. Expect "Сохраняем…" indicator, then "Сохранено"
    // 4. Reload and verify value persists without manual Save button click
  });

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

  test("edit name, save via button, value persists after reload", async ({ page }) => {
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

    // Find and click Save button
    const saveBtn = page.getByRole("button", { name: /Сохранить/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });
    await saveBtn.click();
    await page.waitForTimeout(2_000);

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
