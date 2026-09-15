// ============================================================
// GANTARIKU — DATA SISWA
// FULL REPLACEMENT
// ============================================================

// Catatan:
// - Siswa TIDAK dihapus saat mengundurkan diri.
// - tanggal_keluar hanya menjadi penanda riwayat.
// - Data SPP, absensi, perkembangan, dan relasi orang tua tetap aman.

// ============================================================
// AKUN ORANG TUA
// ============================================================

async function loadOrangTuaUntukForm(selectedId = "") {
  const select = document.getElementById("siswaOrangTuaId");
  if (!select || !supabase) return;

  select.innerHTML = `<option value="">Memuat akun orang tua...</option>`;

  try {
    const { data, error } = await supabase
      .from("pengguna")
      .select("id, nama, email")
      .eq("role", "ortu")
      .order("nama", { ascending: true });

    if (error) throw error;

    semuaOrangTua = data || [];

    select.innerHTML =
      `<option value="">Tanpa akun orang tua</option>` +
      semuaOrangTua
        .map((o) => {
          const selected = String(o.id) === String(selectedId) ? " selected" : "";
          return `<option value="${escapeHtml(o.id)}"${selected}>${escapeHtml(o.nama || o.email || "Orang tua")} — ${escapeHtml(o.email || "")}</option>`;
        })
        .join("");
  } catch (error) {
    console.error("Error load akun orang tua:", error);
    select.innerHTML = `<option value="">Gagal memuat akun orang tua</option>`;
  }
}

// ============================================================
// UI FEEDBACK
// ============================================================

function notifySiswa(message, type = "info") {
  if (typeof appNotify === "function") {
    appNotify(message, type);
    return;
  }
  console[type === "error" ? "error" : "log"](message);
}

