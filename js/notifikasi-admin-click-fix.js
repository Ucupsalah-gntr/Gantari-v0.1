// ============================================================
// GANTARIKU — NOTIFIKASI ADMIN CLICK FIX
// Klik "Periksa pembayaran" menunggu tabel SPP selesai render.
// ============================================================

(function () {
  "use strict";

  let patched = false;

  function waitForSppTarget(sppId, bulan, tahun, deadline) {
    const app = window.__app;
    if (!app) return;

    const buttons = Array.from(document.querySelectorAll("#daftarSppAnnual .spp-cell"));
    const target = buttons.find((el) => {
      const onclick = el.getAttribute("onclick") || "";
      return onclick.includes(String(sppId));
    });

    if (target && typeof app.fokusSppTahunan === "function") {
      app.fokusSppTahunan(sppId, bulan, tahun);
      return;
    }

    if (Date.now() >= deadline) {
      if (typeof app.bukaDetailSpp === "function") {
        app.bukaDetailSpp(sppId);
      }
      return;
    }

    setTimeout(() => {
      waitForSppTarget(sppId, bulan, tahun, deadline);
    }, 100);
  }

  function patch() {
    if (patched) return true;

    const app = window.__app;
    if (!app || typeof app.bukaPembayaranDariNotifikasi !== "function") {
      return false;
    }

    const original = app.bukaPembayaranDariNotifikasi;

    app.bukaPembayaranDariNotifikasi = function (sppId, bulan, tahun) {
      const panel = document.getElementById("notifPanel");
      if (panel) panel.classList.remove("show");

      const bell = document.getElementById("notifButton");
      if (bell) bell.setAttribute("aria-expanded", "false");

      if (typeof app.goTo === "function") {
        app.goTo("spp");
      } else {
        original.apply(this, arguments);
        return;
      }

      const startedAt = Date.now();
      const deadline = startedAt + 5000;

      const prepare = () => {
        const yearEl = document.getElementById("filterTahunSpp");

        if (!yearEl) {
          if (Date.now() < deadline) {
            setTimeout(prepare, 50);
          }
          return;
        }

        const targetYear = String(tahun);

        if (yearEl.value !== targetYear) {
          yearEl.value = targetYear;
          if (typeof app.loadSpp === "function") {
            app.loadSpp().catch((error) => {
              console.error("Gantariku: gagal memuat tahun SPP dari notifikasi:", error);
            });
          }
        }

        waitForSppTarget(sppId, bulan, tahun, deadline);
      };

      prepare();
    };

    patched = true;
    window.gantarikuAdminNotifClickFix = true;
    return true;
  }

  if (!patch()) {
    const timer = setInterval(() => {
      if (patch()) clearInterval(timer);
    }, 100);

    setTimeout(() => clearInterval(timer), 10000);
  }
})();
