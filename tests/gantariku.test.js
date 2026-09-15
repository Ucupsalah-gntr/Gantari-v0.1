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

test("validasi tanggal menerima tanggal kalender yang valid", () => {
  assert.equal(isValidDateString("2026-09-15"), true);
  assert.equal(isValidDateString("2026-02-28"), true);
  assert.equal(isValidDateString("2026-02-30"), false);
  assert.equal(isValidDateString("15-09-2026"), false);
});
