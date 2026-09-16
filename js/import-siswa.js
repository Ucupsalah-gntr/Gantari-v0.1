/* Gantariku — standalone student import module */
(function () {
  "use strict";

  const state = { rows: [], valid: [], invalid: [] };
  const esc = (value) => {
    if (typeof window.escapeHtml === "function") return window.escapeHtml(value ?? "");
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  function notify(message, type = "info") {
    if (typeof window.appNotify === "function") window.appNotify(message, type);
    else alert(message);
  }

  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector("script[data-gantariku-xlsx='1']");
      const script = existing || document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      script.async = true;
      script.dataset.gantarikuXlsx = "1";
      script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error("Library Excel tidak tersedia."));
      script.onerror = () => reject(new Error("Gagal memuat library Excel. Periksa koneksi internet."));
      if (!existing) document.head.appendChild(script);
    });
  }

  function normalizeHeader(value) {
    return String(value ?? "").trim().toLowerCase()
      .replace(/[.()/_-]+/g, " ").replace(/\s+/g, " ");
  }

  function parseRow(row, number, headers) {
    const get = (...names) => {
      const index = names.map(normalizeHeader).map((name) => headers.indexOf(name)).find((i) => i >= 0);
      return String(index === undefined ? "" : row[index] ?? "").trim();
    };
    const result = {
      rowNumber: number,
      nama: get("nama", "nama siswa", "name"),
      nis: get("nis", "nis siswa", "nomor induk siswa"),
      ttl: get("ttl", "tempat tanggal lahir", "tempat lahir tanggal lahir"),
      alamat: get("alamat", "address"),
      nama_wali: get("nama wali", "wali", "nama orang tua", "orang tua"),
      nomor_hp_ortu: get("no hp", "nomor hp", "no hp orang tua", "nomor hp orang tua", "telepon"),
      kelas: get("kelas", "class"),
      mulai_bergabung: get("mulai bergabung", "tanggal bergabung", "bergabung"),
      errors: [],
    };
    if (!result.nama) result.errors.push("Nama siswa kosong");
    if (!result.nis) result.errors.push("NIS kosong");
    if (!result.kelas) result.errors.push("Kelas kosong");
    return result;
  }

  async function readFile(file) {
    if (!file) throw new Error("File belum dipilih.");
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) throw new Error("Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv.");
    const XLSX = await loadXlsx();
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("Sheet Excel tidak ditemukan.");
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "", blankrows: false });
    if (!rows.length) throw new Error("File tidak berisi data.");
    const headers = rows[0].map(normalizeHeader);
    const hasHeader = headers.some((x) => ["nama", "nama siswa", "nis", "kelas"].includes(x));
    const headerRow = hasHeader ? rows[0] : ["no", "nama", "nis", "ttl", "alamat", "nama wali", "no hp", "kelas", "mulai bergabung"];
    const headerNames = headerRow.map(normalizeHeader);
    const data = rows.slice(hasHeader ? 1 : 0).filter((row) => row.some((value) => String(value ?? "").trim() !== ""));
    if (!data.length) throw new Error("Tidak ditemukan data siswa setelah header.");
    return data.map((row, i) => parseRow(row, i + (hasHeader ? 2 : 1), headerNames));
  }

  function renderPreview(fileName) {
    const status = document.getElementById("gtrImportStatus");
    const preview = document.getElementById("gtrImportPreview");
    if (!status || !preview) return;
    status.innerHTML = `<div class="gtr-import-summary"><div class="gtr-import-stat"><strong>${state.rows.length}</strong><span>Total baris</span></div><div class="gtr-import-stat good"><strong>${state.valid.length}</strong><span>Siap diimport</span></div><div class="gtr-import-stat bad"><strong>${state.invalid.length}</strong><span>Perlu diperbaiki</span></div></div><div class="gtr-import-file">📄 ${esc(fileName)}</div>`;
    preview.innerHTML = `<div class="gtr-import-preview-title"><strong>Preview Data</strong><span>${state.rows.length > 30 ? "Menampilkan 30 baris pertama" : "Semua baris"}</span></div><div class="gtr-import-table-wrap"><table class="gtr-import-table"><thead><tr><th>Baris</th><th>Nama</th><th>NIS</th><th>Kelas</th><th>Status</th><th>Masalah</th></tr></thead><tbody>${state.rows.slice(0, 30).map((row) => `<tr class="${row.errors.length ? "is-invalid" : ""}"><td>${row.rowNumber}</td><td>${esc(row.nama)}</td><td>${esc(row.nis)}</td><td>${esc(row.kelas)}</td><td>${row.errors.length ? "! Perlu diperbaiki" : "✓ Valid"}</td><td>${row.errors.length ? row.errors.map(esc).join("<br>") : "—"}</td></tr>`).join("")}</tbody></table></div><div class="gtr-import-actions"><button type="button" class="btn ghost" id="gtrBtnBatalImport">Batal</button><button type="button" class="btn" id="gtrBtnImportSekarang" ${state.valid.length ? "" : "disabled"}>Import ${state.valid.length} Data</button></div>`;
    document.getElementById("gtrBtnBatalImport")?.addEventListener("click", close);
    document.getElementById("gtrBtnImportSekarang")?.addEventListener("click", save);
  }

  async function save() {
    if (window.currentUserRole !== "admin") return notify("Hanya admin yang dapat melakukan import data siswa.", "error");
    if (!window.supabase) return notify("Supabase belum terhubung.", "error");
    const button = document.getElementById("gtrBtnImportSekarang");
    button && (button.disabled = true);
    try {
      const payload = state.valid.map((row) => ({ nama: row.nama, nis: row.nis, alamat: row.alamat || null, nama_wali: row.nama_wali || null, nomor_hp_ortu: row.nomor_hp_ortu || null, kelas: row.kelas, orang_tua_id: null, kode_akses: typeof window.generateKodeAkses === "function" ? window.generateKodeAkses() : null }));
      const { error } = await window.supabase.from("siswa").insert(payload);
      if (error) throw error;
      notify(`Berhasil mengimport ${payload.length} data siswa.`, "success");
      close();
      if (typeof window.loadSiswa === "function") await window.loadSiswa();
    } catch (error) {
      notify(`Import gagal: ${error?.message || "Terjadi kesalahan."}`, "error");
      button && (button.disabled = false);
    }
  }

  function close() { document.getElementById("modalImportSiswa")?.remove(); state.rows = []; state.valid = []; state.invalid = []; }

  function open() {
    if (window.currentUserRole !== "admin") return notify("Fitur import hanya tersedia untuk admin.", "error");
    close();
    const modal = document.createElement("div");
    modal.id = "modalImportSiswa";
    modal.innerHTML = `<div class="gtr-import-backdrop"><div class="gtr-import-modal"><div class="gtr-import-header"><div><h2>Import Data Siswa</h2><p>Gunakan file Excel atau CSV.</p></div><button type="button" class="gtr-import-close" id="gtrCloseImport">×</button></div><div class="gtr-import-content"><div class="gtr-import-upload"><strong>Pilih file Excel / CSV</strong><span>.xlsx · .xls · .csv</span><input type="file" id="gtrInputFileSiswa" accept=".xlsx,.xls,.csv"><label for="gtrInputFileSiswa" class="btn">Pilih File</label><small>Kolom minimal: Nama, NIS, Kelas</small></div><div id="gtrImportStatus"></div><div id="gtrImportPreview"></div></div></div></div>`;
    document.body.appendChild(modal);
    document.getElementById("gtrCloseImport")?.addEventListener("click", close);
    modal.querySelector(".gtr-import-backdrop")?.addEventListener("click", (event) => { if (event.target.classList.contains("gtr-import-backdrop")) close(); });
    document.getElementById("gtrInputFileSiswa")?.addEventListener("change", async (event) => {
      const status = document.getElementById("gtrImportStatus");
      if (status) status.textContent = "Membaca dan memeriksa file...";
      try { state.rows = await readFile(event.target.files?.[0]); const seen = new Set(); state.rows.forEach((row) => { const key = row.nis.toLowerCase(); if (key && seen.has(key)) row.errors.push("NIS duplikat di dalam file"); if (key) seen.add(key); }); state.valid = state.rows.filter((row) => !row.errors.length); state.invalid = state.rows.filter((row) => row.errors.length); renderPreview(event.target.files[0].name); } catch (error) { if (status) status.innerHTML = `<div class="gtr-import-error">❌ ${esc(error.message)}</div>`; }
    });
  }

  window.bukaImportSiswa = open;
  window.tutupImportSiswa = close;
})();
