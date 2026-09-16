// ============================================================
// GANTARIKU — NOTIFIKASI ORANGTUA MOBILE UX FIX
// Dijalankan setelah app.js.
// Tidak mengubah proses upload/status SPP.
// ============================================================

(function () {
  "use strict";

  // ----------------------------------------------------------
  // FOKUS SPP: desktop memakai table row, mobile memakai card.
  // ----------------------------------------------------------
  window.fokusSppDariNotifikasi = async function (context, attempt = 0) {
    if (!context || !document.getElementById("view")) return;

    const maxAttempts = 40;
    if (attempt >= maxAttempts) {
      console.warn("Gantariku: target SPP belum ditemukan.", context);
      return;
    }

    const tbody = document.getElementById("daftarSppAnak");
    const mobileList = document.getElementById("daftarSppAnakMobile");

    if (!tbody || !mobileList) {
      setTimeout(() => window.fokusSppDariNotifikasi(context, attempt + 1), 150);
      return;
    }

    if (context.siswaId && String(window. anakTerpilihId || anakTerpilihId) !== String(context.siswaId)) {
      try {
        anakTerpilihId = context.siswaId;
      } catch (_) {}

      if (typeof window.renderView === "function") {
        window.renderView();
      } else if (typeof renderView === "function") {
        renderView();
      }

      setTimeout(() => window.fokusSppDariNotifikasi(context, attempt + 1), 150);
      return;
    }

    const yearSelect = document.getElementById("sppAnakTahun");

    if (yearSelect && String(yearSelect.value) !== String(context.tahun)) {
      yearSelect.value = String(context.tahun);

      const loader =
        window.__app && typeof window.__app.loadSppAnak === "function"
          ? window.__app.loadSppAnak
          : typeof loadSppAnak === "function"
            ? loadSppAnak
            : null;

      if (loader) {
        try {
          await loader();
        } catch (error) {
          console.warn("Gantariku: gagal memuat tahun SPP target.", error);
        }
      }

      setTimeout(() => window.fokusSppDariNotifikasi(context, attempt + 1), 150);
      return;
    }

    const bulanTarget = Number(context.bulan);
    const tahunTarget = Number(context.tahun);
    const namaBulanTarget = String(
      typeof namaBulan === "function" ? namaBulan(bulanTarget) : ""
    ).toLowerCase();

    const mobileVisible =
      window.innerWidth <= 768 &&
      window.getComputedStyle(mobileList).display !== "none";

    let target = null;

    if (mobileVisible) {
      const cards = Array.from(mobileList.querySelectorAll(".ortu-spp-card"));

      target = cards.find((card) => {
        const text = String(card.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();

        return (
          namaBulanTarget &&
          text.includes(namaBulanTarget) &&
          text.includes(String(tahunTarget))
        );
      });

      if (!target && namaBulanTarget) {
        target = cards.find((card) =>
          String(card.textContent || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase()
            .includes(namaBulanTarget)
        );
      }
    } else {
      const rows = Array.from(tbody.querySelectorAll("tr"));

      target = rows.find((row) => {
        const text = String(row.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();

        return (
          namaBulanTarget &&
          text.includes(namaBulanTarget) &&
          text.includes(String(tahunTarget))
        );
      });

      if (!target && namaBulanTarget) {
        target = rows.find((row) =>
          String(row.textContent || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase()
            .includes(namaBulanTarget)
        );
      }
    }

    if (!target) {
      setTimeout(() => window.fokusSppDariNotifikasi(context, attempt + 1), 150);
      return;
    }

    target.style.transition = "box-shadow .2s ease, background-color .2s ease";
    target.style.backgroundColor = "rgba(255, 193, 7, .12)";
    target.style.boxShadow = "inset 4px 0 0 var(--primary)";
    target.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      target.style.backgroundColor = "";
      target.style.boxShadow = "";
    }, 2800);
  };

  // ----------------------------------------------------------
  // Notifikasi SPP hanya untuk keadaan yang membutuhkan aksi.
  // Menunggu Verifikasi bukan notifikasi baru untuk orangtua.
  // ----------------------------------------------------------
  const previousLoadNotifikasi = window.loadNotifikasi;

  if (typeof previousLoadNotifikasi === "function") {
    window.loadNotifikasi = async function () {
      const result = await previousLoadNotifikasi.apply(this, arguments);

      if (String(window.currentUserRole || "").toLowerCase() === "ortu" ||
          (typeof currentUserRole !== "undefined" && String(currentUserRole).toLowerCase() === "ortu")) {
        const panel = document.getElementById("notifPanel");
        const count = document.getElementById("notifCount");

        if (panel && count) {
          const pendingButtons = Array.from(
            panel.querySelectorAll('[data-notif-action="spp-anak"]')
          ).filter((button) =>
            String(button.textContent || "").toLowerCase().includes("menunggu verifikasi")
          );

          pendingButtons.forEach((button) => button.remove());

          const visibleItems = panel.querySelectorAll('[data-notif-action]');
          const total = visibleItems.length;

          count.textContent = total ? String(total) : "";
          count.style.display = total ? "inline-flex" : "none";
          count.classList.toggle("is-hidden", !total);

          if (!total) {
            panel.innerHTML = `<div class="notif-empty">Semua aman. Tidak ada notifikasi baru.</div>`;
          }
        }
      }

      return result;
    };
  }
})();
