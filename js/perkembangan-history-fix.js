// ============================================================
// GANTARIKU — PERBAIKAN RIWAYAT PERKEMBANGAN ORANG TUA
// Mengambil seluruh riwayat anak dengan pagination agar bulan lama
// tidak terpotong oleh limit 200 baris.
// ============================================================

async function loadPerkembanganAnak() {
  const wrap = document.getElementById("pilihAnakWrap");
  const body = document.getElementById("ringkasanPerkembangan");

  if (!body || !supabase) return;

  await pastikanAnakOrangTuaDimuat();

  if (wrap) wrap.innerHTML = renderPilihAnakHtml();

  const anak = anakYangDipilih();
  if (!anak) {
    body.innerHTML = `<div class="empty">Belum ada siswa yang terhubung dengan akun ini.</div>`;
    return;
  }

  body.innerHTML = `<div class="empty">Memuat seluruh riwayat perkembangan...</div>`;

  try {
    const now = getNowWIB();
    const bulan = now.getMonth() + 1;
    const tahun = now.getFullYear();
    const currentPeriod = `${tahun}-${String(bulan).padStart(2, "0")}`;
    const awal = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const akhirD = new Date(tahun, bulan, 0).getDate();
    const akhir = `${tahun}-${String(bulan).padStart(2, "0")}-${String(akhirD).padStart(2, "0")}`;

    const allRows = [];
    const pageSize = 1000;
    let from = 0;

    while (true) {
      const { data, error } = await withRequestTimeout(
        supabase
          .from("perkembangan")
          .select(`
            tanggal,
            aspek,
            nilai,
            catatan,
            guru:guru_id(nama),
            created_at
          `)
          .eq("siswa_id", anak.id)
          .order("tanggal", { ascending: false })
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1),
        "riwayat perkembangan"
      );

      if (error) throw error;
      allRows.push(...(data || []));
      if (!data || data.length < pageSize) break;
      from += pageSize;
    }

    const monthRows = allRows.filter((row) => row.tanggal >= awal && row.tanggal <= akhir);
    const latest = {};
    let note = "";
    let date = "";
    let guru = "";

    for (const row of monthRows) {
      if (!latest[row.aspek]) latest[row.aspek] = row;
      if (!date) {
        date = row.tanggal || "";
        guru = row.guru?.nama || "Pelatih";
      }
      if (!note && row.catatan) note = row.catatan;
    }

    const vals = PERKEMBANGAN_ASPEK
      .map((aspek) => Number(latest[aspek]?.nilai) || 0)
      .filter((value) => value > 0);

    const avg = vals.length
      ? (vals.reduce((sum, value) => sum + value, 0) / vals.length).toFixed(1)
      : "-";

    const historyMap = new Map();
    for (const row of allRows) {
      const period = String(row.tanggal || "").slice(0, 7);
      if (!period) continue;
      if (!historyMap.has(period)) historyMap.set(period, []);
      historyMap.get(period).push(row);
    }

    riwayatPerkembanganAnakData = Object.fromEntries(historyMap.entries());

    const histPeriods = [...historyMap.keys()]
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 24);

    const previousPeriods = histPeriods.filter((period) => period < currentPeriod);
    const defaultHistory = previousPeriods[0] || histPeriods[0] || "";

    const historySelect = histPeriods.length
      ? `
        <select class="perk-history-select" id="pilihRiwayatPerkembangan">
          ${histPeriods.map((period) => `
            <option value="${escapeHtml(period)}" ${period === defaultHistory ? "selected" : ""}>
              ${escapeHtml(formatPeriodePerkembangan(period))}
            </option>
          `).join("")}
        </select>
      `
      : `<span class="form-help">Belum ada riwayat</span>`;

    body.innerHTML = `
      <div class="ortu-perk-header">
        <div class="ortu-perk-heading">
          <span class="ortu-perk-heading-icon" aria-hidden="true">
            <img src="assets/icon-perkembangan-anak.png" alt="" aria-hidden="true">
          </span>
          <div>
          <h3 class="ortu-perk-title">${escapeHtml(anak.nama)}</h3>
          <div class="form-help">
            ${escapeHtml(anak.kelas || "Tanpa kelas")} · ${escapeHtml(namaBulan(bulan))} ${tahun}
          </div>
        </div>
        </div>
        <div class="ortu-perk-average">
          <span class="ortu-perk-average-icon" aria-hidden="true">
            <img src="assets/icon-perkembangan-rata-rata.png" alt="" aria-hidden="true">
          </span>
          <span>Rata-rata ${avg}${avg !== "-" ? " / 5" : ""}</span>
        </div>
      </div>

      <div class="perk-parent-summary">
        ${PERKEMBANGAN_ASPEK.map((aspek, index) => `
          <div class="perk-parent-aspect">
            <span class="perk-aspect-icon" aria-hidden="true"><img src="assets/${["icon-perkembangan-teknik.png","icon-perkembangan-hafalan.png","icon-perkembangan-ekspresi.png","icon-perkembangan-disiplin.png","icon-perkembangan-kepercayaan-diri.png"][index] || "icon-perkembangan-anak.png"}" alt="" aria-hidden="true"></span>
            <div class="name">${escapeHtml(aspek)}</div>
            <div class="score">${latest[aspek]?.nilai ? `${latest[aspek].nilai}/5` : "—"}</div>
          </div>
        `).join("")}
      </div>

      <div class="perk-note">
        <div class="perk-note-heading">
          <span class="perk-note-icon" aria-hidden="true"><img src="assets/icon-perkembangan-catatan.png" alt="" aria-hidden="true"></span>
          <strong>Catatan pelatih</strong>
        </div>
        <div class="ortu-perk-note-text">${escapeHtml(note || "Belum ada catatan perkembangan untuk bulan ini.")}</div>
        ${date ? `<div class="perk-date">${escapeHtml(namaBulan(bulan))} ${tahun} · ${escapeHtml(guru)}</div>` : ""}
      </div>

      <div class="perk-history">
        <div class="perk-history-title">
          <div>
            <h3 class="ortu-perk-history-title">Penilaian sebelumnya</h3>
            <div class="ortu-perk-history-help">Pilih bulan dan tahun untuk melihat detail penilaian.</div>
          </div>
          ${historySelect}
        </div>
        <div id="perkembanganRiwayatPanel">
          ${defaultHistory ? "Memuat penilaian..." : `<div class="empty">Belum ada riwayat penilaian sebelumnya.</div>`}
        </div>
      </div>
    `;

    const select = document.getElementById("pilihRiwayatPerkembangan");
    if (select) {
      select.addEventListener("change", () => {
        renderRiwayatPerkembanganDipilih(select.value);
      });
    }

    if (defaultHistory) renderRiwayatPerkembanganDipilih(defaultHistory);
  } catch (error) {
    console.error("Error load riwayat perkembangan orang tua:", error);
    body.innerHTML = `
      <div class="empty text-danger">
        Gagal memuat riwayat perkembangan. Silakan coba lagi.
      </div>
    `;
  }
}
