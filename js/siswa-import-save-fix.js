// ============================================================
// GANTARIKU — IMPORT SISWA SAVE SAFETY FIX
// Menjaga importer lama tetap dipakai, tetapi mencegah batch insert
// gagal hanya karena Tahun Ajaran kosong/null.
//
// Perilaku:
// - Menunggu Supabase client benar-benar siap.
// - Normalisasi 2023-2024 / 2023-24 -> 2023/2024.
// - Mendukung Excel dengan Tahun Ajaran di-merge/blank: nilai blank
//   mewarisi Tahun Ajaran terakhir yang terbaca.
// - Jika baris pertama kosong sementara hanya ada satu tahun unik,
//   tahun unik tersebut dipakai sebagai fallback.
// - Jika masih ambigu, import dihentikan dengan pesan yang jelas.
// - Hanya memproses insert ke tabel siswa saat modal import terbuka.
// ============================================================

(function () {
  "use strict";

  function normalizeTahunAjaran(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";

    let match = text.match(/^(20\d{2})\s*[\/-]\s*(20\d{2})$/);
    if (match) return `${match[1]}/${match[2]}`;

    match = text.match(/^(20\d{2})\s*[\/-]\s*(\d{2})$/);
    if (match) return `${match[1]}/${String(match[1]).slice(0, 2)}${match[2]}`;

    return text;
  }

  function installImportSaveGuard() {
    if (!window.supabase || window.__gtrImportSaveGuardInstalled) return false;

    const originalFrom = window.supabase.from.bind(window.supabase);

    window.supabase.from = function (table, ...args) {
      const builder = originalFrom(table, ...args);

      if (
        table !== "siswa" ||
        !document.getElementById("gtrImportSiswaModal")
      ) {
        return builder;
      }

      return new Proxy(builder, {
        get(target, property, receiver) {
          if (property !== "insert") {
            const value = Reflect.get(target, property, receiver);
            return typeof value === "function" ? value.bind(target) : value;
          }

          return function guardedInsert(payload, ...insertArgs) {
            const rows = Array.isArray(payload) ? payload : [payload];
            const normalized = rows.map((row) => ({
              ...(row || {}),
              tahun_ajaran: normalizeTahunAjaran(row?.tahun_ajaran)
            }));

            const uniqueYears = [...new Set(
              normalized
                .map((row) => row.tahun_ajaran)
                .filter(Boolean)
            )];

            let lastYear = null;

            for (const row of normalized) {
              if (row.tahun_ajaran) {
                lastYear = row.tahun_ajaran;
              } else if (lastYear) {
                row.tahun_ajaran = lastYear;
              } else if (uniqueYears.length === 1) {
                row.tahun_ajaran = uniqueYears[0];
              }
            }

            if (normalized.some((row) => !row.tahun_ajaran)) {
              throw new Error(
                "Import dibatalkan: ada data siswa tanpa Tahun Ajaran. " +
                "Isi Tahun Ajaran pada baris yang kosong (atau jangan merge sebagian kolom), lalu coba import lagi."
              );
            }

            return target.insert(normalized, ...insertArgs);
          };
        }
      });
    };

    window.__gtrImportSaveGuardInstalled = true;
    return true;
  }

  async function init() {
    try {
      if (window.gantarikuSupabaseReady) {
        await window.gantarikuSupabaseReady;
      }
    } catch (error) {
      console.error("Supabase readiness check untuk import fix gagal:", error);
    }

    installImportSaveGuard();
  }

  init();
  window.__gtrNormalizeTahunAjaran = normalizeTahunAjaran;
})();
