import test from "node:test";
import assert from "node:assert/strict";

const VALID_SPP_STATUSES = ["Belum Bayar", "Menunggu Verifikasi", "Lunas"];

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
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

function upsertTeacherAttendance(rows, nextRow) {
  const index = rows.findIndex(
    (row) => row.guru_id === nextRow.guru_id && row.tanggal === nextRow.tanggal
  );
  if (index === -1) return [...rows, nextRow];
  const result = [...rows];
  result[index] = { ...result[index], ...nextRow };
  return result;
}

function settleSpp(record, status, tanggalBayar = null) {
  if (!VALID_SPP_STATUSES.includes(status)) throw new Error("Status SPP tidak valid");
  if (status === "Lunas" && tanggalBayar && !isValidDateString(tanggalBayar)) {
    throw new Error("Tanggal pembayaran tidak valid");
  }
  return { ...record, status, tanggal_bayar: tanggalBayar };
}

test("integritas SPP: kombinasi siswa-bulan-tahun harus unik", () => {
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

test("integritas SPP: status hanya boleh berada pada tiga status bisnis", () => {
  for (const status of VALID_SPP_STATUSES) {
    assert.equal(settleSpp({ id: "spp-1" }, status).status, status);
  }
  assert.throws(() => settleSpp({ id: "spp-1" }, "Dibatalkan"), /Status SPP tidak valid/);
});

test("integritas SPP: tanggal bayar harus tanggal kalender valid", () => {
  assert.equal(isValidDateString("2026-09-15"), true);
  assert.equal(isValidDateString("2026-02-30"), false);
  assert.equal(isValidDateString("2026-13-01"), false);
  assert.throws(() => settleSpp({ id: "spp-1" }, "Lunas", "2026-02-30"), /Tanggal pembayaran tidak valid/);
});

test("integritas absensi siswa: siswa dan tanggal yang sama di-upsert", () => {
  const awal = [{ id: "a1", siswa_id: "s1", tanggal: "2026-09-15", status: "H" }];
  const hasil = upsertAttendance(awal, {
    id: "a1",
    siswa_id: "s1",
    tanggal: "2026-09-15",
    status: "I"
  });

  assert.equal(hasil.length, 1);
  assert.equal(hasil[0].status, "I");

  const tanggalBerbeda = upsertAttendance(hasil, {
    id: "a2",
    siswa_id: "s1",
    tanggal: "2026-09-16",
    status: "H"
  });
  assert.equal(tanggalBerbeda.length, 2);
});

test("integritas absensi guru: guru dan tanggal yang sama di-upsert", () => {
  const awal = [{ id: "g1", guru_id: "guru-1", tanggal: "2026-09-15", status: "H" }];
  const hasil = upsertTeacherAttendance(awal, {
    id: "g1",
    guru_id: "guru-1",
    tanggal: "2026-09-15",
    status: "I"
  });

  assert.equal(hasil.length, 1);
  assert.equal(hasil[0].status, "I");

  const guruBerbeda = upsertTeacherAttendance(hasil, {
    id: "g2",
    guru_id: "guru-2",
    tanggal: "2026-09-15",
    status: "H"
  });
  assert.equal(guruBerbeda.length, 2);
});

test("status siswa ditentukan oleh tanggal keluar", () => {
  const getStatus = (tanggalKeluar) => String(tanggalKeluar || "").trim() ? "Keluar" : "Aktif";
  assert.equal(getStatus(null), "Aktif");
  assert.equal(getStatus(""), "Aktif");
  assert.equal(getStatus("2026-09-15"), "Keluar");
});

test("tanggal batas WIB tidak boleh bergeser ke hari UTC sebelumnya", () => {
  const getTodayWIBString = (date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
    );
    return `${values.year}-${values.month}-${values.day}`;
  };

  assert.equal(getTodayWIBString(new Date("2026-08-31T17:30:00Z")), "2026-09-01");
  assert.equal(getTodayWIBString(new Date("2026-09-15T16:59:59Z")), "2026-09-15");
  assert.equal(getTodayWIBString(new Date("2026-09-15T17:00:00Z")), "2026-09-16");
});
