// ============================================================
// GANTARIKU — SPP PAYMENT TYPE FIX
// ============================================================
// Membuat pembayaran CASH dan TRANSFER mudah dibedakan.
// CASH = ditandai manual oleh Admin dan memiliki keterangan_pembayaran.
// TRANSFER = pembayaran yang masuk melalui bukti transfer/verifikasi.

(function () {
  "use strict";

  const CASH_CLASS = "spp-payment-cash";
  const TRANSFER_CLASS = "spp-payment-transfer";

  function ensurePaymentTypeStyles() {
    if (document.getElementById("spp-payment-type-styles")) return;

    const style = document.createElement("style");
    style.id = "spp-payment-type-styles";
    style.textContent = `
      .spp-cell.${CASH_CLASS} {
        background: #e8f3ff !important;
        color: #1976d2 !important;
        border-color: #90caf9 !important;
      }
      .spp-cell.${CASH_CLASS}:hover { background: #dbeeff !important; }
      .spp-cell.${TRANSFER_CLASS} {
        background: #e8f7ed !important;
        color: #218838 !important;
        border-color: #9bd7ad !important;
      }
      .spp-payment-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
      }
      .spp-payment-badge.cash { background: #e8f3ff; color: #1976d2; }
      .spp-payment-badge.transfer { background: #e8f7ed; color: #218838; }
    `;
    document.head.appendChild(style);
  }

  function isCashPayment(row) {
    return Boolean(String(row?.keterangan_pembayaran || "").trim());
  }

  // Tambahkan keterangan pembayaran ke data SPP tahunan.
  if (typeof window.loadAllSppForYear === "function") {
    const originalLoadAllSppForYear = window.loadAllSppForYear;

    window.loadAllSppForYear = async function (tahun) {
      const rows = await originalLoadAllSppForYear(tahun);
      if (!supabase || !rows?.length) return rows || [];

      const ids = rows.map((row) => row.id).filter(Boolean);
      const detailMap = new Map();
      const chunkSize = 500;

      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from("spp")
          .select("id,keterangan_pembayaran")
          .in("id", chunk);

        if (error) {
          console.warn("Gagal memuat jenis pembayaran SPP:", error);
          continue;
        }

        (data || []).forEach((row) => {
          detailMap.set(String(row.id), row.keterangan_pembayaran || "");
        });
      }

      return rows.map((row) => ({
        ...row,
        keterangan_pembayaran:
          detailMap.get(String(row.id)) || row.keterangan_pembayaran || ""
      }));
    };
  }

  // Setelah matrix dirender, bedakan warna Lunas Cash vs Transfer.
  if (typeof window.renderSppTahunanTable === "function") {
    const originalRenderSppTahunanTable = window.renderSppTahunanTable;

    window.renderSppTahunanTable = function () {
      originalRenderSppTahunanTable();
      ensurePaymentTypeStyles();

      // sppTahunanData adalah global lexical variable dari spp.js.
      const rows = Array.isArray(sppTahunanData) ? sppTahunanData : [];
      const byId = new Map(rows.map((row) => [String(row.id), row]));

      document.querySelectorAll("#daftarSppAnnual .spp-cell.spp-lunas").forEach((button) => {
        const match = button.getAttribute("onclick")?.match(/bukaDetailSpp\('([^']+)'\)/);
        const id = match?.[1];
        const row = id ? byId.get(String(id)) : null;

        button.classList.remove(CASH_CLASS, TRANSFER_CLASS);

        if (row && isCashPayment(row)) {
          button.classList.add(CASH_CLASS);
          button.title = `${button.title || ""} · Cash`;
        } else {
          button.classList.add(TRANSFER_CLASS);
          button.title = `${button.title || ""} · Transfer`;
        }
      });
    };
  }

  // Tambahkan jenis pembayaran pada detail SPP.
  if (typeof window.bukaDetailSpp === "function") {
    const originalBukaDetailSpp = window.bukaDetailSpp;

    window.bukaDetailSpp = async function (id) {
      await originalBukaDetailSpp(id);

      if (!supabase || !id) return;

      const { data, error } = await supabase
        .from("spp")
        .select("id,status,keterangan_pembayaran")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return;

      ensurePaymentTypeStyles();

      const card = document.querySelector("#sppDetailModal .spp-modal-card");
      if (!card) return;

      card.querySelectorAll(".spp-payment-type-detail").forEach((el) => el.remove());

      if (data.status !== "Lunas") return;

      const cash = isCashPayment(data);
      const label = cash ? "Cash" : "Transfer";
      const icon = cash ? "💵" : "🏦";
      const className = cash ? "cash" : "transfer";

      const section = document.createElement("div");
      section.className = "spp-detail-section spp-payment-type-detail";
      section.innerHTML = `
        <div class="spp-detail-label">Jenis Pembayaran</div>
        <div><span class="spp-payment-badge ${className}">${icon} ${label}</span></div>
      `;

      const grid = card.querySelector(".spp-modal-grid");
      if (grid) grid.insertAdjacentElement("afterend", section);
      else card.prepend(section);

      if (cash && data.keterangan_pembayaran) {
        const note = document.createElement("div");
        note.className = "spp-detail-section spp-payment-type-detail";
        note.innerHTML = `
          <div class="spp-detail-label">Keterangan Pembayaran</div>
          <div class="spp-note"></div>
        `;
        note.querySelector(".spp-note").textContent = data.keterangan_pembayaran;
        section.insertAdjacentElement("afterend", note);
      }
    };
  }
})();
