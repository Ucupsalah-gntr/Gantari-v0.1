// ============================================================
// GANTARIKU — SISWA FIX
// 1. Admin selalu membaca seluruh data siswa.
// 2. Import CSV/TSV kembali berfungsi.
// 3. Tidak menghapus atau mengubah data siswa lama.
// ============================================================

(function () {
  const originalLoadSiswa = typeof loadSiswa === "function" ? loadSiswa : null;

  async function loadSiswaAdminFix() {
    if (!supabase) return;

    const tbody = document.getElementById("daftarSiswa");
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="10" class="table-state">Memuat data siswa...</td></tr>';
    }

    try {
      const { data, error } = await withRequestTimeout(
        supabase
          .from("siswa")
          .select("*")
          .order("nama", { ascending: true }),
        "data siswa admin"
      );

      if (error) throw error;

      semuaSiswa = Array.isArray(data) ? data : [];
      AppState.siswa = semuaSiswa;

      // Ambil nama akun orang tua secara terpisah supaya query siswa
      // tetap sederhana dan tidak bergantung pada nested relation.
      const parentIds = [...new Set(
        semuaSiswa.map((s) => s.orang_tua_id).filter(Boolean)
      )];

      if (parentIds.length) {
        const { data: parents, error: parentError } = await supabase
          .from("pengguna")
          .select("id,nama,email,nomor_hp")
          .in("id", parentIds);

        if (!parentError) {
          const parentMap = new Map((parents || []).map((p) => [String(p.id), p]));
          semuaSiswa = semuaSiswa.map((s) => ({
            ...s,
            orang_tua: s.orang_tua_id
              ? parentMap.get(String(s.orang_tua_id)) || null
              : null
          }));
          AppState.siswa = semuaSiswa;
        }
      }

      if (typeof renderDaftarSiswa === "function") {
        renderDaftarSiswa(semuaSiswa);
      }
    } catch (error) {
      console.error("Error load data siswa admin:", error);
      semuaSiswa = [];
      AppState.siswa = [];
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="10" class="table-state error">Gagal memuat data siswa. ${escapeHtml(error?.message || "Silakan coba lagi.")}</td></tr>`;
      }
      notifySiswa("Data siswa gagal dimuat. Silakan coba lagi.", "error");
    }
  }

  window.loadSiswa = async function () {
    if (currentUserRole === "admin") {
      return loadSiswaAdminFix();
    }
    if (originalLoadSiswa) return originalLoadSiswa();
  };

  function normalizeHeader(value) {
    return String(value || "")
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/[\s\-\/]+/g, "_");
  }

  function parseDelimited(text) {
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
      } else if (!quoted && (ch === "," || ch === "\t")) {
        row.push(cell.trim());
        cell = "";
      } else if (!quoted && (ch === "\n" || ch === "\r")) {
        if (ch === "\r" && next === "\n") i += 1;
        row.push(cell.trim());
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }

    row.push(cell.trim());
    if (row.some((value) => value !== "")) rows.push(row);
    return rows;
  }

  function rowsToObjects(text) {
    const rows = parseDelimited(text);
    if (rows.length < 2) throw new Error("File harus memiliki baris judul dan minimal satu data siswa.");

    const headers = rows[0].map(normalizeHeader);
    return rows.slice(1).map((values) => {
      const obj = {};
      headers.forEach((header, index) => {
        if (header) obj[header] = String(values[index] || "").trim();
      });
      return obj;
    }).filter((row) => Object.values(row).some(Boolean));
  }

  function pick(row, keys) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== "") return row[key];
    }
    return "";
  }

  function normalizeGender(value) {
    const v = String(value || "").trim().toLowerCase();
    if (["l", "lk", "laki-laki", "laki laki", "male"].includes(v)) return "L";
    if (["p", "pr", "perempuan", "female"].includes(v)) return "P";
    return null;
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
    return m ? `${m[2]}-${m[1].padStart(2, "0")}` : "";
  }

  function closeImportModal() {
    document.getElementById("gtrImportSiswaModal")?.remove();
  }

  function bukaImportSiswa() {
    if (currentUserRole !== "admin") {
      notifySiswa("Import data siswa hanya tersedia untuk admin.", "warning");
      return;
    }

    closeImportModal();
    const modal = document.createElement("div");
    modal.id = "gtrImportSiswaModal";
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;">
        <div style="width:min(720px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:20px;padding:24px;box-shadow:0 25px 70px rgba(0,0,0,.25);">
          <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
            <div>
              <h3 style="margin:0 0 6px;">📊 Import Data Siswa</h3>
              <div style="color:#76695f;font-size:13px;line-height:1.5;">Import dari CSV atau TSV. File Excel (.xlsx) simpan dulu sebagai CSV.</div>
            </div>
            <button type="button" id="gtrImportClose" class="btn ghost">Tutup</button>
          </div>

          <div style="margin-top:18px;padding:14px;border-radius:14px;background:#faf6ef;font-size:13px;line-height:1.6;">
            <strong>Kolom minimal:</strong> Nama, NIS, Kelas.<br>
            Kolom tambahan yang dikenali: Tahun Ajaran, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Nama Wali, Nomor HP Orang Tua, Mulai Bergabung, Tanggal Keluar, Alamat, Kode Akses.
          </div>

          <div style="margin-top:18px;">
            <input type="file" id="gtrImportSiswaFile" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values">
          </div>

          <div id="gtrImportPreview" style="margin-top:16px;"></div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
            <button type="button" id="gtrImportRun" class="btn" disabled>Import Siswa</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const fileInput = document.getElementById("gtrImportSiswaFile");
    const preview = document.getElementById("gtrImportPreview");
    const runButton = document.getElementById("gtrImportRun");
    let parsedRows = [];

    document.getElementById("gtrImportClose")?.addEventListener("click", closeImportModal);
    modal.querySelector("[style*='position:fixed']")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeImportModal();
    });

    fileInput?.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      parsedRows = [];
      runButton.disabled = true;
      preview.innerHTML = "";
      if (!file) return;

      try {
        const text = await file.text();
        parsedRows = rowsToObjects(text);
        const valid = parsedRows.filter((r) =>
          pick(r, ["nama", "nama_siswa", "nama_anak"]) &&
          pick(r, ["nis", "nomor_induk", "nomor_induk_siswa"]) &&
          pick(r, ["kelas"])
        );
        const invalid = parsedRows.length - valid.length;
        preview.innerHTML = `<div style="padding:12px;border-radius:12px;background:#f3f8f0;font-size:13px;">Ditemukan <strong>${parsedRows.length}</strong> baris. Siap diimport: <strong>${valid.length}</strong>. ${invalid ? `<span style="color:#a54b3e;">${invalid} baris dilewati karena Nama/NIS/Kelas kosong.</span>` : ""}</div>`;
        runButton.disabled = valid.length === 0;
      } catch (error) {
        preview.innerHTML = `<div style="padding:12px;border-radius:12px;background:#fff0ed;color:#9d473b;font-size:13px;">${escapeHtml(error.message || "File tidak dapat dibaca.")}</div>`;
      }
    });

    runButton.addEventListener("click", async () => {
      if (!parsedRows.length || !supabase) return;
      runButton.disabled = true;
      runButton.textContent = "Mengimport...";

      try {
        const { data: existing, error: existingError } = await supabase.from("siswa").select("nis");
        if (existingError) throw existingError;
        const existingNis = new Set((existing || []).map((s) => String(s.nis || "").trim().toLowerCase()).filter(Boolean));

        const payload = [];
        const skipped = [];

        for (const row of parsedRows) {
          const nama = pick(row, ["nama", "nama_siswa", "nama_anak"]);
          const nis = pick(row, ["nis", "nomor_induk", "nomor_induk_siswa"]);
          const kelas = pick(row, ["kelas"]);
          if (!nama || !nis || !kelas) continue;

          const nisKey = nis.toLowerCase();
          if (existingNis.has(nisKey) || payload.some((item) => String(item.nis).toLowerCase() === nisKey)) {
            skipped.push(`${nama} (${nis})`);
            continue;
          }

          payload.push({
            nama,
            nis,
            kelas,
            tahun_ajaran: pick(row, ["tahun_ajaran", "tahunajaran"]) || null,
            tempat_lahir: pick(row, ["tempat_lahir", "tempatlahir"]) || null,
            tanggal_lahir: normalizeDate(pick(row, ["tanggal_lahir", "tanggallahir"])),
            jenis_kelamin: normalizeGender(pick(row, ["jenis_kelamin", "jeniskelamin", "gender"])),
            nama_wali: pick(row, ["nama_wali", "wali", "nama_orang_tua"]) || null,
            nomor_hp_ortu: pick(row, ["nomor_hp_ortu", "no_hp_ortu", "nomor_hp", "no_hp"]) || null,
            mulai_bulan: (() => {
              const month = normalizeMonth(pick(row, ["mulai_bergabung", "mulai_bulan"]));
              return month ? Number(month.slice(5, 7)) : null;
            })(),
            mulai_tahun: (() => {
              const month = normalizeMonth(pick(row, ["mulai_bergabung", "mulai_bulan"]));
              return month ? Number(month.slice(0, 4)) : null;
            })(),
            tanggal_keluar: normalizeDate(pick(row, ["tanggal_keluar", "tanggal_keluar_siswa"])),
            alamat: pick(row, ["alamat"]) || null,
            kode_akses: pick(row, ["kode_akses", "kode_akses_anak"]) || generateKodeAkses()
          });
        }

        if (!payload.length) {
          throw new Error("Tidak ada siswa baru yang dapat diimport. NIS mungkin sudah terdaftar semua.");
        }

        const { error } = await supabase.from("siswa").insert(payload);
        if (error) throw error;

        await loadSiswaAdminFix();
        closeImportModal();
        notifySiswa(`${payload.length} siswa berhasil diimport.${skipped.length ? ` ${skipped.length} data dilewati karena NIS sudah ada.` : ""}`, "success");
      } catch (error) {
        console.error("Error import siswa:", error);
        runButton.disabled = false;
        runButton.textContent = "Import Siswa";
        notifySiswa(error.message || "Import siswa gagal.", "error");
      }
    });
  }

  window.bukaImportSiswa = bukaImportSiswa;
})();
