// ============================================================
// GANTARIKU — NOTIFIKASI ORANGTUA STABLE FIX
// Dimuat paling akhir setelah app + realtime init.
// Tidak mengubah fungsi notifikasi Admin.
// ============================================================

(function () {
  "use strict";

  const READ_KEY = "gantariku_ortu_notif_read_v1";
  let lastFingerprint = "";

  function getReadSet() {
    try {
      const raw = localStorage.getItem(READ_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveReadSet(set) {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(set).slice(-100)));
    } catch (_) {}
  }

  function markRead(key) {
    if (!key) return;
    const set = getReadSet();
    set.add(String(key));
    saveReadSet(set);
  }

  function getRole() {
    try {
      if (typeof currentUserRole !== "undefined" && currentUserRole) {
        return String(currentUserRole).toLowerCase();
      }
    } catch (_) {}
    return String(window.currentUserRole || "").toLowerCase();
  }

  function renderItems(panel, count, items, force = false) {
    const fingerprint = items.map((item) => item.id).join("|");

    // Saat panel sedang terlihat, jangan sentuh DOM bila daftar belum berubah.
    // Ini mencegah efek berkedip akibat realtime/polling.
    if (!force && fingerprint === lastFingerprint) {
      return;
    }

    lastFingerprint = fingerprint;

    count.textContent = items.length ? String(items.length) : "";
    count.style.display = items.length ? "inline-flex" : "none";
    count.classList.toggle("is-hidden", !items.length);

    panel.innerHTML = items.length
      ? items.map((item) => `
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

        const notificationId = button.dataset.notifId;
        const item = items.find((entry) => entry.id === notificationId);
        const target = item?.action;

        // Hanya notifikasi sekali-baca yang ditandai selesai saat dibuka.
        // SPP Belum Bayar tetap aktif sampai status berubah.
        if (item?.readOnOpen) {
          markRead(notificationId);
        }

        if (item?.context?.siswaId) {
          anakTerpilihId = item.context.siswaId;
        }

        panel.classList.remove("show");
        const buttonBell = document.getElementById("notifButton");
        if (buttonBell) buttonBell.setAttribute("aria-expanded", "false");

        if (window.__app && typeof window.__app.goTo === "function") {
          window.__app.goTo(target);
        }

        if (target === "spp-anak" && item?.context && typeof window.fokusSppDariNotifikasi === "function") {
          setTimeout(() => window.fokusSppDariNotifikasi(item.context), 220);
        }
      });
    });
  }

  async function loadStableOrtuNotifications() {
    const panel = document.getElementById("notifPanel");
    const count = document.getElementById("notifCount");

    if (!supabase || getRole() !== "ortu" || !panel || !count) return;

    await pastikanAnakOrangTuaDimuat();
    const ids = (anakOrangTuaList || []).map((anak) => anak.id).filter(Boolean);

    if (!ids.length) {
      lastFingerprint = "";
      renderItems(panel, count, [], true);
      return;
    }

    const items = [];
    const readSet = getReadSet();

    try {
      // ----------------------------------------------------------
      // A. SPP BELUM BAYAR = notifikasi tindakan
      // Menunggu Verifikasi sengaja tidak masuk daftar orangtua.
      // ----------------------------------------------------------
      const { data: sppBelumBayar, error: sppError } = await supabase
        .from("spp")
        .select("id,siswa_id,bulan,tahun,status,updated_at")
        .in("siswa_id", ids)
        .eq("status", "Belum Bayar")
        .order("updated_at", { ascending: false })
        .limit(8);

      if (sppError) throw sppError;

      (sppBelumBayar || []).forEach((row) => {
        const anak = anakOrangTuaList.find((x) => String(x.id) === String(row.siswa_id));
        if (!anak) return;

        items.push({
          id: `spp:${row.id}:${row.updated_at || "belum-bayar"}`,
          icon: "💳",
          text: `${anak.nama}: SPP ${namaBulan(Number(row.bulan))} ${row.tahun} belum lunas.`,
          action: "spp-anak",
          readOnOpen: false,
          context: {
            siswaId: row.siswa_id,
            bulan: Number(row.bulan),
            tahun: Number(row.tahun)
          }
        });
      });

      // ----------------------------------------------------------
      // B. SPP DITOLAK = notifikasi sekali-baca
      // Saat status berubah menjadi Menunggu Verifikasi/Lunas,
      // query ini otomatis tidak lagi menemukannya.
      // ----------------------------------------------------------
      const { data: sppDitolak, error: rejectError } = await supabase
        .from("spp")
        .select("id,siswa_id,bulan,tahun,status,catatan,updated_at")
        .in("siswa_id", ids)
        .eq("status", "Belum Bayar")
        .eq("catatan", "Bukti pembayaran ditolak oleh admin.")
        .order("updated_at", { ascending: false })
        .limit(8);

      if (rejectError) throw rejectError;

      (sppDitolak || []).forEach((row) => {
        const anak = anakOrangTuaList.find((x) => String(x.id) === String(row.siswa_id));
        if (!anak) return;

        const id = `spp-ditolak:${row.id}:${row.updated_at || row.catatan}`;
        if (readSet.has(id)) return;

        items.unshift({
          id,
          icon: "⚠️",
          text: `${anak.nama}: bukti SPP ${namaBulan(Number(row.bulan))} ${row.tahun} ditolak. Silakan kirim ulang bukti pembayaran.`,
          action: "spp-anak",
          readOnOpen: true,
          context: {
            siswaId: row.siswa_id,
            bulan: Number(row.bulan),
            tahun: Number(row.tahun)
          }
        });
      });

      // ----------------------------------------------------------
      // C. PERKEMBANGAN = tetap seperti perilaku sebelumnya
      // ----------------------------------------------------------
      const { data: perkembangan, error: perkembanganError } = await supabase
        .from("perkembangan")
        .select("id,siswa_id,tanggal,created_at")
        .in("siswa_id", ids)
        .order("created_at", { ascending: false })
        .limit(20);

      if (perkembanganError) throw perkembanganError;

      const seen = new Set();
      (perkembangan || []).forEach((row) => {
        const keyDate = `${row.siswa_id}-${row.tanggal}`;
        if (seen.has(keyDate)) return;
        seen.add(keyDate);

        const anak = anakOrangTuaList.find((x) => String(x.id) === String(row.siswa_id));
        if (!anak) return;

        const id = `perkembangan:${row.id}:${row.created_at || row.tanggal}`;
        if (readSet.has(id)) return;

        items.push({
          id,
          icon: "🌱",
          text: `${anak.nama}: perkembangan terbaru tersedia.`,
          action: "perkembangan-anak",
          readOnOpen: true,
          context: {
            siswaId: row.siswa_id,
            tanggal: row.tanggal
          }
        });
      });

      // Prioritas pesan ditolak, lalu SPP, lalu perkembangan.
      const unique = [];
      const seenIds = new Set();
      items.forEach((item) => {
        if (seenIds.has(item.id)) return;
        seenIds.add(item.id);
        unique.push(item);
      });

      renderItems(panel, count, unique.slice(0, 10));

      if (typeof window.syncNotificationBadge === "function") {
        window.syncNotificationBadge();
      }
    } catch (error) {
      console.error("Gantariku: stable notification error:", error);
      // Jangan menghapus daftar yang sudah tampil hanya karena satu refresh gagal.
      count.textContent = panel.querySelectorAll("[data-notif-action]").length || "";
      count.style.display = count.textContent ? "inline-flex" : "none";
      count.classList.toggle("is-hidden", !count.textContent);
    }
  }

  // Ganti loader hanya untuk role orangtua.
  window.loadNotifikasi = async function () {
    if (getRole() === "ortu") {
      return loadStableOrtuNotifications();
    }
  };

  // app.js menyimpan toggle di window.__app dan fungsi tersebut memakai
  // loader lexical lama. Override khusus role orangtua agar membuka panel
  // selalu memakai loader stabil di atas.
  if (window.__app && typeof window.__app.toggleNotifikasi === "function") {
    window.__app.toggleNotifikasi = function () {
      const panel = document.getElementById("notifPanel");
      const button = document.getElementById("notifButton");
      if (!panel) return;

      const showing = !panel.classList.contains("show");
      panel.classList.toggle("show", showing);
      if (button) button.setAttribute("aria-expanded", showing ? "true" : "false");

      if (showing && getRole() === "ortu") {
        loadStableOrtuNotifications();
      }
    };
  }

  window.gantarikuLoadNotifikasiOrtuStable = loadStableOrtuNotifications;
})();
