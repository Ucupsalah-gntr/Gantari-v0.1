// ============================================================
// GANTARIKU — IMPORT SISWA EXCEL
// Single, clean Excel importer.
// Preview first. Database is only written after Import is clicked.
// ============================================================

(function () {
  "use strict";

  const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const MONTH_ALIASES = {
    jan: 1, januari: 1,
    feb: 2, februari: 2,
    mar: 3, maret: 3,
    apr: 4, april: 4,
    mei: 5, may: 5,
    jun: 6, juni: 6,
    jul: 7, juli: 7,
    agu: 8, agt: 8, agustus: 8,
    sep: 9, sept: 9, september: 9,
    okt: 10, oktober: 10,
    nov: 11, november: 11,
    des: 12, desember: 12, dec: 12
  };

  let candidates = [];
  let importing = false;

  function esc(value) {
    if (typeof escapeHtml === "function") return escapeHtml(value ?? "");
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function notify(message, type = "info") {
    if (typeof appNotify === "function") appNotify(message, type);
    else console.log(message);
  }

  function normalizeHeader(value) {
    return String(value ?? "")
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/[\r\n]+/g, " ")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function canonicalHeader(value) {
    const key = normalizeHeader(value);
    const compact = key.replace(/_/g, "");

    if (
      (key.includes("nama") || compact.includes("namapeserta")) &&
      !key.includes("wali") &&
      !key.includes("ortu") &&
      !key.includes("orang_tua") &&
      !compact.includes("orangtua")
    ) return "nama";

    if (
      key === "nis" ||
      compact.includes("nomorinduksiswa") ||
      compact === "nomorinduk" ||
      compact === "nisanak"
    ) return "nis";

    if (key === "kelas" || key === "class" || compact.includes("kelassiswa")) return "kelas";

    if (key.includes("tahun") && key.includes("ajar")) return "tahun_ajaran";
    if (key.includes("tempat") && key.includes("lahir")) return "tempat_lahir";
    if ((key.includes("tanggal") && key.includes("lahir")) || key === "tgl_lahir") return "tanggal_lahir";
    if ((key.includes("jenis") && key.includes("kelamin")) || ["gender", "jk"].includes(key)) return "jenis_kelamin";

    if (
      key === "wali" ||
      key.includes("nama_wali") ||
      key.includes("orang_tua") ||
      key.includes("orangtua") ||
      key.includes("nama_ortu")
    ) return "nama_wali";

    if (
      key.includes("hp") ||
      key.includes("nomor_hp") ||
      key.includes("no_hp") ||
      key.includes("telepon") ||
      key.includes("telp")
    ) return "nomor_hp_ortu";

    // IMPORTANT: supports both "Mulai Bergabung" and "Bulan Bergabung".
    if (
      (key.includes("mulai") && key.includes("gabung")) ||
      (key.includes("bulan") && key.includes("gabung")) ||
      key === "mulai_bulan" ||
      key === "bulan_bergabung" ||
      key === "bergabung"
    ) return "mulai_bergabung";

    if ((key.includes("tanggal") && key.includes("keluar")) || key === "tgl_keluar") return "tanggal_keluar";
    if (key === "alamat" || key.includes("alamat_siswa")) return "alamat";
    if (key.includes("kode") && key.includes("akses")) return "kode_akses";

    return key;
  }

  function headerScore(row) {
    return (row || []).reduce((score, value) => {
      const key = canonicalHeader(value);
      if (["nama", "nis", "kelas"].includes(key)) return score + 3;
      if ([
        "tahun_ajaran", "tempat_lahir", "tanggal_lahir", "jenis_kelamin",
        "nama_wali", "nomor_hp_ortu", "mulai_bergabung", "tanggal_keluar",
        "alamat", "kode_akses"
      ].includes(key)) return score + 1;
      return score;
    }, 0);
  }

  function makeRows(matrix) {
    const source = (matrix || []).filter(
      row => Array.isArray(row) && row.some(value => String(value ?? "").trim() !== "")
    );

    if (source.length < 2) {
      throw new Error("File Excel kosong atau belum memiliki data siswa.");
    }

    let headerIndex = -1;
    let bestScore = -1;

    source.slice(0, 40).forEach((row, index) => {
      const score = headerScore(row);
      if (score > bestScore) {
        bestScore = score;
        headerIndex = index;
      }
    });

    if (headerIndex < 0 || bestScore < 6) {
      throw new Error("Header tidak dikenali. Pastikan ada kolom Nama, NIS, dan Kelas.");
    }

    const headers = source[headerIndex].map(canonicalHeader);

    return source.slice(headerIndex + 1)
      .map((values, offset) => {
        const row = { __row: headerIndex + offset + 2 };
        headers.forEach((header, columnIndex) => {
          if (header && header !== "no") {
            row[header] = String(values[columnIndex] ?? "").trim();
          }
        });
        return row;
      })
      .filter(row => [row.nama, row.nis, row.kelas].some(Boolean));
  }

  function parseDate(value) {
    const text = String(value ?? "").trim();
    if (!text) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    let match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }

    match = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
    if (match) {
      const month = MONTH_ALIASES[match[2].toLowerCase()];
      if (month) {
        return `${match[3]}-${String(month).padStart(2, "0")}-${String(Number(match[1])).padStart(2, "0")}`;
      }
    }

    const serial = Number(text.replace(",", "."));
    if (Number.isInteger(serial) && serial > 30000 && serial < 70000) {
      const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    }

    return null;
  }

  function parseMonth(value, fallbackYear = "") {
    const text = String(value ?? "").trim();
    if (!text) return "";

    const fallback = String(fallbackYear ?? "").match(/20\d{2}/)?.[0] || "";

    // YYYY-MM
    let match = text.match(/^(20\d{2})-(\d{1,2})$/);
    if (match) {
      const month = Number(match[2]);
      return month >= 1 && month <= 12 ? `${match[1]}-${String(month).padStart(2, "0")}` : "";
    }

    // YYYY/MM or YYYY-MM
    match = text.match(/^(20\d{2})[\/-](\d{1,2})$/);
    if (match) {
      const month = Number(match[2]);
      return month >= 1 && month <= 12 ? `${match[1]}-${String(month).padStart(2, "0")}` : "";
    }

    // MM/YYYY
    match = text.match(/^(\d{1,2})[\/-](20\d{2})$/);
    if (match) {
      const month = Number(match[1]);
      return month >= 1 && month <= 12 ? `${match[2]}-${String(month).padStart(2, "0")}` : "";
    }

    // A full date such as 15/08/2026 means August 2026 for "Bulan Bergabung".
    match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})$/);
    if (match) {
      const month = Number(match[2]);
      return month >= 1 && month <= 12 ? `${match[3]}-${String(month).padStart(2, "0")}` : "";
    }

    // Month + year / year + month.
    match = text.match(/^([A-Za-z]+)[\s\-\/]+(20\d{2})$/i);
    if (match) {
      const month = MONTH_ALIASES[match[1].toLowerCase()];
      return month ? `${match[2]}-${String(month).padStart(2, "0")}` : "";
    }

    match = text.match(/^(20\d{2})[\s\-\/]+([A-Za-z]+)$/i);
    if (match) {
      const month = MONTH_ALIASES[match[2].toLowerCase()];
      return month ? `${match[1]}-${String(month).padStart(2, "0")}` : "";
    }

    // Month name with year anywhere in the cell.
    const normalized = text.toLowerCase().replace(/[.,]/g, " ");
    const monthToken = normalized.split(/\s+/).map(token => MONTH_ALIASES[token]).find(Boolean);
    if (monthToken) {
      const year = text.match(/20\d{2}/)?.[0] || fallback;
      if (year) return `${year}-${String(monthToken).padStart(2, "0")}`;
    }

    // Month number 1..12. Use Tahun Ajaran as fallback when available.
    const numeric = Number(text.replace(",", "."));
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
      const year = fallback || String(new Date().getFullYear());
      return `${year}-${String(numeric).padStart(2, "0")}`;
    }

    // Native Excel serial date.
    if (Number.isInteger(numeric) && numeric > 30000 && numeric < 70000) {
      const date = new Date(Date.UTC(1899, 11, 30) + numeric * 86400000);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    }

    return "";
  }

  function parseGender(value) {
    const text = String(value ?? "").trim().toLowerCase();
    if (["l", "lk", "laki-laki", "laki laki", "male"].includes(text)) return "L";
    if (["p", "pr", "perempuan", "female"].includes(text)) return "P";
    return null;
  }

  function value(row, key) {
    return String(row[key] ?? "").trim();
  }

  function buildCandidates(rows, existingNis) {
    const seen = new Set(existingNis);

    return rows.map(row => {
      const nama = value(row, "nama");
      const nis = value(row, "nis");
      const kelas = value(row, "kelas");
      const errors = [];

      if (!nama) errors.push("Nama kosong");
      if (!nis) errors.push("NIS kosong");
      if (!kelas) errors.push("Kelas kosong");

      const nisKey = nis.toLowerCase();
      if (nis && seen.has(nisKey)) errors.push("NIS sudah terdaftar/duplikat");
      if (nis) seen.add(nisKey);

      const tahunAjaran = value(row, "tahun_ajaran");
      const tanggalLahirRaw = value(row, "tanggal_lahir");
      const tanggalKeluarRaw = value(row, "tanggal_keluar");
      const bulanBergabungRaw = value(row, "mulai_bergabung");

      const tanggalLahir = parseDate(tanggalLahirRaw);
      const tanggalKeluar = parseDate(tanggalKeluarRaw);
      const bulanBergabung = parseMonth(bulanBergabungRaw, tahunAjaran);

      if (tanggalLahirRaw && !tanggalLahir) errors.push("Tanggal lahir tidak valid");
      if (tanggalKeluarRaw && !tanggalKeluar) errors.push("Tanggal keluar tidak valid");
      if (bulanBergabungRaw && !bulanBergabung) errors.push("Bulan bergabung tidak valid");

      return {
        row: row.__row,
        nama,
        nis,
        kelas,
        tahun_ajaran: tahunAjaran,
        tempat_lahir: value(row, "tempat_lahir"),
        tanggal_lahir: tanggalLahir,
        jenis_kelamin: parseGender(value(row, "jenis_kelamin")),
        nama_wali: value(row, "nama_wali"),
        nomor_hp_ortu: value(row, "nomor_hp_ortu"),
        mulai_bulan: bulanBergabung ? Number(bulanBergabung.slice(5, 7)) : null,
        mulai_tahun: bulanBergabung ? Number(bulanBergabung.slice(0, 4)) : null,
        tanggal_keluar: tanggalKeluar,
        alamat: value(row, "alamat"),
        kode_akses: value(row, "kode_akses"),
        errors
      };
    });
  }

  function renderPreview(preview, list) {
    const valid = list.filter(item => !item.errors.length);
    const invalid = list.filter(item => item.errors.length);

    preview.classList.remove("gtr-import-preview-empty");
    preview.innerHTML = `
      <div class="gtr-import-summary">
        <div class="gtr-import-stat"><strong>${list.length}</strong><span>Total baris</span></div>
        <div class="gtr-import-stat is-good"><strong>${valid.length}</strong><span>Siap diimport</span></div>
        <div class="gtr-import-stat ${invalid.length ? "is-bad" : ""}"><strong>${invalid.length}</strong><span>Perlu diperiksa</span></div>
      </div>

      <div class="gtr-import-preview-head">
        <div>
          <strong>Preview Data Siswa</strong>
          <small>Data Excel sudah dibaca. Periksa sebelum disimpan ke sistem.</small>
        </div>
        ${list.length > 100 ? `<span>Menampilkan 100 dari ${list.length} baris</span>` : ""}
      </div>

      <div class="gtr-import-table-wrap">
        <table class="gtr-import-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nama</th>
              <th>NIS</th>
              <th>Kelas</th>
              <th>Tahun Ajaran</th>
              <th>Bulan Bergabung</th>
              <th>Jenis Kelamin</th>
              <th>Nama Wali</th>
              <th>HP Orang Tua</th>
              <th>Tgl. Keluar</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${list.slice(0, 100).map(item => `
              <tr class="${item.errors.length ? "is-invalid" : ""}">
                <td>${item.row}</td>
                <td class="name-cell">${esc(item.nama || "—")}</td>
                <td>${esc(item.nis || "—")}</td>
                <td>${esc(item.kelas || "—")}</td>
                <td>${esc(item.tahun_ajaran || "—")}</td>
                <td>${esc(item.mulai_bulan ? `${MONTHS[item.mulai_bulan - 1]} ${item.mulai_tahun}` : "—")}</td>
                <td>${item.jenis_kelamin === "L" ? "Laki-laki" : item.jenis_kelamin === "P" ? "Perempuan" : "—"}</td>
                <td>${esc(item.nama_wali || "—")}</td>
                <td>${esc(item.nomor_hp_ortu || "—")}</td>
                <td>${esc(item.tanggal_keluar || "—")}</td>
                <td>
                  ${item.errors.length
                    ? `<span class="gtr-import-badge bad" title="${esc(item.errors.join(", "))}">⚠ ${esc(item.errors[0])}</span>`
                    : `<span class="gtr-import-badge good">✓ Siap</span>`}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="gtr-import-note">
        Data dengan tanda ⚠ tidak akan diimport. Data lama tidak diubah.
      </div>
    `;

    return { valid, invalid };
  }

  function closeModal() {
    document.getElementById("gtrImportSiswaModal")?.remove();
  }

  function bukaImportSiswa() {
    if (typeof currentUserRole !== "undefined" && currentUserRole !== "admin") {
      notify("Import data siswa hanya tersedia untuk admin.", "warning");
      return;
    }

    closeModal();

    const modal = document.createElement("div");
    modal.id = "gtrImportSiswaModal";
    modal.innerHTML = `
      <div class="gtr-import-overlay">
        <div class="gtr-import-modal" role="dialog" aria-modal="true" aria-labelledby="gtrImportTitle">
          <div class="gtr-import-top">
            <div>
              <div class="gtr-import-kicker">DATA SISWA</div>
              <h3 id="gtrImportTitle">📊 Import Data Siswa</h3>
              <p>Upload Excel (.xlsx/.xls), lihat preview, lalu import jika sudah benar.</p>
            </div>
            <button type="button" class="gtr-import-close" id="gtrImportClose" aria-label="Tutup">×</button>
          </div>

          <div class="gtr-import-info">
            <div><strong>Kolom wajib</strong><span>Nama · NIS · Kelas</span></div>
            <div><strong>Kolom tambahan</strong><span>Tahun Ajaran · Tempat Lahir · Tanggal Lahir · Jenis Kelamin · Wali · HP · Bulan Bergabung · Tanggal Keluar · Alamat · Kode Akses</span></div>
          </div>

          <label class="gtr-import-drop" id="gtrImportDrop">
            <input type="file" id="gtrImportSiswaFile" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel">
            <span class="gtr-import-drop-icon">↑</span>
            <strong>Pilih file Excel</strong>
            <small>Format .xlsx atau .xls</small>
            <span class="gtr-import-file" id="gtrImportFileName">Belum ada file dipilih</span>
          </label>

          <div id="gtrImportPreview" class="gtr-import-preview-empty">
            <div class="gtr-import-empty-icon">📋</div>
            <strong>Preview akan muncul di sini</strong>
            <span>Pilih file Excel untuk melihat data siswa.</span>
          </div>

          <div class="gtr-import-actions">
            <span id="gtrImportReadyText">Belum ada data yang siap diimport.</span>
            <div>
              <button type="button" class="btn ghost" id="gtrImportCancel">Batal</button>
              <button type="button" class="btn" id="gtrImportRun" disabled>Import Siswa</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const fileInput = modal.querySelector("#gtrImportSiswaFile");
    const preview = modal.querySelector("#gtrImportPreview");
    const runButton = modal.querySelector("#gtrImportRun");
    const readyText = modal.querySelector("#gtrImportReadyText");
    const fileName = modal.querySelector("#gtrImportFileName");

    const close = () => closeModal();
    modal.querySelector("#gtrImportClose")?.addEventListener("click", close);
    modal.querySelector("#gtrImportCancel")?.addEventListener("click", close);
    modal.querySelector(".gtr-import-overlay")?.addEventListener("click", event => {
      if (event.target === event.currentTarget) close();
    });

    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      candidates = [];
      runButton.disabled = true;
      readyText.textContent = "Membaca file Excel...";
      preview.innerHTML = `<div class="gtr-import-loading">Membaca data siswa...</div>`;
      fileName.textContent = file
        ? `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB`
        : "Belum ada file dipilih";

      if (!file) return;

      if (!window.XLSX) {
        preview.innerHTML = `<div class="gtr-import-error">⚠ Library Excel belum siap. Muat ulang halaman lalu coba lagi.</div>`;
        readyText.textContent = "Excel belum siap dibaca.";
        return;
      }

      try {
        const workbook = XLSX.read(await file.arrayBuffer(), {
          type: "array",
          cellDates: true,
          raw: false
        });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet) throw new Error("Sheet Excel tidak ditemukan.");

        const matrix = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: "",
          raw: false
        });

        const rows = makeRows(matrix);
        if (!rows.length) throw new Error("Tidak ditemukan baris data siswa.");

        if (!supabase) throw new Error("Koneksi database belum siap.");

        const { data: existing, error } = await supabase.from("siswa").select("nis");
        if (error) throw error;

        const existingNis = new Set(
          (existing || [])
            .map(item => String(item.nis || "").trim().toLowerCase())
            .filter(Boolean)
        );

        candidates = buildCandidates(rows, existingNis);
        const result = renderPreview(preview, candidates);

        runButton.disabled = result.valid.length === 0;
        readyText.textContent = result.valid.length
          ? `${result.valid.length} siswa siap diimport${result.invalid.length ? ` · ${result.invalid.length} perlu diperiksa` : ""}.`
          : "Belum ada data yang siap diimport.";
      } catch (error) {
        console.error("Preview import siswa:", error);
        candidates = [];
        runButton.disabled = true;
        readyText.textContent = "File belum siap diimport.";
        preview.innerHTML = `<div class="gtr-import-error">⚠ ${esc(error?.message || "File Excel tidak dapat dibaca.")}</div>`;
      }
    });

    runButton?.addEventListener("click", async () => {
      if (importing || !supabase) return;

      const valid = candidates.filter(item => !item.errors.length);
      if (!valid.length) return;

      if (!confirm(`Import ${valid.length} siswa ke Data Siswa?\n\nData lama tidak akan dihapus atau diubah.`)) return;

      importing = true;
      runButton.disabled = true;
      runButton.textContent = "Mengimport...";
      readyText.textContent = "Sedang menyimpan data...";

      try {
        const payload = valid.map(item => ({
          nama: item.nama,
          nis: item.nis,
          kelas: item.kelas,
          tahun_ajaran: item.tahun_ajaran || null,
          tempat_lahir: item.tempat_lahir || null,
          tanggal_lahir: item.tanggal_lahir,
          jenis_kelamin: item.jenis_kelamin,
          nama_wali: item.nama_wali || null,
          nomor_hp_ortu: item.nomor_hp_ortu || null,
          mulai_bulan: item.mulai_bulan,
          mulai_tahun: item.mulai_tahun,
          tanggal_keluar: item.tanggal_keluar,
          alamat: item.alamat || null,
          kode_akses: item.kode_akses || (typeof generateKodeAkses === "function" ? generateKodeAkses() : null)
        }));

        const { error } = await supabase.from("siswa").insert(payload);
        if (error) throw error;

        if (typeof loadSiswa === "function") await loadSiswa();
        closeModal();
        notify(`${payload.length} siswa berhasil diimport.`, "success");
      } catch (error) {
        console.error("Import siswa:", error);
        runButton.disabled = false;
        runButton.textContent = "Import Siswa";
        readyText.textContent = "Import gagal. Periksa pesan notifikasi.";
        notify(error?.message || "Import siswa gagal.", "error");
      } finally {
        importing = false;
      }
    });
  }

  window.bukaImportSiswa = bukaImportSiswa;
  window.__gtrImportSiswaExcel = bukaImportSiswa;
})();
