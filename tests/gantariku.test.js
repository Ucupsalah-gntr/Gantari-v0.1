import test from "node:test";
import assert from "node:assert/strict";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember"
];

const ABSEN_STATUS_LABELS = {
  H: "Hadir",
  I: "Izin",
  S: "Sakit",
  A: "Alpa"
};

const VALID_ROLES = ["admin", "guru", "ortu"];

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

function formatRupiah(angka) {
  const n = Number(angka) || 0;
  return "Rp " + n.toLocaleString("id-ID");
}

function namaBulan(bulanNum) {
  return MONTHS[(Number(bulanNum) || 1) - 1] || "-";
}

function labelStatusAbsensi(kode) {
  return ABSEN_STATUS_LABELS[kode] || kode || "-";
}

function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getPaymentMethod(row) {
  const value = String(row?.metode_pembayaran || "").trim().toLowerCase();
  return value === "cash" || value === "transfer" ? value : "";
}

function getStudentStatus(tanggalKeluar) {
  return String(tanggalKeluar || "").trim() ? "Keluar" : "Aktif";
}

function getWIBParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
}

function getTodayWIBString(date = new Date()) {
  const p = getWIBParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

test("formatRupiah memformat nominal rupiah", () => {
  assert.equal(formatRupiah(150000), "Rp 150.000");
  assert.equal(formatRupiah(0), "Rp 0");
});

test("namaBulan mengembalikan nama bulan yang benar", () => {
  assert.equal(namaBulan(1), "Januari");
  assert.equal(namaBulan(9), "September");
  assert.equal(namaBulan(12), "Desember");
  assert.equal(namaBulan(99), "-");
});

test("status absensi diterjemahkan dengan benar", () => {
  assert.equal(labelStatusAbsensi("H"), "Hadir");
  assert.equal(labelStatusAbsensi("I"), "Izin");
  assert.equal(labelStatusAbsensi("S"), "Sakit");
  assert.equal(labelStatusAbsensi("A"), "Alpa");
  assert.equal(labelStatusAbsensi(""), "-");
});

test("role aplikasi hanya menerima admin, guru, dan ortu", () => {
  assert.equal(isValidRole("admin"), true);
  assert.equal(isValidRole("guru"), true);
  assert.equal(isValidRole("ortu"), true);
  assert.equal(isValidRole("siswa"), false);
  assert.equal(isValidRole(""), false);
});

test("setiap role memiliki navigasi yang sesuai", () => {
  assert.deepEqual(NAV_CONFIG.admin, [
    "dasbor",
    "siswa",
    "spp",
    "guru",
    "absen-guru",
    "rekap",
    "perkembangan"
  ]);
  assert.deepEqual(NAV_CONFIG.guru, [
    "input-absen",
    "absen-saya",
    "riwayat-absen",
    "perkembangan-input"
  ]);
  assert.deepEqual(NAV_CONFIG.ortu, [
    "ringkasan",
    "absen-anak",
    "spp-anak",
    "perkembangan-anak"
  ]);
});

test("metode pembayaran SPP hanya mengenali cash dan transfer", () => {
  assert.equal(getPaymentMethod({ metode_pembayaran: "cash" }), "cash");
  assert.equal(getPaymentMethod({ metode_pembayaran: " CASH " }), "cash");
  assert.equal(getPaymentMethod({ metode_pembayaran: "transfer" }), "transfer");
  assert.equal(getPaymentMethod({ metode_pembayaran: "TRANSFER" }), "transfer");
  assert.equal(getPaymentMethod({ metode_pembayaran: null }), "");
  assert.equal(getPaymentMethod({ metode_pembayaran: "" }), "");
  assert.equal(getPaymentMethod({ metode_pembayaran: "qris" }), "");
});

test("status siswa mengikuti field tanggal_keluar", () => {
  assert.equal(getStudentStatus(null), "Aktif");
  assert.equal(getStudentStatus(""), "Aktif");
  assert.equal(getStudentStatus("2026-09-15"), "Keluar");
  assert.equal(getStudentStatus(" 2026-09-15 "), "Keluar");
});

test("validasi tanggal menerima tanggal kalender yang valid", () => {
  assert.equal(isValidDateString("2026-09-15"), true);
  assert.equal(isValidDateString("2026-02-28"), true);
  assert.equal(isValidDateString("2026-02-30"), false);
  assert.equal(isValidDateString("15-09-2026"), false);
});

test("tanggal aplikasi dapat dihitung dalam zona waktu WIB", () => {
  // 31 Agustus 2026 17:30 UTC = 1 September 2026 00:30 WIB.
  const instant = new Date("2026-08-31T17:30:00Z");
  assert.equal(getTodayWIBString(instant), "2026-09-01");

  // 15 September 2026 05:00 UTC = 15 September 2026 12:00 WIB.
  const midday = new Date("2026-09-15T05:00:00Z");
  assert.equal(getTodayWIBString(midday), "2026-09-15");
});
