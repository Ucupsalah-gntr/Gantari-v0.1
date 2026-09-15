import { test, expect } from "@playwright/test";

const INVALID_EMAIL = "level8.invalid@gantariku.invalid";
const INVALID_PASSWORD = "InvalidPassword-Level8!";

test.describe("Gantariku authentication flow", () => {
  test("login menolak kredensial yang tidak valid tanpa crash", async ({ page }) => {
    const runtimeErrors = [];

    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await page.goto("/", { waitUntil: "domcontentloaded" });

    const email = page.locator('input[type="email"]').first();
    const password = page.locator('input[type="password"]').first();

    await expect(email).toBeVisible();
    await expect(password).toBeVisible();

    await email.fill(INVALID_EMAIL);
    await password.fill(INVALID_PASSWORD);

    const submit = page.locator('button[type="submit"]').first();
    await expect(submit).toBeVisible();
    await submit.click();

    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test("toggle password mengubah visibility tanpa reload halaman", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const password = page.locator('input[type="password"]').first();
    await expect(password).toBeVisible();

    const passwordId = await password.getAttribute("id");
    expect(passwordId).toBeTruthy();

    const toggle = page.locator(`button[aria-label="Tampilkan password"]`).first();
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.locator(`input#${passwordId}`)).toHaveAttribute("type", "text");
    await expect(page.locator('button[aria-label="Sembunyikan password"]').first()).toBeVisible();

    await page.locator('button[aria-label="Sembunyikan password"]').first().click();
    await expect(page.locator(`input#${passwordId}`)).toHaveAttribute("type", "password");
  });
});
