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

async function callWrite(page, table, id, patch) {
  return page.evaluate(async ({ table, id, patch }) => {
    if (!window.supabase) throw new Error("Supabase client tidak tersedia");
    const { data, error } = await window.supabase
      .from(table)
      .update(patch)
      .eq("id", id)
      .select("id");

    return {
      data: data || [],
      error: error
        ? { code: error.code || null, message: error.message || null }
        : null,
    };
  }, { table, id, patch });
}

async function callInsert(page, table, payload) {
  return page.evaluate(async ({ table, payload }) => {
    if (!window.supabase) throw new Error("Supabase client tidak tersedia");
    const { data, error } = await window.supabase
      .from(table)
      .insert(payload)
      .select("id");

    return {
      data: data || [],
      error: error
        ? { code: error.code || null, message: error.message || null }
        : null,
    };
  }, { table, payload });
}

test.describe("Audit 7.3C — write authorization", () => {
  test.skip(
    !AUTH_READY || process.env.GTR_TEST_WRITE_MODE !== "1",
    "Write authorization test memerlukan akun test + GTR_TEST_WRITE_MODE=1."
  );

  test("Guru tidak dapat menulis ke tabel SPP", async ({ page }) => {
    await login(page, ENV.guruEmail, ENV.guruPassword);

    const result = await callInsert(page, "spp", {
      siswa_id: ENV.childAId,
      bulan: 1,
      tahun: 2099,
      nominal: 1,
      status: "Belum Bayar",
    });

    expect(result.data).toEqual([]);
    expect(result.error?.code).toBe("42501");
    await logout(page);
  });

  test("Orang tua tidak dapat menulis langsung ke data siswa", async ({ page }) => {
    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);

    const result = await callUpdate(page, "siswa", ENV.childAId, {
      nama: undefined,
    });

    expect(result.data).toEqual([]);
    expect(result.error?.code).toBe("42501");
    await logout(page);
  });

  test("Orang tua tidak dapat memasukkan absensi siswa secara langsung", async ({ page }) => {
    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);

    const result = await callInsert(page, "absensi", {
      siswa_id: ENV.childAId,
      tanggal: "2099-01-01",
      status: "Hadir",
    });

    expect(result.data).toEqual([]);
    expect(result.error?.code).toBe("42501");
    await logout(page);
  });

  test("Orang tua tidak dapat menulis perkembangan anak secara langsung", async ({ page }) => {
    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);

    const result = await callInsert(page, "perkembangan", {
      siswa_id: ENV.childAId,
      guru_id: null,
      tanggal: "2099-01-01",
      aspek: "AUDIT",
      nilai: 1,
      catatan: "AUDIT",
    });

    expect(result.data).toEqual([]);
    expect(result.error?.code).toBe("42501");
    await logout(page);
  });

  test("Role guru dan orang tua tetap hanya menampilkan menu write miliknya", async ({ page }) => {
    await login(page, ENV.guruEmail, ENV.guruPassword);
    const guruLabels = await navLabels(page);
    expect(guruLabels).not.toContain("Data Siswa");
    expect(guruLabels).not.toContain("Monitoring SPP");
    expect(guruLabels).not.toContain("Guru & Pelatih");
    expect(guruLabels).toContain("Input Absensi");
    await logout(page);

    await login(page, ENV.ortuAEmail, ENV.ortuAPassword);
    const ortuLabels = await navLabels(page);
    expect(ortuLabels).not.toContain("Data Siswa");
    expect(ortuLabels).not.toContain("Monitoring SPP");
    expect(ortuLabels).not.toContain("Input Absensi");
    await logout(page);
  });
});

async function callUpdate(page, table, id, patch) {
  return page.evaluate(async ({ table, id, patch }) => {
    if (!window.supabase) throw new Error("Supabase client tidak tersedia");
    const { data, error } = await window.supabase
      .from(table)
      .update(patch)
      .eq("id", id)
      .select("id");

    return {
      data: data || [],
      error: error
        ? { code: error.code || null, message: error.message || null }
        : null,
    };
  }, { table, id, patch });
}
