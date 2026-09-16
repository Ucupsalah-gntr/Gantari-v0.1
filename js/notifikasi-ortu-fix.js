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

function clearOrtuNotifRead(notificationKey) {
  if (!notificationKey) return;
  const readSet = getOrtuNotifReadSet();
  readSet.delete(String(notificationKey));
  saveOrtuNotifReadSet(readSet);
}

// ============================================================
// FOKUS KONTEKS NOTIFIKASI SPP
// ============================================================

async function fokusSppDariNotifikasi(context, attempt = 0) {
  if (!context || !document.getElementById("view")) return;

  const maxAttempts = 40;
  if (attempt >= maxAttempts) {
    console.warn("Gantariku: gagal menemukan target SPP dari notifikasi.", context);
    return;
  }

  const tbody = document.getElementById("daftarSppAnak");
  if (!tbody) {
    setTimeout(() => fokusSppDariNotifikasi(context, attempt + 1), 150);
    return;
  }

  if (context.siswaId && String(anakTerpilihId) !== String(context.siswaId)) {
    anakTerpilihId = context.siswaId;
    if (typeof renderView === "function") {
      renderView();
      setTimeout(() => fokusSppDariNotifikasi(context, attempt + 1), 150);
      return;
    }
  }

  const yearSelect = Array.from(document.querySelectorAll("select")).find((select) =>
    Array.from(select.options || []).some(
      (option) => String(option.value) === String(context.tahun)
    )
  );

  if (yearSelect && String(yearSelect.value) !== String(context.tahun)) {
    yearSelect.value = String(context.tahun);
    yearSelect.dispatchEvent(new Event("change", { bubbles: true }));
    if (typeof loadSppAnak === "function") {
      try {
        await loadSppAnak();
      } catch (error) {
        console.warn("Gantariku: gagal memuat ulang SPP setelah memilih tahun.", error);
      }
    }
    setTimeout(() => fokusSppDariNotifikasi(context, attempt + 1), 150);
    return;
  }

  if (typeof loadSppAnak === "function" && attempt === 0) {
    try {
      await loadSppAnak();
    } catch (error) {
      console.warn("Gantariku: gagal memuat ulang Status SPP dari notifikasi.", error);
    }
    setTimeout(() => fokusSppDariNotifikasi(context, attempt + 1), 100);
    return;
  }

  const rows = Array.from(tbody.querySelectorAll("tr"));
  if (!rows.length) {
    setTimeout(() => fokusSppDariNotifikasi(context, attempt + 1), 150);
    return;
  }

  const bulanTarget = Number(context.bulan);
  const tahunTarget = Number(context.tahun);
  const namaBulanTarget = String(namaBulan(bulanTarget) || "").toLowerCase();

  let targetRow = rows.find((row) => {
    const text = String(row.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const cocokBulan = namaBulanTarget && text.includes(namaBulanTarget);
    const cocokTahun = !tahunTarget || text.includes(String(tahunTarget));
    return cocokBulan && cocokTahun;
  });

  if (!targetRow && namaBulanTarget) {
    targetRow = rows.find((row) => {
      const text = String(row.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      return text.includes(namaBulanTarget);
    });
  }

  if (!targetRow) {
    setTimeout(() => fokusSppDariNotifikasi(context, attempt + 1), 150);
    return;
  }

  targetRow.style.transition = "box-shadow .2s ease, background-color .2s ease";
  targetRow.style.backgroundColor = "rgba(255, 193, 7, .12)";
  targetRow.style.boxShadow = "inset 4px 0 0 var(--primary)";
  targetRow.scrollIntoView({ behavior: "smooth", block: "center" });

  setTimeout(() => {
    targetRow.style.backgroundColor = "";
    targetRow.style.boxShadow = "";
  }, 2800);
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

      // SPP adalah notifikasi berbasis kondisi, bukan notifikasi sekali baca.
      // Selama tagihan masih Belum Bayar / Menunggu Verifikasi, notifikasi
      // tetap boleh muncul kembali meskipun sebelumnya sudah diklik.
      if (readSet.has(notificationKey)) {
        // Hapus status baca lama untuk SPP yang masih aktif.
        clearOrtuNotifRead(notificationKey);
      }

      items.push({
        id: notificationKey,
        icon: row.status === "Menunggu Verifikasi" ? "⏳" : "💳",
        text: `${anak.nama}: SPP ${namaBulan(Number(row.bulan))} ${row.tahun} ${row.status === "Menunggu Verifikasi" ? "menunggu verifikasi" : "belum lunas"}.`,
        action: "spp-anak",
        context: {
          siswaId: row.siswa_id,
          bulan: Number(row.bulan),
          tahun: Number(row.tahun)
        }
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
        action: "perkembangan-anak",
        context: {
          siswaId: row.siswa_id,
          tanggal: row.tanggal
        }
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
        const item = uniqueItems.find((entry) => entry.id === notificationId);

        // SPP JANGAN ditandai selesai hanya karena dibuka.
        // Notifikasi SPP akan berhenti muncul otomatis ketika statusnya
        // tidak lagi "Belum Bayar" / "Menunggu Verifikasi".
        if (target !== "spp-anak") {
          markOrtuNotifRead(notificationId);
        }

        if (item?.context?.siswaId) {
          anakTerpilihId = item.context.siswaId;
        }

        panel.classList.remove("show");

        if (target !== "spp-anak") {
          const countNow = Math.max(0, (Number.parseInt(count.textContent, 10) || 0) - 1);
          count.textContent = countNow ? String(countNow) : "";
          count.style.display = countNow ? "inline-flex" : "none";
          count.classList.toggle("is-hidden", !countNow);
        }

        if (window.__app && typeof window.__app.goTo === "function") {
          window.__app.goTo(target);

          if (target === "spp-anak" && item?.context) {
            setTimeout(() => fokusSppDariNotifikasi(item.context), 150);
          }
          return;
        }

        const navButton = document.querySelector(
          `.nav-item[onclick*="goTo('${target}')"]`
        );
        if (navButton) navButton.click();

        if (target === "spp-anak" && item?.context) {
          setTimeout(() => fokusSppDariNotifikasi(item.context), 150);
        }
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
