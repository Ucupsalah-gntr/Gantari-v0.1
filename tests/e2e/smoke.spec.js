import { test, expect } from "@playwright/test";

async function assertLoginShell(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveTitle(/Gantariku/i);
  await expect(page.locator("#app")).toBeVisible();

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
}

test.describe("Gantariku browser smoke", () => {
  test("halaman utama dapat dibuka dan bootstrap aplikasi berjalan", async ({ page }) => {
    const runtimeErrors = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveTitle(/Gantariku/i);
    await expect(page.locator("#app")).toBeVisible();
    await expect(page.locator("body")).toContainText(/Gantariku/i);

    expect(runtimeErrors, `Runtime error: ${runtimeErrors.join(" | ")}`).toEqual([]);
  });

  test("halaman login tampil untuk pengguna yang belum masuk", async ({ page }) => {
    await assertLoginShell(page);
  });

  test("kontrol password dapat ditampilkan dan disembunyikan kembali", async ({ page }) => {
    await assertLoginShell(page);

    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button[aria-label="Tampilkan password"]').first();

    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    await expect(page.locator('input[type="text"]')).toHaveCount(1);
    await expect(page.locator('button[aria-label="Sembunyikan password"]').first()).toBeVisible();

    await page.locator('button[aria-label="Sembunyikan password"]').first().click();
    await expect(passwordInput).toBeVisible();
  });

  test("login shell aman dipakai pada viewport mobile tanpa horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await assertLoginShell(page);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });

  test("login shell tetap usable pada viewport desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await assertLoginShell(page);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });

  test("tidak ada error resource kritis saat halaman dimuat", async ({ page }) => {
    const failedResources = [];

    page.on("response", (response) => {
      if (response.status() >= 500) {
        failedResources.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });

    expect(failedResources).toEqual([]);
  });
});
