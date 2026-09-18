// ============================================================
// GANTARIKU — ABSENSI COMPACT UX
// Dipakai untuk:
// - Riwayat Absensi guru
// - Rekap Absensi admin
//
// Tujuan: ringkas per tanggal. Detail siswa dibuka hanya saat
// diperlukan, sehingga tetap nyaman meski jumlah siswa banyak.
// ============================================================

(function () {
  "use strict";

  const STATUS = { H: "Hadir", I: "Izin", S: "Sakit", A: "Alpa" };

  function esc(value) {
    if (typeof escapeHtml === "function") return escapeHtml(value ?? "");
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function todayString() {
    if (typeof getNowWIB === "function") {
      const d = getNowWIB();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  }

  function formatDate(value) {
    if (!value) return "-";
    const parts = String(value).split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return esc(value);
    const [year, month, day] = parts;
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function statusLabel(code) {
    if (typeof labelStatusAbsensi === "function") return labelStatusAbsensi(code);
    return STATUS[code] || code || "-";
  }

  function statusBadge(code) {
    if (typeof statusBadgeAbsensi === "function") return statusBadgeAbsensi(code);
    return "";
  }

  function groupByDate(rows) {
    const groups = new Map();

    for (const row of rows || []) {
      const tanggal = row?.tanggal || "";
      if (!tanggal) continue;

      if (!groups.has(tanggal)) {
        groups.set(tanggal, {
          tanggal,
          rows: [],
          counts: { H: 0, I: 0, S: 0, A: 0 }
        });
      }

      const group = groups.get(tanggal);
      group.rows.push(row);

      const code = String(row?.status || "").trim();
      if (Object.prototype.hasOwnProperty.call(group.counts, code)) {
        group.counts[code] += 1;
      }
    }

    return [...groups.values()].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }

  function renderDay(group) {
    const total = group.rows.length;
    const stats = ["H", "I", "S", "A"].map((code) => `
      <span class="gtr-riwayat-stat gtr-riwayat-stat--${code.toLowerCase()}">
        <strong>${group.counts[code]}</strong>
        <small>${esc(statusLabel(code))}</small>
      </span>
    `).join("");

    const detailRows = [...group.rows]
      .sort((a, b) => String(a?.siswa?.nama || "").localeCompare(String(b?.siswa?.nama || ""), "id"))
      .map((row) => `
        <tr>
          <td class="gtr-riwayat-detail-name">${esc(row?.siswa?.nama || "-")}</td>
          <td>${esc(row?.siswa?.kelas || "-")}</td>
          <td><span class="badge ${esc(statusBadge(row?.status))}">${esc(statusLabel(row?.status))}</span></td>
          <td>${esc(row?.keterangan || "-")}</td>
        </tr>
      `).join("");

    return `
      <details class="gtr-riwayat-day">
        <summary class="gtr-riwayat-day__head">
          <div class="gtr-riwayat-day__date">
            <strong>${esc(formatDate(group.tanggal))}</strong>
            <span>${total} siswa tercatat</span>
          </div>
          <div class="gtr-riwayat-stats">${stats}</div>
          <span class="gtr-riwayat-toggle" aria-hidden="true">›</span>
        </summary>
        <div class="gtr-riwayat-detail">
          <div class="gtr-riwayat-detail__title">
            <strong>Detail ${esc(formatDate(group.tanggal))}</strong>
            <span>${total} siswa</span>
          </div>
          <div class="gtr-riwayat-detail__table-wrap">
            <table class="gtr-riwayat-detail__table">
              <thead>
                <tr><th>Nama</th><th>Kelas</th><th>Status</th><th>Keterangan</th></tr>
              </thead>
              <tbody>${detailRows}</tbody>
            </table>
          </div>
        </div>
      </details>
    `;
  }

  function renderCompactShell(kind) {
    const isAdmin = kind === "admin";
    const prefix = isAdmin ? "rekap" : "riwayat";
    const title = isAdmin ? "Rekap Absensi" : "Riwayat Absensi";
    const subtitle = isAdmin
      ? "Ringkas per hari. Detail siswa dibuka hanya saat diperlukan."
      : "Ringkas per hari. Detail dibuka hanya saat diperlukan.";
    const today = todayString();
    const action = isAdmin ? "loadRekapAbsensi" : "loadRiwayatAbsensi";
    const exportButton = isAdmin
      ? '<button class="btn secondary" onclick="window.__app.exportRekapAbsensiCsv()">⬇ Export Excel</button>'
      : "";

    return `
      <div class="section gtr-riwayat-section">
        <div class="section-head gtr-riwayat-head">
          <div>
            <h2>${title}</h2>
            <div class="section-subtitle">${subtitle}</div>
          </div>
          <div class="controls gtr-riwayat-controls">
            <select id="${prefix}Kelas"><option value="">Semua kelas</option></select>
            <input type="date" id="${prefix}Dari" value="${today}">
            <input type="date" id="${prefix}Sampai" value="${today}">
            <button class="btn secondary" onclick="window.__app.${action}()">Tampilkan</button>
            ${exportButton}
          </div>
        </div>
        <div class="section-body">
          <div id="${isAdmin ? "daftarRekapAbsensi" : "daftarRiwayatAbsensi"}" class="gtr-riwayat-list">
            <div class="table-state">Pilih rentang tanggal, lalu klik Tampilkan.</div>
          </div>
        </div>
      </div>
    `;
  }

  async function loadCompact(kind) {
    const isAdmin = kind === "admin";
    const containerId = isAdmin ? "daftarRekapAbsensi" : "daftarRiwayatAbsensi";
    const kelasId = isAdmin ? "rekapKelas" : "riwayatKelas";
    const dariId = isAdmin ? "rekapDari" : "riwayatDari";
    const sampaiId = isAdmin ? "rekapSampai" : "riwayatSampai";
    const container = document.getElementById(containerId);

    if (!container || !supabase) return;

    const kelas = document.getElementById(kelasId)?.value || "";
    const dari = document.getElementById(dariId)?.value || "";
    const sampai = document.getElementById(sampaiId)?.value || "";

    if (!dari || !sampai) {
      container.innerHTML = `<div class="table-state">Pilih rentang tanggal terlebih dahulu.</div>`;
      return;
    }

    if (dari > sampai) {
      container.innerHTML = `<div class="table-state table-state-error">Tanggal mulai tidak boleh setelah tanggal akhir.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="gtr-riwayat-loading">
        <div class="gtr-riwayat-loading__bar"></div>
        <div class="gtr-riwayat-loading__bar"></div>
        <div class="gtr-riwayat-loading__bar"></div>
      </div>
    `;

    try {
      const { data, error } = await supabase
        .from("absensi")
        .select("tanggal, status, keterangan, siswa:siswa_id ( nama, kelas )")
        .gte("tanggal", dari)
        .lte("tanggal", sampai)
        .order("tanggal", { ascending: false });

      if (error) throw error;

      let rows = data || [];
      if (kelas) rows = rows.filter((row) => row?.siswa?.kelas === kelas);

      if (!rows.length) {
        container.innerHTML = `
          <div class="gtr-riwayat-empty">
            <div class="gtr-riwayat-empty__icon">📭</div>
            <strong>${isAdmin ? "Belum ada rekap absensi" : "Belum ada riwayat absensi"}</strong>
            <span>Tidak ada data pada rentang tanggal dan kelas yang dipilih.</span>
          </div>
        `;
        return;
      }

      container.innerHTML = groupByDate(rows).map(renderDay).join("");
    } catch (error) {
      console.error(`Error load ${kind} absensi compact:`, error);
      container.innerHTML = `
        <div class="table-state table-state-error">
          Gagal memuat ${isAdmin ? "rekap" : "riwayat"} absensi. Silakan coba lagi.
        </div>
      `;
    }
  }

  window.renderRiwayatAbsen = () => renderCompactShell("guru");
  window.loadRiwayatAbsensi = () => loadCompact("guru");
  window.renderRekap = () => renderCompactShell("admin");
  window.loadRekapAbsensi = () => loadCompact("admin");
})();
