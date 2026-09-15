import { test, expect } from "@playwright/test";

const viewports = [
  { name: "mobile-small", width: 320, height: 800 },
  { name: "mobile-standard", width: 375, height: 812 },
  { name: "mobile-large", width: 430, height: 932 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

test.describe("Gantariku responsive UX", () => {
  for (const viewport of viewports) {
    test(`${viewport.name} tidak memiliki horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      await expect(page.locator("#app")).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        bodyWidth: document.body.scrollWidth,
      }));

      expect(
        dimensions.documentWidth,
        `${viewport.name}: document melebar ${dimensions.documentWidth}px untuk viewport ${dimensions.viewportWidth}px`
      ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);

      expect(
        dimensions.bodyWidth,
        `${viewport.name}: body melebar ${dimensions.bodyWidth}px untuk viewport ${dimensions.viewportWidth}px`
      ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
    });
  }

  test("mobile memiliki tombol menu dan dapat membuka sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const menuButton = page.locator("#mobileMenuBtn");
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute("aria-label", "Buka menu");

    const sidebar = page.locator("#sidebar");
    await menuButton.click();
    await expect(sidebar).toHaveClass(/mobile-open/);

    await menuButton.click();
    await expect(sidebar).not.toHaveClass(/mobile-open/);
  });

  test("login tetap nyaman digunakan pada mobile kecil", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const email = page.locator('input[type="email"]').first();
    const password = page.locator('input[type="password"]').first();
    const submit = page.locator('button[type="submit"]').first();

    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await expect(submit).toBeVisible();

    const emailBox = await email.boundingBox();
    const passwordBox = await password.boundingBox();
    const submitBox = await submit.boundingBox();

    for (const [label, box] of [
      ["email", emailBox],
      ["password", passwordBox],
      ["submit", submitBox],
    ]) {
      expect(box, `${label} tidak memiliki bounding box`).not.toBeNull();
      expect(box.x, `${label} keluar sisi kiri`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${label} keluar sisi kanan`).toBeLessThanOrEqual(320);
    }
  });
});
