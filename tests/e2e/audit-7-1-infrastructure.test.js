import { test, expect } from "@playwright/test";

test.describe("Audit 7.1 — E2E infrastructure", () => {
  test("uses a configurable target URL and serves the application", async ({ page }) => {
    await page.goto("./", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveTitle(/Gantariku/i);
    await expect(page.locator("body")).toBeVisible();
  });
});
