// ============================================================
// PERKEMBANGAN ANAK
// ============================================================

const PERKEMBANGAN_ASPEK = [
  "Teknik",
  "Hafalan Koreografi",
  "Ekspresi",
  "Disiplin",
  "Kepercayaan Diri"
];

let perkembanganAdminData = [];
let perkembanganAdminPage = 1;

const PERK_PAGE_SIZE = 12;


// ============================================================
// UTILITAS
// ============================================================

function opsiBulanPerkembangan() {
  const n = new Date();

  return [
    "Semua bulan",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ]
    .map(
      (m, i) =>
        `<option value="${i === 0 ? 0 : i}" ${
          i === n.getMonth() + 1 ? "selected" : ""
        }>${m}</option>`
    )
    .join("");
}


// ============================================================
// ADMIN - HALAMAN PERKEMBANGAN
// ============================================================

function renderPerkembanganAdmin() {
  const tahun = new Date().getFullYear();

  return `
    <div class="section">

      <div class="section-head">

        <div>
          <h2>Perkembangan Anak</h2>

          <div class="section-subtitle">
            Satu kartu mewakili satu anak agar tetap nyaman saat jumlah siswa bertambah.
          </div>
        </div>

        <div class="perk-toolbar">

          <input
            class="perk-search"
            type="text"
            id="perkembanganAdminCari"
            placeholder="Cari nama siswa..."
          >

          <select id="perkembanganAdminKelas">
            <option value="">Semua kelas</option>
          </select>

          <select id="perkembanganAdminBulan">
            ${opsiBulanPerkembangan()}
          </select>

          <select id="perkembanganAdminTahun">
            <option value="${tahun}">
              ${tahun}
            </option>

            <option value="${tahun - 1}">
              ${tahun - 1}
            </option>
          </select>

          <button
            class="btn secondary"
            onclick="window.__app.loadPerkembanganAdmin()"
          >
            Tampilkan
          </button>

          <button
            class="btn secondary"
            onclick="window.__app.exportPerkembanganCsv()"
          >
            ↓ Export CSV
          </button>

        </div>

      </div>

      <div class="section-body">

        <div id="perkembanganAdminGrid">

          <div class="perk-empty">
            Memuat data perkembangan...
          </div>

        </div>

        <div
          class="perk-pagination"
          id="perkembanganPagination"
        ></div>

      </div>

    </div>
  `;
}


// ============================================================
// ADMIN - RENDER KARTU
// ============================================================

