import test from "node:test";
import assert from "node:assert/strict";

// Kontrak akses UI Gantariku.
// Ini sengaja dibuat independen dari DOM/Supabase agar CI dapat menguji
// batas role tanpa membutuhkan akun atau password produksi.

const NAV_CONFIG = {
  admin: [
    "dasbor",
    "siswa",
    "spp",
    "guru",
    "absen-guru",
    "rekap",
    "perkembangan"
  ],
  guru: [
    "input-absen",
    "absen-saya",
    "riwayat-absen",
    "perkembangan-input"
  ],
  ortu: [
    "ringkasan",
    "absen-anak",
    "spp-anak",
    "perkembangan-anak"
  ]
};

const ROLE_LABELS = {
  admin: "Admin",
  guru: "Guru / Pelatih",
  ortu: "Orang Tua"
};

const ALL_NAV_IDS = new Set(Object.values(NAV_CONFIG).flat());

function allowedNavigation(role, navId) {
  return Boolean(NAV_CONFIG[role]?.includes(navId));
}

function simulateGoTo(role, currentNav, requestedNav) {
  if (!allowedNavigation(role, requestedNav)) return currentNav;
  return requestedNav;
}

test("hanya tiga role resmi yang memiliki konfigurasi akses", () => {
  assert.deepEqual(Object.keys(NAV_CONFIG).sort(), ["admin", "guru", "ortu"]);
  assert.deepEqual(Object.keys(ROLE_LABELS).sort(), ["admin", "guru", "ortu"]);
});

test("setiap role memiliki menu dan tidak ada menu kosong", () => {
  for (const [role, menus] of Object.entries(NAV_CONFIG)) {
    assert.ok(menus.length > 0, `${role} tidak memiliki menu`);
    assert.ok(menus.every((id) => typeof id === "string" && id.length > 0));
  }
});

test("tidak ada ID navigasi yang muncul pada dua role", () => {
  const seen = new Map();

  for (const [role, menus] of Object.entries(NAV_CONFIG)) {
    for (const id of menus) {
      assert.equal(seen.has(id), false, `Menu ${id} muncul pada lebih dari satu role`);
      seen.set(id, role);
    }
  }
});

test("admin hanya mendapat menu admin", () => {
  for (const id of NAV_CONFIG.admin) assert.equal(allowedNavigation("admin", id), true);
  for (const id of [...NAV_CONFIG.guru, ...NAV_CONFIG.ortu]) {
    assert.equal(allowedNavigation("admin", id), false);
  }
});

test("guru tidak mendapat menu admin atau orang tua", () => {
  for (const id of NAV_CONFIG.guru) assert.equal(allowedNavigation("guru", id), true);
  for (const id of [...NAV_CONFIG.admin, ...NAV_CONFIG.ortu]) {
    assert.equal(allowedNavigation("guru", id), false);
  }
});

test("orang tua hanya mendapat menu orang tua", () => {
  for (const id of NAV_CONFIG.ortu) assert.equal(allowedNavigation("ortu", id), true);
  for (const id of [...NAV_CONFIG.admin, ...NAV_CONFIG.guru]) {
    assert.equal(allowedNavigation("ortu", id), false);
  }
});

test("role tidak dikenal tidak boleh membuka menu apa pun", () => {
  for (const role of ["", "siswa", "bendahara", "guest", null, undefined]) {
    for (const id of ALL_NAV_IDS) {
      assert.equal(allowedNavigation(role, id), false);
    }
  }
});

test("permintaan navigasi ilegal tidak mengubah halaman aktif", () => {
  assert.equal(simulateGoTo("guru", "input-absen", "siswa"), "input-absen");
  assert.equal(simulateGoTo("ortu", "ringkasan", "spp"), "ringkasan");
  assert.equal(simulateGoTo("admin", "dasbor", "absen-anak"), "dasbor");
});

test("permintaan navigasi legal mengubah halaman aktif", () => {
  assert.equal(simulateGoTo("admin", "dasbor", "spp"), "spp");
  assert.equal(simulateGoTo("guru", "input-absen", "riwayat-absen"), "riwayat-absen");
  assert.equal(simulateGoTo("ortu", "ringkasan", "perkembangan-anak"), "perkembangan-anak");
});

test("menu sensitif tetap eksklusif", () => {
  const adminOnly = ["siswa", "spp", "guru", "absen-guru", "rekap", "perkembangan"];
  const guruOnly = ["input-absen", "absen-saya", "riwayat-absen", "perkembangan-input"];
  const ortuOnly = ["ringkasan", "absen-anak", "spp-anak", "perkembangan-anak"];

  for (const id of adminOnly) {
    assert.equal(allowedNavigation("admin", id), true);
    assert.equal(allowedNavigation("guru", id), false);
    assert.equal(allowedNavigation("ortu", id), false);
  }

  for (const id of guruOnly) {
    assert.equal(allowedNavigation("admin", id), false);
    assert.equal(allowedNavigation("guru", id), true);
    assert.equal(allowedNavigation("ortu", id), false);
  }

  for (const id of ortuOnly) {
    assert.equal(allowedNavigation("admin", id), false);
    assert.equal(allowedNavigation("guru", id), false);
    assert.equal(allowedNavigation("ortu", id), true);
  }
});
