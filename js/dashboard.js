// ============================================================
// GANTARIKU — DASHBOARD ADMIN
// Dashboard ringkas, scalable, dan fokus pada tindakan.
// ============================================================

function dashEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function dashToday() {
  const now = typeof getNowWIB === "function" ? getNowWIB() : new Date();

  const dateString =
    typeof getTodayWIBString === "function"
      ? getTodayWIBString()
      : now.toISOString().slice(0, 10);

  return {
    date: now,
    dateString,
    bulan: now.getMonth() + 1,
    tahun: now.getFullYear(),
  };
}

function dashGo(navId) {
  if (window.__app && typeof window.__app.goTo === "function") {
    window.__app.goTo(navId);
  }
}

function dashOpenSpp(sppId, bulan, tahun) {
  if (window.__app && typeof window.__app.goTo === "function") {
    window.__app.goTo("spp");
  }

  setTimeout(() => {
    if (
      window.__app &&
      typeof window.__app.fokusSppTahunan === "function" &&
      sppId
    ) {
      window.__app.fokusSppTahunan(sppId, bulan, tahun);
    }
  }, 220);
}

// ============================================================
// RENDER DASHBOARD
// ============================================================

function renderDasbor() {
  const nama = currentUser?.nama || "Pengelola Gantari";
  const { bulan, tahun } = dashToday();

  return `
    <div class="dash-welcome dash-welcome-pro">
      <div>
        <div class="dash-eyebrow">Pusat kendali Gantari</div>
        <h2>Selamat datang, ${dashEscape(nama)} 💛</h2>
        <p>
          Semua hal penting sekolah diringkas di satu tempat.
          Lihat yang perlu ditindaklanjuti terlebih dahulu,
          lalu lanjutkan ke detailnya.
        </p>
      </div>

      <div class="dash-welcome-mark" aria-hidden="true">🌻</div>
    </div>

    <div class="dash-summary dash-summary-pro">

      <div class="dash-mini dash-mini-action">
        <div class="dash-mini-top">
          <div class="dash-mini-label">Siswa aktif</div>
          <span>👧</span>
        </div>

        <div class="dash-mini-num" id="dashTotalSiswa">–</div>

        <div class="dash-mini-sub">
          semua siswa terdaftar
        </div>

        <button
          type="button"
          class="dash-link"
          onclick="window.__app.goTo('siswa')"
        >
          Kelola data siswa →
        </button>
      </div>

      <div class="dash-mini">
        <div class="dash-mini-top">
          <div class="dash-mini-label">Kehadiran hari ini</div>
          <span>🌼</span>
        </div>

        <div class="dash-mini-num" id="dashPersenHadir">–</div>

        <div class="dash-mini-sub" id="dashHadirSub">
          Belum ada data
        </div>

        <div class="dash-progress">
          <span id="dashHadirProgress"></span>
        </div>
      </div>

      <div class="dash-mini dash-mini-action">
        <div class="dash-mini-top">
          <div class="dash-mini-label">
            Pemasukan ${namaBulan(bulan)}
          </div>
          <span>💛</span>
        </div>

        <div class="dash-mini-num dash-money" id="dashPemasukan">
          –
        </div>

        <div class="dash-mini-sub" id="dashPemasukanSub">
          SPP lunas
        </div>

        <button
          type="button"
          class="dash-link"
          onclick="window.__app.goTo('spp')"
        >
          Buka monitoring SPP →
        </button>
      </div>

    </div>

    <div class="stat-row stat-row-pro">

      <div class="stat c-teal">
        <div class="num" id="statHadir">–</div>
        <div class="lbl">Hadir hari ini</div>
      </div>

      <div class="stat c-good">
        <div class="num" id="statLunas">–</div>
        <div class="lbl" id="lblLunas">
          Lunas SPP
        </div>
      </div>

      <div class="stat c-bad">
        <div class="num" id="statBelumBayar">–</div>
        <div class="lbl" id="lblBelumBayar">
          Belum bayar
        </div>
      </div>

      <div class="stat c-pink">
        <div class="num" id="statTunggakan">–</div>
        <div class="lbl">
          Nilai belum lunas
        </div>
      </div>

    </div>

    <div class="dash-two-col dash-two-col-pro">

      <div class="section" id="perhatianSection">

        <div class="section-head">

          <div>
            <h2>✨ Perlu tindakan</h2>

            <div class="section-hint">
              Prioritas yang paling relevan untuk
              ${namaBulan(bulan)} ${tahun}
            </div>
          </div>

          <span
            class="badge badge-muted"
            id="perhatianStatus"
          >
            Memuat...
          </span>

        </div>

        <div
          class="section-body"
          id="perhatianBody"
        >
          <div class="empty">
            Memuat kondisi terbaru...
          </div>
        </div>

      </div>

      <div class="section">

        <div class="section-head">

          <div>
            <h2>💌 Ringkasan hari ini</h2>

            <div class="section-hint">
              Akses cepat ke pekerjaan yang paling sering dipakai
            </div>
          </div>

        </div>

        <div class="section-body">

          <div class="dash-quick-grid">

            <button
              type="button"
              class="dash-quick-card"
              onclick="window.__app.goTo('absen-guru')"
            >
              <span class="dash-quick-icon">👩‍🏫</span>

              <span>
                <strong>Absensi guru</strong>
                <small>Pantau kehadiran pelatih</small>
              </span>

              <b>→</b>
            </button>

            <button
              type="button"
              class="dash-quick-card"
              onclick="window.__app.goTo('perkembangan')"
            >
              <span class="dash-quick-icon">🌱</span>

              <span>
                <strong>Perkembangan anak</strong>
                <small>Lihat catatan per siswa</small>
              </span>

              <b>→</b>
            </button>

            <button
              type="button"
              class="dash-quick-card"
              onclick="window.__app.goTo('spp')"
            >
              <span class="dash-quick-icon">💳</span>

              <span>
                <strong>Monitoring SPP</strong>
                <small>12 bulan dalam satu tampilan</small>
              </span>

              <b>→</b>
            </button>

            <button
              type="button"
              class="dash-quick-card"
              onclick="window.__app.goTo('rekap')"
            >
              <span class="dash-quick-icon">📊</span>

              <span>
                <strong>Rekap absensi</strong>
                <small>Lihat ringkasan kehadiran</small>
              </span>

              <b>→</b>
            </button>

          </div>

        </div>

      </div>

    </div>

    <div class="section">

      <div class="section-head">

        <div>
          <h2>📊 Kondisi kelas</h2>

          <div class="section-hint">
            Ringkasan siswa, absensi, dan SPP bulan berjalan
          </div>
        </div>

        <span
          class="badge badge-muted"
          id="dashKelasCount"
        >
          Memuat...
        </span>

      </div>

      <div class="section-body dash-class-table">

        <div class="dash-table-scroll">

          <table>

            <thead>
              <tr>
                <th>Kelas</th>
                <th class="num">Siswa</th>
                <th class="num">Hadir</th>
                <th class="num">Tercatat</th>
                <th class="num">Kehadiran</th>
                <th class="num">SPP Lunas</th>
              </tr>
            </thead>

            <tbody id="tbodyKondisiKelas">
              <tr>
                <td
                  colspan="6"
                  style="text-align:center;"
                >
                  Memuat kondisi kelas...
                </td>
              </tr>
            </tbody>

          </table>

        </div>

      </div>

    </div>

    <!-- ======================================================
         AKTIVITAS PEMBAYARAN
         HANYA MENAMPILKAN 6 TERBARU
         ====================================================== -->

    <div class="section">

      <div class="section-head">

        <div>
          <h2>🕐 Aktivitas terbaru</h2>

          <div class="section-hint">
            6 perubahan pembayaran terakhir
          </div>
        </div>

        <button
          type="button"
          class="btn ghost small"
          onclick="window.__app.goTo('spp')"
        >
          Buka monitoring SPP →
        </button>

      </div>

      <div
        class="section-body"
        id="dashAktivitasBody"
      >
        <div class="empty">
          Memuat aktivitas...
        </div>
      </div>

    </div>
  `;
}

