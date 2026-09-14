// ============================================================
// GANTARIKU — MONITORING SPP TAHUNAN
// ============================================================

let sppTahunanData = [];
let sppTahunanSiswa = [];
let sppTahunanTahun = null;

const SPP_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function sppStatusClass(status) {
  if (status === "Lunas") return "spp-lunas";
  if (status === "Menunggu Verifikasi") return "spp-pending";
  if (status === "Belum Bayar") return "spp-belum";
  return "spp-kosong";
}

function sppStatusIcon(status) {
  if (status === "Lunas") return "✓";
  if (status === "Menunggu Verifikasi") return "⏳";
  if (status === "Belum Bayar") return "!";
  return "—";
}

// ============================================================
// VIEW
// ============================================================

function renderSpp() {
  const tahunSekarang = getNowWIB().getFullYear();

  const tahunOptions = [
    tahunSekarang - 1,
    tahunSekarang,
    tahunSekarang + 1
  ]
    .map(
      (tahun) => `
        <option value="${tahun}" ${
          tahun === tahunSekarang ? "selected" : ""
        }>${tahun}</option>
      `
    )
    .join("");

  return `
    <div class="section spp-annual-section">

      <div class="section-head">
        <div>
          <h2>Monitoring SPP Tahunan</h2>
          <div style="font-size:12px;color:var(--ink-soft);margin-top:4px;">
            Pantau pembayaran seluruh siswa dalam satu tahun.
          </div>
        </div>

        <div class="controls spp-toolbar">
          <select id="filterTahunSpp">
            ${tahunOptions}
          </select>

          <select id="filterKelasSpp">
            <option value="">Semua Kelas</option>
          </select>

          <input
            type="text"
            id="filterCariSpp"
            placeholder="Cari nama / NIS..."
            class="spp-search"
          >

          <select id="filterStatusSpp">
            <option value="">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Belum Bayar">Belum Bayar</option>
          </select>

          <button
            class="btn secondary"
            onclick="window.__app.exportSppCsv()"
          >
            ⬇ Export
          </button>

          <button
            class="btn secondary"
            onclick="window.__app.buatTagihanBulanan()"
          >
            ⚡ Buat Tagihan
          </button>

          <button
            class="btn"
            onclick="window.__app.bukaFormSpp()"
          >
            + Tambah Tagihan
          </button>
        </div>
      </div>

      <!-- ====================================================
           FORM TAMBAH SPP
           ==================================================== -->

      <div
        id="formSppContainer"
        style="display:none;padding:20px;border-bottom:1px solid var(--line);"
      >

        <h3 style="margin-top:0;">
          Tambah Tagihan SPP
        </h3>

        <form id="formSpp">

          <div
            style="
              display:grid;
              grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
              gap:15px;
            "
          >

            <div class="form-group">
              <label>Siswa</label>
              <select id="sppSiswaId" required>
                <option value="">Memuat siswa...</option>
              </select>
            </div>

            <div class="form-group">
              <label>Bulan</label>
              <select id="sppBulan">
                ${SPP_BULAN.map(
                  (bulan, i) => `
                    <option value="${i + 1}" ${
                      i + 1 === getNowWIB().getMonth() + 1
                        ? "selected"
                        : ""
                    }>${bulan}</option>
                  `
                ).join("")}
              </select>
            </div>

            <div class="form-group">
              <label>Tahun</label>
              <select id="sppTahun">
                ${tahunOptions}
              </select>
            </div>

            <div class="form-group">
              <label>Nominal (Rp)</label>
              <input
                type="number"
                id="sppNominal"
                placeholder="Contoh: 150000"
                min="0"
                required
              >
            </div>

            <div class="form-group">
              <label>Status</label>
              <select id="sppStatus">
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="Lunas">Lunas</option>
              </select>
            </div>

          </div>

          <div style="display:flex;gap:10px;margin-top:20px;">
            <button
              type="submit"
              class="btn"
              id="btnSimpanSpp"
            >
              Simpan Tagihan
            </button>

            <button
              type="button"
              class="btn ghost"
              onclick="window.__app.tutupFormSpp()"
            >
              Batal
            </button>
          </div>

        </form>
      </div>

      <!-- ====================================================
           RINGKASAN
           ==================================================== -->

      <div
        id="sppAnnualSummary"
        class="spp-annual-summary"
      >
        <div class="spp-summary-card">
          <div class="spp-summary-value" id="sppSummarySiswa">0</div>
          <div class="spp-summary-label">Siswa</div>
        </div>

        <div class="spp-summary-card">
          <div class="spp-summary-value spp-summary-good" id="sppSummaryLunas">0</div>
          <div class="spp-summary-label">Lunas</div>
        </div>

        <div class="spp-summary-card">
          <div class="spp-summary-value spp-summary-warn" id="sppSummaryPending">0</div>
          <div class="spp-summary-label">Menunggu Verifikasi</div>
        </div>

        <div class="spp-summary-card">
          <div class="spp-summary-value spp-summary-bad" id="sppSummaryBelum">0</div>
          <div class="spp-summary-label">Belum Bayar</div>
        </div>
      </div>

      <!-- ====================================================
           MATRIX
           ==================================================== -->

      <div class="spp-annual-help">
        <span>✓ Lunas</span>
        <span>⏳ Menunggu Verifikasi</span>
        <span>! Belum Bayar</span>
        <span>— Belum ada tagihan</span>
      </div>

      <div class="spp-table-wrap">
        <table class="spp-annual-table">
          <thead>
            <tr>
              <th class="spp-sticky-col">Siswa</th>
              <th class="spp-class-col">Kelas</th>
              ${SPP_BULAN.map((b) => `<th>${b.substring(0, 3)}</th>`).join("")}
            </tr>
          </thead>
          <tbody id="daftarSppAnnual">
            <tr>
              <td colspan="14" class="empty">
                Memuat data SPP...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        id="sppDetailModal"
        class="spp-modal"
        style="display:none;"
      ></div>

    </div>
  `;
}