function renderPerkembanganAdminCards() {

  const grid =
    document.getElementById("perkembanganAdminGrid");

  const pag =
    document.getElementById("perkembanganPagination");

  if (!grid) return;


  const search =
    (
      document.getElementById(
        "perkembanganAdminCari"
      )?.value || ""
    )
      .toLowerCase()
      .trim();


  const kelas =
    document.getElementById(
      "perkembanganAdminKelas"
    )?.value || "";


  const items =
    perkembanganAdminData.filter((x) =>

      (!kelas || x.kelas === kelas) &&

      (
        !search ||
        x.nama
          .toLowerCase()
          .includes(search)
      )

    );


  const pages =
    Math.max(
      1,
      Math.ceil(
        items.length / PERK_PAGE_SIZE
      )
    );


  if (
    perkembanganAdminPage > pages
  ) {
    perkembanganAdminPage = pages;
  }


  const slice =
    items.slice(
      (perkembanganAdminPage - 1)
        * PERK_PAGE_SIZE,

      perkembanganAdminPage
        * PERK_PAGE_SIZE
    );


  if (!slice.length) {

    grid.innerHTML = `
      <div class="perk-empty">
        Belum ada data perkembangan
        untuk filter ini.
      </div>
    `;

  } else {

    grid.innerHTML = `
      <div class="perk-grid">

        ${slice.map((item) => {

          const vals =
            PERKEMBANGAN_ASPEK
              .map(
                (a) =>
                  item.aspekMap[a]?.nilai
              )
              .filter(
                (v) =>
                  Number(v) > 0
              );


          const avg =
            vals.length

              ? (
                  vals.reduce(
                    (a, b) => a + b,
                    0
                  ) / vals.length
                ).toFixed(1)

              : "-";


          return `

            <div class="perk-card">

              <div class="perk-card-top">

                <div>

                  <div class="perk-student">
                    ${item.nama}
                  </div>

                  <div class="perk-class">
                    ${item.kelas || "Tanpa kelas"}
                    ·
                    ${item.latestDate || "-"}
                  </div>

                </div>


                <div class="perk-average">

                  ${avg}

                  ${
                    avg !== "-"
                      ? "/5"
                      : ""
                  }

                </div>

              </div>


              <div class="perk-aspects">

                ${PERKEMBANGAN_ASPEK.map(
                  (a) => `

                    <div class="perk-aspect">

                      <span class="perk-aspect-name">
                        ${a}
                      </span>

                      <span class="perk-aspect-score">

                        ${
                          item.aspekMap[a]

                            ? `${item.aspekMap[a].nilai}/5`

                            : "—"
                        }

                      </span>

                    </div>

                  `
                ).join("")}

              </div>


              <div class="perk-note">

                ${
                  item.latestNote ||
                  "Belum ada catatan tambahan."
                }

              </div>


              <div class="perk-date">

                Pelatih:
                ${item.latestGuru || "-"}

              </div>

            </div>

          `;

        }).join("")}

      </div>
    `;

  }


  if (pag) {

    pag.innerHTML =
      pages > 1

        ? `

          <button
            class="btn ghost small"

            ${
              perkembanganAdminPage === 1
                ? "disabled"
                : ""
            }

            onclick="
              window.__app.changePerkPage(-1)
            "
          >
            ← Sebelumnya
          </button>


          <span class="perk-page-label">

            Halaman
            ${perkembanganAdminPage}
            /
            ${pages}

          </span>


          <button
            class="btn ghost small"

            ${
              perkembanganAdminPage === pages
                ? "disabled"
                : ""
            }

            onclick="
              window.__app.changePerkPage(1)
            "
          >
            Berikutnya →
          </button>

        `

        : "";

  }

}


// ============================================================
// ADMIN - PAGINATION
// ============================================================

function changePerkPage(delta) {

  perkembanganAdminPage += delta;

  renderPerkembanganAdminCards();

}


// ============================================================
// ADMIN - LOAD DATA
// ============================================================

