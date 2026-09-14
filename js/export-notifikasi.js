function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((v) => {
          const x = String(v ?? "")
            .replace(/"/g, '""');

          return `"${x}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob(
    ["\ufeff" + csv],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(
    () =>
      URL.revokeObjectURL(url),
    500
  );
}


// ============================================================
// EXPORT SPP TAHUNAN
// ============================================================
async function exportSppCsv() {
  if (!supabase) return alert("Supabase belum terhubung.");

  const tahun = Number(
    document.getElementById("filterTahunSpp")?.value ||
      (typeof sppTahunanTahun !== "undefined" && sppTahunanTahun) ||
      (typeof getNowWIB === "function" ? getNowWIB().getFullYear() : new Date().getFullYear())
  );
  const kelas = document.getElementById("filterKelasSpp")?.value || "";
  const cari = (document.getElementById("filterCariSpp")?.value || "").trim().toLowerCase();
  const statusFilter = document.getElementById("filterStatusSpp")?.value || "";

  try {
    let siswa = typeof sppTahunanSiswa !== "undefined" ? sppTahunanSiswa : [];
    let data = typeof sppTahunanData !== "undefined" ? sppTahunanData : [];

    if (!siswa.length) {
      const { data: siswaData, error: siswaError } = await supabase
        .from("siswa")
        .select("id,nama,nis,kelas")
        .order("nama", { ascending: true });
      if (siswaError) throw siswaError;
      siswa = siswaData || [];
    }

    if (!data.length || (typeof sppTahunanTahun !== "undefined" && Number(sppTahunanTahun) !== tahun)) {
      const rows = [];
      let from = 0;
      const size = 1000;
      while (true) {
        const { data: batch, error } = await supabase
          .from("spp")
          .select("id,siswa_id,bulan,tahun,nominal,status,tanggal_bayar")
          .eq("tahun", tahun)
          .range(from, from + size - 1);
        if (error) throw error;
        rows.push(...(batch || []));
        if (!batch || batch.length < size) break;
        from += size;
      }
      data = rows;
    }

    const visible = siswa.filter((s) => {
      const hay = `${s.nama || ""} ${s.nis || ""}`.toLowerCase();
      if (kelas && s.kelas !== kelas) return false;
      if (cari && !hay.includes(cari)) return false;
      if (statusFilter) {
        const rowHasStatus = data.some((x) => String(x.siswa_id) === String(s.id) && x.status === statusFilter);
        if (!rowHasStatus) return false;
      }
      return true;
    });

    const bulanNama = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const lookup = new Map(data.map((x) => [`${x.siswa_id}-${x.bulan}`, x]));
    const rows = [["Nama", "NIS", "Kelas", ...bulanNama, "Total Lunas", "Total Belum Lunas"]];

    visible.forEach((s) => {
      let lunas = 0;
      let belum = 0;
      const bulanCells = bulanNama.map((_, i) => {
        const rec = lookup.get(`${s.id}-${i + 1}`);
        if (!rec) return "";
        if (rec.status === "Lunas") lunas++; else belum++;
        return rec.status || "";
      });
      rows.push([s.nama || "", s.nis || "", s.kelas || "", ...bulanCells, lunas, belum]);
    });

    downloadCsv(`gantariku-spp-tahunan-${tahun}.csv`, rows);
  } catch (error) {
    console.error("Export SPP tahunan:", error);
    alert("Gagal export SPP tahunan:\n\n" + (error?.message || "Terjadi kesalahan."));
  }
}


// ============================================================
// EXPORT ABSENSI GURU
// ============================================================

async function exportAbsensiGuruCsv() {
  if (!supabase) {
    return alert(
      "Supabase belum terhubung."
    );
  }

  const dari =
    document.getElementById(
      "guruAbsenTanggalDari"
    )?.value;

  const sampai =
    document.getElementById(
      "guruAbsenTanggalSampai"
    )?.value;

  const status =
    document.getElementById(
      "guruAbsenStatus"
    )?.value;

  let query =
    supabase
      .from("absensi_guru")
      .select(
        "tanggal,status,keterangan,guru:guru_id(nama,email)"
      )
      .gte(
        "tanggal",
        dari
      )
      .lte(
        "tanggal",
        sampai
      )
      .order(
        "tanggal",
        {
          ascending: false,
        }
      );

  if (status) {
    query =
      query.eq(
        "status",
        status
      );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    return alert(
      "Gagal export absensi guru: " +
        error.message
    );
  }

  const rows = [
    [
      "Tanggal",
      "Guru/Pelatih",
      "Email",
      "Status",
      "Keterangan",
    ],
  ];

  (data || []).forEach(
    (x) =>
      rows.push([
        x.tanggal || "",
        x.guru?.nama || "",
        x.guru?.email || "",
        x.status || "",
        x.keterangan || "",
      ])
  );

  downloadCsv(
    `gantariku-absensi-guru-${dari}-${sampai}.csv`,
    rows
  );
}


// ============================================================
// EXPORT REKAP ABSENSI
// ============================================================

async function exportRekapAbsensiCsv() {
  if (!supabase) {
    return alert(
      "Supabase belum terhubung."
    );
  }

  const dari =
    document.getElementById(
      "rekapDari"
    )?.value;

  const sampai =
    document.getElementById(
      "rekapSampai"
    )?.value;

  const kelas =
    document.getElementById(
      "rekapKelas"
    )?.value;

  const {
    data,
    error,
  } =
    await supabase
      .from("absensi")
      .select(
        "tanggal,status,keterangan,siswa:siswa_id(nama,nis,kelas)"
      )
      .gte(
        "tanggal",
        dari
      )
      .lte(
        "tanggal",
        sampai
      )
      .order(
        "tanggal",
        {
          ascending: false,
        }
      );

  if (error) {
    return alert(
      "Gagal export rekap absensi: " +
        error.message
    );
  }

  const hasil =
    (data || []).filter(
      (x) =>
        !kelas ||
        x.siswa?.kelas ===
          kelas
    );

  const rows = [
    [
      "Tanggal",
      "Nama",
      "NIS",
      "Kelas",
      "Status",
      "Keterangan",
    ],
  ];

  hasil.forEach(
    (x) =>
      rows.push([
        x.tanggal || "",
        x.siswa?.nama || "",
        x.siswa?.nis || "",
        x.siswa?.kelas || "",
        x.status || "",
        x.keterangan || "",
      ])
  );

  downloadCsv(
    `gantariku-rekap-absensi-${dari}-${sampai}.csv`,
    rows
  );
}


// ============================================================
// NOTIFIKASI
// ============================================================

let gantarikuRealtimeChannel =
  null;

let notifikasiRefreshTimer =
  null;


// ------------------------------------------------------------
// Toggle panel
// ------------------------------------------------------------

function toggleNotifikasi() {
  const panel =
    document.getElementById(
      "notifPanel"
    );

  if (!panel) return;

  panel.classList.toggle(
    "show"
  );

  if (
    panel.classList.contains(
      "show"
    )
  ) {
    loadNotifikasi();
  }
}


// ------------------------------------------------------------
// Load notifikasi
// ------------------------------------------------------------

async function loadNotifikasi() {

  const panel =
    document.getElementById("notifPanel");

  const count =
    document.getElementById("notifCount");

  if (
    !supabase ||
    currentUserRole !== "admin" ||
    !panel ||
    !count
  ) {
    return;
  }

  const pembayaran = [];
  const perhatian = [];

  try {

    const now =
      getNowWIB();

    const bulan =
      now.getMonth() + 1;

    const tahun =
      now.getFullYear();

    const tanggal =
      getTodayWIBString();


    // ========================================================
    // A. PEMBAYARAN MENUNGGU VERIFIKASI
    //    Tidak dibatasi bulan berjalan.
    // ========================================================

    const {
      data: pending,
      error: pendingError
    } = await supabase
      .from("spp")
      .select(`
        id,
        bulan,
        tahun,
        nominal,
        updated_at,
        siswa:siswa_id (
          nama,
          kelas
        )
      `)
      .eq(
        "status",
        "Menunggu Verifikasi"
      )
      .order(
        "updated_at",
        {
          ascending: false
        }
      );

    if (pendingError) {
      throw pendingError;
    }

    (pending || [])
      .slice(0, 10)
      .forEach((spp) => {
        pembayaran.push({
          id: spp.id,
          bulan: Number(spp.bulan),
          tahun: Number(spp.tahun),
          nama: spp.siswa?.nama || "Siswa",
          kelas: spp.siswa?.kelas || "-",
          nominal: spp.nominal || 0,
          waktu: spp.updated_at
        });
      });


    // ========================================================
    // B. SPP BULAN BERJALAN
    // ========================================================

    const {
      data: sppBelumBayar,
      error: sppError
    } = await supabase
      .from("spp")
      .select("id")
      .eq("bulan", bulan)
      .eq("tahun", tahun)
      .eq("status", "Belum Bayar");

    if (sppError) {
      throw sppError;
    }

    if ((sppBelumBayar || []).length > 0) {
      perhatian.push(
        `💳 ${sppBelumBayar.length} tagihan SPP ${namaBulan(bulan)} ${tahun} belum lunas.`
      );
    }


    // ========================================================
    // C. ABSENSI GURU
    // ========================================================

    const {
      data: absensiGuru,
      error: agError
    } = await supabase
      .from("absensi_guru")
      .select("guru_id")
      .eq("tanggal", tanggal);

    if (agError) {
      throw agError;
    }

    const {
      count: jumlahGuru,
      error: guruError
    } = await supabase
      .from("pengguna")
      .select("id", { count: "exact", head: true })
      .eq("role", "guru");

    if (guruError) {
      throw guruError;
    }

    const guruSudahAbsen =
      new Set((absensiGuru || []).map((x) => x.guru_id));

    const guruBelumAbsen =
      Math.max(0, (jumlahGuru || 0) - guruSudahAbsen.size);

    if (guruBelumAbsen > 0) {
      perhatian.push(
        `👩‍🏫 ${guruBelumAbsen} guru/pelatih belum mengisi absensi hari ini.`
      );
    }


    // ========================================================
    // D. ABSENSI SISWA
    // ========================================================

    const {
      data: absensiSiswa,
      error: asError
    } = await supabase
      .from("absensi")
      .select("siswa_id")
      .eq("tanggal", tanggal);

    if (asError) {
      throw asError;
    }

    const {
      count: jumlahSiswa,
      error: siswaError
    } = await supabase
      .from("siswa")
      .select("id", { count: "exact", head: true });

    if (siswaError) {
      throw siswaError;
    }

    const jumlahAbsenSiswa =
      (absensiSiswa || []).length;

    const siswaBelumAbsen =
      Math.max(0, (jumlahSiswa || 0) - jumlahAbsenSiswa);

    if (siswaBelumAbsen > 0) {
      perhatian.push(
        `📋 ${siswaBelumAbsen} siswa belum memiliki absensi hari ini.`
      );
    }


  } catch (error) {

    console.error(
      "Error load notifikasi:",
      error
    );

    count.textContent = "!";
    count.style.display = "inline-flex";

    panel.innerHTML = `
      <div
        style="
          font-weight:700;
          color:var(--bad);
          margin-bottom:6px;
        "
      >
        Notifikasi gagal dimuat
      </div>

      <div class="notif-item">
        Silakan coba lagi.
      </div>
    `;

    return;
  }


  // ==========================================================
  // BADGE = pembayaran yang masih perlu diverifikasi
  // ==========================================================

  count.textContent = pembayaran.length;
  count.style.display =
    pembayaran.length > 0
      ? "inline-flex"
      : "none";


  // ==========================================================
  // PANEL
  // ==========================================================

  let html = "";

  if (pembayaran.length > 0) {

    html += `
      <div
        style="
          font-weight:700;
          margin-bottom:10px;
        "
      >
        Pembayaran Menunggu Verifikasi
      </div>
    `;

    pembayaran.forEach((item) => {

      html += `
        <div
          class="notif-item notif-payment"
          onclick="window.__app.bukaPembayaranDariNotifikasi('${item.id}', ${item.bulan}, ${item.tahun})"
        >

          <div
            style="
              font-weight:600;
              line-height:1.4;
            "
          >
            🔔 ${item.nama}
          </div>

          <div
            style="
              font-size:12px;
              margin-top:3px;
              color:var(--ink-soft);
            "
          >
            SPP ${namaBulan(item.bulan)} ${item.tahun}
            · ${formatRupiah(item.nominal)}
          </div>

          <div
            style="
              margin-top:7px;
              color:var(--primary-dark);
              font-size:11px;
              font-weight:700;
            "
          >
            Periksa pembayaran →
          </div>

        </div>
      `;
    });
  }

  if (perhatian.length > 0) {

    html += `
      <div
        style="
          font-weight:700;
          margin-top:14px;
          margin-bottom:6px;
          padding-top:10px;
          border-top:1px solid var(--line);
        "
      >
        Perlu Perhatian
      </div>
    `;

    perhatian.forEach((item) => {
      html += `
        <div class="notif-item">
          ${item}
        </div>
      `;
    });
  }

  if (
    pembayaran.length === 0 &&
    perhatian.length === 0
  ) {
    html = `
      <div
        style="
          font-weight:700;
          margin-bottom:6px;
        "
      >
        Semua aman ✨
      </div>

      <div class="notif-item">
        Belum ada hal yang perlu ditindaklanjuti.
      </div>
    `;
  }

  panel.innerHTML = html;
}


// ============================================================
// BUKA PEMBAYARAN DARI NOTIFIKASI
// ============================================================

function bukaPembayaranDariNotifikasi(
  sppId,
  bulan,
  tahun
) {
  const panel = document.getElementById("notifPanel");
  if (panel) panel.classList.remove("show");

  if (window.__app && typeof window.__app.goTo === "function") {
    window.__app.goTo("spp");
  }

  setTimeout(() => {
    if (window.__app && typeof window.__app.fokusSppTahunan === "function") {
      window.__app.fokusSppTahunan(sppId, bulan, tahun);
    }
  }, 220);
}


// ============================================================
// REFRESH NOTIFIKASI DENGAN DEBOUNCE
// ============================================================

function jadwalkanRefreshNotifikasi() {

  clearTimeout(
    notifikasiRefreshTimer
  );

  notifikasiRefreshTimer =
    setTimeout(
      () => {
        loadNotifikasi();
      },
      350
    );
}


// ============================================================
// START REALTIME
// ============================================================

function startRealtimeNotifications() {

  if (
    !supabase ||
    currentUserRole !== "admin"
  ) {
    return;
  }

  // Jangan membuat subscription baru
  // kalau sudah ada yang aktif.
  if (gantarikuRealtimeChannel) {
    console.log(
      "Gantariku Realtime sudah aktif."
    );
    return;
  }

  console.log(
    "Memulai Gantariku Realtime..."
  );

  const channel =
    supabase
      .channel(
        "gantariku-admin-realtime"
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spp"
        },
        () => {
          console.log(
            "Realtime: perubahan SPP"
          );

          jadwalkanRefreshNotifikasi();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "absensi"
        },
        () => {
          console.log(
            "Realtime: perubahan absensi siswa"
          );

          jadwalkanRefreshNotifikasi();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "absensi_guru"
        },
        () => {
          console.log(
            "Realtime: perubahan absensi guru"
          );

          jadwalkanRefreshNotifikasi();
        }
      );

  // Simpan channel SEBELUM subscribe.
  // Dengan demikian pemanggilan kedua
  // langsung berhenti di guard di atas.
  gantarikuRealtimeChannel =
    channel;

  channel.subscribe(
    (status) => {
      console.log(
        "Gantariku Realtime:",
        status
      );

      if (
        status ===
          "CHANNEL_ERROR" ||
        status ===
          "TIMED_OUT"
      ) {
        gantarikuRealtimeChannel =
          null;
      }
    }
  );
}


// ============================================================
// STOP REALTIME
// ============================================================

function stopRealtimeNotifications() {

  if (
    gantarikuRealtimeChannel &&
    supabase
  ) {

    supabase.removeChannel(
      gantarikuRealtimeChannel
    );
  }

  gantarikuRealtimeChannel =
    null;
}



// ============================================================
// ROLE LABEL
// ============================================================

function getRoleLabel(role) {

  const map = {
    admin: "Admin Sekolah",
    guru: "Guru",
    ortu: "Orang Tua",
  };

  return (
    map[role] ||
    role
  );
}
