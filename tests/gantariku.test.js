import test from "node:test";
import assert from "node:assert/strict";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const ABSEN_STATUS_LABELS = { H: "Hadir", I: "Izin", S: "Sakit", A: "Alpa" };
const VALID_ROLES = ["admin", "guru", "ortu"];
const VALID_PAYMENT_METHODS = ["cash", "transfer"];
const VALID_SPP_STATUSES = ["Belum Bayar", "Menunggu Verifikasi", "Lunas"];

const NAV_CONFIG = {
  admin: ["dasbor", "siswa", "spp", "guru", "absen-guru", "rekap", "perkembangan"],
  guru: ["input-absen", "absen-saya", "riwayat-absen", "perkembangan-input"],
  ortu: ["ringkasan", "absen-anak", "spp-anak", "perkembangan-anak"]
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
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function getPaymentMethod(row) {
  const value = String(row?.metode_pembayaran || "").trim().toLowerCase();
  return VALID_PAYMENT_METHODS.includes(value) ? value : "";
}

function getStudentStatus(tanggalKeluar) {
  return String(tanggalKeluar || "").trim() ? "Keluar" : "Aktif";
}

function getWIBParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  return Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );
}

function getTodayWIBString(date = new Date()) {
  const p = getWIBParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

function createSppRecord({ status = "Belum Bayar", method = null, note = null } = {}) {
  if (!VALID_SPP_STATUSES.includes(status)) throw new Error("Status SPP tidak valid");
  const normalizedMethod = method == null ? null : getPaymentMethod({ metode_pembayaran: method });
  if (method != null && !normalizedMethod) throw new Error("Metode pembayaran tidak valid");
  return {
    status,
    metode_pembayaran: normalizedMethod,
    keterangan_pembayaran: note ? String(note).trim() : null
  };
}

function verifyPendingPayment(record) {
  if (record.status !== "Menunggu Verifikasi") throw new Error("Pembayaran bukan Menunggu Verifikasi");
  return { ...record, status: "Lunas" };
}

function rejectPendingPayment(record) {
  if (record.status !== "Menunggu Verifikasi") throw new Error("Pembayaran bukan Menunggu Verifikasi");
  return { ...record, status: "Belum Bayar", bukti_bayar_url: null, tanggal_bayar: null };
}

function settleCashPayment(record, tanggalBayar, keterangan) {
  if (record.status !== "Belum Bayar") throw new Error("Tagihan bukan Belum Bayar");
  if (!isValidDateString(tanggalBayar)) throw new Error("Tanggal pembayaran tidak valid");
  const note = String(keterangan || "").trim();
  return {
    ...record, status: "Lunas", tanggal_bayar: tanggalBayar,
    metode_pembayaran: "cash", keterangan_pembayaran: note || null
  };
}

function settleTransferPayment(record, tanggalBayar) {
  if (record.status !== "Menunggu Verifikasi") throw new Error("Transfer harus melalui verifikasi");
  if (!isValidDateString(tanggalBayar)) throw new Error("Tanggal pembayaran tidak valid");
  return { ...record, status: "Lunas", tanggal_bayar: tanggalBayar, metode_pembayaran: "transfer" };
}

function uniqueSppByStudentMonthYear(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.siswa_id}|${row.bulan}|${row.tahun}`;
    if (!map.has(key)) map.set(key, row);
  }
  return [...map.values()];
}

function upsertAttendance(rows, nextRow) {
  const index = rows.findIndex(
    (row) => row.siswa_id === nextRow.siswa_id && row.tanggal === nextRow.tanggal
  );
  if (index === -1) return [...rows, nextRow];
  const result = [...rows];
  result[index] = { ...result[index], ...nextRow };
  return result;
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
  assert.deepEqual(NAV_CONFIG.admin, ["dasbor", "siswa", "spp", "guru", "absen-guru", "rekap", "perkembangan"]);
  assert.deepEqual(NAV_CONFIG.guru, ["input-absen", "absen-saya", "riwayat-absen", "perkembangan-input"]);
  assert.deepEqual(NAV_CONFIG.ortu, ["ringkasan", "absen-anak", "spp-anak", "perkembangan-anak"]);
});

test("metode pembayaran SPP hanya mengenali cash dan transfer", () => {
  assert.equal(getPaymentMethod({ metode_pembayaran: "cash" }), "cash");
  assert.equal(getPaymentMethod({ metode_pembayaran: " CASH " }), "cash");
  assert.equal(getPaymentMethod({ metode_pembayaran: "transfer" }), "transfer");
  assert.equal(getPaymentMethod({ metode_pembayaran: "TRANSFER" }), "transfer");
  assert.equal(getPaymentMethod({ metode_pembayaran: null }), "");
  assert.equal(getPaymentMethod({ metode_pembayaran: "qris" }), "");
});

test("status siswa mengikuti field tanggal_keluar", () => {
  assert.equal(getStudentStatus(null), "Aktif");
  assert.equal(getStudentStatus(""), "Aktif");
  assert.equal(getStudentStatus("2026-09-15"), "Keluar");
});

test("validasi tanggal menerima tanggal kalender yang valid", () => {
  assert.equal(isValidDateString("2026-09-15"), true);
  assert.equal(isValidDateString("2026-02-28"), true);
  assert.equal(isValidDateString("2026-02-30"), false);
  assert.equal(isValidDateString("15-09-2026"), false);
});

test("tanggal aplikasi dapat dihitung dalam zona waktu WIB", () => {
  assert.equal(getTodayWIBString(new Date("2026-08-31T17:30:00Z")), "2026-09-01");
  assert.equal(getTodayWIBString(new Date("2026-09-15T05:00:00Z")), "2026-09-15");
});

test("SPP hanya menerima status bisnis yang valid", () => {
  for (const status of VALID_SPP_STATUSES) assert.equal(createSppRecord({ status }).status, status);
  assert.throws(() => createSppRecord({ status: "Dibatalkan" }), /Status SPP tidak valid/);
});

test("SPP membedakan metode pembayaran cash dan transfer", () => {
  assert.deepEqual(createSppRecord({ status: "Lunas", method: "cash", note: "cash ke Bu Vika" }), {
    status: "Lunas", metode_pembayaran: "cash", keterangan_pembayaran: "cash ke Bu Vika"
  });
  assert.deepEqual(createSppRecord({ status: "Lunas", method: "transfer" }), {
    status: "Lunas", metode_pembayaran: "transfer", keterangan_pembayaran: null
  });
  assert.throws(() => createSppRecord({ status: "Lunas", method: "qris" }), /Metode pembayaran tidak valid/);
});

test("verifikasi pembayaran hanya mengubah Menunggu Verifikasi menjadi Lunas", () => {
  const verified = verifyPendingPayment(createSppRecord({ status: "Menunggu Verifikasi", method: "transfer" }));
  assert.equal(verified.status, "Lunas");
  assert.equal(verified.metode_pembayaran, "transfer");
  assert.throws(() => verifyPendingPayment(createSppRecord({ status: "Belum Bayar" })), /bukan Menunggu Verifikasi/);
});

test("penolakan bukti pembayaran mengembalikan status menjadi Belum Bayar", () => {
  const pending = { ...createSppRecord({ status: "Menunggu Verifikasi", method: "transfer" }),
    bukti_bayar_url: "bukti.jpg", tanggal_bayar: "2026-09-15" };
  const rejected = rejectPendingPayment(pending);
  assert.equal(rejected.status, "Belum Bayar");
  assert.equal(rejected.bukti_bayar_url, null);
  assert.equal(rejected.tanggal_bayar, null);
});

test("tandai lunas cash hanya berlaku untuk Belum Bayar", () => {
  const paid = settleCashPayment(createSppRecord(), "2026-09-15", "cash ke Bu Vika");
  assert.equal(paid.status, "Lunas");
  assert.equal(paid.tanggal_bayar, "2026-09-15");
  assert.equal(paid.metode_pembayaran, "cash");
  assert.equal(paid.keterangan_pembayaran, "cash ke Bu Vika");
  assert.throws(() => settleCashPayment(paid, "2026-09-15", "kedua"), /bukan Belum Bayar/);
});

test("tanggal pembayaran cash harus tanggal kalender yang valid", () => {
  assert.throws(() => settleCashPayment(createSppRecord(), "2026-02-30", "cash"), /Tanggal pembayaran tidak valid/);
  assert.throws(() => settleCashPayment(createSppRecord(), "30-02-2026", "cash"), /Tanggal pembayaran tidak valid/);
});

test("transfer yang diverifikasi menghasilkan Lunas dengan metode transfer", () => {
  const paid = settleTransferPayment(createSppRecord({ status: "Menunggu Verifikasi" }), "2026-09-15");
  assert.equal(paid.status, "Lunas");
  assert.equal(paid.metode_pembayaran, "transfer");
  assert.equal(paid.tanggal_bayar, "2026-09-15");
  assert.throws(() => settleTransferPayment(createSppRecord(), "2026-09-15"), /harus melalui verifikasi/);
});

test("duplikasi SPP siswa-bulan-tahun tidak dihitung dua kali", () => {
  const rows = [
    { id: "1", siswa_id: "s1", bulan: 9, tahun: 2026 },
    { id: "2", siswa_id: "s1", bulan: 9, tahun: 2026 },
    { id: "3", siswa_id: "s1", bulan: 10, tahun: 2026 },
    { id: "4", siswa_id: "s2", bulan: 9, tahun: 2026 }
  ];
  const unique = uniqueSppByStudentMonthYear(rows);
  assert.equal(unique.length, 3);
  assert.deepEqual(unique.map((row) => row.id), ["1", "3", "4"]);
});

test("absensi satu siswa pada tanggal yang sama di-upsert, bukan digandakan", () => {
  const awal = [{ id: "a1", siswa_id: "s1", tanggal: "2026-09-15", status: "H" }];
  const diperbarui = upsertAttendance(awal, { id: "a1", siswa_id: "s1", tanggal: "2026-09-15", status: "I" });
  assert.equal(diperbarui.length, 1);
  assert.equal(diperbarui[0].status, "I");
  const tanggalBerbeda = upsertAttendance(diperbarui, { id: "a2", siswa_id: "s1", tanggal: "2026-09-16", status: "H" });
  assert.equal(tanggalBerbeda.length, 2);
});