// ============================================================
// LOAD SISWA UNTUK FORM & FILTER
// ============================================================

async function loadSiswaSppTahunan() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("siswa")
    .select("id,nama,nis,kelas,tahun_ajaran")
    .order("nama", { ascending: true });

  if (error) throw error;

  sppTahunanSiswa = data || [];

  const selectForm = document.getElementById("sppSiswaId");
  if (selectForm) {
    selectForm.innerHTML =
      `<option value="">Pilih siswa...</option>` +
      sppTahunanSiswa
        .map(
          (s) =>
            `<option value="${s.id}">${s.nama} — ${s.kelas || "-"}</option>`
        )
        .join("");
  }

  const selectKelas = document.getElementById("filterKelasSpp");
  if (selectKelas) {
    const kelas = [
      ...new Set(
        sppTahunanSiswa
          .map((s) => (s.kelas || "").trim())
          .filter(Boolean)
      )
    ].sort();

    selectKelas.innerHTML =
      `<option value="">Semua Kelas</option>` +
      kelas
        .map((k) => `<option value="${k}">${k}</option>`)
        .join("");
  }
}

async function loadAllSppForYear(tahun) {
  const hasil = [];
  let from = 0;
  const size = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("spp")
      .select(`
        id,
        siswa_id,
        bulan,
        tahun,
        nominal,
        status,
        tanggal_bayar,
        bukti_bayar_url,
        catatan,
        updated_at
      `)
      .eq("tahun", tahun)
      .order("bulan", { ascending: true })
      .order("updated_at", { ascending: false })
      .range(from, from + size - 1);

    if (error) throw error;

    hasil.push(...(data || []));

    if (!data || data.length < size) break;
    from += size;
  }

  return hasil;
}

