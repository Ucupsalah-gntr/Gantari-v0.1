// ============================================================
// GANTARIKU — HALAMAN ORANG TUA
// MOBILE-FIRST RESPONSIVE VERSION
// ============================================================

// Satu akun orang tua bisa memiliki beberapa anak.
let anakOrangTuaList = [];
let anakTerpilihId = null;


// ============================================================
// HELPER RESPONSIVE
// ============================================================

function isMobileOrtu() {
  return window.innerWidth <= 768;
}


// ============================================================
// BUKTI PEMBAYARAN — STORAGE PRIVATE
// ============================================================

function getBuktiPathOrtu(value) {

  if (!value) return null;

  const text = String(value);

  const marker =
    "/storage/v1/object/public/bukti-pembayaran/";

  const markerSign =
    "/storage/v1/object/sign/bukti-pembayaran/";

  if (text.includes(marker)) {
    return decodeURIComponent(
      text
        .split(marker)[1]
        .split("?")[0]
    );
  }

  if (text.includes(markerSign)) {
    return decodeURIComponent(
      text
        .split(markerSign)[1]
        .split("?")[0]
    );
  }

  return text;
}


async function getBuktiSignedUrlOrtu(
  value,
  expiresIn = 600
) {

  if (!supabase || !value) {
    return null;
  }

  const path =
    getBuktiPathOrtu(value);

  const {
    data,
    error
  } =
    await supabase
      .storage
      .from("bukti-pembayaran")
      .createSignedUrl(
        path,
        expiresIn
      );

  if (error) {

    console.error(
      "Gagal membuka bukti pembayaran:",
      error
    );

    return null;
  }

  return (
    data?.signedUrl ||
    null
  );
}


// ============================================================
// LOAD ANAK ORANG TUA
// ============================================================

async function pastikanAnakOrangTuaDimuat() {

  if (
    !supabase ||
    !currentUser
  ) {
    return;
  }

  if (
    anakOrangTuaList.length > 0
  ) {
    return;
  }

  const {
    data,
    error
  } =
    await withRequestTimeout(
      supabase
      .from("siswa")
      .select(
        "id, nama, nis, kelas, tahun_ajaran"
      )
      .eq(
        "orang_tua_id",
        currentUser.id
      )
      .order(
        "nama",
        {
          ascending: true
        }
      ),
      "daftar anak"
    );

  if (error) {
    console.error(
      "Error load daftar anak:",
      error
    );
    anakOrangTuaList = [];
    return;
  }

  anakOrangTuaList =
    data || [];

  if (
    !anakTerpilihId &&
    anakOrangTuaList.length > 0
  ) {

    anakTerpilihId =
      anakOrangTuaList[0].id;
  }
}


function anakYangDipilih() {

  return (
    anakOrangTuaList.find(
      (a) =>
        String(a.id) ===
        String(anakTerpilihId)
    ) ||
    anakOrangTuaList[0] ||
    null
  );
}


// ============================================================
// PILIH ANAK
// ============================================================

function renderPilihAnakHtml() {

  if (
    anakOrangTuaList.length <= 1
  ) {
    return "";
  }

  const opsi =
    anakOrangTuaList
      .map(
        (a) => `
          <option
            value="${a.id}"
            ${
              String(a.id) ===
              String(anakTerpilihId)
                ? "selected"
                : ""
            }
          >
            ${a.nama} — ${a.kelas || "-"}
          </option>
        `
      )
      .join("");

  return `
    <div
      class="ortu-child-selector"
      style="
        margin-bottom:16px;
      "
    >

      <div
        style="
          font-size:12px;
          font-weight:700;
          color:var(--ink-soft);
          margin-bottom:7px;
        "
      >
        Pilih Anak
      </div>

      <select
        id="pilihAnak"
        onchange="window.__app.gantiAnak(this.value)"
        style="
          width:100%;
          max-width:420px;
        "
      >
        ${opsi}
      </select>

    </div>
  `;
}


function gantiAnak(id) {

  anakTerpilihId =
    id;

  renderView();
}


// ============================================================
// RINGKASAN ANAK
// ============================================================

function renderRingkasanAnak() {

  return `

    <div id="pilihAnakWrap"></div>

    <div id="ringkasanAnakBody">

      <div class="empty">
        Memuat data anak...
      </div>

    </div>

  `;
}


