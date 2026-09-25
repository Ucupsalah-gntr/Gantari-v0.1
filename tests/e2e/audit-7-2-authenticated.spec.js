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

  async function readStudentById(page, studentId) {
    return page.evaluate(async (id) => {
      if (!window.supabase) return { data: null, error: "Supabase client tidak tersedia" };
      const { data, error } = await window.supabase
        .from("siswa")
        .select("id,nama,orang_tua_id")
        .eq("id", id)
        .maybeSingle();
      return {
        data: data || null,
        error: error ? { code: error.code || null, message: error.message || null } : null,
      };
    }, studentId);
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
    await visitNav(page, "Kehadiran Anak");
    await visitNav(page, "Status SPP");
    await visitNav(page, "Perkembangan Anak");

    const ownAccess = await readStudentById(page, ENV.childAId);
    expect(ownAccess.error).toBeNull();
    expect(ownAccess.data?.id).toBe(ENV.childAId);

    const crossAccess = await readStudentById(page, ENV.childBId);
    expect(crossAccess.error).toBeNull();
    expect(crossAccess.data).toBeNull();

    await logout(page);
  });

  test("Orang tua B hanya melihat anak B dan ditolak saat membaca anak A", async ({ page }) => {
    await login(page, ENV.ortuBEmail, ENV.ortuBPassword);

    await visitNav(page, "Ringkasan Anak");
    await visitNav(page, "Kehadiran Anak");
    await visitNav(page, "Status SPP");
    await visitNav(page, "Perkembangan Anak");

    const ownAccess = await readStudentById(page, ENV.childBId);
    expect(ownAccess.error).toBeNull();
    expect(ownAccess.data?.id).toBe(ENV.childBId);

    const crossAccess = await readStudentById(page, ENV.childAId);
    expect(crossAccess.error).toBeNull();
    expect(crossAccess.data).toBeNull();

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