function escapeSiswa(value) {
  if (typeof escapeHtml === "function") return escapeHtml(value ?? "");
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTanggalKeluar(tanggal) {
  if (!tanggal) return "—";
  const parts = String(tanggal).split("-");
  if (parts.length !== 3) return escapeSiswa(tanggal);

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return escapeSiswa(tanggal);

  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return `${day} ${bulan[month - 1] || parts[1]} ${year}`;
}

function setSiswaValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

function getSiswaValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function normalizeTanggalInput(value) {
  if (!value) return null;
  const text = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

// ============================================================
// VIEW DATA SISWA
// ============================================================

function renderSiswa() {
  return `
    <div class="section">
      <div class="section-head">
        <div>
          <h2>Daftar Siswa</h2>
          <div class="section-hint">
            Kelola data siswa dan hubungkan dengan akun orang tua.
          </div>
        </div>

        <div class="controls">
          <input
            type="text"
            id="cariSiswa"
            placeholder="Cari nama, NIS, kelas..."
            autocomplete="off"
          >

          <button
            class="btn ghost"
            type="button"
            onclick="window.bukaImportSiswa()"
          >
            📊 Import Data
          </button>

          <button
            class="btn"
            type="button"
            onclick="window.__app.bukaFormSiswa()"
          >
            + Tambah Siswa
          </button>
        </div>
      </div>

      <div id="formSiswaContainer" class="siswa-form-panel" style="display:none">
        <h3 id="judulFormSiswa" class="siswa-form-title">Tambah Siswa Baru</h3>

        <form id="formSiswa" novalidate>
          <input type="hidden" id="siswaId">

          <div class="siswa-form-grid">
            <div class="form-group">
              <label for="siswaNama">Nama Siswa</label>
              <input type="text" id="siswaNama" placeholder="Masukkan nama siswa" required>
            </div>

            <div class="form-group">
              <label for="siswaNis">NIS</label>
              <input type="text" id="siswaNis" placeholder="Contoh: GTR-001-24" required>
            </div>

            <div class="form-group">
              <label for="siswaKelas">Kelas</label>
              <input type="text" id="siswaKelas" placeholder="Contoh: Kecil" required>
            </div>

            <div class="form-group">
              <label for="siswaTahunAjaran">Tahun Ajaran</label>
              <input type="text" id="siswaTahunAjaran" placeholder="Contoh: 2026/2027">
            </div>

            <div class="form-group">
              <label for="siswaTempatLahir">Tempat Lahir</label>
              <input type="text" id="siswaTempatLahir" placeholder="Contoh: Semarang">
            </div>

            <div class="form-group">
              <label for="siswaTanggalLahir">Tanggal Lahir</label>
              <input type="date" id="siswaTanggalLahir">
            </div>

            <div class="form-group">
              <label for="siswaJenisKelamin">Jenis Kelamin</label>
              <select id="siswaJenisKelamin">
                <option value="">Pilih jenis kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div class="form-group">
              <label for="siswaNamaWali">Nama Wali</label>
              <input type="text" id="siswaNamaWali" placeholder="Nama orang tua / wali">
            </div>

            <div class="form-group">
              <label for="siswaNomorHpOrtu">Nomor HP Orang Tua</label>
              <input type="text" id="siswaNomorHpOrtu" placeholder="Contoh: 081234567890">
            </div>

            <div class="form-group">
              <label for="siswaOrangTuaId">Akun Orang Tua</label>
              <select id="siswaOrangTuaId">
                <option value="">Memuat akun orang tua...</option>
              </select>
              <small class="form-help">Hubungkan bila akun orang tua sudah dibuat.</small>
            </div>

            <div class="form-group">
              <label for="siswaKodeAkses">Kode Akses Anak</label>
              <div class="access-code-row">
                <input
                  type="text"
                  id="siswaKodeAkses"
                  readonly
                  placeholder="Dibuat setelah siswa disimpan"
                  class="access-code-input"
                >
                <button
                  type="button"
                  class="btn secondary small"
                  id="btnSalinKodeForm"
                  onclick="window.__app.salinKodeAksesDariForm()"
                  disabled
                >Salin</button>
                <button
                  type="button"
                  class="btn ghost small"
                  id="btnBuatKodeForm"
                  onclick="window.__app.buatKodeAksesDariForm()"
                >Buat</button>
              </div>
              <small class="form-help">Berikan kode ini kepada orang tua. Kode hanya untuk satu siswa.</small>
            </div>

            <div class="form-group">
              <label for="siswaMulaiBergabung">Mulai Bergabung</label>
              <input type="month" id="siswaMulaiBergabung">
              <small class="form-help">Contoh: Juli 2024</small>
            </div>

            <div class="form-group">
              <label for="siswaTanggalKeluar">Tanggal Keluar</label>
              <input type="date" id="siswaTanggalKeluar">
              <small class="form-help">Isi bila siswa mengundurkan diri. Kosongkan untuk siswa yang masih aktif.</small>
            </div>

            <div class="form-group">
              <label for="siswaAlamat">Alamat</label>
              <input type="text" id="siswaAlamat" placeholder="Masukkan alamat">
            </div>
          </div>

          <div class="siswa-form-actions">
            <button type="submit" class="btn" id="btnSimpanSiswa">Simpan Siswa</button>
            <button type="button" class="btn ghost" onclick="window.__app.tutupFormSiswa()">Batal</button>
          </div>
        </form>
      </div>

      <div class="section-body">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>NIS</th>
                <th>Kelas</th>
                <th>Tahun Ajaran</th>
                <th>Orang Tua</th>
                <th>Nomor HP</th>
                <th>Kode Akses</th>
                <th>Bergabung</th>
                <th>Tanggal Keluar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="daftarSiswa">
              <tr>
                <td colspan="10" class="table-state">Memuat data siswa...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// FORM TAMBAH
// ============================================================

function bukaFormSiswa() {
  const container = document.getElementById("formSiswaContainer");
  const judul = document.getElementById("judulFormSiswa");
  const form = document.getElementById("formSiswa");
  const hiddenId = document.getElementById("siswaId");
  const btn = document.getElementById("btnSimpanSiswa");

  if (!container) return;

  container.style.display = "block";
  if (judul) judul.textContent = "Tambah Siswa Baru";
  if (form) form.reset();
  if (hiddenId) hiddenId.value = "";
  setFormKodeAkses("");
  if (btn) btn.textContent = "Simpan Siswa";

  loadOrangTuaUntukForm("");

  container.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================================
// TUTUP FORM
// ============================================================

function tutupFormSiswa() {
  const container = document.getElementById("formSiswaContainer");
  const form = document.getElementById("formSiswa");
  const hiddenId = document.getElementById("siswaId");

  if (container) container.style.display = "none";
  if (form) form.reset();
  if (hiddenId) hiddenId.value = "";
  setFormKodeAkses("");
}

// ============================================================
// KODE AKSES ORANG TUA
// ============================================================

function generateKodeAkses() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return `GTR-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

function setFormKodeAkses(kode) {
  const input = document.getElementById("siswaKodeAkses");
  const button = document.getElementById("btnSalinKodeForm");
  if (input) input.value = kode || "";
  if (button) button.disabled = !kode;
}

async function salinKodeAkses(kode) {
  if (!kode) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(kode);
    } else {
      throw new Error("Clipboard API tidak tersedia");
    }
  } catch (error) {
    const helper = document.createElement("textarea");
    helper.value = kode;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  notifySiswa(`Kode akses ${kode} berhasil disalin.`, "success");
}

function salinKodeAksesDariForm() {
  salinKodeAkses(document.getElementById("siswaKodeAkses")?.value);
}

function buatKodeAksesDariForm() {
  const id = document.getElementById("siswaId")?.value;

  if (!id) {
    notifySiswa("Simpan data siswa terlebih dahulu, lalu buat kode akses.", "warning");
    return;
  }

  const kodeLama = document.getElementById("siswaKodeAkses")?.value;
  buatAtauRegenerasiKodeAkses(id, Boolean(kodeLama)).catch((error) => {
    console.error("Error kode akses:", error);
    notifySiswa(error.message || "Gagal membuat kode akses.", "error");
  });
}

async function buatAtauRegenerasiKodeAkses(id, regenerate = false) {
  if (!supabase || !id) return;

  if (
    regenerate &&
    !confirm("Regenerasi kode akses? Kode lama tidak akan dapat digunakan lagi.")
  ) {
    return;
  }

  const siswa = (semuaSiswa || []).find((item) => String(item.id) === String(id));
  if (!siswa) {
    throw new Error("Data siswa tidak ditemukan.");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const kode = generateKodeAkses();

    const { error } = await supabase
      .from("siswa")
      .update({ kode_akses: kode })
      .eq("id", id);

    if (!error) {
      siswa.kode_akses = kode;
      setFormKodeAkses(kode);
      renderDaftarSiswa(semuaSiswa);
      notifySiswa(`Kode akses untuk ${siswa.nama || "siswa"}: ${kode}`, "success");
      return kode;
    }

    if (error.code !== "23505") throw error;
  }

  throw new Error("Gagal membuat kode unik. Silakan coba lagi.");
}

// ============================================================
// LOAD DATA SISWA
// ============================================================

async function loadSiswa() {
  const tbody = document.getElementById("daftarSiswa");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10" class="table-state">Memuat data siswa...</td></tr>`;

  if (!supabase) {
    tbody.innerHTML = `<tr><td colspan="10" class="table-state">Supabase belum terhubung.</td></tr>`;
    return;
  }

  try {
    const { data, error } = await supabase
      .from("siswa")
      .select("id, nama, nis, kelas, tahun_ajaran, orang_tua_id, tanggal_lahir, jenis_kelamin, alamat, nomor_hp_ortu, tempat_lahir, nama_wali, mulai_bulan, mulai_tahun, kode_akses, tanggal_keluar")
      .order("nama", { ascending: true });

    if (error) throw error;

    semuaSiswa = data || [];
    renderDaftarSiswa(semuaSiswa);
  } catch (error) {
    console.error("Error load siswa:", error);
    tbody.innerHTML = `<tr><td colspan="10" class="table-state">Gagal memuat data siswa.</td></tr>`;
    notifySiswa(error.message || "Gagal memuat data siswa.", "error");
  }
}

// ============================================================
// RENDER TABEL SISWA
// ============================================================

function renderDaftarSiswa(data = []) {
  const tbody = document.getElementById("daftarSiswa");
  if (!tbody) return;

  const rows = Array.isArray(data) ? data : [];

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="table-state">Belum ada data siswa.</td>
      </tr>
    `;
    return;
  }

  const orangTuaMap = new Map(
    (semuaOrangTua || []).map((item) => [String(item.id), item])
  );

  tbody.innerHTML = rows
    .map((siswa) => {
      const ortu = orangTuaMap.get(String(siswa.orang_tua_id));
      const namaOrtu = ortu?.nama || ortu?.email || siswa.nama_wali || "—";
      const nomorHp = siswa.nomor_hp_ortu || "—";
      const kode = siswa.kode_akses || "—";
      const bergabung = siswa.mulai_bulan && siswa.mulai_tahun
        ? `${String(siswa.mulai_bulan).padStart(2, "0")}/${siswa.mulai_tahun}`
        : "—";
      const keluar = siswa.tanggal_keluar
        ? formatTanggalKeluar(siswa.tanggal_keluar)
        : "—";
      const statusKeluar = siswa.tanggal_keluar
        ? `<span class="status-badge status-danger">Keluar</span>`
        : `<span class="status-badge status-success">Aktif</span>`;

      return `
        <tr>
          <td>
            <strong>${escapeSiswa(siswa.nama || "Tanpa nama")}</strong>
            <div class="table-subtext">${statusKeluar}</div>
          </td>
          <td>${escapeSiswa(siswa.nis || "—")}</td>
          <td>${escapeSiswa(siswa.kelas || "—")}</td>
          <td>${escapeSiswa(siswa.tahun_ajaran || "—")}</td>
          <td>${escapeSiswa(namaOrtu)}</td>
          <td>${escapeSiswa(nomorHp)}</td>
          <td>
            ${siswa.kode_akses
              ? `<button type="button" class="btn ghost small" onclick="window.__app.salinKodeAkses('${escapeSiswa(siswa.kode_akses)}')">${escapeSiswa(siswa.kode_akses)}</button>`
              : "—"}
          </td>
          <td>${escapeSiswa(bergabung)}</td>
          <td>${keluar}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn ghost small" onclick="window.__app.editSiswa('${escapeSiswa(siswa.id)}')">Edit</button>
              <button type="button" class="btn danger small" onclick="window.__app.hapusSiswa('${escapeSiswa(siswa.id)}')">Hapus</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ============================================================
// SEARCH
// ============================================================

function cariSiswa() {
  const keyword = (document.getElementById("cariSiswa")?.value || "")
    .trim()
    .toLowerCase();

  if (!keyword) {
    renderDaftarSiswa(semuaSiswa || []);
    return;
  }

  const hasil = (semuaSiswa || []).filter((siswa) => {
    const ortu = (semuaOrangTua || []).find(
      (item) => String(item.id) === String(siswa.orang_tua_id)
    );

    const text = [
      siswa.nama,
      siswa.nis,
      siswa.kelas,
      siswa.tahun_ajaran,
      siswa.nama_wali,
      siswa.nomor_hp_ortu,
      ortu?.nama,
      ortu?.email,
      siswa.tanggal_keluar,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(keyword);
  });

  renderDaftarSiswa(hasil);
}

// ============================================================
// SIMPAN SISWA
// ============================================================

async function simpanSiswa(event) {
  event?.preventDefault();

  if (!supabase) {
    notifySiswa("Supabase belum terhubung.", "error");
    return;
  }

  const id = getSiswaValue("siswaId");
  const nama = getSiswaValue("siswaNama");
  const nis = getSiswaValue("siswaNis");
  const kelas = getSiswaValue("siswaKelas");

  if (!nama || !nis || !kelas) {
    notifySiswa("Nama, NIS, dan kelas wajib diisi.", "warning");
    return;
  }

  const mulaiBergabung = getSiswaValue("siswaMulaiBergabung");
  let mulaiBulan = null;
  let mulaiTahun = null;

  if (mulaiBergabung) {
    const match = /^(\d{4})-(\d{2})$/.exec(mulaiBergabung);
    if (!match) {
      notifySiswa("Format mulai bergabung tidak valid.", "warning");
      return;
    }
    mulaiTahun = Number(match[1]);
    mulaiBulan = Number(match[2]);
  }

  const payload = {
    nama,
    nis,
    kelas,
    tahun_ajaran: getSiswaValue("siswaTahunAjaran") || null,
    tempat_lahir: getSiswaValue("siswaTempatLahir") || null,
    tanggal_lahir: normalizeTanggalInput(getSiswaValue("siswaTanggalLahir")),
    jenis_kelamin: getSiswaValue("siswaJenisKelamin") || null,
    nama_wali: getSiswaValue("siswaNamaWali") || null,
    nomor_hp_ortu: getSiswaValue("siswaNomorHpOrtu") || null,
    orang_tua_id: getSiswaValue("siswaOrangTuaId") || null,
    alamat: getSiswaValue("siswaAlamat") || null,
    mulai_bulan: mulaiBulan,
    mulai_tahun: mulaiTahun,
    tanggal_keluar: normalizeTanggalInput(getSiswaValue("siswaTanggalKeluar")),
  };

  const btn = document.getElementById("btnSimpanSiswa");
  if (btn && typeof setButtonBusy === "function") {
    setButtonBusy(btn, true, id ? "Menyimpan..." : "Menambahkan...");
  } else if (btn) {
    btn.disabled = true;
  }

  try {
    let result;

    if (id) {
      result = await supabase
        .from("siswa")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single();
    } else {
      result = await supabase
        .from("siswa")
        .insert(payload)
        .select("id")
        .single();
    }

    if (result.error) {
      if (result.error.code === "23505") {
        throw new Error("NIS tersebut sudah digunakan siswa lain.");
      }
      throw result.error;
    }

    notifySiswa(
      id ? "Data siswa berhasil diperbarui." : "Siswa berhasil ditambahkan.",
      "success"
    );

    tutupFormSiswa();
    await loadOrangTuaUntukForm("");
    await loadSiswa();
  } catch (error) {
    console.error("Error simpan siswa:", error);
    notifySiswa(error.message || "Gagal menyimpan data siswa.", "error");
  } finally {
    if (btn && typeof setButtonBusy === "function") {
      setButtonBusy(btn, false);
    } else if (btn) {
      btn.disabled = false;
    }
  }
}

// ============================================================
// EDIT SISWA
// ============================================================

async function editSiswa(id) {
  if (!supabase) {
    notifySiswa("Supabase belum terhubung.", "error");
    return;
  }

  const siswa = (semuaSiswa || []).find(
    (item) => String(item.id) === String(id)
  );

  if (!siswa) {
    notifySiswa("Data siswa tidak ditemukan.", "warning");
    return;
  }

  const container = document.getElementById("formSiswaContainer");
  const judul = document.getElementById("judulFormSiswa");
  const hiddenId = document.getElementById("siswaId");
  const btn = document.getElementById("btnSimpanSiswa");

  if (!container) return;

  container.style.display = "block";
  if (judul) judul.textContent = "Edit Data Siswa";
  if (hiddenId) hiddenId.value = siswa.id;
  if (btn) btn.textContent = "Simpan Perubahan";

  setSiswaValue("siswaNama", siswa.nama);
  setSiswaValue("siswaNis", siswa.nis);
  setSiswaValue("siswaKelas", siswa.kelas);
  setSiswaValue("siswaTahunAjaran", siswa.tahun_ajaran);
  setSiswaValue("siswaTempatLahir", siswa.tempat_lahir);
  setSiswaValue("siswaTanggalLahir", siswa.tanggal_lahir);
  setSiswaValue("siswaJenisKelamin", siswa.jenis_kelamin);
  setSiswaValue("siswaNamaWali", siswa.nama_wali);
  setSiswaValue("siswaNomorHpOrtu", siswa.nomor_hp_ortu);
  setSiswaValue("siswaAlamat", siswa.alamat);
  setSiswaValue("siswaTanggalKeluar", siswa.tanggal_keluar);

  if (siswa.mulai_tahun && siswa.mulai_bulan) {
    setSiswaValue(
      "siswaMulaiBergabung",
      `${siswa.mulai_tahun}-${String(siswa.mulai_bulan).padStart(2, "0")}`
    );
  } else {
    setSiswaValue("siswaMulaiBergabung", "");
  }

  setFormKodeAkses(siswa.kode_akses || "");
  await loadOrangTuaUntukForm(siswa.orang_tua_id || "");

  container.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================================
// HAPUS SISWA
// ============================================================

async function hapusSiswa(id) {
  if (!supabase || !id) return;

  const siswa = (semuaSiswa || []).find(
    (item) => String(item.id) === String(id)
  );

  if (!siswa) {
    notifySiswa("Data siswa tidak ditemukan.", "warning");
    return;
  }

  const yakin = confirm(
    `Hapus data siswa ${siswa.nama || "ini"}?\n\nPerhatian: penghapusan dapat berdampak pada data SPP, absensi, dan perkembangan yang terhubung.`
  );

  if (!yakin) return;

  try {
    const { error } = await supabase
      .from("siswa")
      .delete()
      .eq("id", id);

    if (error) throw error;

    notifySiswa("Data siswa berhasil dihapus.", "success");
    await loadSiswa();
  } catch (error) {
    console.error("Error hapus siswa:", error);

    if (error.code === "23503") {
      notifySiswa(
        "Siswa tidak dapat dihapus karena masih memiliki riwayat SPP, absensi, atau perkembangan. Gunakan Tanggal Keluar untuk menandai siswa yang mengundurkan diri.",
        "warning"
      );
      return;
    }

    notifySiswa(error.message || "Gagal menghapus data siswa.", "error");
  }
}

// ============================================================
// IMPORT DATA
// ============================================================

function bukaImportSiswa() {
  notifySiswa(
    "Fitur import sedang dipulihkan. Untuk sementara gunakan Tambah Siswa.",
    "info"
  );
}

// ============================================================
// COMPATIBILITY / GLOBAL
// ============================================================

window.bukaImportSiswa = bukaImportSiswa;

// Pastikan fungsi tetap tersedia untuk inline handler lama.
window.loadSiswa = loadSiswa;
window.renderDaftarSiswa = renderDaftarSiswa;
window.cariSiswa = cariSiswa;
window.simpanSiswa = simpanSiswa;
window.editSiswa = editSiswa;
window.hapusSiswa = hapusSiswa;
window.bukaFormSiswa = bukaFormSiswa;
window.tutupFormSiswa = tutupFormSiswa;
window.salinKodeAkses = salinKodeAkses;
window.salinKodeAksesDariForm = salinKodeAksesDariForm;
window.buatKodeAksesDariForm = buatKodeAksesDariForm;
window.buatAtauRegenerasiKodeAkses = buatAtauRegenerasiKodeAkses;
