// ============================================================
// GANTARIKU — PERKEMBANGAN COMPACT UX
// Ringkasan per siswa. Histori penilaian dibuka hanya saat perlu.
// Tidak mengubah struktur tabel atau alur simpan penilaian.
// ============================================================

(function () {
  "use strict";

  const ASPEK = [
    "Teknik",
    "Hafalan Koreografi",
    "Ekspresi",
    "Disiplin",
    "Kepercayaan Diri"
  ];

  function esc(value) {
    if (typeof escapeHtml === "function") return escapeHtml(value ?? "");
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function todayWIB() {
    if (typeof getNowWIB === "function") {
      const d = getNowWIB();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  }

  function formatDate(value) {
    if (!value) return "-";
    const [year, month, day] = String(value).split("-").map(Number);
    if (![year, month, day].every(Number.isFinite)) return esc(value);
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function formatShortDate(value) {
    if (!value) return "-";
    const [year, month, day] = String(value).split("-").map(Number);
    if (![year, month, day].every(Number.isFinite)) return esc(value);
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function scoreValue(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
  }

  function groupRecords(records) {
    const students = new Map();

    for (const row of records || []) {
      const studentId = row?.siswa?.id || row?.siswa_id;
      if (!studentId || !row?.tanggal) continue;

      if (!students.has(studentId)) {
        students.set(studentId, {
          id: studentId,
          nama: row?.siswa?.nama || "-",
          kelas: row?.siswa?.kelas || "",
          assessments: new Map()
        });
      }

      const student = students.get(studentId);
      const assessmentKey = row.tanggal;

      if (!student.assessments.has(assessmentKey)) {
        student.assessments.set(assessmentKey, {
          tanggal: row.tanggal,
          created_at: row.created_at || "",
          guru: row?.guru?.nama || "-",
          scores: {},
          notes: []
        });
      }

      const assessment = student.assessments.get(assessmentKey);
      const score = scoreValue(row.nilai);
      if (score !== null && row.aspek) {
        if (assessment.scores[row.aspek] == null) assessment.scores[row.aspek] = score;
      }
      if (row.catatan && !assessment.notes.includes(String(row.catatan))) {
        assessment.notes.push(String(row.catatan));
      }
    }

    for (const student of students.values()) {
      student.history = [...student.assessments.values()]
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      student.count = student.history.length;
      student.latest = student.history[0] || null;
      student.latestScores = student.latest?.scores || {};
      const latestValues = ASPEK.map((a) => student.latestScores[a]).filter((v) => Number(v) > 0);
      student.latestAverage = latestValues.length
        ? (latestValues.reduce((sum, value) => sum + value, 0) / latestValues.length).toFixed(1)
        : "-";
    }

    return [...students.values()].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  }

  function renderScores(scores) {
    return ASPEK.map((aspek) => `
      <div class="gtr-perk-score">
        <span>${esc(aspek)}</span>
        <strong>${scores?.[aspek] ? `${esc(scores[aspek])}/5` : "—"}</strong>
      </div>
    `).join("");
  }

  function renderHistory(student) {
    if (!student.history.length) {
      return `<div class="gtr-perk-empty-inner">Belum ada histori penilaian.</div>`;
    }

    return student.history.map((assessment) => {
      const values = ASPEK.map((a) => assessment.scores[a]).filter((v) => Number(v) > 0);
      const avg = values.length
        ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
        : "-";
      const note = assessment.notes.join(" · ");

      return `
        <div class="gtr-perk-history-item">
          <div class="gtr-perk-history-head">
            <div>
              <strong>${esc(formatShortDate(assessment.tanggal))}</strong>
              <span>${esc(assessment.guru || "-")}</span>
            </div>
            <span class="gtr-perk-history-avg">${avg === "-" ? "Belum lengkap" : `${avg}/5`}</span>
          </div>
          <div class="gtr-perk-score-grid gtr-perk-score-grid--history">
            ${renderScores(assessment.scores)}
          </div>
          ${note ? `<div class="gtr-perk-history-note"><strong>Catatan</strong><div>${esc(note)}</div></div>` : ""}
        </div>
      `;
    }).join("");
  }

  function renderStudentCard(student, mode) {
    const latestNote = student.latest?.notes?.join(" · ") || "";
    const labelCount = mode === "guru" ? "penilaian saya" : "sesi penilaian";
    const detailTitle = mode === "guru" ? "Histori Penilaian Saya" : "Histori Penilaian";

    return `
      <details class="gtr-perk-card">
        <summary class="gtr-perk-card-head">
          <div class="gtr-perk-card-main">
            <strong>${esc(student.nama)}</strong>
            <span>${esc(student.kelas || "Tanpa kelas")} · ${student.count} ${labelCount}</span>
          </div>
          <div class="gtr-perk-card-metric">
            <strong>${student.latestAverage === "-" ? "—" : `${student.latestAverage}/5`}</strong>
            <span>${student.latest ? `Terakhir ${esc(formatShortDate(student.latest.tanggal))}` : "Belum ada"}</span>
          </div>
          <span class="gtr-perk-chevron" aria-hidden="true">›</span>
        </summary>
        <div class="gtr-perk-card-body">
          <div class="gtr-perk-latest">
            <div class="gtr-perk-section-label">Penilaian Terbaru</div>
            ${renderScores(student.latestScores)}
            ${latestNote ? `<div class="gtr-perk-history-note"><strong>Catatan terbaru</strong><div>${esc(latestNote)}</div></div>` : ""}
          </div>
          <div class="gtr-perk-history">
            <div class="gtr-perk-section-row">
              <strong>${detailTitle}</strong>
              <span>${student.count} sesi</span>
            </div>
            <div class="gtr-perk-history-list">${renderHistory(student)}</div>
          </div>
        </div>
      </details>
    `;
  }

  function renderAdminShell() {
    const year = new Date().getFullYear();
    return `
      <div class="section gtr-perk-section">
        <div class="section-head gtr-perk-head">
          <div>
            <h2>Perkembangan Anak</h2>
            <div class="section-subtitle">Ringkasan per anak. Histori lengkap dibuka hanya saat diperlukan.</div>
          </div>
          <div class="perk-toolbar gtr-perk-toolbar">
            <input class="perk-search" type="text" id="perkembanganAdminCari" placeholder="Cari nama siswa...">
            <select id="perkembanganAdminKelas"><option value="">Semua kelas</option></select>
            <select id="perkembanganAdminBulan">
              <option value="0">Semua bulan</option>
              <option value="1">Januari</option><option value="2">Februari</option><option value="3">Maret</option>
              <option value="4">April</option><option value="5">Mei</option><option value="6">Juni</option>
              <option value="7">Juli</option><option value="8">Agustus</option><option value="9">September</option>
              <option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
            </select>
            <select id="perkembanganAdminTahun"><option value="${year}">${year}</option><option value="${year - 1}">${year - 1}</option></select>
            <button class="btn secondary" onclick="window.__app.loadPerkembanganAdmin()">Tampilkan</button>
            <button class="btn secondary" onclick="window.__app.exportPerkembanganCsv()">↓ Export CSV</button>
          </div>
        </div>
        <div class="section-body">
          <div id="perkembanganAdminGrid"><div class="perk-empty">Memuat data perkembangan...</div></div>
          <div class="perk-pagination" id="perkembanganPagination"></div>
        </div>
      </div>
    `;
  }



  async function fetchRecords(role) {
    let query = supabase
      .from("perkembangan")
      .select(`
        tanggal,
        aspek,
        nilai,
        catatan,
        created_at,
        siswa:siswa_id(id,nama,kelas,nis),
        guru:guru_id(nama)
      `)
      .order("tanggal", { ascending: false })
      .order("created_at", { ascending: false });

    if (role === "guru") query = query.eq("guru_id", currentUser.id);

    const yearId = role === "admin" ? "perkembanganAdminTahun" : "perkembanganGuruTahun";
    const monthId = role === "admin" ? "perkembanganAdminBulan" : "perkembanganGuruBulan";
    const year = Number(document.getElementById(yearId)?.value || new Date().getFullYear());
    const month = Number(document.getElementById(monthId)?.value || 0);

    if (month) {
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      query = query.gte("tanggal", start).lte("tanggal", end);
    } else {
      query = query.gte("tanggal", `${year}-01-01`).lte("tanggal", `${year}-12-31`);
    }

    const { data, error } = await query.limit(5000);
    if (error) throw error;
    return data || [];
  }

  function applyStudentFilters(students, role) {
    const searchId = role === "admin" ? "perkembanganAdminCari" : "perkembanganGuruCari";
    const classId = "perkembanganAdminKelas";
    const search = String(document.getElementById(searchId)?.value || "").toLowerCase().trim();
    const kelas = role === "admin" ? String(document.getElementById(classId)?.value || "") : "";

    return students.filter((student) =>
      (!search || student.nama.toLowerCase().includes(search)) &&
      (!kelas || student.kelas === kelas)
    );
  }

  function fillAdminClasses(students) {
    const select = document.getElementById("perkembanganAdminKelas");
    if (!select) return;
    const old = select.value;
    const classes = [...new Set(students.map((s) => s.kelas).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
    select.innerHTML = `<option value="">Semua kelas</option>${classes.map((k) => `<option value="${esc(k)}">${esc(k)}</option>`).join("")}`;
    select.value = classes.includes(old) ? old : "";
  }

  function renderAdminCards() {
    const grid = document.getElementById("perkembanganAdminGrid");
    const pag = document.getElementById("perkembanganPagination");
    if (!grid) return;

    const filtered = applyStudentFilters(window.__gtrPerkAdminData || [], "admin");
    const pageSize = 12;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (!Number.isFinite(window.__gtrPerkAdminPage) || window.__gtrPerkAdminPage < 1) window.__gtrPerkAdminPage = 1;
    if (window.__gtrPerkAdminPage > pages) window.__gtrPerkAdminPage = pages;
    const start = (window.__gtrPerkAdminPage - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);

    if (!slice.length) {
      grid.innerHTML = `<div class="perk-empty">Belum ada data perkembangan untuk filter ini.</div>`;
    } else {
      grid.innerHTML = `<div class="gtr-perk-student-list">${slice.map((student) => renderStudentCard(student, "admin")).join("")}</div>`;
    }

    pag.innerHTML = pages > 1 ? `
      <button class="btn ghost small" ${window.__gtrPerkAdminPage === 1 ? "disabled" : ""} onclick="window.__app.changePerkPage(-1)">← Sebelumnya</button>
      <span class="perk-page-label">Halaman ${window.__gtrPerkAdminPage} / ${pages}</span>
      <button class="btn ghost small" ${window.__gtrPerkAdminPage === pages ? "disabled" : ""} onclick="window.__app.changePerkPage(1)">Berikutnya →</button>
    ` : "";
  }

  function renderGuruCards() {
    const container = document.getElementById("daftarPerkembanganGuru");
    if (!container) return;
    const filtered = applyStudentFilters(window.__gtrPerkGuruData || [], "guru");
    if (!filtered.length) {
      container.innerHTML = `<div class="perk-empty">Belum ada penilaian untuk filter ini.</div>`;
      return;
    }
    container.innerHTML = `<div class="gtr-perk-student-list">${filtered.map((student) => renderStudentCard(student, "guru")).join("")}</div>`;
  }

  async function loadAdmin() {
    const grid = document.getElementById("perkembanganAdminGrid");
    if (!grid || !supabase || currentUserRole !== "admin") return;
    grid.innerHTML = `<div class="perk-empty">Memuat data perkembangan...</div>`;
    try {
      const rows = await fetchRecords("admin");
      const students = groupRecords(rows);
      window.__gtrPerkAdminData = students;
      window.__gtrPerkAdminPage = 1;
      fillAdminClasses(students);
      renderAdminCards();
    } catch (error) {
      console.error("Error load perkembangan admin compact:", error);
      grid.innerHTML = `<div class="perk-empty">Gagal memuat data perkembangan.</div>`;
    }
  }

  async function loadGuru() {
    const container = document.getElementById("daftarPerkembanganGuru");
    if (!container || !supabase || currentUserRole !== "guru") return;
    container.innerHTML = `<div class="perk-empty">Memuat data perkembangan...</div>`;
    try {
      const rows = await fetchRecords("guru");
      window.__gtrPerkGuruData = groupRecords(rows);
      renderGuruCards();
    } catch (error) {
      console.error("Error load perkembangan guru compact:", error);
      container.innerHTML = `<div class="perk-empty">Gagal memuat riwayat penilaian.</div>`;
    }
  }

  function patchExports() {
    window.renderPerkembanganAdmin = renderAdminShell;
    window.renderPerkembanganAdminCards = renderAdminCards;
    window.loadPerkembanganAdmin = loadAdmin;
    window.loadPerkembanganGuru = loadGuru;
    window.changePerkPage = function (delta) {
      window.__gtrPerkAdminPage = Math.max(1, (Number(window.__gtrPerkAdminPage) || 1) + delta);
      renderAdminCards();
    };

    if (typeof window.__app === "object" && window.__app) {
      window.__app.loadPerkembanganAdmin = loadAdmin;
      window.__app.loadPerkembanganGuru = loadGuru;
      window.__app.changePerkPage = window.changePerkPage;
    }
  }

  function bindSearch() {
    const adminSearch = document.getElementById("perkembanganAdminCari");
    if (adminSearch && !adminSearch.dataset.gtrBound) {
      adminSearch.dataset.gtrBound = "1";
      adminSearch.addEventListener("input", () => {
        window.__gtrPerkAdminPage = 1;
        renderAdminCards();
      });
    }
    const guruSearch = document.getElementById("perkembanganGuruCari");
    if (guruSearch && !guruSearch.dataset.gtrBound) {
      guruSearch.dataset.gtrBound = "1";
      guruSearch.addEventListener("input", renderGuruCards);
    }
  }

  patchExports();

  const observer = new MutationObserver(() => bindSearch());
  observer.observe(document.body, { childList: true, subtree: true });
})();
