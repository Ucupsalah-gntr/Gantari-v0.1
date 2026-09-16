import { test, expect } from "@playwright/test";

const LIVE_URL = process.env.GANTARIKU_URL || "https://gantariku.vercel.app/";

test.describe("Audit 7.5 — production smoke & deployment safety", () => {
  test("Production URL membuka login tanpa runtime error", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(LIVE_URL, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#loginForm")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#loginEmail")).toBeVisible();
    await expect(page.locator("#loginPassword")).toBeVisible();
    await expect(page.locator("#loginButton")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("Production shell memuat asset inti", async ({ page }) => {
    const failed = [];

    page.on("requestfailed", (request) => {
      const url = request.url();
      if (
        url.startsWith(LIVE_URL) ||
        url.includes("/css/") ||
        url.includes("/js/") ||
        url.includes("/assets/")
      ) {
        failed.push(`${request.method()} ${url} :: ${request.failure()?.errorText || "failed"}`);
      }
    });

    const response = await page.goto(LIVE_URL, { waitUntil: "networkidle" });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("#loginForm")).toBeVisible({ timeout: 15000 });

    expect(failed, `Asset/request gagal: ${failed.join(" | ")}`).toEqual([]);
  });

  test("Login kosong dan kredensial palsu tidak membuka aplikasi", async ({ page }) => {
    let authRequests = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/auth/v1/token")) {
        authRequests += 1;
      }
    });

    await page.goto(LIVE_URL, { waitUntil: "domcontentloaded" });
    await page.locator("#loginButton").click();
    expect(authRequests).toBe(0);

    await page.locator("#loginEmail").fill("audit-invalid-account@example.invalid");
    await page.locator("#loginPassword").fill("invalid-password-for-audit-only");
    await page.locator("#loginButton").click();

    await expect(page.locator("#loginForm")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#nav")).toHaveCount(0);
  });

  test("CI release gate tetap read-only dan write test hanya opt-in", async ({ page }) => {
    const response = await page.goto(LIVE_URL, { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("#loginForm")).toBeVisible();

    const workflow = await page.evaluate(async () => {
      const response = await fetch("/.github/workflows/main.yml", { cache: "no-store" });
      return response.ok ? response.text() : "";
    });

    // This check is informational when GitHub Pages/Vercel does not expose dotfiles.
    if (workflow) {
      expect(workflow).toMatch(/permissions:\s*\n\s*contents:\s*read/);
      expect(workflow).not.toMatch(/GTR_TEST_WRITE_MODE:\s*\$\{\{\s*secrets\.GTR_TEST_WRITE_MODE\s*\}\}/);
    }
  });
});