async function loadPerkembanganAdmin() {

  const grid =
    document.getElementById(
      "perkembanganAdminGrid"
    );


  if (
    !grid ||
    !supabase ||
    currentUserRole !== "admin"
  ) {
    return;
  }


  try {

    const sel =
      document.getElementById(
        "perkembanganAdminKelas"
      );


    const {
      data: kd,
      error: ke
    } =
      await supabase
        .from("siswa")
        .select("kelas");


    if (ke) throw ke;


    const ku =
      [
        ...new Set(
          (kd || [])
            .map(
              (x) => x.kelas
            )
            .filter(Boolean)
        )
      ]
        .sort();


    const old =
      sel?.value || "";


    if (sel) {

      sel.innerHTML =

        `<option value="">
          Semua kelas
        </option>`

        +

        ku
          .map(
            (k) =>
              `<option value="${k}">
                ${k}
              </option>`
          )
          .join("");

    }


    if (sel) {
      sel.value = old;
    }


    const bulan =
      Number(
        document.getElementById(
          "perkembanganAdminBulan"
        )?.value || 0
      );


    const tahun =
      Number(
        document.getElementById(
          "perkembanganAdminTahun"
        )?.value ||
        new Date().getFullYear()
      );


    let q =
      supabase
        .from("perkembangan")
        .select(
          `
          tanggal,
          aspek,
          nilai,
          catatan,
          created_at,

          siswa:siswa_id(
            id,
            nama,
            nis,
            kelas
          ),

          guru:guru_id(
            nama
          )
          `
        )
        .order(
          "tanggal",
          {
            ascending: false
          }
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (bulan) {

      const awal =
        `${tahun}-${String(
          bulan
        ).padStart(2, "0")}-01`;


      const akhirD =
        new Date(
          tahun,
          bulan,
          0
        ).getDate();


      const akhir =
        `${tahun}-${String(
          bulan
        ).padStart(2, "0")}-${String(
          akhirD
        ).padStart(2, "0")}`;


      q =
        q
          .gte(
            "tanggal",
            awal
          )
          .lte(
            "tanggal",
            akhir
          );

    } else {

      q =
        q
          .gte(
            "tanggal",
            `${tahun}-01-01`
          )
          .lte(
            "tanggal",
            `${tahun}-12-31`
          );

    }


    const {
      data,
      error
    } =
      await q;


    if (error) throw error;


    const grouped =
      new Map();


    for (
      const row
      of (data || [])
    ) {

      const sid =
        row.siswa?.id;


      if (!sid) continue;


      if (
        !grouped.has(sid)
      ) {

        grouped.set(
          sid,
          {
            id: sid,

            nama:
              row.siswa?.nama ||
              "-",

            kelas:
              row.siswa?.kelas ||
              "",

            aspekMap: {},

            latestDate:
              row.tanggal ||
              "",

            latestGuru:
              row.guru?.nama ||
              "-",

            latestNote:
              row.catatan ||
              ""
          }
        );

      }


      const item =
        grouped.get(sid);


      if (
        !item.aspekMap[
          row.aspek
        ]
      ) {

        item.aspekMap[
          row.aspek
        ] =
          {
            nilai:
              row.nilai,

            catatan:
              row.catatan,

            tanggal:
              row.tanggal,

            guru:
              row.guru?.nama ||
              "-"
          };

      }


      if (
        !item.latestNote &&
        row.catatan
      ) {

        item.latestNote =
          row.catatan;

      }

    }


    perkembanganAdminData =
      [
        ...grouped.values()
      ]
        .sort(
          (a, b) =>
            a.nama.localeCompare(
              b.nama,
              "id"
            )
        );


    perkembanganAdminPage = 1;


    renderPerkembanganAdminCards();

  }

  catch (e) {

    grid.innerHTML = `
      <div
        class="perk-empty"
        class="text-danger"
      >
        Tabel perkembangan belum tersedia
        atau gagal dimuat.
      </div>
    `;

    console.error(e);

  }

}


// ============================================================
// GURU - FORM INPUT PERKEMBANGAN
// ============================================================

function renderPerkembanganInput() {

  const todayStr =
    new Date()
      .toISOString()
      .slice(0, 10);


  const opt =
    (id) => `

      <select
        id="${id}"
        required
      >

        <option value="5">
          5 — Sangat Baik
        </option>

        <option value="4">
          4 — Baik
        </option>

        <option value="3">
          3 — Cukup
        </option>

        <option value="2">
          2 — Perlu Latihan
        </option>

        <option value="1">
          1 — Perlu Pendampingan
        </option>

      </select>

    `;


  return `

    <style>

      .perk-input-grid-top {
        display:grid;
        grid-template-columns:
          repeat(
            3,
            minmax(0, 1fr)
          );
        gap:15px;
      }


      .perk-input-grid-score {
        display:grid;
        grid-template-columns:
          repeat(
            2,
            minmax(0, 1fr)
          );
        gap:12px;
        margin-top:16px;
      }


      .perk-guru-history-grid {
        display:grid;
        grid-template-columns:
          repeat(
            2,
            minmax(0, 1fr)
          );
        gap:14px;
      }


      .perk-guru-history-card {
        border:1px solid var(--line);
        border-radius:16px;
        padding:15px;
        background:#fff;
      }


      .perk-guru-history-top {
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:12px;
        margin-bottom:14px;
      }


      .perk-guru-student {
        font-size:15px;
        font-weight:700;
        line-height:1.35;
      }


      .perk-guru-date {
        font-size:11px;
        color:var(--ink-soft);
        margin-top:4px;
      }


      .perk-guru-average {
        flex:0 0 auto;
        padding:7px 10px;
        border-radius:10px;
        background:var(--primary-soft);
        color:var(--primary-dark);
        font-weight:700;
        font-size:13px;
        white-space:nowrap;
      }


      .perk-guru-score-grid {
        display:grid;
        grid-template-columns:
          repeat(
            2,
            minmax(0, 1fr)
          );
        gap:8px;
      }


      .perk-guru-score-item {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:8px;
        padding:9px 10px;
        background:var(--bg);
        border-radius:10px;
        min-width:0;
      }


      .perk-guru-score-name {
        font-size:11px;
        color:var(--ink-soft);
        line-height:1.25;
        min-width:0;
      }


      .perk-guru-score-value {
        font-weight:700;
        font-size:12px;
        white-space:nowrap;
      }


      .perk-guru-note {
        margin-top:12px;
        padding:10px 11px;
        border-radius:10px;
        background:var(--primary-soft);
        font-size:12px;
        line-height:1.5;
        word-break:break-word;
      }


      @media (
        max-width:760px
      ) {

        .perk-input-grid-top {
          grid-template-columns:
            1fr;
        }


        .perk-input-grid-score {
          grid-template-columns:
            1fr;
        }


        .perk-guru-history-grid {
          grid-template-columns:
            1fr;
        }


        .perk-guru-history-card {
          padding:13px;
        }


        .perk-guru-score-grid {
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
        }

      }


      @media (
        max-width:390px
      ) {

        .perk-guru-history-top {
          flex-direction:column;
          align-items:stretch;
        }


        .perk-guru-average {
          align-self:flex-start;
        }


        .perk-guru-score-item {
          padding:8px;
        }

      }

    </style>


    <div class="section">

      <div class="section-head">

        <div>

          <h2>
            Catat Perkembangan Siswa
          </h2>

          <div
            class="section-subtitle"
          >
            Pilih satu anak lalu isi semua aspek sekaligus.
          </div>

        </div>

      </div>


      <div class="section-body">

        <form
          id="formPerkembangan"
          onsubmit="
            window.__app.simpanPerkembangan(event)
          "
        >

          <div class="perk-input-grid-top">


            <div class="form-group">

              <label>
                Kelas
              </label>

              <select
                id="perkembanganKelas"
                required

                onchange="
                  window.__app.loadSiswaPerkembangan()
                "
              >

                <option value="">
                  Pilih kelas...
                </option>

              </select>

            </div>


            <div class="form-group">

              <label>
                Siswa
              </label>

              <select
                id="perkembanganSiswaId"
                required
              >

                <option value="">
                  Pilih kelas terlebih dahulu
                </option>

              </select>

            </div>


            <div class="form-group">

              <label>
                Tanggal Penilaian
              </label>

              <input
                type="date"
                id="perkembanganTanggal"
                value="${todayStr}"
                required
              >

            </div>


          </div>


          <div class="perk-input-grid-score">


            <div class="form-group">

              <label>
                Teknik
              </label>

              ${opt(
                "perkNilaiTeknik"
              )}

            </div>


            <div class="form-group">

              <label>
                Hafalan Koreografi
              </label>

              ${opt(
                "perkNilaiHafalan"
              )}

            </div>


            <div class="form-group">

              <label>
                Ekspresi
              </label>

              ${opt(
                "perkNilaiEkspresi"
              )}

            </div>


            <div class="form-group">

              <label>
                Disiplin
              </label>

              ${opt(
                "perkNilaiDisiplin"
              )}

            </div>


            <div class="form-group">

              <label>
                Kepercayaan Diri
              </label>

              ${opt(
                "perkNilaiPercaya"
              )}

            </div>


          </div>


          <div
            class="form-group"
            style="margin-top:15px;"
          >

            <label>
              Catatan Pelatih
            </label>

            <input
              type="text"
              id="perkembanganCatatan"

              placeholder="
                Contoh:
                sudah semakin percaya diri
                saat tampil
              "
            >

          </div>


          <div
            class="spp-detail-section spp-detail-section-lg"
          >

            <button
              type="submit"
              class="btn"
              id="btnSimpanPerkembangan"
            >
              Simpan Penilaian Anak
            </button>

          </div>


        </form>

      </div>

    </div>



    <div class="section">

      <div class="section-head">

        <div>

          <h2>
            Penilaian Terakhir Saya
          </h2>

          <div
            class="section-subtitle"
          >
            Riwayat penilaian ditampilkan dalam bentuk kartu agar nyaman dibaca di HP.
          </div>

        </div>

      </div>


      <div class="section-body">

        <div
          id="daftarPerkembanganGuru"
        >

          <div
            class="perk-empty"
          >
            Memuat data...
          </div>

        </div>

      </div>

    </div>

  `;

}


// ============================================================
// GURU - LOAD SISWA BERDASARKAN KELAS
// ============================================================

async function loadSiswaPerkembangan() {

  const kelas =
    document.getElementById(
      "perkembanganKelas"
    )?.value;


  const sel =
    document.getElementById(
      "perkembanganSiswaId"
    );


  if (
    !sel ||
    !supabase
  ) {
    return;
  }


  if (!kelas) {

    sel.innerHTML = `
      <option value="">
        Pilih kelas terlebih dahulu
      </option>
    `;

    return;

  }


  const {
    data,
    error
  } =
    await supabase
      .from("siswa")
      .select(
        "id,nama,nis"
      )
      .eq(
        "kelas",
        kelas
      )
      .order("nama");


  if (error) {

    sel.innerHTML = `
      <option value="">
        Gagal memuat siswa
      </option>
    `;

    return;

  }


  sel.innerHTML =

    (data || [])
      .map(
        (s) => `

          <option
            value="${s.id}"
          >
            ${s.nama}
            —
            ${s.nis || "-"}
          </option>

        `
      )
      .join("")

    ||

    `
      <option value="">
        Belum ada siswa
      </option>
    `;

}


// ============================================================
// GURU - SIMPAN PENILAIAN
// ============================================================

async function simpanPerkembangan(e) {

  e.preventDefault();


  if (
    !supabase ||
    currentUserRole !== "guru"
  ) {
    return;
  }


  const btn =
    document.getElementById(
      "btnSimpanPerkembangan"
    );


  btn.disabled = true;

  btn.textContent =
    "Menyimpan...";


  try {

    const siswa_id =
      document.getElementById(
        "perkembanganSiswaId"
      )?.value;


    const tanggal =
      document.getElementById(
        "perkembanganTanggal"
      )?.value;


    const catatan =
      document
        .getElementById(
          "perkembanganCatatan"
        )
        ?.value
        .trim()
      ||
      null;


    if (
      !siswa_id ||
      !tanggal
    ) {

      throw new Error(
        "Siswa dan tanggal wajib dipilih."
      );

    }


    const map = {

      "Teknik":
        Number(
          document
            .getElementById(
              "perkNilaiTeknik"
            )
            .value
        ),

      "Hafalan Koreografi":
        Number(
          document
            .getElementById(
              "perkNilaiHafalan"
            )
            .value
        ),

      "Ekspresi":
        Number(
          document
            .getElementById(
              "perkNilaiEkspresi"
            )
            .value
        ),

      "Disiplin":
        Number(
          document
            .getElementById(
              "perkNilaiDisiplin"
            )
            .value
        ),

      "Kepercayaan Diri":
        Number(
          document
            .getElementById(
              "perkNilaiPercaya"
            )
            .value
        )

    };


    const payloads =
      Object
        .entries(map)
        .map(
          ([
            aspek,
            nilai
          ]) => ({

            siswa_id,

            guru_id:
              currentUser.id,

            tanggal,

            aspek,

            nilai,

            catatan

          })
        );


    const {
      error
    } =
      await supabase
        .from("perkembangan")
        .insert(
          payloads
        );


    if (error) throw error;


    appNotify(
      "Penilaian lengkap untuk anak berhasil disimpan."
    );


    document
      .getElementById(
        "perkembanganCatatan"
      )
      .value = "";


    loadPerkembanganGuru();

  }

  catch (e) {

    appNotify(
      "Gagal menyimpan: "
      +
      e.message
    );

  }

  finally {

    btn.disabled = false;

    btn.textContent =
      "Simpan Penilaian Anak";

  }

}


// ============================================================
// ORANG TUA - RENDER HALAMAN
// ============================================================

function renderPerkembanganAnak() {

  return `

    <div
      id="pilihAnakWrap"
    ></div>


    <div class="section">

      <div class="section-head">

        <div>

          <h2>
            Perkembangan Anak
          </h2>

          <div
            class="section-subtitle"
          >
            Ringkasan dibuat per anak agar mudah dibaca.
          </div>

        </div>

      </div>


      <div class="section-body">

        <div
          id="ringkasanPerkembangan"
        >

          <div class="empty">
            Memuat data...
          </div>

        </div>

      </div>

    </div>

  `;

}


// ============================================================
// ORANG TUA - FORMAT PERIODE
// ============================================================

function formatPeriodePerkembangan(periode) {

  const [
    tahun,
    bulan
  ] =
    periode
      .split("-")
      .map(
        Number
      );


  return `
    ${namaBulan(bulan)}
    ${tahun}
  `;

}


// ============================================================
// ORANG TUA - RENDER RIWAYAT TERPILIH
// ============================================================

function renderRiwayatPerkembanganDipilih(
  periode
) {

  const panel =
    document.getElementById(
      "perkembanganRiwayatPanel"
    );


  if (!panel) return;


  const rows =
    riwayatPerkembanganAnakData[
      periode
    ]
    ||
    [];


  if (!rows.length) {

    panel.innerHTML = `
      <div class="empty">
        Belum ada penilaian
        pada periode ini.
      </div>
    `;

    return;

  }


  const nilaiMap =
    {};


  rows.forEach(
    (r) => {

      if (
        !nilaiMap[
          r.aspek
        ]
      ) {

        nilaiMap[
          r.aspek
        ] =
          r;

      }

    }
  );


  const vals =
    PERKEMBANGAN_ASPEK
      .map(
        (a) =>
          Number(
            nilaiMap[
              a
            ]?.nilai
          )
          ||
          0
      )
      .filter(
        Boolean
      );


  const avg =
    vals.length

      ? (
          vals.reduce(
            (a, b) =>
              a + b,
            0
          )
          /
          vals.length
        ).toFixed(1)

      : "-";


  const note =
    rows.find(
      (r) =>
        r.catatan
    )?.catatan

    ||

    "Tidak ada catatan tambahan.";


  const guru =
    rows[0]
      ?.guru
      ?.nama

    ||

    "Pelatih";


  panel.innerHTML = `

    <div
      class="perk-history-grid"
    >

      ${PERKEMBANGAN_ASPEK
        .map(
          (a) => `

            <div
              class="
                perk-history-cell
              "
            >

              <div class="name">
                ${a}
              </div>


              <div class="score">

                ${
                  nilaiMap[a]?.nilai

                    ? `${nilaiMap[a].nilai}/5`

                    : "—"
                }

              </div>

            </div>

          `
        )
        .join("")}

    </div>


    <div
      class="perk-history-meta"
    >

      ${formatPeriodePerkembangan(
        periode
      )}

      ·

      ${guru}

      ·

      Rata-rata
      ${avg}/5

    </div>


    <div
      class="perk-history-note"
    >

      <strong>
        Catatan:
      </strong>

      ${note}

    </div>

  `;

}


// ============================================================
// DATA RIWAYAT ORANG TUA
// ============================================================

let riwayatPerkembanganAnakData =
  {};


// ============================================================
// ADMIN - EXPORT CSV
// ============================================================

async function exportPerkembanganCsv() {

  if (
    !supabase ||
    currentUserRole !== "admin"
  ) {
    return;
  }


  const bulan =
    Number(
      document.getElementById(
        "perkembanganAdminBulan"
      )?.value || 0
    );


  const tahun =
    Number(
      document.getElementById(
        "perkembanganAdminTahun"
      )?.value ||
      new Date().getFullYear()
    );


  const kelas =
    document.getElementById(
      "perkembanganAdminKelas"
    )?.value
    ||
    "";


  const search =
    (
      document.getElementById(
        "perkembanganAdminCari"
      )?.value
      ||
      ""
    )
      .trim()
      .toLowerCase();


  let q =
    supabase
      .from("perkembangan")
      .select(
        `
        tanggal,
        aspek,
        nilai,
        catatan,

        siswa:siswa_id(
          nama,
          nis,
          kelas
        ),

        guru:guru_id(
          nama
        )
        `
      )
      .order(
        "tanggal",
        {
          ascending: false
        }
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (bulan) {

    const awal =
      `${tahun}-${String(
        bulan
      ).padStart(2, "0")}-01`;


    const akhirD =
      new Date(
        tahun,
        bulan,
        0
      ).getDate();


    const akhir =
      `${tahun}-${String(
        bulan
      ).padStart(2, "0")}-${String(
        akhirD
      ).padStart(2, "0")}`;


    q =
      q
        .gte(
          "tanggal",
          awal
        )
        .lte(
          "tanggal",
          akhir
        );

  }

  else {

    q =
      q
        .gte(
          "tanggal",
          `${tahun}-01-01`
        )
        .lte(
          "tanggal",
          `${tahun}-12-31`
        );

  }


  const {
    data,
    error
  } =
    await q;


  if (error) {

    appNotify(
      "Gagal export perkembangan: "
      +
      error.message
    );

    return;

  }


  const filtered =
    (data || [])
      .filter(
        (x) =>

          (
            !kelas ||
            x.siswa?.kelas === kelas
          )

          &&

          (
            !search ||
            (
              x.siswa?.nama ||
              ""
            )
              .toLowerCase()
              .includes(search)
          )
      );


  const rows = [

    [
      "Tanggal",
      "Nama",
      "NIS",
      "Kelas",
      "Aspek",
      "Nilai",
      "Pelatih",
      "Catatan"
    ]

  ];


  filtered.forEach(
    (x) =>

      rows.push(
        [

          x.tanggal || "",

          x.siswa?.nama || "",

          x.siswa?.nis || "",

          x.siswa?.kelas || "",

          x.aspek || "",

          x.nilai || "",

          x.guru?.nama || "",

          x.catatan || ""

        ]
      )
  );


  const periode =
    bulan

      ? `${tahun}-${String(
          bulan
        ).padStart(2, "0")}`

      : String(tahun);


  downloadCsv(
    `gantariku-perkembangan-${periode}.csv`,
    rows
  );

}


// ============================================================
// ORANG TUA - LOAD PERKEMBANGAN
// ============================================================
// Implementasi aktif untuk Orang Tua berada di js/perkembangan-history-fix.js.
// File ini dipertahankan untuk shell, utilitas, dan kompatibilitas modul lainnya.


