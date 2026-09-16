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
const KNOWN_SPP_ID = "45893537-b749-4a71-9962-5afc25942b91";

async function login(page, email, password) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("#loginEmail").fill(email);
  await page.locator("#loginPassword").fill(password);
  await page.locator("#loginButton").click();
  await expect(page.locator("#nav")).toBeVisible();
}

async function logout(page) {
  await page.locator(".logout-btn").click();
  await expect(page.locator("#loginForm")).toBeVisible();
}

async function navLabels(page) {
  return page.locator("#nav .nav-item").allTextContents();
}

async function readById(page, table, id, select) {
  return page.evaluate(async ({ table, id, select }) => {
    if (!window.supabase) throw new Error("Supabase client tidak tersedia");
    const { data, error } = await window.supabase
      .from(table)
      .select(select)
      .eq("id", id)
      .maybeSingle();
    return {
      data: data || null,
      error: error ? { code: error.code || null, message: error.message || null } : null,
    };
  }, { table, id, select });
}

test.describe("Audit 7.3B — negative authorization", () => {
  test.skip(!AUTH_READY, "Test account secrets belum dikonfigurasi di GitHub Actions.");

  test("Guru tidak mendapat menu Admin/Ortu dan tidak dapat membaca record SPP", async ({ page }) => {
    await login(page, ENV.guruEmail, ENV.guruPassword);

    const labels = await navLabels(page);
    for (const forbidden of [
      "Dasbor",
      "Data Siswa",
      "Monitoring SPP",
      "Guru & Pelatih",
      "Absensi Guru",
      "Rekap Absensi",
      "Ringkasan Anak",
      "Kehadiran Anak",
      "Status SPP",
    ]) {
      expect(labels).not.toContain(forbidden);
    }

    const sppAccess = await readById(page, "spp", KNOWN_SPP_ID, "id,siswa_id,status");
    expect(sppAccess.error).toBeNull();
    expect(sppAccess.data).toBeNull();

    await logout(page);
  });

  test("Orang tua A hanya dapat membaca anak A, bukan anak B", async ({ page }) => {
    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);

    const labels = await navLabels(page);
    for (const forbidden of [
      "Dasbor",
      "Data Siswa",
      "Monitoring SPP",
      "Guru & Pelatih",
      "Absensi Guru",
      "Rekap Absensi",
      "Input Absensi",
      "Kehadiran Saya",
      "Riwayat Absensi",
    ]) {
      expect(labels).not.toContain(forbidden);
    }

    const ownAccess = await readById(page, "siswa", ENV.childAId, "id,nama,orang_tua_id");
    expect(ownAccess.error).toBeNull();
    expect(ownAccess.data?.id).toBe(ENV.childAId);

    const crossAccess = await readById(page, "siswa", ENV.childBId, "id,nama,orang_tua_id");
    expect(crossAccess.error).toBeNull();
    expect(crossAccess.data).toBeNull();

    await logout(page);
  });

  test("Orang tua B hanya dapat membaca anak B, bukan anak A", async ({ page }) => {
    await login(page, ENV.ortuBEmail, ENV.ortuBPassword);

    const labels = await navLabels(page);
    for (const forbidden of [
      "Dasbor",
      "Data Siswa",
      "Monitoring SPP",
      "Guru & Pelatih",
      "Absensi Guru",
      "Rekap Absensi",
      "Input Absensi",
      "Kehadiran Saya",
      "Riwayat Absensi",
    ]) {
      expect(labels).not.toContain(forbidden);
    }

    const ownAccess = await readById(page, "siswa", ENV.childBId, "id,nama,orang_tua_id");
    expect(ownAccess.error).toBeNull();
    expect(ownAccess.data?.id).toBe(ENV.childBId);

    const crossAccess = await readById(page, "siswa", ENV.childAId, "id,nama,orang_tua_id");
    expect(crossAccess.error).toBeNull();
    expect(crossAccess.data).toBeNull();

    await logout(page);
  });

  test("Sesudah logout, UI terlindungi kembali ke login", async ({ page }) => {
    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);
    await logout(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#loginForm")).toBeVisible();
    await expect(page.locator("#nav")).toHaveCount(0);
  });
});
