// ============================================================
// GANTARIKU — UTILITIES
// Zona waktu aplikasi: WIB / Asia/Jakarta
// ============================================================

const APP_REQUEST_TIMEOUT_MS = 12000;

function withRequestTimeout(promise, label = "Permintaan", timeoutMs = APP_REQUEST_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} terlalu lama. Periksa koneksi lalu coba lagi.`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function retryButtonHtml(handler) {
  return `<br><br><button class="btn secondary" type="button" onclick="${handler}">Coba lagi</button>`;
}

// ------------------------------------------------------------
// ABSENSI
// ------------------------------------------------------------

const ABSEN_STATUS_LABELS = {
  H: "Hadir",
  I: "Izin",
  S: "Sakit",
  A: "Alpa"
};

function labelStatusAbsensi(kode) {
  return ABSEN_STATUS_LABELS[kode] || kode || "-";
}

function statusBadgeAbsensi(status) {
  const map = {
    H: "badge-good",
    I: "badge-warn",
    S: "badge-sick",
    A: "badge-bad"
  };

  return map[status] || "badge-muted";
}

// ------------------------------------------------------------
// FORMAT
// ------------------------------------------------------------

function formatRupiah(angka) {
  const n = Number(angka) || 0;
  return "Rp " + n.toLocaleString("id-ID");
}

function namaBulan(bulanNum) {
  const nama = [
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

  return nama[(Number(bulanNum) || 1) - 1] || "-";
}

// ------------------------------------------------------------
// KELAS
// ------------------------------------------------------------

async function loadKelasOptions(selectId) {
  const select = document.getElementById(selectId);

  if (!select || !supabase) return;

  try {
    const { data, error } = await supabase
      .from("siswa")
      .select("kelas");

    if (error) throw error;

    const kelasUnik = [
      ...new Set(
        (data || [])
          .map((s) => s.kelas)
          .filter(Boolean)
      )
    ].sort();

    select.innerHTML =
      `<option value="">Pilih kelas...</option>` +
      kelasUnik
        .map((k) => `<option value="${k}">${k}</option>`)
        .join("");

  } catch (error) {
    console.error("Error load kelas:", error);
  }
}

// ============================================================
// TIMEZONE WIB
// ============================================================

const APP_TIME_ZONE = "Asia/Jakarta";

// ------------------------------------------------------------
// Ambil bagian tanggal/jam berdasarkan WIB
// ------------------------------------------------------------

function getWIBParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,

    year: "numeric",
    month: "2-digit",
    day: "2-digit",

    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",

    hourCycle: "h23"
  }).formatToParts(date);

  const result = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  }

  return result;
}

// ------------------------------------------------------------
// Hari ini dalam format YYYY-MM-DD
// ------------------------------------------------------------

function getTodayWIBString() {
  const p = getWIBParts();

  return `${p.year}-${p.month}-${p.day}`;
}

// ------------------------------------------------------------
// Tahun / bulan / tanggal hari ini
// ------------------------------------------------------------

function getTodayWIBDateParts() {
  const p = getWIBParts();

  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day)
  };
}

// ------------------------------------------------------------
// Waktu sekarang berdasarkan WIB
// ------------------------------------------------------------

function getNowWIB() {
  const p = getWIBParts();

  return new Date(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second)
  );
}

// ------------------------------------------------------------
// Format tanggal WIB
// Contoh:
// 11 Sep 2026
// ------------------------------------------------------------

function formatTanggalWIB(tanggal, options = {}) {
  if (!tanggal) return "-";

  const date = new Date(tanggal);

  if (Number.isNaN(date.getTime())) {
    return tanggal;
  }

  const defaultOptions = {
    day: "numeric",
    month: "short",
    year: "numeric"
  };

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone: APP_TIME_ZONE,
      ...defaultOptions,
      ...options
    }
  ).format(date);
}

// ------------------------------------------------------------
// Format tanggal panjang WIB
// Contoh:
// Jumat, 11 September 2026
// ------------------------------------------------------------

function formatTanggalPanjangWIB(tanggal) {
  if (!tanggal) return "-";

  const date = new Date(tanggal);

  if (Number.isNaN(date.getTime())) {
    return tanggal;
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

// ------------------------------------------------------------
// Format jam WIB
// Contoh:
// 07:30
// ------------------------------------------------------------

function formatJamWIB(tanggal) {
  if (!tanggal) return "-";

  const date = new Date(tanggal);

  if (Number.isNaN(date.getTime())) {
    return tanggal;
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "2-digit"
  }).format(date);
}

// ============================================================
// HEADER / CHIP HARI INI
// ============================================================

function updateTodayChip() {
  const chip = document.getElementById("todayChip");

  if (!chip) return;

  const today = getNowWIB();

  chip.textContent = today.toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}
