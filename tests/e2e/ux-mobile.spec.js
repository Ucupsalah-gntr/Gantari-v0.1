import { test, expect } from "@playwright/test";

const viewports = [
  { name: "mobile-small", width: 320, height: 800 },
  { name: "mobile-standard", width: 375, height: 812 },
  { name: "mobile-large", width: 430, height: 932 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

async function assertLoginShell(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#app")).toBeVisible();
  await expect(page.locator('#loginEmail').first()).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
}

test.describe("Gantariku responsive UX", () => {
  for (const viewport of viewports) {
    test(`${viewport.name} login shell tidak memiliki horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await assertLoginShell(page);

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

  test("login tetap usable pada mobile kecil", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await assertLoginShell(page);

    const email = page.locator('#loginEmail').first();
    const password = page.locator('input[type="password"]').first();
    const submit = page.locator('button[type="submit"]').first();

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

  test("password toggle tetap tersedia pada mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await assertLoginShell(page);

    const showButton = page.locator('button[aria-label="Tampilkan password"]').first();
    await expect(showButton).toBeVisible();

    await showButton.click();
    await expect(page.locator('button[aria-label="Sembunyikan password"]').first()).toBeVisible();

    await page.locator('button[aria-label="Sembunyikan password"]').first().click();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});
