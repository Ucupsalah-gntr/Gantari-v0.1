import { test, expect } from "@playwright/test";

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
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
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
