// ============================================================
// GANTARIKU — SPP VERIFICATION FIX
// ============================================================
// Admin verification uses protected Supabase RPCs.

async function terimaPembayaranSpp(id) {
  if (!supabase) {
    appNotify("Supabase belum terhubung.");
    return false;
  }

  if (!id) {
    appNotify("ID pembayaran tidak ditemukan.");
    return false;
  }

  if (!window.confirm("Terima pembayaran ini dan ubah status menjadi Lunas?")) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc(
      "verifikasi_pembayaran_spp",
      { p_spp_id: id }
    );

    if (error) {
      console.error("SPP verification RPC error:", error);
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row || row.status !== "Lunas") {
      appNotify("Verifikasi gagal: pembayaran belum berubah menjadi Lunas.");
      await loadSpp();
      return false;
    }

    appNotify("Pembayaran berhasil diverifikasi dan status menjadi Lunas.");
    tutupDetailSpp();
    await loadSpp();
    return true;
  } catch (error) {
    console.error("Terima pembayaran:", error);

    let message = error?.message || "Terjadi kesalahan.";

    if (error?.code === "42501") {
      message = "Akun yang digunakan bukan admin atau profil admin tidak ditemukan.";
    } else if (error?.code === "P0002") {
      message = "Pembayaran sudah berubah atau tidak lagi berstatus Menunggu Verifikasi.";
    }

    appNotify("Gagal memverifikasi pembayaran:\n\n" + message);
    return false;
  }
}

async function tolakPembayaranSpp(id) {
  if (!supabase) {
    appNotify("Supabase belum terhubung.");
    return false;
  }

  if (!id) {
    appNotify("ID pembayaran tidak ditemukan.");
    return false;
  }

  if (!window.confirm("Tolak bukti pembayaran ini? Status akan kembali menjadi Belum Bayar.")) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("spp")
      .update({
        status: "Belum Bayar",
        bukti_bayar_url: null,
        tanggal_bayar: null,
        catatan: "Bukti pembayaran ditolak oleh admin."
      })
      .eq("id", id)
      .eq("status", "Menunggu Verifikasi")
      .select("id,status")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      appNotify("Penolakan tidak dilakukan. Data SPP mungkin sudah berubah.");
      await loadSpp();
      return false;
    }

    appNotify("Bukti pembayaran ditolak dan status dikembalikan ke Belum Bayar.");
    tutupDetailSpp();
    await loadSpp();
    return true;
  } catch (error) {
    console.error("Tolak pembayaran:", error);
    appNotify("Gagal menolak pembayaran:\n\n" + (error?.message || "Terjadi kesalahan."));
    return false;
  }
}

async function tandaiLunas(id) {
  if (!supabase) {
    appNotify("Supabase belum terhubung.");
    return false;
  }

  if (!id) {
    appNotify("ID tagihan tidak ditemukan.");
    return false;
  }

  const tanggalDefault = getTodayWIBString();
  const tanggalInput = window.prompt(
    "Tanggal pembayaran (format YYYY-MM-DD):",
    tanggalDefault
  );

  if (tanggalInput === null) return false;

  const tanggal = String(tanggalInput).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    appNotify("Tanggal tidak valid. Gunakan format YYYY-MM-DD, contoh: 2026-09-15.");
    return false;
  }

  const keteranganInput = window.prompt(
    "Keterangan pembayaran cash (boleh dikosongkan):",
    ""
  );

  if (keteranganInput === null) return false;

  const keterangan = String(keteranganInput).trim();

  if (!window.confirm(
    "Simpan pembayaran sebagai Lunas?\n\n" +
    "Tanggal: " + tanggal + "\n" +
    "Keterangan: " + (keterangan || "—")
  )) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc(
      "tandai_lunas_spp",
      {
        p_spp_id: id,
        p_tanggal_bayar: tanggal,
        p_keterangan: keterangan || null
      }
    );

    if (error) {
      console.error("Manual SPP settlement RPC error:", error);
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row || row.status !== "Lunas") {
      appNotify("Gagal: tagihan belum berubah menjadi Lunas.");
      await loadSpp();
      return false;
    }

    appNotify("Tagihan berhasil ditandai Lunas dan keterangan pembayaran tersimpan.");
    tutupDetailSpp();
    await loadSpp();
    return true;
  } catch (error) {
    console.error("Tandai lunas:", error);

    let message = error?.message || "Terjadi kesalahan.";
    if (error?.code === "42501") {
      message = "Akun yang digunakan bukan admin atau profil admin tidak ditemukan.";
    } else if (error?.code === "P0002") {
      message = "Tagihan sudah berubah atau tidak lagi berstatus Belum Bayar.";
    }

    appNotify("Gagal menandai lunas:\n\n" + message);
    return false;
  }
}

// ============================================================
// TAMPILKAN KETERANGAN PEMBAYARAN CASH
// ============================================================
// Data keterangan disimpan di kolom keterangan_pembayaran.
// Versi bukaDetailSpp lama hanya menampilkan kolom catatan,
// sehingga keterangan cash tersimpan tetapi belum terlihat.

(function pasangTampilanKeteranganPembayaran() {
  const bukaDetailSppAsli = window.bukaDetailSpp;

  if (typeof bukaDetailSppAsli !== "function") return;

  window.bukaDetailSpp = async function (id) {
    await bukaDetailSppAsli(id);

    if (!supabase || !id) return;

    try {
      const { data, error } = await supabase
        .from("spp")
        .select("keterangan_pembayaran")
        .eq("id", id)
        .single();

      if (error) throw error;

      const keterangan = String(data?.keterangan_pembayaran || "").trim();
      if (!keterangan) return;

      const card = document.querySelector("#sppDetailModal .spp-modal-card");
      if (!card) return;

      const existing = card.querySelector("[data-spp-keterangan]");
      if (existing) existing.remove();

      const section = document.createElement("div");
      section.className = "spp-detail-section";
      section.setAttribute("data-spp-keterangan", "true");

      const label = document.createElement("div");
      label.className = "spp-detail-label";
      label.textContent = "Keterangan Pembayaran";

      const note = document.createElement("div");
      note.className = "spp-note";
      note.textContent = keterangan;

      section.appendChild(label);
      section.appendChild(note);

      const aksi = card.querySelector(".spp-detail-section button")?.closest(".spp-detail-section");
      if (aksi) {
        card.insertBefore(section, aksi);
      } else {
        card.appendChild(section);
      }
    } catch (error) {
      console.error("Gagal menampilkan keterangan pembayaran:", error);
    }
  };
})();
