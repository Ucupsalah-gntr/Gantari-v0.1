// ============================================================
// GANTARIKU — SPP VERIFICATION FIX
// ============================================================
// Admin verification uses a protected Supabase RPC.

async function terimaPembayaranSpp(id) {
  if (!supabase) {
    appNotify("Supabase belum terhubung.");
    return false;
  }

  if (!id) {
    appNotify("ID pembayaran tidak ditemukan.");
    return false;
  }

  // Jangan bergantung pada helper confirmSpp yang tidak tersedia
  // di semua versi aplikasi. Gunakan confirm bawaan browser.
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

  if (
    !window.confirm(
      "Tolak bukti pembayaran ini? Status akan kembali menjadi Belum Bayar."
    )
  ) {
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
    appNotify(
      "Gagal menolak pembayaran:\n\n" +
      (error?.message || "Terjadi kesalahan.")
    );
    return false;
  }
}