async function loadRingkasanAnak() {

  const wrap =
    document.getElementById(
      "pilihAnakWrap"
    );

  const body =
    document.getElementById(
      "ringkasanAnakBody"
    );

  if (
    !body ||
    !supabase
  ) {
    return;
  }

  await pastikanAnakOrangTuaDimuat();

  if (wrap) {

    wrap.innerHTML =
      renderPilihAnakHtml();
  }

  if (
    anakOrangTuaList.length === 0
  ) {

    body.innerHTML = `
      <div class="empty">

        Belum ada data siswa yang
        terhubung dengan akun ini.

        <br><br>

        Hubungi admin sekolah atau
        hubungkan anak menggunakan
        kode akses yang diberikan.

      </div>
    `;

    return;
  }

  const anak =
    anakYangDipilih();

  try {

    const today =
      getNowWIB();

    const bulanIni =
      today.getMonth() + 1;

    const tahunIni =
      today.getFullYear();

    const bulanStr =
      String(
        bulanIni
      ).padStart(
        2,
        "0"
      );

    const hariTerakhir =
      new Date(
        tahunIni,
        bulanIni,
        0
      ).getDate();

    const {
      data: absensiBulanIni,
      error: absensiError
    } =
      await withRequestTimeout(
        supabase
        .from("absensi")
        .select("status")
        .eq(
          "siswa_id",
          anak.id
        )
        .gte(
          "tanggal",
          `${tahunIni}-${bulanStr}-01`
        )
        .lte(
          "tanggal",
          `${tahunIni}-${bulanStr}-${String(
            hariTerakhir
          ).padStart(2, "0")}`
        ),
        "ringkasan absensi anak"
      );

    if (absensiError) {
      throw absensiError;
    }

    const hitung = {

      H: 0,
      I: 0,
      S: 0,
      A: 0

    };

    (
      absensiBulanIni ||
      []
    )
      .forEach(
        (a) => {

          if (
            hitung[
              a.status
            ] !== undefined
          ) {

            hitung[
              a.status
            ]++;

          }

        }
      );

    const {
      data: sppBulanIni,
      error: sppError
    } =
      await withRequestTimeout(
        supabase
        .from("spp")
        .select(
          "status, nominal, bukti_bayar_url"
        )
        .eq(
          "siswa_id",
          anak.id
        )
        .eq(
          "bulan",
          bulanIni
        )
        .eq(
          "tahun",
          tahunIni
        )
        .maybeSingle(),
        "ringkasan SPP anak"
      );

    if (sppError) {
      throw sppError;
    }

    const sppStatus =
      sppBulanIni
        ? sppBulanIni.status
        : "Belum ada tagihan";

    body.innerHTML = `

      <div class="section">

        <div class="section-head">

          <div>

            <h2
              style="
                margin:0;
              "
            >
              ${anak.nama}
            </h2>

            <div
              style="
                margin-top:5px;
                font-size:12px;
                color:var(--ink-soft);
              "
            >
              Ringkasan
              ${namaBulan(
                bulanIni
              )}
              ${tahunIni}
            </div>

          </div>

        </div>


        <div class="section-body">

          <div
            class="ortu-child-profile"
            style="
              margin-bottom:20px;
              padding:14px;
              border:1px solid var(--line);
              border-radius:16px;
              background:
                rgba(255,255,255,.45);
            "
          >

            <div
              style="
                display:grid;
                grid-template-columns:
                  repeat(
                    3,
                    minmax(0,1fr)
                  );
                gap:12px;
              "
            >

              <div>

                <div
                  style="
                    font-size:10px;
                    color:var(--ink-soft);
                    text-transform:uppercase;
                    font-weight:700;
                  "
                >
                  NIS
                </div>

                <div
                  style="
                    margin-top:3px;
                    font-weight:700;
                  "
                >
                  ${anak.nis || "-"}
                </div>

              </div>


              <div>

                <div
                  style="
                    font-size:10px;
                    color:var(--ink-soft);
                    text-transform:uppercase;
                    font-weight:700;
                  "
                >
                  Kelas
                </div>

                <div
                  style="
                    margin-top:3px;
                    font-weight:700;
                  "
                >
                  ${anak.kelas || "-"}
                </div>

              </div>


              <div>

                <div
                  style="
                    font-size:10px;
                    color:var(--ink-soft);
                    text-transform:uppercase;
                    font-weight:700;
                  "
                >
                  Tahun Ajaran
                </div>

                <div
                  style="
                    margin-top:3px;
                    font-weight:700;
                  "
                >
                  ${anak.tahun_ajaran || "-"}
                </div>

              </div>

            </div>

          </div>


          <div class="stat-row">

            <div class="stat c-teal">

              <div class="num">
                ${hitung.H}
              </div>

              <div class="lbl">
                Hadir
              </div>

            </div>


            <div class="stat c-warn">

              <div class="num">
                ${hitung.I}
              </div>

              <div class="lbl">
                Izin
              </div>

            </div>


            <div class="stat c-sick">

              <div class="num">
                ${hitung.S}
              </div>

              <div class="lbl">
                Sakit
              </div>

            </div>


            <div class="stat c-bad">

              <div class="num">
                ${hitung.A}
              </div>

              <div class="lbl">
                Alpa
              </div>

            </div>

          </div>


          <div
            class="ortu-spp-summary"
            style="
              margin-top:20px;
              padding:16px;
              border:1px solid var(--line);
              border-radius:16px;
            "
          >

            <div
              style="
                display:flex;
                justify-content:space-between;
                gap:12px;
                align-items:center;
                flex-wrap:wrap;
              "
            >

              <div>

                <div
                  style="
                    font-size:11px;
                    color:var(--ink-soft);
                    margin-bottom:5px;
                  "
                >
                  Status SPP
                  ${namaBulan(
                    bulanIni
                  )}
                  ${tahunIni}
                </div>

                <div
                  style="
                    font-size:15px;
                    font-weight:800;
                  "
                >
                  ${sppBulanIni
                    ? formatRupiah(
                        sppBulanIni.nominal
                      )
                    : "-"
                  }
                </div>

              </div>


              <span
                class="badge ${
                  sppBulanIni
                    ? sppBulanIni.status ===
                      "Lunas"
                      ? "badge-good"
                      : sppBulanIni.status ===
                        "Menunggu Verifikasi"
                      ? "badge-warn"
                      : "badge-bad"
                    : "badge-muted"
                }"
              >

                ${sppStatus}

              </span>

            </div>

          </div>

        </div>

      </div>

    `;

  } catch (error) {

    console.error(
      "Error load ringkasan anak:",
      error
    );

    body.innerHTML = `

      <div
        class="empty"
        style="
          color:#E11D48;
        "
      >
        Gagal memuat ringkasan anak.
      </div>

    `;
  }
}


