import { test, expect } from "@playwright/test";

const ENV = {
  guruEmail: process.env.GTR_TEST_GURU_EMAIL,
  guruPassword: process.env.GTR_TEST_GURU_PASSWORD,
  ortuAEmail: process.env.GTR_TEST_ORTU_A_EMAIL,
  ortuAPassword: process.env.GTR_TEST_ORTU_A_PASSWORD,
  ortuAChildId: process.env.GTR_TEST_ORTU_A_CHILD_ID,
};

const AUTH_READY = Object.values(ENV).every(Boolean);
const WRITE_MODE = process.env.GTR_TEST_WRITE_MODE === "1";

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

async function readOwnStudent(page, studentId) {
  return page.evaluate(async (id) => {
    const { data, error } = await window.supabase
      .from("siswa")
      .select("id,nama,orang_tua_id")
      .eq("id", id)
      .maybeSingle();
    return { data: data || null, error: error?.code || null };
  }, studentId);
}

// This suite is deliberately opt-in. Normal CI never performs production writes.
// Set GTR_TEST_WRITE_MODE=1 only in a dedicated safe/test environment.
test.describe("Audit 7.3C — write authorization", () => {
  test.skip(
    !AUTH_READY || !WRITE_MODE,
    "Memerlukan akun test dan GTR_TEST_WRITE_MODE=1."
  );

  test("Orang tua tidak memiliki write access ke data siswa", async ({ page }) => {
    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);

    const before = await readOwnStudent(page, ENV.ortuAChildId);
    expect(before.error).toBeNull();
    expect(before.data?.id).toBe(ENV.ortuAChildId);

    const result = await page.evaluate(async (id) => {
      const current = await window.supabase
        .from("siswa")
        .select("nama")
        .eq("id", id)
        .maybeSingle();
      if (current.error) throw new Error(current.error.message);

      const { data, error } = await window.supabase
        .from("siswa")
        .update({ nama: current.data?.nama })
        .eq("id", id)
        .select("id");

      return {
        count: data?.length || 0,
        code: error?.code || null,
      };
    }, ENV.ortuAChildId);

    expect(result.count).toBe(0);
    expect(result.code).toBe("42501");
    await logout(page);
  });

  test("Guru tidak memiliki write access ke tabel SPP", async ({ page }) => {
    await login(page, ENV.guruEmail, ENV.guruPassword);

    const result = await page.evaluate(async () => {
      const fakeStudentId = "00000000-0000-0000-0000-000000000000";
      const { data, error } = await window.supabase
        .from("spp")
        .insert({
          siswa_id: fakeStudentId,
          bulan: 1,
          tahun: 2099,
          nominal: 1,
          status: "Belum Bayar",
        })
        .select("id");
      return {
        count: data?.length || 0,
        code: error?.code || null,
      };
    });

    expect(result.count).toBe(0);
    expect(result.code).toBe("42501");
    await logout(page);
  });

  test("Orang tua tidak memiliki write access ke perkembangan", async ({ page }) => {
    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);

    const result = await page.evaluate(async (studentId) => {
      const { data, error } = await window.supabase
        .from("perkembangan")
        .insert({
          siswa_id: studentId,
          guru_id: null,
          tanggal: "2099-01-01",
          aspek: "AUDIT",
          nilai: 1,
          catatan: "AUDIT",
        })
        .select("id");
      return {
        count: data?.length || 0,
        code: error?.code || null,
      };
    }, ENV.ortuAChildId);

    expect(result.count).toBe(0);
    expect(result.code).toBe("42501");
    await logout(page);
  });

  test("Menu write tetap dibatasi berdasarkan role", async ({ page }) => {
    await login(page, ENV.guruEmail, ENV.guruPassword);
    const guruLabels = await navLabels(page);
    expect(guruLabels).toContain("Input Absensi");
    expect(guruLabels).not.toContain("Data Siswa");
    expect(guruLabels).not.toContain("Monitoring SPP");
    await logout(page);

    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);
    const ortuLabels = await navLabels(page);
    expect(ortuLabels).not.toContain("Data Siswa");
    expect(ortuLabels).not.toContain("Monitoring SPP");
    expect(ortuLabels).not.toContain("Input Absensi");
    await logout(page);
  });
});
