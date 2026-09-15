// ============================================================
// GANTARIKU — SPP PAYMENT METHOD
// ============================================================
// Membedakan CASH dan TRANSFER menggunakan spp.metode_pembayaran.

(function () {
  "use strict";

  const CASH_CLASS = "spp-payment-cash";
  const TRANSFER_CLASS = "spp-payment-transfer";

  function ensureStyles() {
    if (document.getElementById("spp-payment-method-styles")) return;
    const style = document.createElement("style");
    style.id = "spp-payment-method-styles";
    style.textContent = `
      .spp-cell.${CASH_CLASS} { background:#e8f3ff !important; color:#1976d2 !important; border-color:#90caf9 !important; }
      .spp-cell.${CASH_CLASS}:hover { background:#dbeeff !important; }
      .spp-cell.${TRANSFER_CLASS} { background:#e8f7ed !important; color:#218838 !important; border-color:#9bd7ad !important; }
      .spp-payment-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border-radius:999px; font-size:12px; font-weight:700; line-height:1; }
      .spp-payment-badge.cash { background:#e8f3ff; color:#1976d2; }
      .spp-payment-badge.transfer { background:#e8f7ed; color:#218838; }
    `;
    document.head.appendChild(style);
  }

  function getType(row) {
    const value = String(row?.metode_pembayaran || "").trim().toLowerCase();
    return value === "cash" || value === "transfer" ? value : "";
  }

  if (typeof window.loadAllSppForYear === "function") {
    const originalLoad = window.loadAllSppForYear;
    window.loadAllSppForYear = async function (tahun) {
      const rows = await originalLoad(tahun);
      if (!supabase || !rows?.length) return rows || [];

      const ids = rows.map((row) => row.id).filter(Boolean);
      const map = new Map();
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        const { data, error } = await supabase
          .from("spp")
          .select("id,metode_pembayaran,keterangan_pembayaran")
          .in("id", chunk);
        if (error) {
          console.warn("Gagal memuat metode pembayaran SPP:", error);
          continue;
        }
        (data || []).forEach((row) => map.set(String(row.id), row));
      }

      return rows.map((row) => ({
        ...row,
        ...(map.get(String(row.id)) || {})
      }));
    };
  }

  if (typeof window.renderSppTahunanTable === "function") {
    const originalRender = window.renderSppTahunanTable;
    window.renderSppTahunanTable = function () {
      originalRender();
      ensureStyles();

      const rows = Array.isArray(sppTahunanData) ? sppTahunanData : [];
      const byId = new Map(rows.map((row) => [String(row.id), row]));

      document.querySelectorAll("#daftarSppAnnual .spp-cell.spp-lunas").forEach((button) => {
        const match = button.getAttribute("onclick")?.match(/bukaDetailSpp\('([^']+)'\)/);
        const row = match ? byId.get(String(match[1])) : null;
        const type = getType(row);
        button.classList.remove(CASH_CLASS, TRANSFER_CLASS);
        if (type === "cash") {
          button.classList.add(CASH_CLASS);
          button.title = `${button.title || ""} · Cash`;
        } else if (type === "transfer") {
          button.classList.add(TRANSFER_CLASS);
          button.title = `${button.title || ""} · Transfer`;
        }
      });
    };
  }

  if (typeof window.bukaDetailSpp === "function") {
    const originalDetail = window.bukaDetailSpp;
    window.bukaDetailSpp = async function (id) {
      await originalDetail(id);
      if (!supabase || !id) return;

      const { data, error } = await supabase
        .from("spp")
        .select("id,status,metode_pembayaran,keterangan_pembayaran")
        .eq("id", id)
        .maybeSingle();
      if (error || !data || data.status !== "Lunas") return;

      const type = getType(data);
      if (!type) return;
      ensureStyles();

      const card = document.querySelector("#sppDetailModal .spp-modal-card");
      if (!card) return;
      card.querySelectorAll(".spp-payment-method-detail").forEach((el) => el.remove());

      const cash = type === "cash";
      const section = document.createElement("div");
      section.className = "spp-detail-section spp-payment-method-detail";
      section.innerHTML = `
        <div class="spp-detail-label">Jenis Pembayaran</div>
        <div><span class="spp-payment-badge ${cash ? "cash" : "transfer"}">${cash ? "💵 Cash" : "🏦 Transfer"}</span></div>
      `;

      const grid = card.querySelector(".spp-modal-grid");
      if (grid) grid.insertAdjacentElement("afterend", section);
      else card.prepend(section);

      if (cash && data.keterangan_pembayaran) {
        const note = document.createElement("div");
        note.className = "spp-detail-section spp-payment-method-detail";
        note.innerHTML = `<div class="spp-detail-label">Keterangan Pembayaran</div><div class="spp-note"></div>`;
        note.querySelector(".spp-note").textContent = data.keterangan_pembayaran;
        section.insertAdjacentElement("afterend", note);
      }
    };
  }
})();
