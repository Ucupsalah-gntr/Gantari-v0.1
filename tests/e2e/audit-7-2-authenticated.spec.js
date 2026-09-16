import { test, expect } from "@playwright/test";

const ENV = {
  adminEmail: process.env.GTR_TEST_ADMIN_EMAIL,
  adminPassword: process.env.GTR_TEST_ADMIN_PASSWORD,
  guruEmail: process.env.GTR_TEST_GURU_EMAIL,
  guruPassword: process.env.GTR_TEST_GURU_PASSWORD,
  ortuAEmail: process.env.GTR_TEST_ORTU_A_EMAIL,
  ortuAPassword: process.env.GTR_TEST_ORTU_A_PASSWORD,
  ortuBEmail: process.env.GTR_TEST_ORTU_B_EMAIL,
  ortuBPassword: process.env.GTR_TEST_ORTU_B_PASSWORD,
  childAId: process.env.GTR_TEST_ORTU_A_CHILD_ID,
  childBId: process.env.GTR_TEST_ORTU_B_CHILD_ID,
};

const AUTH_READY = Object.values(ENV).every(Boolean);

test.describe("Audit 7.2 — authenticated E2E", () => {
  test.skip(!AUTH_READY, "Test account secrets belum dikonfigurasi di GitHub Actions.");

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
    await page.locator("#nav .nav-item", { hasText: label }).click();
    await expect(page.locator("#pageTitle")).toHaveText(expectedTitle);
    await expect(page.locator("#view")).toBeVisible();
  }

  test("Admin login → seluruh halaman admin → logout", async ({ page }) => {
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
      await visitNav(page, label);
    }

    await logout(page);
  });

  test("Guru login → seluruh halaman guru → logout", async ({ page }) => {
    await login(page, ENV.guruEmail, ENV.guruPassword);

    for (const label of [
      "Input Absensi",
      "Kehadiran Saya",
      "Riwayat Absensi",
      "Perkembangan Anak",
    ]) {
      await visitNav(page, label);
    }

    await logout(page);
  });

  test("Orang tua A hanya melihat anak A dan ditolak saat membaca anak B", async ({ page }) => {
    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);

    await visitNav(page, "Ringkasan Anak");
    await expect(page.locator("#view")).toContainText(/Anak|Siswa/i);

    await visitNav(page, "Kehadiran Anak");
    await visitNav(page, "Status SPP");
    await visitNav(page, "Perkembangan Anak");

    const crossAccess = await page.evaluate(async (childBId) => {
      if (!window.supabase) return { error: "Supabase client tidak tersedia" };
      const { data, error } = await window.supabase
        .from("siswa")
        .select("id")
        .eq("id", childBId)
        .maybeSingle();
      return {
        rows: data ? 1 : 0,
        errorCode: error?.code || null,
        errorMessage: error?.message || null,
      };
    }, ENV.childBId);

    expect(crossAccess.rows).toBe(0);
    await logout(page);
  });

  test("Orang tua B hanya melihat anak B dan ditolak saat membaca anak A", async ({ page }) => {
    await login(page, ENV.ortuBEmail, ENV.ortuBPassword);

    await visitNav(page, "Ringkasan Anak");
    await visitNav(page, "Kehadiran Anak");
    await visitNav(page, "Status SPP");
    await visitNav(page, "Perkembangan Anak");

    const crossAccess = await page.evaluate(async (childAId) => {
      if (!window.supabase) return { error: "Supabase client tidak tersedia" };
      const { data, error } = await window.supabase
        .from("siswa")
        .select("id")
        .eq("id", childAId)
        .maybeSingle();
      return {
        rows: data ? 1 : 0,
        errorCode: error?.code || null,
        errorMessage: error?.message || null,
      };
    }, ENV.childAId);

    expect(crossAccess.rows).toBe(0);
    await logout(page);
  });

  test("Logout benar-benar menutup sesi browser", async ({ page }) => {
    await login(page, ENV.adminEmail, ENV.adminPassword);
    await logout(page);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#loginForm")).toBeVisible();
    await expect(page.locator("#nav")).toHaveCount(0);
  });
});
