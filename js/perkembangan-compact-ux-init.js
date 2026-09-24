// ============================================================
// GANTARIKU — PERKEMBANGAN COMPACT UX INIT
// Mengganti area histori guru setelah app.js selesai merender.
// Form input penilaian tidak disentuh.
// ============================================================

(function () {
  "use strict";

  let lastContainer = null;

  function replaceGuruHistorySection() {
    if (typeof currentUserRole === "undefined" || currentUserRole !== "guru") return;

    const oldContainer = document.getElementById("daftarPerkembanganGuru");
    if (!oldContainer || oldContainer === lastContainer) return;

    const section = oldContainer.closest(".section");
    if (!section) return;

    const sectionBody = section.querySelector(".section-body");
    if (!sectionBody) return;

    section.innerHTML = `
      <div class="section-head gtr-perk-head">
        <div>
          <h2>Penilaian Terakhir Saya</h2>
          <div class="section-subtitle">Ringkasan per anak. Klik anak untuk melihat seluruh histori penilaiannya.</div>
        </div>
        <div class="perk-toolbar gtr-perk-toolbar">
          <input class="perk-search" type="text" id="perkembanganGuruCari" placeholder="Cari nama siswa...">
          <select id="perkembanganGuruBulan">
            <option value="0">Semua bulan</option>
            <option value="1">Januari</option><option value="2">Februari</option><option value="3">Maret</option>
            <option value="4">April</option><option value="5">Mei</option><option value="6">Juni</option>
            <option value="7">Juli</option><option value="8">Agustus</option><option value="9">September</option>
            <option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
          </select>
          <select id="perkembanganGuruTahun">${Array.from({ length: Math.max(1, new Date().getFullYear() - 2026 + 1) }, (_, i) => 2026 + i).map((yearOption) => `<option value="${yearOption}" ${yearOption === new Date().getFullYear() ? "selected" : ""}>${yearOption}</option>`).join("")}</select>
          <button class="btn secondary" type="button" id="gtrMuatPerkembanganGuru">Tampilkan</button>
        </div>
      </div>
      <div class="section-body">
        <div id="daftarPerkembanganGuru" data-gtr-compact="1">
          <div class="perk-empty">Memuat data...</div>
        </div>
      </div>
    `;

    lastContainer = document.getElementById("daftarPerkembanganGuru");

    document.getElementById("gtrMuatPerkembanganGuru")?.addEventListener("click", () => {
      window.__app?.loadPerkembanganGuru?.();
    });

    document.getElementById("perkembanganGuruCari")?.addEventListener("input", () => {
      window.__app?.loadPerkembanganGuru?.();
    });

    window.__app?.loadPerkembanganGuru?.();
  }

  const observer = new MutationObserver(() => {
    replaceGuruHistorySection();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  replaceGuruHistorySection();
})();
