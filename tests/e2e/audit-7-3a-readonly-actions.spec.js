import { test, expect } from "@playwright/test";

const ENV = {
  adminEmail: process.env.GTR_TEST_ADMIN_EMAIL,
  adminPassword: process.env.GTR_TEST_ADMIN_PASSWORD,
  guruEmail: process.env.GTR_TEST_GURU_EMAIL,
  guruPassword: process.env.GTR_TEST_GURU_PASSWORD,
  ortuAEmail: process.env.GTR_TEST_ORTU_A_EMAIL,
  ortuAPassword: process.env.GTR_TEST_ORTU_A_PASSWORD,
};

const AUTH_READY = Object.values(ENV).every(Boolean);

async function login(page, email, password) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("#loginEmail").fill(email);
  await page.locator("#loginPassword").fill(password);
  await page.locator("#loginButton").click();
  await expect(page.locator("#nav")).toBeVisible();
  await expect(page.locator(".user-name")).toBeVisible();
  await expect(page.locator(".user-role")).toBeVisible();
}

async function logout(page) {
  await page.locator(".logout-btn").click();
  await expect(page.locator("#loginForm")).toBeVisible();
}

async function visitNav(page, label, expectedTitle = label) {
  const button = page.locator("#nav .nav-item", { hasText: label });
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator("#pageTitle")).toHaveText(expectedTitle);
  await expect(page.locator("#view")).toBeVisible();
}

async function assertNoCriticalRuntimeErrors(page, action) {
  const runtimeErrors = [];
  const onPageError = (error) => runtimeErrors.push(error.message);
  page.on("pageerror", onPageError);
  try {
    await action();
    expect(runtimeErrors, `Runtime error: ${runtimeErrors.join(" | ")}`).toEqual([]);
  } finally {
    page.off("pageerror", onPageError);
  }
}

test.describe("Audit 7.3A — authenticated read-only actions", () => {
  test.skip(!AUTH_READY, "Test account secrets belum dikonfigurasi di GitHub Actions.");

  test("Admin dapat membuka seluruh halaman tanpa operasi write", async ({ page }) => {
    const writes = [];
    page.on("request", (request) => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) {
        writes.push(`${request.method()} ${request.url()}`);
      }
    });

    await login(page, ENV.adminEmail, ENV.adminPassword);

    for (const label of [
      "Dasbor",
      "Data Siswa",
      "Monitoring SPP",
      "Guru & Pelatih",
      "Absensi Guru",
      "Rekap Absensi",
      "Perkembangan Anak",
    ]) {
      await assertNoCriticalRuntimeErrors(page, () => visitNav(page, label));
    }

    expect(writes, `Ditemukan request write tidak diharapkan: ${writes.join(" | ")}`).toEqual([]);
    await logout(page);
  });

  test("Guru dapat membuka seluruh halaman tanpa operasi write", async ({ page }) => {
    const writes = [];
    page.on("request", (request) => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) {
        writes.push(`${request.method()} ${request.url()}`);
      }
    });

    await login(page, ENV.guruEmail, ENV.guruPassword);

    for (const label of [
      "Input Absensi",
      "Kehadiran Saya",
      "Riwayat Absensi",
      "Perkembangan Anak",
    ]) {
      await assertNoCriticalRuntimeErrors(page, () => visitNav(page, label));
    }

    expect(writes, `Ditemukan request write tidak diharapkan: ${writes.join(" | ")}`).toEqual([]);
    await logout(page);
  });

  test("Orang tua dapat membuka seluruh halaman anak tanpa operasi write", async ({ page }) => {
    const writes = [];
    page.on("request", (request) => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) {
        writes.push(`${request.method()} ${request.url()}`);
      }
    });

    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);

    for (const label of [
      "Ringkasan Anak",
      "Kehadiran Anak",
      "Status SPP",
      "Perkembangan Anak",
    ]) {
      await assertNoCriticalRuntimeErrors(page, () => visitNav(page, label));
    }

    expect(writes, `Ditemukan request write tidak diharapkan: ${writes.join(" | ")}`).toEqual([]);
    await logout(page);
  });
});
