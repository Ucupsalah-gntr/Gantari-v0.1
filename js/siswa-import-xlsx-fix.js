// GANTARIKU — IMPORT SISWA EXCEL FIX
// Dukungan .xlsx/.xls menggunakan SheetJS. Hanya membaca file saat preview;
// database baru ditulis setelah tombol Import ditekan.
(function () {
  let excelCandidates = [];
  let excelMode = false;
  let importing = false;

  const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const esc = (v) => typeof escapeHtml === "function"
    ? escapeHtml(v ?? "")
    : String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");

  function pick(row, keys) {
    for (const key of keys) {
      if (row[key] !== undefined && String(row[key]).trim() !== "") return String(row[key]).trim();
    }
    return "";
  }

  function headerKey(v) {
    return String(v ?? "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s\-\/]+/g, "_");
  }

  function normalizeDate(v) {
    const s = String(v ?? "").trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    let m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
    if (m) {
      const month = MONTHS.findIndex(x => x.toLowerCase() === m[2].toLowerCase());
      if (month >= 0) return `${m[3]}-${String(month + 1).padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    }
    return null;
  }

  function normalizeMonth(v) {
    const s = String(v ?? "").trim();
    if (!s) return "";
    if (/^\d{4}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})[\/-](\d{4})$/);
    if (m) return `${m[2]}-${m[1].padStart(2,"0")}`;
    const idx = MONTHS.findIndex(x => s.toLowerCase().includes(x.toLowerCase()));
    const year = s.match(/20\d{2}/)?.[0];
    return idx >= 0 && year ? `${year}-${String(idx + 1).padStart(2,"0")}` : "";
  }

  function gender(v) {
    const s = String(v ?? "").trim().toLowerCase();
    if (["l","lk","laki-laki","laki laki","male"].includes(s)) return "L";
    if (["p","pr","perempuan","female"].includes(s)) return "P";
    return null;
  }

  function makeRows(matrix) {
    const nonEmpty = matrix.filter(r => Array.isArray(r) && r.some(v => String(v ?? "").trim() !== ""));
    if (nonEmpty.length < 2) throw new Error("File Excel harus memiliki judul kolom dan minimal satu data siswa.");
    const headers = nonEmpty[0].map(headerKey);
    return nonEmpty.slice(1).map((values, i) => {
      const row = { __row: i + 2 };
      headers.forEach((h,j) => { if (h) row[h] = String(values[j] ?? "").trim(); });
      return row;
    });
  }

  function candidatesFrom(rows, existing) {
    const seen = new Set(existing);
    return rows.map(row => {
      const nama = pick(row,["nama","nama_siswa","nama_anak","nama_murid"]);
      const nis = pick(row,["nis","nomor_induk","nomor_induk_siswa","nomor_induk_murid"]);
      const kelas = pick(row,["kelas","class"]);
      const errors = [];
      const nisKey = nis.toLowerCase();
      if (!nama) errors.push("Nama kosong");
      if (!nis) errors.push("NIS kosong");
      if (!kelas) errors.push("Kelas kosong");
      if (nis && seen.has(nisKey)) errors.push("NIS sudah terdaftar/duplikat");
      if (nis) seen.add(nisKey);

      const lahirRaw = pick(row,["tanggal_lahir","tanggallahir","tgl_lahir"]);
      const keluarRaw = pick(row,["tanggal_keluar","tanggal_keluar_siswa","tgl_keluar"]);
      const lahir = normalizeDate(lahirRaw);
      const keluar = normalizeDate(keluarRaw);
      if (lahirRaw && !lahir) errors.push("Tanggal lahir tidak valid");
      if (keluarRaw && !keluar) errors.push("Tanggal keluar tidak valid");

      const gabungRaw = pick(row,["mulai_bergabung","mulai_bulan","bergabung"]);
      const gabung = normalizeMonth(gabungRaw);
      if (gabungRaw && !gabung) errors.push("Mulai bergabung tidak valid");

      return {
        row: row.__row,
        nama, nis, kelas,
        tahun_ajaran: pick(row,["tahun_ajaran","tahunajaran"]),
        tempat_lahir: pick(row,["tempat_lahir","tempatlahir"]),
        tanggal_lahir: lahir,
        jenis_kelamin: gender(pick(row,["jenis_kelamin","jeniskelamin","gender","jk"])),
        nama_wali: pick(row,["nama_wali","wali","nama_orang_tua","nama_ortu"]),
        nomor_hp_ortu: pick(row,["nomor_hp_ortu","no_hp_ortu","nomor_hp","no_hp","hp_ortu"]),
        mulai_bulan: gabung ? Number(gabung.slice(5,7)) : null,
        mulai_tahun: gabung ? Number(gabung.slice(0,4)) : null,
        tanggal_keluar: keluar,
        alamat: pick(row,["alamat"]),
        kode_akses: pick(row,["kode_akses","kode_akses_anak"]),
        errors
      };
    });
  }

  function render(preview, list) {
    const valid = list.filter(x => !x.errors.length);
    const invalid = list.filter(x => x.errors.length);
    preview.classList.remove("gtr-import-preview-empty");
    preview.innerHTML = `
      <div class="gtr-import-summary">
        <div class="gtr-import-stat"><strong>${list.length}</strong><span>Total baris</span></div>
        <div class="gtr-import-stat is-good"><strong>${valid.length}</strong><span>Siap diimport</span></div>
        <div class="gtr-import-stat ${invalid.length ? "is-bad" : ""}"><strong>${invalid.length}</strong><span>Perlu diperiksa</span></div>
      </div>
      <div class="gtr-import-preview-head"><div><strong>Preview Data Siswa</strong><small>Periksa data sebelum disimpan ke sistem.</small></div></div>
      <div class="gtr-import-table-wrap"><table class="gtr-import-table"><thead><tr>
        <th>#</th><th>Nama</th><th>NIS</th><th>Kelas</th><th>Tahun Ajaran</th><th>Jenis Kelamin</th><th>Nama Wali</th><th>HP Orang Tua</th><th>Tgl. Keluar</th><th>Status</th>
      </tr></thead><tbody>
        ${list.slice(0,100).map(x => `<tr class="${x.errors.length ? "is-invalid" : ""}">
          <td>${x.row}</td><td class="name-cell">${esc(x.nama || "—")}</td><td>${esc(x.nis || "—")}</td><td>${esc(x.kelas || "—")}</td>
          <td>${esc(x.tahun_ajaran || "—")}</td><td>${x.jenis_kelamin === "L" ? "Laki-laki" : x.jenis_kelamin === "P" ? "Perempuan" : "—"}</td>
          <td>${esc(x.nama_wali || "—")}</td><td>${esc(x.nomor_hp_ortu || "—")}</td><td>${esc(x.tanggal_keluar || "—")}</td>
          <td>${x.errors.length ? `<span class="gtr-import-badge bad" title="${esc(x.errors.join(", "))}">⚠ ${esc(x.errors[0])}</span>` : `<span class="gtr-import-badge good">✓ Siap</span>`}</td>
        </tr>`).join("")}
      </tbody></table></div>
      <div class="gtr-import-note">Data dengan tanda ⚠ tidak akan diimport. Data lama tidak diubah.</div>`;
    return {valid, invalid};
  }

  async function handleExcel(fileInput) {
    const file = fileInput.files?.[0];
    const modal = document.getElementById("gtrImportSiswaModal");
    if (!file || !modal || !window.XLSX) return;
    const preview = modal.querySelector("#gtrImportPreview");
    const button = modal.querySelector("#gtrImportRun");
    const ready = modal.querySelector("#gtrImportReadyText");
    const name = modal.querySelector("#gtrImportFileName");
    name.textContent = `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB`;
    preview.innerHTML = `<div class="gtr-import-loading">Membaca file Excel...</div>`;
    button.disabled = true;
    ready.textContent = "Membaca file Excel...";
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {type:"array", cellDates:true});
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error("Sheet Excel tidak ditemukan.");
      const matrix = XLSX.utils.sheet_to_json(firstSheet, {header:1, defval:"", raw:false});
      const rows = makeRows(matrix);
      const {data: existing, error} = await supabase.from("siswa").select("nis");
      if (error) throw error;
      const existingNis = new Set((existing || []).map(s => String(s.nis || "").trim().toLowerCase()).filter(Boolean));
      excelCandidates = candidatesFrom(rows, existingNis);
      const result = render(preview, excelCandidates);
      button.disabled = result.valid.length === 0;
      ready.textContent = result.valid.length
        ? `${result.valid.length} siswa siap diimport${result.invalid.length ? ` · ${result.invalid.length} perlu diperiksa` : ""}.`
        : "Belum ada data yang siap diimport.";
    } catch (error) {
      console.error("Preview Excel siswa:", error);
      excelCandidates = [];
      preview.innerHTML = `<div class="gtr-import-error">⚠ ${esc(error?.message || "File Excel tidak dapat dibaca.")}</div>`;
      ready.textContent = "File belum siap diimport.";
    }
  }

  async function importExcel() {
    if (importing) return;
    const valid = excelCandidates.filter(x => !x.errors.length);
    if (!excelMode || !valid.length) return;
    importing = true;
    const button = document.getElementById("gtrImportRun");
    if (button) { button.disabled = true; button.textContent = "Mengimport..."; }
    try {
      const rows = valid.map(x => ({
        nama:x.nama, nis:x.nis, kelas:x.kelas, tahun_ajaran:x.tahun_ajaran || null,
        tempat_lahir:x.tempat_lahir || null, tanggal_lahir:x.tanggal_lahir, jenis_kelamin:x.jenis_kelamin,
        nama_wali:x.nama_wali || null, nomor_hp_ortu:x.nomor_hp_ortu || null,
        mulai_bulan:x.mulai_bulan, mulai_tahun:x.mulai_tahun, tanggal_keluar:x.tanggal_keluar,
        alamat:x.alamat || null, kode_akses:x.kode_akses || (typeof generateKodeAkses === "function" ? generateKodeAkses() : null)
      }));
      const {error} = await supabase.from("siswa").insert(rows);
      if (error) throw error;
      if (typeof appNotify === "function") appNotify(`${rows.length} siswa berhasil diimport.`, "success");
      document.getElementById("gtrImportSiswaModal")?.remove();
      if (typeof loadSiswa === "function") await loadSiswa();
    } catch (error) {
      console.error("Import Excel siswa:", error);
      if (typeof appNotify === "function") appNotify(error?.message || "Import Excel siswa gagal.", "error");
      if (button) { button.disabled = false; button.textContent = "Import Siswa"; }
    } finally { importing = false; }
  }

  // Capture lebih dulu daripada parser CSV lama karena file ini dimuat sebelum parser-fix.
  document.addEventListener("change", event => {
    const input = event.target;
    if (!input || input.id !== "gtrImportSiswaFile") return;
    const file = input.files?.[0];
    if (!file || !/\.(xlsx|xls)$/i.test(file.name)) return;
    excelMode = true;
    event.preventDefault();
    event.stopImmediatePropagation();
    handleExcel(input);
  }, true);

  document.addEventListener("click", event => {
    const button = event.target?.closest?.("#gtrImportRun");
    if (!button || !excelMode) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    importExcel();
  }, true);
})();
