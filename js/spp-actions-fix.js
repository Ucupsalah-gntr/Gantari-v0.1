// ============================================================
// GANTARIKU — SPP ACTIONS FIX
// ============================================================
// Menjaga alur pembayaran manual CASH dan verifikasi TRANSFER.
// - CASH: minta tanggal + keterangan, lalu RPC tandai_lunas_spp
// - TRANSFER: gunakan RPC verifikasi_pembayaran_spp
// ============================================================

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
    "Tanggal pembayaran cash (format YYYY-MM-DD):",
    tanggalDefault
  );

  if (tanggalInput === null) return false;

  const tanggal = String(tanggalInput).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    appNotify("Tanggal tidak valid. Gunakan format YYYY-MM-DD, contoh: 2026-09-15.", "warning");
    return false;
  }

  const keteranganInput = window.prompt(
    "Keterangan pembayaran cash (boleh dikosongkan):",
    ""
  );

  if (keteranganInput === null) return false;

  const keterangan = String(keteranganInput).trim();

  const pesan =
    "Simpan pembayaran sebagai Lunas?\n\n" +
    "Jenis: Cash\n" +
    "Tanggal: " + tanggal + "\n" +
    "Keterangan: " + (keterangan || "—");

  if (!window.confirm(pesan)) return false;

  try {
    const { data, error } = await supabase.rpc("tandai_lunas_spp", {
      p_spp_id: id,
      p_tanggal_bayar: tanggal,
      p_keterangan: keterangan || null
    });

    if (error) {
      console.error("Manual SPP settlement RPC error:", error);
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row || row.status !== "Lunas") {
      appNotify("Gagal: tagihan belum berubah menjadi Lunas.", "error");
      await loadSpp();
      return false;
    }

    appNotify("Pembayaran cash berhasil dicatat sebagai Lunas.", "success");
    tutupDetailSpp();
    await loadSpp();
    return true;
  } catch (error) {
    console.error("Tandai lunas cash:", error);

    let message = error?.message || "Terjadi kesalahan.";
    if (error?.code === "42501") {
      message = "Akun yang digunakan bukan admin atau profil admin tidak ditemukan.";
    } else if (error?.code === "P0002") {
      message = "Tagihan sudah berubah atau tidak lagi berstatus Belum Bayar.";
    }

    appNotify("Gagal mencatat pembayaran cash:\n\n" + message, "error");
    return false;
  }
}

async function terimaPembayaranSpp(id) {
  if (!supabase) {
    appNotify("Supabase belum terhubung.");
    return false;
  }

  if (!id) {
    appNotify("ID pembayaran tidak ditemukan.");
    return false;
  }

  if (!window.confirm("Terima bukti pembayaran ini dan ubah status menjadi Lunas?\n\nJenis pembayaran: Transfer")) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc("verifikasi_pembayaran_spp", {
      p_spp_id: id
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;

    if (!row || row.status !== "Lunas") {
      appNotify("Verifikasi gagal: pembayaran belum berubah menjadi Lunas.", "error");
      await loadSpp();
      return false;
    }

    // Bukti yang diverifikasi berasal dari alur pembayaran transfer.
    // Simpan tipe pembayaran agar tampilan centang membedakan transfer vs cash.
    const { error: methodError } = await supabase
      .from("spp")
      .update({ metode_pembayaran: "transfer" })
      .eq("id", id)
      .eq("status", "Lunas");

    if (methodError) throw methodError;

    appNotify("Pembayaran transfer berhasil diverifikasi dan menjadi Lunas.", "success");
    tutupDetailSpp();
    await loadSpp();
    return true;
  } catch (error) {
    console.error("Verifikasi pembayaran transfer:", error);

    let message = error?.message || "Terjadi kesalahan.";
    if (error?.code === "42501") {
      message = "Akun yang digunakan bukan admin atau profil admin tidak ditemukan.";
    } else if (error?.code === "P0002") {
      message = "Pembayaran sudah berubah atau tidak lagi berstatus Menunggu Verifikasi.";
    }

    appNotify("Gagal memverifikasi pembayaran:\n\n" + message, "error");
    return false;
  }
}
