import { test, expect } from "@playwright/test";

test.describe("Audit 7.4 — resilience & invalid input", () => {
  test("Aplikasi terbuka normal tanpa JavaScript runtime error", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("#loginForm")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("Form login tidak mengirim kredensial kosong", async ({ page }) => {
    let authRequests = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/auth/v1/token")) {
        authRequests += 1;
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("#loginButton").click();

    await expect(page.locator("#loginForm")).toBeVisible();
    expect(authRequests).toBe(0);
  });

  test("Login dengan kredensial fiktif tetap berada di halaman login", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("#loginEmail").fill("audit-invalid-account@example.invalid");
    await page.locator("#loginPassword").fill("invalid-password-for-audit-only");
    await page.locator("#loginButton").click();

    await expect(page.locator("#loginForm")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#nav")).toHaveCount(0);
  });

  test("Navigasi UI tetap membutuhkan session yang valid", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.evaluate(() => {
      window.__app?.goTo?.("spp");
      window.__app?.goTo?.("siswa");
      window.__app?.goTo?.("dasbor");
    });

    await expect(page.locator("#loginForm")).toBeVisible();
    await expect(page.locator("#nav")).toHaveCount(0);
  });
});
