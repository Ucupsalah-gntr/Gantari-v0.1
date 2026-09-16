// ============================================================
// GANTARIKU — NOTIFIKASI ORANG TUA
// Tidak mengubah notifikasi Admin.
// ============================================================

const gtrAdminLoadNotifikasi = window.loadNotifikasi;

const GTR_ORTU_NOTIF_READ_KEY = "gantariku_ortu_notif_read_v1";

function getOrtuNotifReadSet() {
  try {
    const raw = localStorage.getItem(GTR_ORTU_NOTIF_READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.warn("Gantariku: gagal membaca status notifikasi Orangtua:", error);
    return new Set();
  }
}

function saveOrtuNotifReadSet(readSet) {
  try {
    // Batasi penyimpanan agar localStorage tidak terus membesar.
    const values = Array.from(readSet).slice(-100);
    localStorage.setItem(GTR_ORTU_NOTIF_READ_KEY, JSON.stringify(values));
  } catch (error) {
    console.warn("Gantariku: gagal menyimpan status notifikasi Orangtua:", error);
  }
}

function markOrtuNotifRead(notificationKey) {
  if (!notificationKey) return;
  const readSet = getOrtuNotifReadSet();
  readSet.add(String(notificationKey));
  saveOrtuNotifReadSet(readSet);
}

async function loadNotifikasiOrtu() {
  const panel = document.getElementById("notifPanel");
  const count = document.getElementById("notifCount");
  if (!supabase || !panel || !count) return;

  await pastikanAnakOrangTuaDimuat();
  const ids = anakOrangTuaList.map((anak) => anak.id).filter(Boolean);
  const items = [];
  const readSet = getOrtuNotifReadSet();

  if (!ids.length) {
    count.textContent = "";
    count.style.display = "none";
    count.classList.add("is-hidden");
    panel.innerHTML = `<div class="notif-empty">Belum ada notifikasi untuk akun Anda.</div>`;
    return;
  }

  try {
    const { data: spp, error: sppError } = await supabase
      .from("spp")
      .select("id,siswa_id,bulan,tahun,status,nominal,updated_at")
      .in("siswa_id", ids)
      .in("status", ["Belum Bayar", "Menunggu Verifikasi"])
      .order("updated_at", { ascending: false })
      .limit(8);
    if (sppError) throw sppError;

    (spp || []).forEach((row) => {
      const anak = anakOrangTuaList.find((x) => String(x.id) === String(row.siswa_id));
      if (!anak) return;

      const notificationKey = `spp:${row.id}:${row.updated_at || row.status}`;
      if (readSet.has(notificationKey)) return;

      items.push({
        id: notificationKey,
        icon: row.status === "Menunggu Verifikasi" ? "⏳" : "💳",
        text: `${anak.nama}: SPP ${namaBulan(Number(row.bulan))} ${row.tahun} ${row.status === "Menunggu Verifikasi" ? "menunggu verifikasi" : "belum lunas"}.`,
        action: "spp-anak"
      });
    });

    const { data: perkembangan, error: perkembanganError } = await supabase
      .from("perkembangan")
      .select("id,siswa_id,tanggal,created_at")
      .in("siswa_id", ids)
      .order("created_at", { ascending: false })
      .limit(20);
    if (perkembanganError) throw perkembanganError;

    const seen = new Set();
    (perkembangan || []).forEach((row) => {
      const key = `${row.siswa_id}-${row.tanggal}`;
      if (seen.has(key)) return;
      seen.add(key);

      const anak = anakOrangTuaList.find((x) => String(x.id) === String(row.siswa_id));
      if (!anak) return;

      const notificationKey = `perkembangan:${row.id}:${row.created_at || row.tanggal}`;
      if (readSet.has(notificationKey)) return;

      items.push({
        id: notificationKey,
        icon: "🌱",
        text: `${anak.nama}: perkembangan terbaru tersedia.`,
        action: "perkembangan-anak"
      });
    });

    const uniqueItems = items.slice(0, 10);
    count.textContent = uniqueItems.length ? String(uniqueItems.length) : "";
    count.style.display = uniqueItems.length ? "inline-flex" : "none";
    count.classList.toggle("is-hidden", !uniqueItems.length);

    panel.innerHTML = uniqueItems.length
      ? uniqueItems.map((item) => `
          <button
            type="button"
            class="notif-item notif-item-action"
            data-notif-action="${item.action}"
            data-notif-id="${escapeHtml(item.id)}"
          >
            <span class="notif-icon">${item.icon}</span>
            <span>${escapeHtml(item.text)}</span>
          </button>
        `).join("")
      : `<div class="notif-empty">Semua aman. Tidak ada notifikasi baru.</div>`;

    panel.querySelectorAll("[data-notif-action]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const target = button.dataset.notifAction;
        const notificationId = button.dataset.notifId;

        // Tandai sudah dibaca SEBELUM berpindah halaman.
        // Dengan begitu badge tidak menghitungnya lagi saat kembali.
        markOrtuNotifRead(notificationId);

        panel.classList.remove("show");
        const countNow = Math.max(0, (Number.parseInt(count.textContent, 10) || 0) - 1);
        count.textContent = countNow ? String(countNow) : "";
        count.style.display = countNow ? "inline-flex" : "none";
        count.classList.toggle("is-hidden", !countNow);

        // Navigasi langsung melalui router aplikasi.
        if (window.__app && typeof window.__app.goTo === "function") {
          window.__app.goTo(target);
          return;
        }

        // Fallback bila app shell belum siap.
        const navButton = document.querySelector(
          `.nav-item[onclick*="goTo('${target}')"]`
        );
        if (navButton) navButton.click();
      });
    });
  } catch (error) {
    console.error("Error load notifikasi orang tua:", error);
    count.textContent = "!";
    count.style.display = "inline-flex";
    count.classList.remove("is-hidden");
    panel.innerHTML = `<div class="notif-empty notif-error">Notifikasi belum dapat dimuat. Silakan coba lagi.</div>`;
  }
}

window.loadNotifikasi = async function () {
  if (currentUserRole === "ortu") {
    return loadNotifikasiOrtu();
  }
  if (typeof gtrAdminLoadNotifikasi === "function") {
    return gtrAdminLoadNotifikasi();
  }
};