// ============================================================
// LOADER UTAMA
// ============================================================

async function loadDasbor() {
  if (!supabase || currentUserRole !== "admin") return;

  const {
    dateString,
    bulan,
    tahun,
  } = dashToday();

  const els = {
    totalSiswa: document.getElementById("dashTotalSiswa"),
    persenHadir: document.getElementById("dashPersenHadir"),
    hadirSub: document.getElementById("dashHadirSub"),
    hadirProgress: document.getElementById("dashHadirProgress"),

    pemasukan: document.getElementById("dashPemasukan"),
    pemasukanSub: document.getElementById("dashPemasukanSub"),

    statHadir: document.getElementById("statHadir"),
    statLunas: document.getElementById("statLunas"),
    statBelum: document.getElementById("statBelumBayar"),
    statTunggakan: document.getElementById("statTunggakan"),

    lblLunas: document.getElementById("lblLunas"),
    lblBelum: document.getElementById("lblBelumBayar"),
  };

  if (els.lblLunas) {
    els.lblLunas.textContent =
      `Lunas SPP — ${namaBulan(bulan)}`;
  }

  if (els.lblBelum) {
    els.lblBelum.textContent =
      `Belum bayar — ${namaBulan(bulan)}`;
  }

  try {

    const [
      siswa,
      absensi,
      spp,
      aktivitas,
    ] = await Promise.all([

      dashLoadAll(
        "siswa",
        "id,nama,kelas",
        "nama"
      ),

      supabase
        .from("absensi")
        .select(
          "status,siswa_id,siswa:siswa_id(nama,kelas)"
        )
        .eq("tanggal", dateString),

      supabase
        .from("spp")
        .select(
          "id,status,nominal,siswa_id,bulan,tahun,updated_at,siswa:siswa_id(nama,kelas)"
        )
        .eq("bulan", bulan)
        .eq("tahun", tahun),

      supabase
        .from("spp")
        .select(
          "id,status,nominal,bulan,tahun,updated_at,siswa:siswa_id(nama,kelas)"
        )
        .order(
          "updated_at",
          { ascending: false }
        )
        .limit(6),
    ]);

    if (siswa.error) throw siswa.error;
    if (absensi.error) throw absensi.error;
    if (spp.error) throw spp.error;
    if (aktivitas.error) throw aktivitas.error;

    const siswaData = siswa.data || [];
    const absensiData = absensi.data || [];
    const sppData = spp.data || [];

    const total = siswaData.length;

    const hadir =
      absensiData.filter(
        x => x.status === "H"
      ).length;

    const persen =
      total
        ? Math.round((hadir / total) * 100)
        : 0;

    if (els.totalSiswa) {
      els.totalSiswa.textContent =
        total.toLocaleString("id-ID");
    }

    if (els.statHadir) {
      els.statHadir.textContent =
        `${hadir}/${total}`;
    }

    if (els.persenHadir) {
      els.persenHadir.textContent =
        `${persen}%`;
    }

    if (els.hadirSub) {
      els.hadirSub.textContent =
        `${absensiData.length} dari ${total} siswa tercatat`;
    }

    if (els.hadirProgress) {
      els.hadirProgress.style.width =
        `${Math.min(100, persen)}%`;
    }

    const lunas =
      sppData.filter(
        x => x.status === "Lunas"
      );

    const belum =
      sppData.filter(
        x => x.status !== "Lunas"
      );

    const pemasukan =
      lunas.reduce(
        (sum, x) =>
          sum + (Number(x.nominal) || 0),
        0
      );

    const tunggakan =
      belum.reduce(
        (sum, x) =>
          sum + (Number(x.nominal) || 0),
        0
      );

    if (els.statLunas) {
      els.statLunas.textContent =
        lunas.length.toLocaleString("id-ID");
    }

    if (els.statBelum) {
      els.statBelum.textContent =
        belum.length.toLocaleString("id-ID");
    }

    if (els.statTunggakan) {
      els.statTunggakan.textContent =
        formatRupiah(tunggakan);
    }

    if (els.pemasukan) {
      els.pemasukan.textContent =
        formatRupiah(pemasukan);
    }

    if (els.pemasukanSub) {
      els.pemasukanSub.textContent =
        `${lunas.length} tagihan SPP lunas · ${namaBulan(bulan)}`;
    }

    dashRenderKelas(
      siswaData,
      absensiData,
      sppData
    );

    dashRenderAktivitas(
      aktivitas.data || []
    );

  } catch (error) {

    console.error(
      "Error load dasbor:",
      error
    );

    if (els.hadirSub) {
      els.hadirSub.textContent =
        "Belum bisa memuat data";
    }

    if (els.pemasukanSub) {
      els.pemasukanSub.textContent =
        "Belum bisa memuat data";
    }
  }
}