// ============================================================
// FILTER
// ============================================================

function filterSppTahunanData() {
  const kelas =
    document.getElementById("filterKelasSpp")?.value || "";

  const cari =
    (
      document.getElementById("filterCariSpp")?.value || ""
    )
      .toLowerCase()
      .trim();

  const status =
    document.getElementById("filterStatusSpp")?.value || "";

  const siswaMap = new Map(
    sppTahunanSiswa.map((s) => [String(s.id), s])
  );

  let siswa = sppTahunanSiswa.slice();

  if (kelas) {
    siswa = siswa.filter(
      (s) => (s.kelas || "") === kelas
    );
  }

  if (cari) {
    siswa = siswa.filter((s) => {
      const haystack = [
        s.nama,
        s.nis,
        s.kelas,
        s.tahun_ajaran
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(cari);
    });
  }

  const bySiswa = new Map();

  sppTahunanData.forEach((item) => {
    const siswaRef = siswaMap.get(String(item.siswa_id));
    if (!siswaRef) return;

    if (kelas && siswaRef.kelas !== kelas) return;

    const cariMatch = !cari || [
      siswaRef.nama,
      siswaRef.nis,
      siswaRef.kelas,
      siswaRef.tahun_ajaran
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(cari);

    if (!cariMatch) return;

    if (!bySiswa.has(String(item.siswa_id))) {
      bySiswa.set(String(item.siswa_id), new Map());
    }

    const bulanMap = bySiswa.get(String(item.siswa_id));

    // Karena unique index siswa + bulan + tahun sudah aktif,
    // satu bulan hanya boleh mempunyai satu record.
    if (!bulanMap.has(Number(item.bulan))) {
      bulanMap.set(Number(item.bulan), item);
    }
  });

  // Untuk filter status, hanya tampilkan siswa yang mempunyai
  // minimal satu bulan dengan status tersebut.
  if (status) {
    siswa = siswa.filter((s) => {
      const bulanMap = bySiswa.get(String(s.id));
      if (!bulanMap) return false;

      return [...bulanMap.values()].some(
        (item) => item.status === status
      );
    });
  }

  return {
    siswa,
    bySiswa,
    siswaMap
  };
}

// ============================================================
// RENDER MATRIX
// ============================================================

function renderSppTahunanTable() {
  const tbody = document.getElementById("daftarSppAnnual");
  if (!tbody) return;

  const { siswa, bySiswa } =
    filterSppTahunanData();

  if (siswa.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="14" class="empty">
          Tidak ada data siswa yang sesuai.
        </td>
      </tr>
    `;
    updateSppSummary([]);
    return;
  }

  tbody.innerHTML = siswa
    .map((siswaItem) => {
      const bulanMap =
        bySiswa.get(String(siswaItem.id)) ||
        new Map();

      const cells = SPP_BULAN.map((_, index) => {
        const bulan = index + 1;
        const spp = bulanMap.get(bulan);

        if (!spp) {
          return `
            <td class="spp-cell-empty">
              <span>—</span>
            </td>
          `;
        }

        const status = spp.status || "Belum Bayar";
        const cls = sppStatusClass(status);
        const icon = sppStatusIcon(status);

        return `
          <td class="spp-cell-wrap">
            <button
              type="button"
              class="spp-cell ${cls}"
              title="${namaBulan(bulan)} ${spp.tahun} · ${formatRupiah(spp.nominal)} · ${status}"
              onclick="window.__app.bukaDetailSpp('${spp.id}')"
            >
              ${icon}
            </button>
          </td>
        `;
      }).join("");

      return `
        <tr>
          <td class="spp-sticky-col">
            <div class="spp-student-name">
              ${siswaItem.nama || "-"}
            </div>
            <div class="spp-student-meta">
              ${siswaItem.nis || "Tanpa NIS"}
            </div>
          </td>

          <td class="spp-class-col">
            ${siswaItem.kelas || "-"}
          </td>

          ${cells}
        </tr>
      `;
    })
    .join("");

  updateSppSummary(siswa);
}

function updateSppSummary(siswaTampil) {
  const siswaIds = new Set(
    (siswaTampil || []).map((s) => String(s.id))
  );

  let lunas = 0;
  let pending = 0;
  let belum = 0;

  sppTahunanData.forEach((item) => {
    if (!siswaIds.has(String(item.siswa_id))) return;

    if (item.status === "Lunas") lunas++;
    else if (item.status === "Menunggu Verifikasi") pending++;
    else if (item.status === "Belum Bayar") belum++;
  });

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("sppSummarySiswa", siswaIds.size);
  setText("sppSummaryLunas", lunas);
  setText("sppSummaryPending", pending);
  setText("sppSummaryBelum", belum);
}


// ============================================================
// BUKTI PEMBAYARAN — STORAGE PRIVATE
// ============================================================
function getBuktiPath(value) {
  if (!value) return null;
  const text = String(value);
  const marker = "/storage/v1/object/public/bukti-pembayaran/";
  const markerSign = "/storage/v1/object/sign/bukti-pembayaran/";
  if (text.includes(marker)) return decodeURIComponent(text.split(marker)[1].split("?")[0]);
  if (text.includes(markerSign)) return decodeURIComponent(text.split(markerSign)[1].split("?")[0]);
  return text;
}

async function getBuktiSignedUrl(value, expiresIn = 600) {
  if (!supabase || !value) return null;
  const path = getBuktiPath(value);
  if (!path) return null;
  const { data, error } = await supabase
    .storage
    .from("bukti-pembayaran")
    .createSignedUrl(path, expiresIn);
  if (error) {
    console.error("Gagal membuat signed URL bukti pembayaran:", error);
    return null;
  }
  return data?.signedUrl || null;
}

// ============================================================
// LOAD SPP
// ============================================================

async function loadSpp() {
  const tbody = document.getElementById("daftarSppAnnual");
  if (!tbody || !supabase) return;

  const tahun = Number(
    document.getElementById("filterTahunSpp")?.value ||
    getNowWIB().getFullYear()
  );

  sppTahunanTahun = tahun;

  tbody.innerHTML = `
    <tr>
      <td colspan="14" class="empty">
        Memuat data SPP ${tahun}...
      </td>
    </tr>
  `;

  try {
    await loadSiswaSppTahunan();
    sppTahunanData = await loadAllSppForYear(tahun);
    renderSppTahunanTable();
  } catch (error) {
    console.error("Error load SPP tahunan:", error);

    tbody.innerHTML = `
      <tr>
        <td
          colspan="14"
          class="empty"
          style="color:var(--bad);"
        >
          Gagal memuat data SPP: ${error.message || "Terjadi kesalahan."}
        </td>
      </tr>
    `;
  }
}

function applySppTahunanFilter() {
  renderSppTahunanTable();
}

// ============================================================
// FORM TAMBAH SPP
// ============================================================

function bukaFormSpp() {
  const el = document.getElementById("formSppContainer");
  if (el) el.style.display = "block";

  loadSiswaSppTahunan().catch((error) => {
    console.error(error);
  });
}

function tutupFormSpp() {
  const container = document.getElementById("formSppContainer");
  const form = document.getElementById("formSpp");

  if (container) container.style.display = "none";
  if (form) form.reset();
}

async function simpanSpp(event) {
  event.preventDefault();

  if (!supabase) {
    alert("Supabase belum terhubung.");
    return;
  }

  const btn = document.getElementById("btnSimpanSpp");

  const siswaId = document.getElementById("sppSiswaId")?.value;
  const bulan = Number(document.getElementById("sppBulan")?.value);
  const tahun = Number(document.getElementById("sppTahun")?.value);
  const nominal = Number(document.getElementById("sppNominal")?.value);
  const status = document.getElementById("sppStatus")?.value;

  if (!siswaId || !nominal || nominal <= 0) {
    alert("Siswa dan nominal wajib diisi dengan benar.");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Menyimpan...";
  }

  try {
    const { error } = await supabase
      .from("spp")
      .insert({
        siswa_id: siswaId,
        bulan,
        tahun,
        nominal,
        status,
        tanggal_bayar:
          status === "Lunas" ? getTodayWIBString() : null,
        dicatat_oleh: currentUser?.id || null
      });

    if (error) throw error;

    alert("Tagihan SPP berhasil ditambahkan!");
    tutupFormSpp();
    await loadSpp();
  } catch (error) {
    console.error("Error simpan SPP:", error);

    if (error?.code === "23505") {
      alert(
        "Tagihan untuk siswa, bulan, dan tahun tersebut sudah ada."
      );
    } else {
      alert(
        "Gagal menyimpan tagihan SPP:\n\n" +
          (error?.message || "Terjadi kesalahan.")
      );
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Simpan Tagihan";
    }
  }
}

// ============================================================
// BUAT TAGIHAN BULANAN
// ============================================================

async function buatTagihanBulanan() {
  if (!supabase) {
    alert("Supabase belum terhubung.");
    return;
  }

  const bulan = getNowWIB().getMonth() + 1;
  const tahun = Number(
    document.getElementById("filterTahunSpp")?.value ||
      getNowWIB().getFullYear()
  );

  const inputBulan = prompt(
    `Bulan tagihan (1-12) untuk tahun ${tahun}:`,
    String(bulan)
  );

  if (inputBulan === null) return;

  const bulanPilihan = Number(inputBulan);

  if (
    !Number.isInteger(bulanPilihan) ||
    bulanPilihan < 1 ||
    bulanPilihan > 12
  ) {
    alert("Bulan tidak valid.");
    return;
  }

  const inputNominal = prompt(
    `Nominal SPP ${namaBulan(bulanPilihan)} ${tahun}:`,
    "150000"
  );

  if (inputNominal === null) return;

  const nominal = Number(
    String(inputNominal).replace(/[^0-9]/g, "")
  );

  if (!nominal || nominal <= 0) {
    alert("Nominal tidak valid.");
    return;
  }

  if (
    !confirm(
      `Buat tagihan ${namaBulan(bulanPilihan)} ${tahun} ` +
        `sebesar ${formatRupiah(nominal)} untuk semua siswa ` +
        `yang belum memiliki tagihan pada periode tersebut?`
    )
  ) {
    return;
  }

  try {
    await loadSiswaSppTahunan();

    const existing = await loadSppForMonth(
      bulanPilihan,
      tahun
    );

    const sudahAda = new Set(
      existing.map((x) => String(x.siswa_id))
    );

    const belumAda = sppTahunanSiswa.filter(
      (s) => !sudahAda.has(String(s.id))
    );

    if (belumAda.length === 0) {
      alert(
        `Semua siswa sudah memiliki tagihan ${namaBulan(
          bulanPilihan
        )} ${tahun}.`
      );
      return;
    }

    const payload = belumAda.map((s) => ({
      siswa_id: s.id,
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

    alert(
      `Berhasil membuat ${payload.length} tagihan SPP ${namaBulan(
        bulanPilihan
      )} ${tahun}.`
    );

    await loadSpp();
  } catch (error) {
    console.error("Error buat tagihan bulanan:", error);
    alert(
      "Gagal membuat tagihan bulanan:\n\n" +
        (error?.message || "Terjadi kesalahan.")
    );
  }
}

async function loadSppForMonth(bulan, tahun) {
  const hasil = [];
  let from = 0;
  const size = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("spp")
      .select("id,siswa_id,bulan,tahun,status")
      .eq("bulan", bulan)
      .eq("tahun", tahun)
      .range(from, from + size - 1);

    if (error) throw error;

    hasil.push(...(data || []));

    if (!data || data.length < size) break;
    from += size;
  }

  return hasil;
}

// ============================================================
// DETAIL SPP
// ============================================================

async function bukaDetailSpp(id) {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("spp")
    .select(`
      id,
      siswa_id,
      bulan,
      tahun,
      nominal,
      status,
      tanggal_bayar,
      bukti_bayar_url,
      catatan,
      siswa:siswa_id(
        nama,
        nis,
        kelas
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    alert("Gagal membuka detail SPP:\n\n" + error.message);
    return;
  }

  const modal = document.getElementById("sppDetailModal");
  if (!modal) return;

  const buktiSignedUrl = data.bukti_bayar_url
    ? await getBuktiSignedUrl(data.bukti_bayar_url)
    : null;

  let aksi = "";

  if (data.status === "Menunggu Verifikasi") {
    aksi = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
        <button
          class="btn"
          onclick="window.__app.terimaPembayaranSpp('${data.id}');window.__app.tutupDetailSpp();"
        >✓ Terima Pembayaran</button>

        <button
          class="btn ghost"
          onclick="window.__app.tolakPembayaranSpp('${data.id}');window.__app.tutupDetailSpp();"
        >✕ Tolak</button>
      </div>
    `;
  } else if (data.status === "Belum Bayar") {
    aksi = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
        <button
          class="btn"
          onclick="window.__app.tandaiLunas('${data.id}');window.__app.tutupDetailSpp();"
        >✓ Tandai Lunas</button>

        <button
          class="btn ghost"
          onclick="window.__app.hapusSpp('${data.id}');window.__app.tutupDetailSpp();"
        >Hapus</button>
      </div>
    `;
  } else {
    aksi = `
      <div style="margin-top:16px;">
        <button
          class="btn ghost"
          onclick="window.__app.hapusSpp('${data.id}');window.__app.tutupDetailSpp();"
        >Hapus Tagihan</button>
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="spp-modal-card">

      <div class="spp-modal-head">
        <div>
          <div style="font-size:12px;color:var(--ink-soft);">
            SPP ${namaBulan(data.bulan)} ${data.tahun}
          </div>
          <h3 style="margin:3px 0 0;">
            ${data.siswa?.nama || "Siswa"}
          </h3>
        </div>

        <button
          type="button"
          class="spp-modal-close"
          onclick="window.__app.tutupDetailSpp()"
        >×</button>
      </div>

      <div class="spp-modal-grid">
        <div>
          <div class="spp-detail-label">Kelas</div>
          <div>${data.siswa?.kelas || "-"}</div>
        </div>

        <div>
          <div class="spp-detail-label">NIS</div>
          <div>${data.siswa?.nis || "-"}</div>
        </div>

        <div>
          <div class="spp-detail-label">Nominal</div>
          <div>${formatRupiah(data.nominal)}</div>
        </div>

        <div>
          <div class="spp-detail-label">Status</div>
          <div>
            <span class="badge ${
              data.status === "Lunas"
                ? "badge-good"
                : data.status === "Menunggu Verifikasi"
                  ? "badge-warn"
                  : "badge-bad"
            }">
              ${data.status}
            </span>
          </div>
        </div>

        <div>
          <div class="spp-detail-label">Tanggal Bayar</div>
          <div>${data.tanggal_bayar || "-"}</div>
        </div>
      </div>

      ${
        buktiSignedUrl
          ? `
            <div style="margin-top:18px;">
              <div class="spp-detail-label">Bukti Pembayaran</div>
              <a
                href="${buktiSignedUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn secondary small"
                style="margin-top:6px;display:inline-block;"
              >
                🔎 Buka Bukti
              </a>
            </div>
          `
          : ""
      }

      ${
        data.catatan
          ? `
            <div style="margin-top:16px;">
              <div class="spp-detail-label">Catatan</div>
              <div style="margin-top:4px;line-height:1.5;">
                ${data.catatan}
              </div>
            </div>
          `
          : ""
      }

      ${aksi}

    </div>
  `;

  modal.style.display = "flex";
}

function tutupDetailSpp() {
  const modal = document.getElementById("sppDetailModal");
  if (modal) modal.style.display = "none";
}

// ============================================================
// TERIMA / TOLAK / MANUAL LUNAS
// ============================================================

async function terimaPembayaranSpp(id) {
  if (!supabase) return;

  if (!confirm("Terima pembayaran ini dan ubah status menjadi Lunas?")) {
    return;
  }

  try {
    const { error } = await supabase
      .from("spp")
      .update({
        status: "Lunas",
        tanggal_bayar: getTodayWIBString(),
        dicatat_oleh: currentUser?.id || null
      })
      .eq("id", id)
      .eq("status", "Menunggu Verifikasi");

    if (error) throw error;

    alert("Pembayaran berhasil diverifikasi.");
    await loadSpp();
  } catch (error) {
    console.error("Terima pembayaran:", error);
    alert("Gagal memverifikasi pembayaran:\n\n" + error.message);
  }
}

async function tolakPembayaranSpp(id) {
  if (!supabase) return;

  if (
    !confirm(
      "Tolak bukti pembayaran ini? Status akan kembali menjadi Belum Bayar."
    )
  ) {
    return;
  }

  try {
    const { error } = await supabase
      .from("spp")
      .update({
        status: "Belum Bayar",
        bukti_bayar_url: null,
        tanggal_bayar: null,
        catatan: "Bukti pembayaran ditolak oleh admin."
      })
      .eq("id", id)
      .eq("status", "Menunggu Verifikasi");

    if (error) throw error;

    alert("Bukti pembayaran ditolak.");
    await loadSpp();
  } catch (error) {
    console.error("Tolak pembayaran:", error);
    alert("Gagal menolak pembayaran:\n\n" + error.message);
  }
}

async function tandaiLunas(id) {
  if (!supabase) return;

  if (!confirm("Tandai tagihan ini sebagai Lunas?")) return;

  try {
    const { error } = await supabase
      .from("spp")
      .update({
        status: "Lunas",
        tanggal_bayar: getTodayWIBString(),
        dicatat_oleh: currentUser?.id || null
      })
      .eq("id", id)
      .eq("status", "Belum Bayar");

    if (error) throw error;

    await loadSpp();
  } catch (error) {
    console.error("Tandai lunas:", error);
    alert("Gagal menandai lunas:\n\n" + error.message);
  }
}

async function hapusSpp(id) {
  if (!supabase) return;

  if (!confirm("Yakin ingin menghapus tagihan SPP ini?")) return;

  try {
    const { error } = await supabase
      .from("spp")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await loadSpp();
  } catch (error) {
    console.error("Hapus SPP:", error);
    alert("Gagal menghapus tagihan:\n\n" + error.message);
  }
}

// ============================================================
// FOKUS DARI NOTIFIKASI
// ============================================================

function fokusSppTahunan(id, bulan, tahun) {
  if (Number(tahun) !== Number(sppTahunanTahun)) {
    const tahunEl = document.getElementById("filterTahunSpp");
    if (tahunEl) tahunEl.value = String(tahun);
    loadSpp().then(() => fokusSppTahunan(id, bulan, tahun));
    return;
  }

  const rowButtons = document.querySelectorAll(
    `.spp-cell[onclick*="${id}"]`
  );

  const target = rowButtons[0];

  if (target) {
    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center"
    });

    target.classList.add("spp-cell-focus");

    setTimeout(() => {
      target.classList.remove("spp-cell-focus");
    }, 2200);

    setTimeout(() => {
      bukaDetailSpp(id);
    }, 250);
  } else {
    bukaDetailSpp(id);
  }
}