// ============================================================
// KEHADIRAN ANAK
// ============================================================

function renderAbsenAnak() {

  const today =
    getNowWIB();

  const todayStr =
    getTodayWIBString();

  const awalBulanStr =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}-01`;

  return `

    <div id="pilihAnakWrap"></div>


    <div class="section">

      <div class="section-head">

        <div>

          <h2>Kehadiran Anak</h2>

          <div
            style="
              font-size:12px;
              color:var(--ink-soft);
              margin-top:4px;
            "
          >
            Riwayat kehadiran anak
          </div>

        </div>


        <div
          class="controls ortu-mobile-controls"
        >

          <div
            class="ortu-date-field"
          >

            <label>Dari</label>

            <input
              type="date"
              id="absenAnakDari"
              value="${awalBulanStr}"
            >

          </div>


          <div
            class="ortu-date-field"
          >

            <label>Sampai</label>

            <input
              type="date"
              id="absenAnakSampai"
              value="${todayStr}"
            >

          </div>


          <button
            class="btn secondary"
            onclick="window.__app.loadAbsenAnak()"
          >
            Tampilkan
          </button>

        </div>

      </div>


      <div class="section-body">


        <!-- DESKTOP TABLE -->

        <div
          class="ortu-desktop-table"
        >

          <table>

            <thead>

              <tr>

                <th>Tanggal</th>

                <th>Status</th>

                <th>Keterangan</th>

              </tr>

            </thead>


            <tbody
              id="daftarAbsenAnak"
            >

              <tr>

                <td
                  colspan="3"
                  style="
                    text-align:center;
                  "
                >
                  Memuat data...
                </td>

              </tr>

            </tbody>

          </table>

        </div>


        <!-- MOBILE CARD -->

        <div
          id="daftarAbsenAnakMobile"
          class="ortu-mobile-list"
        >

          <div class="empty">
            Memuat data...
          </div>

        </div>


      </div>

    </div>

  `;
}


async function loadAbsenAnak() {

  const wrap =
    document.getElementById(
      "pilihAnakWrap"
    );

  const tbody =
    document.getElementById(
      "daftarAbsenAnak"
    );

  const mobileList =
    document.getElementById(
      "daftarAbsenAnakMobile"
    );

  if (
    !tbody ||
    !mobileList ||
    !supabase
  ) {
    return;
  }

  await pastikanAnakOrangTuaDimuat();

  if (wrap) {

    wrap.innerHTML =
      renderPilihAnakHtml();
  }

  if (
    anakOrangTuaList.length === 0
  ) {

    const emptyHtml =
      `
        Belum ada data siswa yang
        terhubung dengan akun ini.
      `;

    tbody.innerHTML = `
      <tr>
        <td
          colspan="3"
          style="
            text-align:center;
          "
        >
          ${emptyHtml}
        </td>
      </tr>
    `;

    mobileList.innerHTML = `
      <div class="empty">
        ${emptyHtml}
      </div>
    `;

    return;
  }

  const anak =
    anakYangDipilih();

  const dari =
    document.getElementById(
      "absenAnakDari"
    )?.value;

  const sampai =
    document.getElementById(
      "absenAnakSampai"
    )?.value;

  if (
    !dari ||
    !sampai
  ) {

    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabase
        .from("absensi")
        .select(
          "tanggal, status, keterangan"
        )
        .eq(
          "siswa_id",
          anak.id
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
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    if (
      !data ||
      data.length === 0
    ) {

      tbody.innerHTML = `
        <tr>

          <td
            colspan="3"
            style="
              text-align:center;
            "
          >
            Tidak ada data absensi
            pada rentang ini.
          </td>

        </tr>
      `;

      mobileList.innerHTML = `
        <div class="empty">
          Tidak ada data absensi
          pada rentang ini.
        </div>
      `;

      return;
    }


    // --------------------------------------------------------
    // DESKTOP TABLE
    // --------------------------------------------------------

    tbody.innerHTML =
      data
        .map(
          (a) => `

            <tr>

              <td>
                ${a.tanggal || "-"}
              </td>


              <td>

                <span
                  class="badge ${statusBadgeAbsensi(
                    a.status
                  )}"
                >

                  ${labelStatusAbsensi(
                    a.status
                  )}

                </span>

              </td>


              <td>
                ${a.keterangan || "-"}
              </td>

            </tr>

          `
        )
        .join("");


    // --------------------------------------------------------
    // MOBILE CARD
    // --------------------------------------------------------

    mobileList.innerHTML =
      data
        .map(
          (a) => `

            <div
              class="ortu-data-card"
            >

              <div
                class="ortu-card-top"
              >

                <div>

                  <div
                    class="ortu-card-label"
                  >
                    Tanggal
                  </div>

                  <div
                    class="ortu-card-title"
                  >
                    ${a.tanggal || "-"}
                  </div>

                </div>


                <span
                  class="badge ${statusBadgeAbsensi(
                    a.status
                  )}"
                >
                  ${labelStatusAbsensi(
                    a.status
                  )}
                </span>

              </div>


              <div
                class="ortu-card-divider"
              ></div>


              <div
                class="ortu-card-label"
              >
                Keterangan
              </div>


              <div
                class="ortu-card-text"
              >
                ${
                  a.keterangan ||
                  "Tidak ada keterangan."
                }
              </div>

            </div>

          `
        )
        .join("");

  } catch (error) {

    console.error(
      "Error load absen anak:",
      error
    );

    tbody.innerHTML = `
      <tr>

        <td
          colspan="3"
          style="
            text-align:center;
            color:#E11D48;
          "
        >
          Gagal memuat data absensi.
        </td>

      </tr>
    `;

    mobileList.innerHTML = `
      <div
        class="empty"
        style="
          color:#E11D48;
        "
      >
        Gagal memuat data absensi.
      </div>
    `;
  }
}


// ============================================================
// STATUS SPP ANAK
// ============================================================

function renderSppAnak() {

  const tahunSekarang =
    getNowWIB()
      .getFullYear();

  const tahunOptions =
    `<option value="">
      Semua tahun
    </option>` +

    [
      tahunSekarang,
      tahunSekarang - 1,
      tahunSekarang - 2
    ]
      .map(
        (t) => `

          <option
            value="${t}"
            ${
              t === tahunSekarang
                ? "selected"
                : ""
            }
          >
            ${t}
          </option>

        `
      )
      .join("");

  return `

    <div id="pilihAnakWrap"></div>


    <div class="section">

      <div class="section-head">

        <div>

          <h2>Status SPP</h2>

          <div
            style="
              font-size:12px;
              color:var(--ink-soft);
              margin-top:4px;
            "
          >
            Riwayat pembayaran SPP
          </div>

        </div>


        <div
          class="
            controls
            ortu-mobile-controls
          "
        >

          <select
            id="sppAnakTahun"
          >

            ${tahunOptions}

          </select>


          <button
            class="btn secondary"
            onclick="window.__app.loadSppAnak()"
          >
            Tampilkan
          </button>

        </div>

      </div>


      <div class="section-body">


        <!-- DESKTOP -->

        <div
          class="ortu-desktop-table"
        >

          <table>

            <thead>

              <tr>

                <th>Bulan</th>

                <th>Tahun</th>

                <th class="num">
                  Nominal
                </th>

                <th>Status</th>

                <th>
                  Tanggal Bayar
                </th>

                <th>Aksi</th>

              </tr>

            </thead>


            <tbody
              id="daftarSppAnak"
            >

              <tr>

                <td
                  colspan="6"
                  style="
                    text-align:center;
                  "
                >
                  Memuat data...
                </td>

              </tr>

            </tbody>

          </table>

        </div>


        <!-- MOBILE -->

        <div
          id="daftarSppAnakMobile"
          class="ortu-mobile-list"
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
// LOAD SPP ANAK
// ============================================================