// ============================================================
// QUERY DATA SISWA BERTAHAP
// ============================================================

async function dashLoadAll(
  table,
  select,
  orderColumn
) {
  const all = [];

  let from = 0;

  const pageSize = 1000;

  while (true) {

    let query =
      supabase
        .from(table)
        .select(select)
        .range(
          from,
          from + pageSize - 1
        );

    if (orderColumn) {
      query =
        query.order(
          orderColumn,
          { ascending: true }
        );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      throw error;
    }

    all.push(
      ...(data || [])
    );

    if (
      !data ||
      data.length < pageSize
    ) {
      break;
    }

    from += pageSize;
  }

  return {
    data: all,
    error: null,
  };
}

// ============================================================
// KONDISI KELAS
// ============================================================

function dashRenderKelas(
  siswaData,
  absensiData,
  sppData
) {
  const tbody =
    document.getElementById(
      "tbodyKondisiKelas"
    );

  const badge =
    document.getElementById(
      "dashKelasCount"
    );

  if (!tbody) return;

  const classMap = {};

  siswaData.forEach(
    s => {

      const kelas =
        s.kelas ||
        "Tanpa Kelas";

      classMap[kelas] ??= {
        total: 0,
        hadir: 0,
        tercatat: 0,
        lunas: 0,
      };

      classMap[kelas].total++;
    }
  );

  absensiData.forEach(
    a => {

      const kelas =
        a.siswa?.kelas ||
        "Tanpa Kelas";

      classMap[kelas] ??= {
        total: 0,
        hadir: 0,
        tercatat: 0,
        lunas: 0,
      };

      classMap[kelas].tercatat++;

      if (a.status === "H") {
        classMap[kelas].hadir++;
      }
    }
  );

  sppData.forEach(
    x => {

      const kelas =
        x.siswa?.kelas ||
        "Tanpa Kelas";

      classMap[kelas] ??= {
        total: 0,
        hadir: 0,
        tercatat: 0,
        lunas: 0,
      };

      if (x.status === "Lunas") {
        classMap[kelas].lunas++;
      }
    }
  );

  const entries =
    Object.entries(
      classMap
    ).sort(
      (a, b) =>
        a[0].localeCompare(
          b[0],
          "id"
        )
    );

  tbody.innerHTML =
    entries.length
      ? entries
          .map(
            ([kelas, v]) => {

              const pct =
                v.total
                  ? Math.round(
                      (v.hadir /
                        v.total) *
                        100
                    )
                  : 0;

              const scoreClass =
                pct >= 80
                  ? "dash-score-good"
                  : pct >= 60
                  ? "dash-score-warn"
                  : "dash-score-bad";

              return `
                <tr>

                  <td>
                    <div class="dash-class-name">
                      ${dashEscape(kelas)}
                    </div>

                    <div class="dash-class-sub">
                      ${v.total} siswa
                    </div>
                  </td>

                  <td class="num">
                    ${v.total}
                  </td>

                  <td class="num">
                    ${v.hadir}
                  </td>

                  <td class="num">
                    ${v.tercatat}
                  </td>

                  <td class="num">
                    <span class="dash-score ${scoreClass}">
                      ${pct}%
                    </span>
                  </td>

                  <td class="num">
                    ${v.lunas}
                  </td>

                </tr>
              `;
            }
          )
          .join("")
      : `
        <tr>
          <td
            colspan="6"
            style="text-align:center;"
          >
            Belum ada data kelas.
          </td>
        </tr>
      `;

  if (badge) {
    badge.textContent =
      `${entries.length} kelas`;
  }
}

