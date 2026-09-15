// ============================================================
// GANTARIKU — SPP VERIFICATION FIX
// ============================================================
// Override verification actions with explicit row confirmation.
// Prevents silent success when RLS/filter matches zero rows.

async function terimaPembayaranSpp(id) {
  if (!supabase) {
    appNotify("Supabase belum terhubung.");
    return false;
  }

  if (!id) {
    appNotify("ID pembayaran tidak ditemukan.");
    return false;
  }

  if (!confirmSpp("Terima pembayaran ini dan ubah status menjadi Lunas?")) {
    return false;
  }

  try {
    const tanggalBayar = getTodayWIBString();
    const dicatatOleh = currentUser?.id || null;

    const { data, error } = await supabase
      .from("spp")
      .update({
        status: "Lunas",
        tanggal_bayar: tanggalBayar,
        dicatat_oleh: dicatatOleh
      })
      .eq("id", id)
      .eq("status", "Menunggu Verifikasi")
      .select("id,status,tanggal_bayar,dicatat_oleh")
      .maybeSingle();

    if (error) {
      console.error("SPP verification update error:", error);
      throw error;
    }

    // Supabase can return no row when the filter matched nothing.
    if (!data) {
      appNotify(
        "Verifikasi tidak dilakukan. Data SPP mungkin sudah berubah atau statusnya bukan lagi Menunggu Verifikasi."
      );
      await loadSpp();
      return false;
    }

    if (data.status !== "Lunas") {
      appNotify("Verifikasi gagal: status pembayaran belum berubah menjadi Lunas.");
      await loadSpp();
      return false;
    }

    appNotify("Pembayaran berhasil diverifikasi dan status menjadi Lunas.");
    tutupDetailSpp();
    await loadSpp();
    return true;
  } catch (error) {
    console.error("Terima pembayaran:", error);
    appNotify(
      "Gagal memverifikasi pembayaran:\n\n" +
      (error?.message || "Terjadi kesalahan.")
    );
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
    !confirmSpp(
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
      appNotify(
        "Penolakan tidak dilakukan. Data SPP mungkin sudah berubah."
      );
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
