import { test, expect } from "@playwright/test";

/**
 * Specialist catalog → profile → "Написать" button → /requests/new?specialistId=...
 * Tests that the write CTA on a specialist profile:
 *  - navigates to /requests/new with the specialistId query param
 *  - shows a banner "Запрос для: <name>" once the specialist is fetched
 */
test.describe("Specialist profile: write request flow", () => {
  test("click Написать on specialist card, land on /requests/new?specialistId", async ({ page }) => {
    await page.goto("/specialists");
    await page.waitForLoadState("networkidle");

    // Wait for at least one specialist card to render
    // Specialist cards are Pressable elements linking to /specialists/<id>
    const specialistLinks = page.getByRole("link").filter({ hasText: /^.{2,50}$/ });
    // Alternatively locate by href pattern
    const specialistCardLinks = page.locator('a[href*="/specialists/"]');
    const count = await specialistCardLinks.count();

    if (count === 0) {
      // If no specialists exist in this environment, skip gracefully
      test.skip(true, "No specialists found in catalog — seed the DB first");
      return;
    }

    // Click the first specialist card
    const firstCard = specialistCardLinks.first();
    const href = await firstCard.getAttribute("href");
    await firstCard.click();

    // Should be on the specialist detail page
    await expect(page).toHaveURL(/\/specialists\//, { timeout: 10_000 });

    // Click the "Написать" button (desktop sidebar CTA or mobile bottom bar)
    const writeBtn = page
      .getByRole("button", { name: /Написать/i })
      .first();
    await expect(writeBtn).toBeVisible({ timeout: 10_000 });
    await writeBtn.click();

    // Should navigate to /requests/new?specialistId=<id>
    await expect(page).toHaveURL(/\/requests\/new\?specialistId=/, { timeout: 10_000 });

    // Verify the URL contains a specialistId
    const url = new URL(page.url());
    const specialistId = url.searchParams.get("specialistId");
    expect(specialistId).toBeTruthy();
  });

  test("specialist targeting banner is visible on /requests/new?specialistId=<id>", async ({ page }) => {
    // First get a real specialist ID from the API
    const listRes = await page.request.get("http://localhost:3812/api/specialists?page=1&limit=1");
    if (!listRes.ok()) {
      test.skip(true, "Cannot fetch specialists from API");
      return;
    }
    const listData = await listRes.json() as { items?: { id: string; firstName?: string; lastName?: string }[] };
    const items = listData.items ?? [];
    if (items.length === 0) {
      test.skip(true, "No specialists in DB — seed the DB first");
      return;
    }

    const { id: specialistId, firstName, lastName } = items[0];
    const name = [firstName, lastName].filter(Boolean).join(" ");

    await page.goto(`/requests/new?specialistId=${specialistId}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_500); // let specialist fetch complete

    // Banner should show "Запрос для: <name>" or "Адресован специалисту"
    const banner = page.locator("text=/Запрос для:|Адресован специалисту/i");
    await expect(banner).toBeVisible({ timeout: 10_000 });

    if (name) {
      // More specific check when we know the name
      const nameBanner = page.locator(`text=/Запрос для:.*${firstName}/i`);
      await expect(nameBanner).toBeVisible({ timeout: 5_000 });
    }
  });
});