// ============================================================
// AKTIVITAS TERBARU
// HANYA 6 ITEM
// ============================================================

function dashRenderAktivitas(items) {

  const wrap =
    document.getElementById(
      "dashAktivitasBody"
    );

  if (!wrap) return;

  if (!items.length) {

    wrap.innerHTML =
      `
        <div class="empty">
          Belum ada perubahan pembayaran terbaru.
        </div>
      `;

    return;
  }

  // Pengaman tambahan:
  // meskipun data dari sumber lebih banyak,
  // Dashboard tetap hanya menampilkan 6.
  const limitedItems =
    items.slice(0, 6);

  wrap.innerHTML =
    `
      <div class="dash-activity-list">

        ${limitedItems
          .map(item => {

            const status =
              item.status || "-";

            const statusClass =
              status === "Lunas"
                ? "good"
                : status === "Menunggu Verifikasi"
                ? "warn"
                : "bad";

            const waktu =
              item.updated_at
                ? new Date(
                    item.updated_at
                  ).toLocaleString(
                    "id-ID",
                    {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "";

            const bulan =
              Number(item.bulan) || 1;

            const tahun =
              Number(item.tahun) ||
              new Date().getFullYear();

            const icon =
              status === "Lunas"
                ? "✓"
                : status === "Menunggu Verifikasi"
                ? "⏳"
                : "!";

            return `
              <button
                type="button"
                class="dash-activity-item"
                onclick="
                  window.__app.dashOpenSpp(
                    '${item.id}',
                    ${bulan},
                    ${tahun}
                  )
                "
              >

                <span class="dash-activity-icon">
                  ${icon}
                </span>

                <span class="dash-activity-main">

                  <strong>
                    ${dashEscape(
                      item.siswa?.nama ||
                      "Siswa"
                    )}
                  </strong>

                  <small>
                    ${dashEscape(
                      item.siswa?.kelas ||
                      "Tanpa kelas"
                    )}
                    ·
                    ${dashEscape(
                      namaBulan(
                        item.bulan
                      )
                    )}
                    ${tahun}
                    ·
                    ${formatRupiah(
                      item.nominal
                    )}
                  </small>

                </span>

                <span class="dash-activity-side">

                  <span
                    class="dash-status-pill ${statusClass}"
                  >
                    ${dashEscape(status)}
                  </span>

                  <small>
                    ${waktu}
                  </small>

                </span>

              </button>
            `;
          })
          .join("")}

      </div>
    `;
}

