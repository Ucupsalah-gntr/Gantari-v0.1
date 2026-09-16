// ============================================================
// GANTARIKU — IMPORT SISWA SAVE SAFETY FIX
// Menjaga importer lama tetap dipakai, tetapi memastikan payload
// import selalu aman terhadap constraint Tahun Ajaran di database.
// ============================================================

(function () {
  "use strict";

  const DEFAULT_TAHUN_AJARAN = "2025/2026";

  function normalizeTahunAjaran(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";

    let match = text.match(/^(20\d{2})\s*[\/-]\s*(20\d{2})$/);
    if (match) return `${match[1]}/${match[2]}`;

    match = text.match(/^(20\d{2})\s*[\/-]\s*(\d{2})$/);
    if (match) return `${match[1]}/${String(match[1]).slice(0, 2)}${match[2]}`;

    return text;
  }

  function fillMissingTahunAjaran(rows) {
    const normalized = rows.map((row) => ({
      ...(row || {}),
      tahun_ajaran: normalizeTahunAjaran(row?.tahun_ajaran)
    }));

    let lastYear = null;
    const uniqueYears = [...new Set(
      normalized.map((row) => row.tahun_ajaran).filter(Boolean)
    )];

    for (const row of normalized) {
      if (row.tahun_ajaran) {
        lastYear = row.tahun_ajaran;
      } else if (lastYear) {
        row.tahun_ajaran = lastYear;
      } else if (uniqueYears.length === 1) {
        row.tahun_ajaran = uniqueYears[0];
      } else {
        // Database siswa memiliki default Tahun Ajaran.
        // Kirim nilai eksplisit agar insert tidak pernah mengirim null.
        row.tahun_ajaran = DEFAULT_TAHUN_AJARAN;
      }
    }

    return normalized;
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
            const normalized = fillMissingTahunAjaran(rows);
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
  window.__gtrDefaultTahunAjaran = DEFAULT_TAHUN_AJARAN;
})();