async function loadSppAnak() {

  const wrap =
    document.getElementById(
      "pilihAnakWrap"
    );

  const tbody =
    document.getElementById(
      "daftarSppAnak"
    );

  const mobileList =
    document.getElementById(
      "daftarSppAnakMobile"
    );

  if (
    !tbody ||
    !mobileList ||
    !supabase
  ) {
    return;
  }

  await pastikanAnakOrangTuaDimuat();

  if (wrap) {

    wrap.innerHTML =
      renderPilihAnakHtml();
  }

  if (
    anakOrangTuaList.length === 0
  ) {

    const message =
      "Belum ada data siswa yang terhubung dengan akun ini.";

    tbody.innerHTML = `
      <tr>
        <td
          colspan="6"
          style="
            text-align:center;
          "
        >
          ${message}
        </td>
      </tr>
    `;

    mobileList.innerHTML = `
      <div class="empty">
        ${message}
      </div>
    `;

    return;
  }

  const anak =
    anakYangDipilih();

  const tahun =
    document.getElementById(
      "sppAnakTahun"
    )?.value;

  try {

    let query =
      supabase
        .from("spp")
        .select(
          `
            id,
            bulan,
            tahun,
            nominal,
            status,
            tanggal_bayar,
            bukti_bayar_url
          `
        )
        .eq(
          "siswa_id",
          anak.id
        );

    if (tahun) {

      query =
        query.eq(
          "tahun",
          Number(tahun)
        );
    }

    const {
      data,
      error
    } =
      await query
        .order(
          "tahun",
          {
            ascending: false
          }
        )
        .order(
          "bulan",
          {
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    if (
      !data ||
      data.length === 0
    ) {

      tbody.innerHTML = `
        <tr>

          <td
            colspan="6"
            style="
              text-align:center;
            "
          >
            Belum ada data SPP.
          </td>

        </tr>
      `;

      mobileList.innerHTML = `
        <div class="empty">
          Belum ada data SPP.
        </div>
      `;

      return;
    }


    const dataWithSigned =
      await Promise.all(

        data.map(
          async (s) => ({

            ...s,

            buktiSignedUrl:
              s.bukti_bayar_url
                ? await getBuktiSignedUrlOrtu(
                    s.bukti_bayar_url
                  )
                : null

          })
        )

      );


    // --------------------------------------------------------
    // RENDER DESKTOP
    // --------------------------------------------------------

    tbody.innerHTML =
      dataWithSigned
        .map(
          (s) => {

            const aksi =
              renderAksiSppOrtu(
                s,
                false
              );

            return `

              <tr>

                <td>
                  ${namaBulan(
                    s.bulan
                  )}
                </td>


                <td>
                  ${s.tahun}
                </td>


                <td class="num">
                  ${formatRupiah(
                    s.nominal
                  )}
                </td>


                <td>

                  ${renderBadgeSppOrtu(
                    s.status
                  )}

                </td>


                <td>
                  ${
                    s.tanggal_bayar ||
                    "-"
                  }
                </td>


                <td>
                  ${aksi}
                </td>

              </tr>

            `;

          }
        )
        .join("");


    // --------------------------------------------------------
    // RENDER MOBILE
    // --------------------------------------------------------

    mobileList.innerHTML =
      dataWithSigned
        .map(
          (s) => {

            const aksi =
              renderAksiSppOrtu(
                s,
                true
              );

            return `

              <div
                class="ortu-spp-card"
              >

                <div
                  class="ortu-card-top"
                >

                  <div>

                    <div
                      class="ortu-card-label"
                    >
                      Periode
                    </div>

                    <div
                      class="ortu-card-title"
                    >
                      ${namaBulan(
                        s.bulan
                      )}
                      ${s.tahun}
                    </div>

                  </div>


                  ${renderBadgeSppOrtu(
                    s.status
                  )}

                </div>


                <div
                  class="ortu-spp-nominal"
                >

                  ${formatRupiah(
                    s.nominal
                  )}

                </div>


                <div
                  class="ortu-spp-detail"
                >

                  <div>

                    <span>
                      Tanggal bayar
                    </span>

                    <strong>
                      ${
                        s.tanggal_bayar ||
                        "-"
                      }
                    </strong>

                  </div>

                </div>


                <div
                  class="ortu-card-divider"
                ></div>


                <div
                  class="ortu-spp-action"
                >

                  ${aksi}

                </div>

              </div>

            `;

          }
        )
        .join("");

  } catch (error) {

    console.error(
      "Error load SPP anak:",
      error
    );

    tbody.innerHTML = `
      <tr>

        <td
          colspan="6"
          style="
            text-align:center;
            color:#E11D48;
          "
        >
          Gagal memuat data SPP.
        </td>

      </tr>
    `;

    mobileList.innerHTML = `
      <div
        class="empty"
        style="
          color:#E11D48;
        "
      >
        Gagal memuat data SPP.
      </div>
    `;
  }
}


// ============================================================
// BADGE SPP
// ============================================================

function renderBadgeSppOrtu(
  status
) {

  const badgeClass =
    status === "Lunas"
      ? "badge-good"
      : status ===
        "Menunggu Verifikasi"
      ? "badge-warn"
      : "badge-bad";

  return `
    <span
      class="badge ${badgeClass}"
    >
      ${status}
    </span>
  `;
}


// ============================================================
// AKSI SPP
// ============================================================

function renderAksiSppOrtu(
  s,
  mobile = false
) {

  if (
    s.status ===
    "Belum Bayar"
  ) {

    return `

      <button
        class="btn small"
        style="
          ${
            mobile
              ? "width:100%;"
              : ""
          }
        "
        onclick="window.__app.pilihBuktiSpp('${s.id}')"
      >
        📎 Kirim Bukti Pembayaran
      </button>

      <input
        type="file"
        id="fileSpp_${s.id}"
        accept="
          image/jpeg,
          image/png,
          application/pdf
        "
        style="display:none;"
        onchange="
          window.__app.uploadBuktiSpp(
            '${s.id}',
            this.files[0]
          )
        "
      >

    `;
  }


  if (
    s.status ===
    "Menunggu Verifikasi"
  ) {

    return `

      <div
        style="
          font-size:12px;
          color:var(--ink-soft);
          line-height:1.5;
        "
      >
        Bukti pembayaran sudah dikirim.
        Admin sedang melakukan verifikasi.
      </div>

      ${
        s.buktiSignedUrl
          ? `

            <a
              href="${s.buktiSignedUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn secondary small"
              style="
                display:inline-flex;
                margin-top:10px;
                ${
                  mobile
                    ? "width:100%;justify-content:center;"
                    : ""
                }
              "
            >
              Lihat Bukti
            </a>

          `
          : ""
      }

    `;
  }


  if (
    s.status ===
    "Lunas"
  ) {

    return `

      <div
        style="
          font-size:12px;
          color:#15803D;
          font-weight:700;
        "
      >
        ✓ Pembayaran telah diverifikasi
      </div>

    `;
  }

  return "-";
}


// ============================================================
// PILIH FILE BUKTI
// ============================================================

function pilihBuktiSpp(
  id
) {

  const input =
    document.getElementById(
      `fileSpp_${id}`
    );

  if (!input) {
    return;
  }

  input.click();
}


// ============================================================
// UPLOAD BUKTI PEMBAYARAN
// ============================================================

async function uploadBuktiSpp(
  sppId,
  file
) {

  if (!file) {
    return;
  }

  if (!supabase) {

    alert(
      "Supabase belum terhubung."
    );

    return;
  }


  const maxSize =
    5 *
    1024 *
    1024;


  if (
    file.size >
    maxSize
  ) {

    alert(
      "Ukuran file maksimal 5 MB."
    );

    return;
  }


  const tipeDiizinkan = [

    "image/jpeg",

    "image/png",

    "application/pdf"

  ];


  if (
    !tipeDiizinkan.includes(
      file.type
    )
  ) {

    alert(
      "File harus berupa JPG, PNG, atau PDF."
    );

    return;
  }


  try {


    const {
      data: spp,
      error: sppError
    } =
      await supabase
        .from("spp")
        .select(
          `
            id,
            siswa_id,
            bulan,
            tahun,
            status
          `
        )
        .eq(
          "id",
          sppId
        )
        .single();


    if (sppError) {
      throw sppError;
    }


    if (
      !spp ||
      spp.status !==
        "Belum Bayar"
    ) {

      alert(
        "Tagihan ini tidak dapat menerima bukti pembayaran."
      );

      return;
    }


    await pastikanAnakOrangTuaDimuat();


    const anak =
      anakOrangTuaList.find(
        (a) =>
          String(a.id) ===
          String(
            spp.siswa_id
          )
      );


    if (!anak) {

      alert(
        "Anda tidak memiliki akses ke tagihan ini."
      );

      return;
    }


    const extension =
      file.name.includes(".")
        ? file.name
            .split(".")
            .pop()
            .toLowerCase()
        : "bin";


    const safeName =
      `spp-${spp.tahun}-${String(
        spp.bulan
      ).padStart(
        2,
        "0"
      )}-${Date.now()}.${extension}`;


    const folder =
      currentUser.id;


    const filePath =
      `${folder}/${safeName}`;


    const {
      error: uploadError
    } =
      await supabase
        .storage
        .from("bukti-pembayaran")
        .upload(
          filePath,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false
          }
        );


    if (uploadError) {
      throw uploadError;
    }


    const {
      error: updateError
    } =
      await supabase
        .from("spp")
        .update({

          bukti_bayar_url:
            filePath,

          status:
            "Menunggu Verifikasi"

        })
        .eq(
          "id",
          sppId
        );


    if (updateError) {

      await supabase
        .storage
        .from("bukti-pembayaran")
        .remove([
          filePath
        ]);

      throw updateError;
    }


    alert(
      "✅ Bukti pembayaran berhasil dikirim.\n\n" +
      "Status SPP sekarang: Menunggu Verifikasi."
    );


    await loadSppAnak();

  } catch (error) {

    console.error(
      "Error upload bukti:",
      error
    );

    alert(
      "Gagal mengirim bukti pembayaran:\n\n" +
      (
        error?.message ||
        "Terjadi kesalahan."
      )
    );
  }
}


// ============================================================
// DEBUG AKSES PEMBAYARAN
// ============================================================

async function debugAksesPembayaran() {

  try {

    const {
      data: {
        user
      },
      error: userError
    } =
      await supabase
        .auth
        .getUser();


    if (userError) {
      throw userError;
    }


    if (!user) {

      alert(
        "Session login tidak ditemukan."
      );

      return;
    }


    const {
      data: profile,
      error: profileError
    } =
      await supabase
        .from("pengguna")
        .select(
          "id,user_id,nama,email,role"
        )
        .eq(
          "user_id",
          user.id
        )
        .single();


    if (profileError) {
      throw profileError;
    }


    const {
      data: anak,
      error: anakError
    } =
      await supabase
        .from("siswa")
        .select(
          "id,nama,orang_tua_id"
        )
        .eq(
          "orang_tua_id",
          profile.id
        );


    if (anakError) {
      throw anakError;
    }


    console.log(
      "AUTH USER:",
      user
    );

    console.log(
      "PROFILE:",
      profile
    );

    console.log(
      "ANAK:",
      anak
    );


    alert(

      "HASIL DEBUG\n\n" +

      "Login: " +
      user.email +

      "\n" +

      "Nama: " +
      profile.nama +

      "\n" +

      "Role: " +
      profile.role +

      "\n" +

      "ID Profil: " +
      profile.id +

      "\n" +

      "Jumlah anak: " +
      (
        anak ||
        []
      ).length

    );

  } catch (error) {

    console.error(
      "DEBUG PEMBAYARAN:",
      error
    );

    alert(

      "DEBUG GAGAL:\n\n" +

      (
        error?.message ||
        error
      )

    );
  }
}


// ============================================================
// GANTARIKU — HUBUNGKAN ANAK DENGAN KODE AKSES
// ============================================================

(function () {

  "use strict";


  // ----------------------------------------------------------
  // ESCAPE
  // ----------------------------------------------------------

  function escOrtu(
    value
  ) {

    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }


  // ----------------------------------------------------------
  // RENDER FORM HUBUNGKAN ANAK
  // ----------------------------------------------------------

  function renderFormHubungkanAnak() {

    return `

      <div
        style="
          max-width:640px;
          margin:10px auto;
          padding:30px 24px;
          text-align:center;
          border:1px solid #E8DED0;
          border-radius:20px;
          background:
            linear-gradient(
              135deg,
              #FFF7DB,
              #FFFEFB
            );
          box-shadow:
            0 8px 25px
            rgba(
              90,
              65,
              40,
              .06
            );
        "
      >

        <div
          style="
            width:58px;
            height:58px;
            margin:0 auto 14px;
            display:grid;
            place-items:center;
            border-radius:18px;
            background:#FFF0C5;
            font-size:27px;
          "
        >
          🌻
        </div>


        <h2
          style="
            margin:0 0 8px;
            color:#393536;
          "
        >
          Hubungkan Anak
        </h2>


        <p
          style="
            margin:0 auto 20px;
            max-width:480px;
            color:#756B61;
            line-height:1.6;
            font-size:13px;
          "
        >

          Masukkan
          <strong>
            Kode Akses Anak
          </strong>
          yang diberikan oleh sekolah.

          Setelah berhasil,
          data anak akan langsung
          terhubung dengan akun Anda.

        </p>


        <form
          id="formHubungkanAnak"
          style="
            max-width:420px;
            margin:0 auto;
          "
        >

          <input
            type="text"
            id="kodeAksesAnak"
            maxlength="20"
            autocomplete="off"
            placeholder="Contoh: GTR-A7F92C31"
            required
            style="
              width:100%;
              box-sizing:border-box;
              text-align:center;
              text-transform:uppercase;
              letter-spacing:.08em;
              font-weight:700;
              font-size:16px;
              padding:13px 15px;
              border:1px solid #DCCFBC;
              border-radius:12px;
              background:#FFFFFF;
              color:#393536;
            "
          >


          <div
            id="hubungkanAnakError"
            style="
              display:none;
              margin-top:9px;
              padding:10px 12px;
              border-radius:10px;
              background:#FCEBE7;
              color:#B84242;
              font-size:12px;
              text-align:left;
            "
          ></div>


          <div
            id="hubungkanAnakSuccess"
            style="
              display:none;
              margin-top:9px;
              padding:10px 12px;
              border-radius:10px;
              background:#EAF7E9;
              color:#2D8B43;
              font-size:12px;
              text-align:left;
            "
          ></div>


          <button
            type="submit"
            id="btnHubungkanAnak"
            class="btn"
            style="
              width:100%;
              margin-top:12px;
            "
          >
            Hubungkan Anak
          </button>

        </form>


        <div
          style="
            margin-top:18px;
            color:#8B8075;
            font-size:11px;
            line-height:1.5;
          "
        >

          Kode akses diberikan oleh sekolah
          dan hanya dapat digunakan untuk
          menghubungkan siswa yang belum
          terhubung dengan akun orang tua.

        </div>

      </div>

    `;
  }


  // ----------------------------------------------------------
  // HUBUNGKAN DATABASE
  // ----------------------------------------------------------

  async function hubungkanAnakDenganKode(
    kode
  ) {

    if (
      !supabase ||
      !currentUser
    ) {

      throw new Error(
        "Sesi login tidak ditemukan."
      );
    }


    const cleaned =
      String(
        kode ||
        ""
      )
        .trim()
        .toUpperCase()
        .replace(
          /\s+/g,
          ""
        );


    if (!cleaned) {

      throw new Error(
        "Kode akses wajib diisi."
      );
    }


    const {
      data,
      error
    } =
      await supabase.rpc(
        "hubungkan_anak",
        {

          p_kode_akses:
            cleaned

        }
      );


    if (error) {

      console.error(
        "RPC hubungkan anak:",
        error
      );

      throw new Error(
        error.message ||
        "Gagal menghubungkan anak."
      );
    }


    const anak =
      Array.isArray(
        data
      )
        ? data[0]
        : data;


    if (!anak) {

      throw new Error(
        "Data anak tidak ditemukan."
      );
    }


    anakOrangTuaList =
      [];

    anakTerpilihId =
      null;


    return anak;
  }


  // ----------------------------------------------------------
  // TAMPILKAN FORM
  // ----------------------------------------------------------

  async function tampilkanFormHubungkanAnak() {

    const body =
      document.getElementById(
        "ringkasanAnakBody"
      );

    if (!body) {
      return;
    }


    body.innerHTML =
      renderFormHubungkanAnak();


    const form =
      document.getElementById(
        "formHubungkanAnak"
      );

    const input =
      document.getElementById(
        "kodeAksesAnak"
      );

    const errorEl =
      document.getElementById(
        "hubungkanAnakError"
      );

    const successEl =
      document.getElementById(
        "hubungkanAnakSuccess"
      );


    form?.addEventListener(
      "submit",

      async (
        event
      ) => {

        event.preventDefault();


        if (errorEl) {

          errorEl.style.display =
            "none";

          errorEl.textContent =
            "";
        }


        if (successEl) {

          successEl.style.display =
            "none";

          successEl.textContent =
            "";
        }


        const btn =
          document.getElementById(
            "btnHubungkanAnak"
          );


        const kode =
          input?.value
            ?.trim()
            .toUpperCase();


        if (!kode) {

          if (errorEl) {

            errorEl.textContent =
              "Masukkan kode akses anak.";

            errorEl.style.display =
              "block";
          }

          return;
        }


        if (btn) {

          btn.disabled =
            true;

          btn.textContent =
            "Menghubungkan...";
        }


        try {

          const anak =
            await hubungkanAnakDenganKode(
              kode
            );


          await pastikanAnakOrangTuaDimuat();


          if (successEl) {

            successEl.innerHTML =
              `
                ✅ Berhasil!

                Akun Anda terhubung dengan

                <strong>
                  ${escOrtu(
                    anak.nama
                  )}
                </strong>.
              `;

            successEl.style.display =
              "block";
          }


          setTimeout(
            () => {

              if (
                typeof renderView ===
                "function"
              ) {

                renderView();

              } else if (
                window.__app &&
                typeof window.__app.goTo ===
                "function"
              ) {

                window.__app.goTo(
                  currentNav
                );
              }

            },

            500
          );

        } catch (error) {

          console.error(
            "Hubungkan anak:",
            error
          );


          if (errorEl) {

            errorEl.textContent =
              error.message ||
              "Gagal menghubungkan anak.";

            errorEl.style.display =
              "block";
          }


          if (btn) {

            btn.disabled =
              false;

            btn.textContent =
              "Hubungkan Anak";
          }
        }

      }
    );
  }


  // ----------------------------------------------------------
  // WRAP LOAD RINGKASAN
  // ----------------------------------------------------------

  if (
    typeof window.loadRingkasanAnak ===
    "function" &&

    !window
      .loadRingkasanAnak
      .__gtrConnectWrapped
  ) {

    const original =
      window.loadRingkasanAnak;


    async function wrapped() {

      await original();


      if (
        currentUserRole !==
        "ortu"
      ) {
        return;
      }


      const body =
        document.getElementById(
          "ringkasanAnakBody"
        );


      if (
        body &&
        anakOrangTuaList.length ===
        0
      ) {

        await tampilkanFormHubungkanAnak();
      }
    }


    wrapped.__gtrConnectWrapped =
      true;

    wrapped.__gtrOriginal =
      original;


    window.loadRingkasanAnak =
      wrapped;
  }


  // ----------------------------------------------------------
  // GLOBAL
  // ----------------------------------------------------------

  window.hubungkanAnakDenganKode =
    hubungkanAnakDenganKode;

})();


// ============================================================
// MOBILE RESPONSIVE CSS
// Dibuat otomatis agar orangtua.js bisa langsung dipakai.
// ============================================================

(function injectOrtuMobileStyles() {

  const styleId =
    "gantariku-ortu-mobile-style";

  if (
    document.getElementById(
      styleId
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      "style"
    );

  style.id =
    styleId;


  style.textContent = `

    .ortu-mobile-list {
      display:none;
    }


    .ortu-card-top {
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
    }


    .ortu-card-label {
      font-size:10px;
      text-transform:uppercase;
      letter-spacing:.05em;
      color:var(--ink-soft);
      font-weight:800;
    }


    .ortu-card-title {
      margin-top:4px;
      font-size:15px;
      font-weight:800;
      color:var(--ink);
    }


    .ortu-card-text {
      margin-top:5px;
      font-size:13px;
      line-height:1.5;
      color:var(--ink-soft);
    }


    .ortu-card-divider {
      height:1px;
      background:var(--line);
      margin:13px 0;
    }


    .ortu-data-card,
    .ortu-spp-card {

      padding:16px;

      border:
        1px solid
        var(--line);

      border-radius:16px;

      background:
        rgba(
          255,
          255,
          255,
          .72
        );

      margin-bottom:12px;

      box-shadow:
        0 3px 10px
        rgba(
          0,
          0,
          0,
          .025
        );
    }


    .ortu-spp-nominal {

      margin-top:14px;

      font-size:20px;

      font-weight:900;

      color:
        var(--ink);
    }


    .ortu-spp-detail {

      margin-top:12px;

      font-size:12px;

      color:
        var(--ink-soft);
    }


    .ortu-spp-detail div {

      display:flex;

      justify-content:space-between;

      gap:12px;
    }


    .ortu-spp-detail strong {

      color:
        var(--ink);

      text-align:right;
    }


    .ortu-spp-action {

      margin-top:2px;
    }


    .ortu-date-field {

      display:flex;

      flex-direction:column;

      gap:5px;
    }


    .ortu-date-field label {

      font-size:10px;

      color:
        var(--ink-soft);

      font-weight:800;

      text-transform:uppercase;
    }


    @media (
      max-width:768px
    ) {


      .ortu-desktop-table {
        display:none !important;
      }


      .ortu-mobile-list {
        display:block;
      }


      .ortu-mobile-controls {

        width:100%;

        display:grid !important;

        grid-template-columns:
          1fr 1fr;

        gap:10px;

        margin-top:14px;
      }


      .ortu-mobile-controls select,
      .ortu-mobile-controls input {

        width:100%;

        min-width:0;
      }


      .ortu-mobile-controls button {

        grid-column:
          1 / -1;

        width:100%;
      }


      .ortu-child-profile > div {

        grid-template-columns:
          1fr !important;

        gap:14px !important;
      }


      .stat-row {

        grid-template-columns:
          repeat(
            2,
            minmax(
              0,
              1fr
            )
          ) !important;

        gap:10px !important;
      }


      .stat {

        min-width:0;
      }


      .stat .num {

        font-size:24px;
      }


      .section-head {

        align-items:flex-start;

        flex-direction:column;
      }


      .section-head .controls {

        width:100%;
      }

    }


    @media (
      max-width:420px
    ) {

      .ortu-mobile-controls {

        grid-template-columns:
          1fr;
      }


      .ortu-mobile-controls button {

        grid-column:auto;
      }


      .ortu-card-top {

        gap:8px;
      }


      .ortu-card-title {

        font-size:14px;
      }


      .ortu-spp-nominal {

        font-size:18px;
      }

    }

  `;


  document.head.appendChild(
    style
  );

})();
