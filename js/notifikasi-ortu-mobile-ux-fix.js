// ============================================================
// GANTARIKU — NOTIFIKASI ORANGTUA MOBILE UX FIX
// Dijalankan setelah app.js.
// Satu fix aman untuk: fokus SPP, notifikasi penolakan, preview upload.
// ============================================================

(function () {
  "use strict";

  const ROLE_ORANGTUA = "ortu";
  const REJECT_NOTE = "Bukti pembayaran ditolak oleh admin.";
  const READ_KEY = "gantariku_ortu_notif_read_v1";

  function getRole() {
    try {
      if (typeof currentUserRole !== "undefined" && currentUserRole) {
        return String(currentUserRole).toLowerCase();
      }
    } catch (_) {}
    return String(window.currentUserRole || "").toLowerCase();
  }

  function isOrtu() {
    return getRole() === ROLE_ORANGTUA;
  }

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

  function escapeText(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  // ----------------------------------------------------------
  // FOKUS SPP DESKTOP + HP
  // ----------------------------------------------------------
  window.fokusSppDariNotifikasi = async function (context, attempt = 0) {
    if (!context || !document.getElementById("view")) return;
    if (attempt >= 40) return;

    const tbody = document.getElementById("daftarSppAnak");
    const mobileList = document.getElementById("daftarSppAnakMobile");

    if (!tbody || !mobileList) {
      setTimeout(() => window.fokusSppDariNotifikasi(context, attempt + 1), 150);
      return;
    }

    if (context.siswaId) {
      try {
        if (String(anakTerpilihId) !== String(context.siswaId)) {
          anakTerpilihId = context.siswaId;
          renderView();
          setTimeout(() => window.fokusSppDariNotifikasi(context, attempt + 1), 180);
          return;
        }
      } catch (_) {}
    }

    const yearSelect = document.getElementById("sppAnakTahun");
    if (yearSelect && String(yearSelect.value) !== String(context.tahun)) {
      yearSelect.value = String(context.tahun);
      try {
        if (window.__app && typeof window.__app.loadSppAnak === "function") {
          await window.__app.loadSppAnak();
        } else if (typeof loadSppAnak === "function") {
          await loadSppAnak();
        }
      } catch (error) {
        console.warn("Gantariku: gagal memuat tahun SPP target.", error);
      }
      setTimeout(() => window.fokusSppDariNotifikasi(context, attempt + 1), 180);
      return;
    }

    const bulanTarget = Number(context.bulan);
    const tahunTarget = Number(context.tahun);
    const namaTarget = String(
      typeof namaBulan === "function" ? namaBulan(bulanTarget) : ""
    ).toLowerCase();

    const mobileVisible =
      window.innerWidth <= 768 &&
      window.getComputedStyle(mobileList).display !== "none";

    let target = null;

    if (mobileVisible) {
      const cards = Array.from(mobileList.querySelectorAll(".ortu-spp-card"));
      target = cards.find((card) => {
        const text = String(card.textContent || "").replace(/\s+/g, " ").toLowerCase();
        return text.includes(namaTarget) && text.includes(String(tahunTarget));
      });
      if (!target && namaTarget) {
        target = cards.find((card) =>
          String(card.textContent || "").toLowerCase().includes(namaTarget)
        );
      }
    } else {
      const rows = Array.from(tbody.querySelectorAll("tr"));
      target = rows.find((row) => {
        const text = String(row.textContent || "").replace(/\s+/g, " ").toLowerCase();
        return text.includes(namaTarget) && text.includes(String(tahunTarget));
      });
      if (!target && namaTarget) {
        target = rows.find((row) =>
          String(row.textContent || "").toLowerCase().includes(namaTarget)
        );
      }
    }

    if (!target) {
      setTimeout(() => window.fokusSppDariNotifikasi(context, attempt + 1), 180);
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
  // NOTIFIKASI ORANGTUA: PENOLAKAN PEMBAYARAN
  // Sumber data adalah catatan penolakan + status Belum Bayar.
  // ----------------------------------------------------------
  async function appendRejectedNotifications() {
    if (!isOrtu() || !supabase) return;

    const panel = document.getElementById("notifPanel");
    const count = document.getElementById("notifCount");
    if (!panel || !count) return;

    try {
      if (typeof pastikanAnakOrangTuaDimuat === "function") {
        await pastikanAnakOrangTuaDimuat();
      }

      const ids = (anakOrangTuaList || []).map((x) => x.id).filter(Boolean);
      if (!ids.length) return;

      const { data, error } = await supabase
        .from("spp")
        .select("id,siswa_id,bulan,tahun,status,catatan,updated_at")
        .in("siswa_id", ids)
        .eq("status", "Belum Bayar")
        .eq("catatan", REJECT_NOTE)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      panel.querySelectorAll("[data-gtr-rejected-spp]").forEach((el) => el.remove());

      const readSet = getReadSet();

      (data || []).forEach((row) => {
        const key = `spp-rejected:${row.id}:${row.updated_at || REJECT_NOTE}`;
        if (readSet.has(key)) return;

        const anak = (anakOrangTuaList || []).find(
          (x) => String(x.id) === String(row.siswa_id)
        );
        if (!anak) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "notif-item notif-item-action";
        button.dataset.gtrRejectedSpp = "1";
        button.dataset.notifAction = "spp-anak";
        button.dataset.notifId = key;

        button.innerHTML = `
          <span class="notif-icon">⚠️</span>
          <span>${escapeText(anak.nama)}: bukti SPP ${escapeText(namaBulan(row.bulan))} ${escapeText(row.tahun)} ditolak. Silakan kirim ulang bukti pembayaran.</span>
        `;

        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          markRead(key);
          if (row.siswa_id) anakTerpilihId = row.siswa_id;
          panel.classList.remove("show");
          if (window.__app && typeof window.__app.goTo === "function") {
            window.__app.goTo("spp-anak");
          }
          setTimeout(() => window.fokusSppDariNotifikasi({
            siswaId: row.siswa_id,
            bulan: Number(row.bulan),
            tahun: Number(row.tahun)
          }), 200);
        });

        panel.appendChild(button);
      });

      const total = panel.querySelectorAll("[data-notif-action]").length;
      count.textContent = total ? String(total) : "";
      count.style.display = total ? "inline-flex" : "none";
      count.classList.toggle("is-hidden", !total);

      if (!total) {
        panel.innerHTML = `<div class="notif-empty">Semua aman. Tidak ada notifikasi baru.</div>`;
      }
    } catch (error) {
      console.warn("Gantariku: gagal memuat notifikasi penolakan SPP.", error);
    }
  }

  // ----------------------------------------------------------
  // WRAP LOAD NOTIFIKASI
  // Base loader lama tetap dipakai; kita hanya menambahkan notifikasi reject.
  // ----------------------------------------------------------
  const previousLoadNotifikasi = window.loadNotifikasi;
  if (typeof previousLoadNotifikasi === "function") {
    window.loadNotifikasi = async function (...args) {
      const result = await previousLoadNotifikasi.apply(this, args);
      if (isOrtu()) await appendRejectedNotifications();
      return result;
    };
  }

  // ----------------------------------------------------------
  // PREVIEW FILE SEBELUM UPLOAD
  // ----------------------------------------------------------
  function closePreviewModal() {
    const old = document.getElementById("gtrSppUploadPreview");
    if (old) old.remove();
  }

  function showUploadPreview(sppId, file, proceed) {
    closePreviewModal();

    const overlay = document.createElement("div");
    overlay.id = "gtrSppUploadPreview";
    overlay.style.cssText = [
      "position:fixed", "inset:0", "z-index:99999", "background:rgba(15,23,42,.72)",
      "display:flex", "align-items:center", "justify-content:center", "padding:16px", "box-sizing:border-box"
    ].join(";");

    const card = document.createElement("div");
    card.style.cssText = [
      "width:min(92vw,520px)", "max-height:92vh", "overflow:auto", "background:#fff", "border-radius:22px",
      "padding:18px", "box-shadow:0 20px 60px rgba(0,0,0,.25)", "box-sizing:border-box"
    ].join(";");

    const title = document.createElement("div");
    title.innerHTML = "<strong>Periksa bukti pembayaran</strong><div style='font-size:12px;color:#64748b;margin-top:4px'>Pastikan gambar ini adalah bukti pembayaran yang benar.</div>";

    const previewWrap = document.createElement("div");
    previewWrap.style.cssText = "margin-top:14px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;overflow:hidden;display:flex;justify-content:center;align-items:center;min-height:220px;";

    let objectUrl = null;
    if (file.type && file.type.startsWith("image/")) {
      objectUrl = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = objectUrl;
      img.alt = "Preview bukti pembayaran";
      img.style.cssText = "display:block;max-width:100%;max-height:55vh;width:auto;height:auto;object-fit:contain;";
      previewWrap.appendChild(img);
    } else if (file.type === "application/pdf") {
      objectUrl = URL.createObjectURL(file);
      const frame = document.createElement("iframe");
      frame.src = objectUrl;
      frame.title = "Preview PDF bukti pembayaran";
      frame.style.cssText = "width:100%;height:55vh;border:0;";
      previewWrap.appendChild(frame);
    } else {
      previewWrap.innerHTML = "<div style='padding:30px;text-align:center;color:#64748b'>Format file ini tidak dapat dipreview.</div>";
    }

    const info = document.createElement("div");
    info.style.cssText = "font-size:12px;color:#475569;margin-top:10px;text-align:center;word-break:break-word;";
    info.textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:16px;";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn secondary";
    cancel.textContent = "Batal";
    cancel.onclick = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      const input = document.getElementById(`fileSpp_${sppId}`);
      if (input) input.value = "";
      closePreviewModal();
      if (typeof appNotify === "function") appNotify("Upload dibatalkan. File tidak dikirim.");
    };

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "btn";
    confirm.textContent = "✓ Ya, kirim bukti ini";
    confirm.onclick = async () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      closePreviewModal();
      await proceed();
    };

    actions.appendChild(cancel);
    actions.appendChild(confirm);

    card.appendChild(title);
    card.appendChild(previewWrap);
    card.appendChild(info);
    card.appendChild(actions);
    overlay.appendChild(card);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cancel.click();
    });

    document.body.appendChild(overlay);
  }

  // App.js sudah mengambil referensi upload ke window.__app.
  // Bungkus referensi itu agar preview terjadi sebelum upload, tanpa mengubah
  // fungsi upload asli.
  const originalUpload = window.__app && window.__app.uploadBuktiSpp;
  if (typeof originalUpload === "function") {
    window.__app.uploadBuktiSpp = function (sppId, file) {
      if (!file) return;

      const imageOrPdf =
        (file.type && file.type.startsWith("image/")) ||
        file.type === "application/pdf";

      if (!imageOrPdf) {
        return originalUpload(sppId, file);
      }

      return showUploadPreview(sppId, file, async () => {
        // Upload asli sudah memiliki confirm teks sendiri. Kita lewati hanya
        // dialog teks itu setelah user menyetujui preview visual.
        const oldConfirm = window.confirm;
        try {
          window.confirm = () => true;
          const result = await originalUpload(sppId, file);

          // Setelah upload sukses, hapus catatan penolakan lama agar tidak
          // muncul sebagai notifikasi reject untuk pengiriman berikutnya.
          try {
            const { data } = await supabase
              .from("spp")
              .select("status")
              .eq("id", sppId)
              .maybeSingle();

            if (data?.status === "Menunggu Verifikasi") {
              await supabase
                .from("spp")
                .update({ catatan: null })
                .eq("id", sppId);
            }
          } catch (cleanupError) {
            console.warn("Gantariku: gagal membersihkan catatan penolakan lama.", cleanupError);
          }

          return result;
        } finally {
          window.confirm = oldConfirm;
        }
      });
    };
  }

  // ----------------------------------------------------------
  // PENOLAKAN ADMIN
  // - status => Belum Bayar (fungsi asli)
  // - refresh notif admin segera
  // - file bukti lama dihapus dari Storage setelah penolakan berhasil
  // ----------------------------------------------------------
  const originalReject = window.__app && window.__app.tolakPembayaranSpp;
  if (typeof originalReject === "function") {
    window.__app.tolakPembayaranSpp = async function (id) {
      let oldPath = null;

      try {
        if (supabase && id) {
          const { data } = await supabase
            .from("spp")
            .select("bukti_bayar_url")
            .eq("id", id)
            .maybeSingle();
          oldPath = data?.bukti_bayar_url || null;
        }
      } catch (_) {}

      const result = await originalReject(id);

      if (result) {
        if (oldPath && supabase) {
          try {
            const path = typeof getBuktiPathOrtu === "function"
              ? getBuktiPathOrtu(oldPath)
              : oldPath;
            if (path) {
              await supabase.storage.from("bukti-pembayaran").remove([path]);
            }
          } catch (storageError) {
            console.warn("Gantariku: bukti lama gagal dihapus dari Storage.", storageError);
          }
        }

        // Admin: notifikasi Menunggu Verifikasi harus langsung hilang.
        if (getRole() === "admin") {
          try {
            if (typeof window.__app.loadNotifikasi === "function") {
              await window.__app.loadNotifikasi();
            }
          } catch (_) {}
        }
      }

      return result;
    };
  }
})();
