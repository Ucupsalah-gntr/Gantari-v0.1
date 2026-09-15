// ============================================================
// GANTARIKU — NOTIFIKASI ORANG TUA
// ============================================================

async function loadNotifikasi() {
  const panel = document.getElementById("notifPanel");
  const count = document.getElementById("notifCount");

  if (!supabase || !panel || !count) return;

  if (currentUserRole !== "ortu") {
    // Admin tetap menggunakan notifikasi yang sudah ada.
    if (typeof window.__gtrLoadNotifikasiAdmin === "function") {
      return window.__gtrLoadNotifikasiAdmin();
    }
    return;
  }

  await pastikanAnakOrangTuaDimuat();

  const ids = anakOrangTuaList.map((anak) => anak.id).filter(Boolean);
  const items = [];

  if (!ids.length) {
    count.style.display = "none";
    panel.innerHTML = `<div class="notif-empty">Belum ada notifikasi untuk akun Anda.</div>`;
    return;
  }

  try {
    const { data: spp, error: sppError } = await supabase
      .from("spp")
      .select("id,siswa_id,bulan,tahun,status,nominal,updated_at")
      .in("siswa_id", ids)
      .in("status", ["Belum Bayar", "Menunggu Verifikasi"])
      .order("updated_at", { ascending: false });

    if (sppError) throw sppError;

    (spp || []).slice(0, 8).forEach((row) => {
      const anak = anakOrangTuaList.find((x) => String(x.id) === String(row.siswa_id));
      if (!anak) return;
      const statusText = row.status === "Menunggu Verifikasi"
        ? "menunggu verifikasi"
        : "belum lunas";
      items.push({
        icon: row.status === "Menunggu Verifikasi" ? "⏳" : "💳",
        text: `${anak.nama}: SPP ${namaBulan(Number(row.bulan))} ${row.tahun} ${statusText}.`,
        action: "spp"
      });
    });

    const { data: perkembangan, error: perkembanganError } = await supabase
      .from("perkembangan")
      .select("id,siswa_id,tanggal,aspek,created_at")
      .in("siswa_id", ids)
      .order("created_at", { ascending: false })
      .limit(5);

    if (perkembanganError) throw perkembanganError;

    const seen = new Set();
    (perkembangan || []).forEach((row) => {
      const key = `${row.siswa_id}-${row.tanggal}`;
      if (seen.has(key)) return;
      seen.add(key);
      const anak = anakOrangTuaList.find((x) => String(x.id) === String(row.siswa_id));
      if (!anak) return;
      items.push({
        icon: "🌱",
        text: `${anak.nama}: perkembangan terbaru tersedia.`,
        action: "perkembangan"
      });
    });

    count.textContent = items.length > 0 ? String(items.length) : "";
    count.style.display = items.length > 0 ? "inline-flex" : "none";

    panel.innerHTML = items.length
      ? items.map((item) => `
          <button type="button" class="notif-item notif-item-action" data-notif-action="${item.action}">
            <span class="notif-icon">${item.icon}</span>
            <span>${escapeHtml(item.text)}</span>
          </button>
        `).join("")
      : `<div class="notif-empty">Semua aman. Tidak ada notifikasi baru.</div>`;

    panel.querySelectorAll("[data-notif-action]").forEach((button) => {
      button.addEventListener("click", () => {
        panel.classList.remove("show");
        const action = button.dataset.notifAction;
        if (action === "spp") {
          if (typeof window.__app?.navigateTo === "function") window.__app.navigateTo("status-spp");
        } else if (action === "perkembangan") {
          if (typeof window.__app?.navigateTo === "function") window.__app.navigateTo("perkembangan-anak");
        }
      });
    });
  } catch (error) {
    console.error("Error load notifikasi orang tua:", error);
    count.textContent = "!";
    count.style.display = "inline-flex";
    panel.innerHTML = `<div class="notif-empty notif-error">Notifikasi belum dapat dimuat. Silakan coba lagi.</div>`;
  }
}
