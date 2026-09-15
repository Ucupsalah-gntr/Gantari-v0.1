// ============================================================
// GANTARIKU — FIX BUAT TAGIHAN BULANAN
// ============================================================
// Memperbaiki tombol "Buat Tagihan" yang sebelumnya memanggil
// confirmSpp(), padahal fungsi tersebut tidak tersedia.
// ============================================================

async function buatTagihanBulanan() {
  if (!supabase) {
    appNotify("Supabase belum terhubung.");
    return;
  }

  const now = getNowWIB();
  const bulanDefault = now.getMonth() + 1;
  const tahun = Number(
    document.getElementById("filterTahunSpp")?.value || now.getFullYear()
  );

  const inputBulan = window.prompt(
    `Bulan tagihan (1-12) untuk tahun ${tahun}:`,
    String(bulanDefault)
  );

  if (inputBulan === null) return;

  const bulanPilihan = Number(String(inputBulan).trim());

  if (
    !Number.isInteger(bulanPilihan) ||
    bulanPilihan < 1 ||
    bulanPilihan > 12
  ) {
    appNotify("Bulan tidak valid.");
    return;
  }

  const inputNominal = window.prompt(
    `Nominal SPP ${namaBulan(bulanPilihan)} ${tahun}:`,
    "150000"
  );

  if (inputNominal === null) return;

  const nominal = Number(
    String(inputNominal).replace(/[^0-9]/g, "")
  );

  if (!Number.isFinite(nominal) || nominal <= 0) {
    appNotify("Nominal tidak valid.");
    return;
  }

  const periode = `${namaBulan(bulanPilihan)} ${tahun}`;
  const pesan =
    `Buat tagihan ${periode} sebesar ${formatRupiah(nominal)} ` +
    `untuk semua siswa yang belum memiliki tagihan pada periode tersebut?`;

  if (!window.confirm(pesan)) return;

  try {
    await loadSiswaSppTahunan();

    const existing = await loadSppForMonth(bulanPilihan, tahun);
    const sudahAda = new Set(
      existing.map((item) => String(item.siswa_id))
    );

    const belumAda = sppTahunanSiswa.filter(
      (siswa) => !sudahAda.has(String(siswa.id))
    );

    if (belumAda.length === 0) {
      appNotify(`Semua siswa sudah memiliki tagihan ${periode}.`, "info");
      return;
    }

    const payload = belumAda.map((siswa) => ({
      siswa_id: siswa.id,
      bulan: bulanPilihan,
      tahun,
      nominal,
      status: "Belum Bayar",
      tanggal_bayar: null,
      dicatat_oleh: currentUser?.id || null
    }));

    const { error } = await supabase
      .from("spp")
      .insert(payload);

    if (error) throw error;

    appNotify(
      `Berhasil membuat ${payload.length} tagihan SPP ${periode}.`,
      "success"
    );

    await loadSpp();
  } catch (error) {
    console.error("Error buat tagihan bulanan:", error);

    if (error?.code === "23505") {
      appNotify(
        "Sebagian tagihan sudah dibuat oleh proses lain. Silakan muat ulang data SPP.",
        "warning"
      );
      await loadSpp().catch((reloadError) => {
        console.error("Reload SPP setelah konflik:", reloadError);
      });
      return;
    }

    appNotify(
      "Gagal membuat tagihan bulanan:\n\n" +
        (error?.message || "Terjadi kesalahan."),
      "error"
    );
  }
}