// ============================================================
// PERLU TINDAKAN
// ============================================================

async function loadPerhatian() {

  if (
    !supabase ||
    currentUserRole !== "admin"
  ) {
    return;
  }

  const body =
    document.getElementById(
      "perhatianBody"
    );

  const statusEl =
    document.getElementById(
      "perhatianStatus"
    );

  if (!body) return;

  try {

    const {
      dateString,
      bulan,
      tahun,
    } = dashToday();

    const [
      siswaRes,
      sppPendingRes,
      absensiRes,
      guruRes,
      absensiGuruRes,
    ] = await Promise.all([

      dashLoadAll(
        "siswa",
        "id,nama,kelas",
        "nama"
      ),

      supabase
        .from("spp")
        .select(
          "id,bulan,tahun,nominal,siswa_id,updated_at,siswa:siswa_id(nama,kelas)"
        )
        .eq(
          "status",
          "Menunggu Verifikasi"
        )
        .order(
          "updated_at",
          { ascending: false }
        )
        .limit(50),

      supabase
        .from("absensi")
        .select(
          "siswa_id,status"
        )
        .eq(
          "tanggal",
          dateString
        ),

      supabase
        .from("pengguna")
        .select(
          "id,nama"
        )
        .eq(
          "role",
          "guru"
        ),

      supabase
        .from("absensi_guru")
        .select(
          "guru_id,status"
        )
        .eq(
          "tanggal",
          dateString
        ),
    ]);

    if (siswaRes.error)
      throw siswaRes.error;

    if (sppPendingRes.error)
      throw sppPendingRes.error;

    if (absensiRes.error)
      throw absensiRes.error;

    if (guruRes.error)
      throw guruRes.error;

    if (absensiGuruRes.error)
      throw absensiGuruRes.error;

    const siswa =
      siswaRes.data || [];

    const pending =
      sppPendingRes.data || [];

    const absensi =
      absensiRes.data || [];

    const guru =
      guruRes.data || [];

    const absensiGuru =
      absensiGuruRes.data || [];

    const absenSiswaIds =
      new Set(
        absensi.map(
          x => x.siswa_id
        )
      );

    const guruIds =
      new Set(
        absensiGuru.map(
          x => x.guru_id
        )
      );

    const siswaBelumAbsen =
      siswa.filter(
        x =>
          !absenSiswaIds.has(
            x.id
          )
      );

    const guruBelumAbsen =
      guru.filter(
        x =>
          !guruIds.has(
            x.id
          )
      );

    const cards = [];

    if (pending.length) {

      const preview =
        pending
          .slice(0, 4)
          .map(
            x => `
              <button
                type="button"
                class="dash-attention-detail"
                onclick="
                  window.__app.dashOpenSpp(
                    '${x.id}',
                    ${Number(x.bulan) || 1},
                    ${Number(x.tahun) || tahun}
                  )
                "
              >

                <span>
                  ${dashEscape(
                    x.siswa?.nama ||
                    "Siswa"
                  )}
                </span>

                <strong>
                  ${formatRupiah(
                    x.nominal
                  )}
                </strong>

                <small>
                  ${namaBulan(x.bulan)}
                  ${x.tahun}
                  · Periksa pembayaran →
                </small>

              </button>
            `
          )
          .join("");

      const more =
        pending.length > 4
          ? `
            <button
              type="button"
              class="dash-attention-more"
              onclick="
                window.__app.goTo('spp')
              "
            >
              Lihat ${pending.length - 4}
              lainnya di Monitoring SPP →
            </button>
          `
          : "";

      cards.push(
        `
          <div
            class="dash-attention-card is-warn"
          >

            <div class="dash-attention-head">

              <span class="dash-attention-icon">
                💳
              </span>

              <div>

                <strong>
                  ${pending.length}
                  pembayaran menunggu verifikasi
                </strong>

                <small>
                  Prioritas untuk diperiksa
                </small>

              </div>

            </div>

            <div class="dash-attention-list">
              ${preview}
            </div>

            ${more}

          </div>
        `
      );
    }

    if (siswaBelumAbsen.length) {

      cards.push(
        `
          <div
            class="dash-attention-card is-alert"
          >

            <div class="dash-attention-head">

              <span class="dash-attention-icon">
                📋
              </span>

              <div>

                <strong>
                  ${siswaBelumAbsen.length}
                  siswa belum tercatat absensinya
                </strong>

                <small>
                  Hari ini · ${dateString}
                </small>

              </div>

            </div>

            <button
              type="button"
              class="dash-action-btn"
              onclick="
                window.__app.goTo('rekap')
              "
            >
              Lihat rekap absensi →
            </button>

          </div>
        `
      );
    }

    if (guruBelumAbsen.length) {

      const names =
        guruBelumAbsen
          .slice(0, 3)
          .map(
            x =>
              dashEscape(
                x.nama
              )
          )
          .join(", ");

      const suffix =
        guruBelumAbsen.length > 3
          ? ` +${guruBelumAbsen.length - 3} lainnya`
          : "";

      cards.push(
        `
          <div
            class="dash-attention-card is-soft"
          >

            <div class="dash-attention-head">

              <span class="dash-attention-icon">
                👩‍🏫
              </span>

              <div>

                <strong>
                  ${guruBelumAbsen.length}
                  guru/pelatih belum absen
                </strong>

                <small>
                  ${names}${suffix}
                </small>

              </div>

            </div>

            <button
              type="button"
              class="dash-action-btn"
              onclick="
                window.__app.goTo('absen-guru')
              "
            >
              Buka absensi guru →
            </button>

          </div>
        `
      );
    }

    if (!cards.length) {

      body.innerHTML =
        `
          <div class="dash-all-safe">

            <span>🎉</span>

            <div>

              <strong>
                Semua aman untuk saat ini.
              </strong>

              <small>
                Tidak ada pembayaran yang menunggu
                verifikasi dan absensi penting yang terlewat.
              </small>

            </div>

          </div>
        `;

      if (statusEl) {
        statusEl.textContent =
          "Aman";

        statusEl.className =
          "badge badge-good";
      }

    } else {

      body.innerHTML =
        `
          <div
            class="dash-attention-stack"
          >
            ${cards.join("")}
          </div>
        `;

      if (statusEl) {

        statusEl.textContent =
          `${cards.length} prioritas`;

        statusEl.className =
          "badge badge-warn";
      }
    }

  } catch (error) {

    console.error(
      "Error load perhatian:",
      error
    );

    body.innerHTML =
      `
        <div
          class="empty"
          style="color:#E11D48;"
        >
          Belum bisa memuat daftar tindakan.
          Coba muat ulang.
        </div>
      `;

    if (statusEl) {
      statusEl.textContent =
        "Tidak tersedia";
    }
  }
}

// ============================================================
// REFRESH DASHBOARD
// ============================================================

if (
  typeof window !== "undefined"
) {

  window.addEventListener(
    "gantariku:refresh-dashboard",
    () => {

      if (
        currentNav === "dasbor"
      ) {

        loadDasbor();
        loadPerhatian();

      }
    }
  );
}

// ============================================================
// GLOBAL HOOK
// ============================================================

setTimeout(() => {

  if (window.__app) {

    window.__app.dashOpenSpp =
      dashOpenSpp;

  }

}, 0);
