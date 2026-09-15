// ============================================================
// GANTARIKU — IMPORT SISWA PREMIUM PREVIEW
// Menggantikan modal import sederhana dengan preview data nyata.
// Tidak mengubah database sebelum tombol Import ditekan.
// ============================================================

(function () {
  const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

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
    return String(value || "")
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/[\s\-\/]+/g, "_");
  }

  function parseDelimited(text) {
    const delimiter = text.split(/\r?\n/)[0]?.includes("\t") ? "\t" : ",";
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"') {
        if (quoted && next === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (!quoted && ch === delimiter) {
        row.push(cell.trim());
        cell = "";
      } else if (!quoted && (ch === "\n" || ch === "\r")) {
        if (ch === "\r" && next === "\n") i += 1;
        row.push(cell.trim());
        if (row.some(Boolean)) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  function rowsToObjects(text) {
    const rows = parseDelimited(text);
    if (rows.length < 2) throw new Error("File harus memiliki judul kolom dan minimal satu data siswa.");
    const headers = rows[0].map(normalizeHeader);
    return rows.slice(1).map((values, index) => {
      const obj = { __row: index + 2 };
      headers.forEach((header, i) => {
        if (header) obj[header] = String(values[i] || "").trim();
      });
      return obj;
    }).filter((row) => Object.keys(row).some((key) => key !== "__row" && row[key]));
  }

  function pick(row, keys) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== "") return row[key];
    }
    return "";
  }

  function normalizeDate(value) {
    const v = String(value || "").trim();
    if (!v) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const m = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return null;
  }

  function normalizeMonth(value) {
    const v = String(value || "").trim();
    if (/^\d{4}-\d{2}$/.test(v)) return v;
    const m = v.match(/^(\d{1,2})[\/-](\d{4})$/);
    if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;
    const lower = v.toLowerCase();
    const monthIndex = MONTHS.findIndex((m) => lower.includes(m.toLowerCase()));
    const year = v.match(/(20\d{2})/)?.[1];
    return monthIndex >= 0 && year ? `${year}-${String(monthIndex + 1).padStart(2, "0")}` : "";
  }

  function normalizeGender(value) {
    const v = String(value || "").trim().toLowerCase();
    if (["l", "lk", "laki-laki", "laki laki", "male"].includes(v)) return "L";
    if (["p", "pr", "perempuan", "female"].includes(v)) return "P";
    return null;
  }

  function buildCandidate(row, index, existingNis) {
    const nama = pick(row, ["nama", "nama_siswa", "nama_anak"]);
    const nis = pick(row, ["nis", "nomor_induk", "nomor_induk_siswa"]);
    const kelas = pick(row, ["kelas"]);
    const nisKey = nis.toLowerCase();
    const errors = [];

    if (!nama) errors.push("Nama kosong");
    if (!nis) errors.push("NIS kosong");
    if (!kelas) errors.push("Kelas kosong");
    if (nis && existingNis.has(nisKey)) errors.push("NIS sudah terdaftar");

    const tanggalLahirRaw = pick(row, ["tanggal_lahir", "tanggallahir"]);
    const tanggalKeluarRaw = pick(row, ["tanggal_keluar", "tanggal_keluar_siswa"]);
    if (tanggalLahirRaw && !normalizeDate(tanggalLahirRaw)) errors.push("Tanggal lahir tidak valid");
    if (tanggalKeluarRaw && !normalizeDate(tanggalKeluarRaw)) errors.push("Tanggal keluar tidak valid");

    const mulaiRaw = pick(row, ["mulai_bergabung", "mulai_bulan"]);
    if (mulaiRaw && !normalizeMonth(mulaiRaw)) errors.push("Mulai bergabung tidak valid");

    return {
      source: row,
      index,
      nama,
      nis,
      kelas,
      tahun_ajaran: pick(row, ["tahun_ajaran", "tahunajaran"]),
      tempat_lahir: pick(row, ["tempat_lahir", "tempatlahir"]),
      tanggal_lahir: normalizeDate(tanggalLahirRaw),
      jenis_kelamin: normalizeGender(pick(row, ["jenis_kelamin", "jeniskelamin", "gender"])),
      nama_wali: pick(row, ["nama_wali", "wali", "nama_orang_tua"]),
      nomor_hp_ortu: pick(row, ["nomor_hp_ortu", "no_hp_ortu", "nomor_hp", "no_hp"]),
      mulai_bulan: (() => { const m = normalizeMonth(mulaiRaw); return m ? Number(m.slice(5, 7)) : null; })(),
      mulai_tahun: (() => { const m = normalizeMonth(mulaiRaw); return m ? Number(m.slice(0, 4)) : null; })(),
      tanggal_keluar: normalizeDate(tanggalKeluarRaw),
      alamat: pick(row, ["alamat"]),
      kode_akses: pick(row, ["kode_akses", "kode_akses_anak"]),
      errors
    };
  }

  function closeModal() {
    document.getElementById("gtrImportSiswaModal")?.remove();
  }

  function renderPreview(preview, candidates) {
    const valid = candidates.filter((x) => !x.errors.length);
    const invalid = candidates.filter((x) => x.errors.length);
    const visible = candidates.slice(0, 100);

    preview.innerHTML = `
      <div class="gtr-import-summary">
        <div class="gtr-import-stat"><strong>${candidates.length}</strong><span>Total baris</span></div>
        <div class="gtr-import-stat is-good"><strong>${valid.length}</strong><span>Siap diimport</span></div>
        <div class="gtr-import-stat ${invalid.length ? "is-bad" : ""}"><strong>${invalid.length}</strong><span>Perlu diperiksa</span></div>
      </div>
      <div class="gtr-import-preview-head">
        <div><strong>Preview Data Siswa</strong><small>Periksa data sebelum disimpan ke sistem.</small></div>
        ${candidates.length > 100 ? `<span>Menampilkan 100 dari ${candidates.length} baris</span>` : ""}
      </div>
      <div class="gtr-import-table-wrap">
        <table class="gtr-import-table">
          <thead><tr>
            <th>#</th><th>Nama</th><th>NIS</th><th>Kelas</th><th>Tahun Ajaran</th>
            <th>Jenis Kelamin</th><th>Nama Wali</th><th>HP Orang Tua</th><th>Tgl. Keluar</th><th>Status</th>
          </tr></thead>
          <tbody>
            ${visible.map((x) => `
              <tr class="${x.errors.length ? "is-invalid" : ""}">
                <td>${x.index}</td>
                <td class="name-cell">${esc(x.nama || "—")}</td>
                <td>${esc(x.nis || "—")}</td>
                <td>${esc(x.kelas || "—")}</td>
                <td>${esc(x.tahun_ajaran || "—")}</td>
                <td>${x.jenis_kelamin === "L" ? "Laki-laki" : x.jenis_kelamin === "P" ? "Perempuan" : "—"}</td>
                <td>${esc(x.nama_wali || "—")}</td>
                <td>${esc(x.nomor_hp_ortu || "—")}</td>
                <td>${esc(x.tanggal_keluar || "—")}</td>
                <td>${x.errors.length ? `<span class="gtr-import-badge bad" title="${esc(x.errors.join(", "))}">⚠ ${esc(x.errors[0])}</span>` : `<span class="gtr-import-badge good">✓ Siap</span>`}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="gtr-import-note">Data dengan tanda ⚠ tidak akan diimport. Data lama tidak diubah.</div>
    `;
    return { valid, invalid };
  }

  function bukaImportSiswaPremium() {
    if (currentUserRole !== "admin") {
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
              <p>Masukkan data dari CSV/TSV dan periksa seluruh isi file sebelum disimpan.</p>
            </div>
            <button type="button" class="gtr-import-close" id="gtrImportClose" aria-label="Tutup">×</button>
          </div>

          <div class="gtr-import-info">
            <div><strong>Kolom wajib</strong><span>Nama · NIS · Kelas</span></div>
            <div><strong>Kolom tambahan</strong><span>Tahun Ajaran · Tempat Lahir · Tanggal Lahir · Jenis Kelamin · Wali · HP · Bergabung · Tanggal Keluar · Alamat · Kode Akses</span></div>
          </div>

          <label class="gtr-import-drop" id="gtrImportDrop">
            <input type="file" id="gtrImportSiswaFile" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values">
            <span class="gtr-import-drop-icon">↑</span>
            <strong>Pilih file CSV / TSV</strong>
            <small>atau klik area ini untuk memilih file</small>
            <span class="gtr-import-file" id="gtrImportFileName">Belum ada file dipilih</span>
          </label>

          <div id="gtrImportPreview" class="gtr-import-preview-empty">
            <div class="gtr-import-empty-icon">📋</div>
            <strong>Preview akan muncul di sini</strong>
            <span>Pilih file untuk melihat data siswa sebelum import.</span>
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

    const fileInput = document.getElementById("gtrImportSiswaFile");
    const preview = document.getElementById("gtrImportPreview");
    const runButton = document.getElementById("gtrImportRun");
    const readyText = document.getElementById("gtrImportReadyText");
    const fileName = document.getElementById("gtrImportFileName");
    let candidates = [];

    const close = () => closeModal();
    document.getElementById("gtrImportClose")?.addEventListener("click", close);
    document.getElementById("gtrImportCancel")?.addEventListener("click", close);
    modal.querySelector(".gtr-import-overlay")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) close();
    });

    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      candidates = [];
      runButton.disabled = true;
      readyText.textContent = "Membaca file...";
      preview.innerHTML = `<div class="gtr-import-loading">Membaca data siswa...</div>`;
      fileName.textContent = file ? `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB` : "Belum ada file dipilih";
      if (!file) return;

      try {
        const text = await file.text();
        const rows = rowsToObjects(text);
        const { data: existing, error } = await supabase.from("siswa").select("nis");
        if (error) throw error;
        const existingNis = new Set((existing || []).map((s) => String(s.nis || "").trim().toLowerCase()).filter(Boolean));
        candidates = rows.map((row, i) => buildCandidate(row, i + 1, existingNis));
        const result = renderPreview(preview, candidates);
        runButton.disabled = result.valid.length === 0;
        readyText.textContent = result.valid.length
          ? `${result.valid.length} siswa siap diimport${result.invalid.length ? ` · ${result.invalid.length} perlu diperiksa` : ""}.`
          : "Belum ada data yang siap diimport.";
      } catch (error) {
        console.error("Preview import siswa:", error);
        preview.innerHTML = `<div class="gtr-import-error">⚠ ${esc(error?.message || "File tidak dapat dibaca.")}</div>`;
        readyText.textContent = "File belum siap diimport.";
      }
    });

    runButton?.addEventListener("click", async () => {
      const valid = candidates.filter((x) => !x.errors.length);
      if (!valid.length || !supabase) return;
      if (!confirm(`Import ${valid.length} siswa ke Data Siswa?\n\nData lama tidak akan dihapus atau diubah.`)) return;

      runButton.disabled = true;
      runButton.textContent = "Mengimport...";
      readyText.textContent = "Sedang menyimpan data...";

      try {
        const payload = valid.map((x) => ({
          nama: x.nama,
          nis: x.nis,
          kelas: x.kelas,
          tahun_ajaran: x.tahun_ajaran || null,
          tempat_lahir: x.tempat_lahir || null,
          tanggal_lahir: x.tanggal_lahir,
          jenis_kelamin: x.jenis_kelamin,
          nama_wali: x.nama_wali || null,
          nomor_hp_ortu: x.nomor_hp_ortu || null,
          mulai_bulan: x.mulai_bulan,
          mulai_tahun: x.mulai_tahun,
          tanggal_keluar: x.tanggal_keluar,
          alamat: x.alamat || null,
          kode_akses: x.kode_akses || (typeof generateKodeAkses === "function" ? generateKodeAkses() : null)
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
      }
    });
  }

  window.bukaImportSiswa = bukaImportSiswaPremium;
  window.__gtrImportSiswaPremium = bukaImportSiswaPremium;
})();
