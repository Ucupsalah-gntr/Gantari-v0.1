// ============================================================
// GANTARIKU — DATA SISWA
// FULL REPLACEMENT
// ============================================================

// ============================================================
// AKUN ORANG TUA
// ============================================================

async function loadOrangTuaUntukForm(selectedId = "") {
  const select = document.getElementById("siswaOrangTuaId");
  if (!select || !supabase) return;

  select.innerHTML =
    `<option value="">Memuat akun orang tua...</option>`;

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
        .map(
          (o) =>
            `<option value="${escapeHtml(o.id)}" ${
              String(o.id) === String(selectedId)
                ? "selected"
                : ""
            }>${escapeHtml(
              o.nama || o.email || "Orang tua"
            )} — ${escapeHtml(o.email || "")}</option>`
        )
        .join("");
  } catch (error) {
    console.error("Error load akun orang tua:", error);
    select.innerHTML =
      `<option value="">Gagal memuat akun orang tua</option>`;
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

      <div
        id="formSiswaContainer"
        class="siswa-form-panel"
      >

        <h3 id="judulFormSiswa" class="siswa-form-title">
          Tambah Siswa Baru
        </h3>

        <form id="formSiswa">

          <input
            type="hidden"
            id="siswaId"
          >

          <div class="siswa-form-grid">

            <div class="form-group">
              <label>Nama Siswa</label>

              <input
                type="text"
                id="siswaNama"
                placeholder="Masukkan nama siswa"
                required
              >
            </div>

            <div class="form-group">
              <label>NIS</label>

              <input
                type="text"
                id="siswaNis"
                placeholder="Contoh: GTR-001-24"
                required
              >
            </div>

            <div class="form-group">
              <label>Kelas</label>

              <input
                type="text"
                id="siswaKelas"
                placeholder="Contoh: Kecil"
                required
              >
            </div>

            <div class="form-group">
              <label>Tahun Ajaran</label>

              <input
                type="text"
                id="siswaTahunAjaran"
                placeholder="Contoh: 2026/2027"
              >
            </div>

            <div class="form-group">
              <label>Tempat Lahir</label>

              <input
                type="text"
                id="siswaTempatLahir"
                placeholder="Contoh: Semarang"
              >
            </div>

            <div class="form-group">
              <label>Tanggal Lahir</label>

              <input
                type="date"
                id="siswaTanggalLahir"
              >
            </div>

            <div class="form-group">
              <label>Jenis Kelamin</label>

              <select id="siswaJenisKelamin">

                <option value="">
                  Pilih jenis kelamin
                </option>

                <option value="L">
                  Laki-laki
                </option>

                <option value="P">
                  Perempuan
                </option>

              </select>
            </div>

            <div class="form-group">
              <label>Nama Wali</label>

              <input
                type="text"
                id="siswaNamaWali"
                placeholder="Nama orang tua / wali"
              >
            </div>

            <div class="form-group">
              <label>Nomor HP Orang Tua</label>

              <input
                type="text"
                id="siswaNomorHpOrtu"
                placeholder="Contoh: 081234567890"
              >
            </div>

            <div class="form-group">
              <label>Akun Orang Tua</label>

              <select id="siswaOrangTuaId">
                <option value="">
                  Memuat akun orang tua...
                </option>
              </select>

              <small class="form-help">
                Hubungkan bila akun orang tua sudah dibuat.
              </small>
            </div>

            <div class="form-group">
              <label>Kode Akses Anak</label>

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
                >
                  Salin
                </button>
                <button
                  type="button"
                  class="btn ghost small"
                  id="btnBuatKodeForm"
                  onclick="window.__app.buatKodeAksesDariForm()"
                >
                  Buat
                </button>
              </div>

              <small class="form-help">
                Berikan kode ini kepada orang tua. Kode hanya untuk satu siswa.
              </small>
            </div>

            <div class="form-group">
              <label>Mulai Bergabung</label>

              <input
                type="month"
                id="siswaMulaiBergabung"
              >

              <small class="form-help">
                Contoh: Juli 2024
              </small>
            </div>

            <div class="form-group">
              <label>Alamat</label>

              <input
                type="text"
                id="siswaAlamat"
                placeholder="Masukkan alamat"
              >
            </div>

          </div>

          <div class="siswa-form-actions">

            <button
              type="submit"
              class="btn"
              id="btnSimpanSiswa"
            >
              Simpan Siswa
            </button>

            <button
              type="button"
              class="btn ghost"
              onclick="window.__app.tutupFormSiswa()"
            >
              Batal
            </button>

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
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody id="daftarSiswa">

              <tr>
                <td colspan="9" class="table-state">
                  Memuat data siswa...
                </td>
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
  const container =
    document.getElementById("formSiswaContainer");

  const judul =
    document.getElementById("judulFormSiswa");

  const form =
    document.getElementById("formSiswa");

  const hiddenId =
    document.getElementById("siswaId");

  const btn =
    document.getElementById("btnSimpanSiswa");

  if (!container) return;

  container.style.display = "block";

  if (judul) {
    judul.textContent = "Tambah Siswa Baru";
  }

  if (form) {
    form.reset();
  }

  if (hiddenId) {
    hiddenId.value = "";
  }

  setFormKodeAkses("");

  if (btn) {
    btn.textContent = "Simpan Siswa";
  }

  loadOrangTuaUntukForm("");

  container.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// ============================================================
// TUTUP FORM
// ============================================================

function tutupFormSiswa() {
  const container =
    document.getElementById("formSiswaContainer");

  const form =
    document.getElementById("formSiswa");

  const hiddenId =
    document.getElementById("siswaId");

  if (container) {
    container.style.display = "none";
  }

  if (form) {
    form.reset();
  }

  if (hiddenId) {
    hiddenId.value = "";
  }
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
    await navigator.clipboard.writeText(kode);
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
  if (regenerate && !confirm("Regenerasi kode akses? Kode lama tidak akan dapat digunakan lagi.")) {
    return;
  }

  const siswa = (semuaSiswa || []).find((item) => String(item.id) === String(id));
  if (!siswa) return;

  for (let attempt = 0; attempt < 4; attempt += 1) {
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
// EDIT
// ============================================================

async function editSiswa(id) {
  if (!supabase) {
    notifySiswa("Supabase belum terhubung.", "error");
    return;
  }

  const siswa =
    (semuaSiswa || []).find(
      (x) => String(x.id) === String(id)
    );

  if (!siswa) {
    notifySiswa("Data siswa tidak ditemukan.", "warning");
    return;
  }

  const container =
    document.getElementById("formSiswaContainer");

  const judul =
    document.getElementById("judulFormSiswa");

  const hiddenId =
    document.getElementById("siswaId");

  const btn =
    document.getElementById("btnSimpanSiswa");

  if (!container) return;

  container.style.display = "block";

  if (judul) {
    judul.textContent = "Edit Data Siswa";
  }

  if (hiddenId) {
    hiddenId.value = siswa.id;
  }

  setFormKodeAkses(siswa.kode_akses || "");

  setValue("siswaNama", siswa.nama);
  setValue("siswaNis", siswa.nis);
  setValue("siswaKelas", siswa.kelas);
  setValue("siswaTahunAjaran", siswa.tahun_ajaran);
  setValue("siswaTempatLahir", siswa.tempat_lahir);
  setValue("siswaTanggalLahir", siswa.tanggal_lahir);
  setValue("siswaJenisKelamin", siswa.jenis_kelamin);
  setValue("siswaNamaWali", siswa.nama_wali);
  setValue("siswaNomorHpOrtu", siswa.nomor_hp_ortu);
  setValue("siswaAlamat", siswa.alamat);

  if (
    siswa.mulai_bulan &&
    siswa.mulai_tahun
  ) {
    setValue(
      "siswaMulaiBergabung",
      `${siswa.mulai_tahun}-${String(
        siswa.mulai_bulan
      ).padStart(2, "0")}`
    );
  } else {
    setValue("siswaMulaiBergabung", "");
  }

  await loadOrangTuaUntukForm(
    siswa.orang_tua_id || ""
  );

  if (btn) {
    btn.textContent = "Simpan Perubahan";
  }

  container.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// ============================================================
// SIMPAN / UPDATE
// ============================================================

async function simpanSiswa(event) {
  event.preventDefault();

  if (!supabase) {
    notifySiswa("Supabase belum terhubung.", "error");
    return;
  }

  const btn =
    document.getElementById("btnSimpanSiswa");

  const id =
    document.getElementById("siswaId")
      ?.value || "";

  const nama =
    getValue("siswaNama");

  const nis =
    getValue("siswaNis");

  const kelas =
    getValue("siswaKelas");

  const tahunAjaran =
    getValue("siswaTahunAjaran");

  const tempatLahir =
    getValue("siswaTempatLahir");

  const tanggalLahir =
    getValue("siswaTanggalLahir");

  const jenisKelamin =
    getValue("siswaJenisKelamin");

  const namaWali =
    getValue("siswaNamaWali");

  const nomorHpOrtu =
    normalizePhone(
      getValue("siswaNomorHpOrtu")
    );

  const orangTuaId =
    document.getElementById(
      "siswaOrangTuaId"
    )?.value || null;

  const alamat =
    getValue("siswaAlamat");

  const mulai =
    parseMonthInput(
      getValue("siswaMulaiBergabung")
    );

  const tahunAjaranOtomatis =
    hitungTahunAjaranMulai(
      mulai.bulan,
      mulai.tahun
    );

  if (!nama || !nis || !kelas) {
    notifySiswa("Nama, NIS, dan Kelas wajib diisi.", "warning");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent =
      id
        ? "Menyimpan perubahan..."
        : "Menyimpan...";
  }

  try {
    const dataSiswa = {
      nama,
      nis,
      kelas,

      tahun_ajaran:
        tahunAjaran ||
        tahunAjaranOtomatis ||
        null,

      tempat_lahir:
        tempatLahir || null,

      tanggal_lahir:
        tanggalLahir || null,

      jenis_kelamin:
        jenisKelamin || null,

      nama_wali:
        namaWali || null,

      nomor_hp_ortu:
        nomorHpOrtu || null,

      orang_tua_id:
        orangTuaId || null,

      alamat:
        alamat || null,

      mulai_bulan:
        mulai.bulan,

      mulai_tahun:
        mulai.tahun,

      ...(id ? {} : { kode_akses: generateKodeAkses() }),
    };

    let result;

    if (id) {
      result =
        await supabase
          .from("siswa")
          .update(dataSiswa)
          .eq("id", id);
    } else {
      result =
        await supabase
          .from("siswa")
          .insert(dataSiswa);
    }

    if (result.error) {
      throw result.error;
    }

    notifySiswa(id ? "Data siswa berhasil diperbarui." : "Siswa berhasil ditambahkan.", "success");

    tutupFormSiswa();

    await loadSiswa();
  } catch (error) {
    console.error(
      "Error simpan siswa:",
      error
    );

    notifySiswa("Gagal menyimpan siswa: " + (error?.message || "Terjadi kesalahan."), "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent =
        "Simpan Siswa";
    }
  }
}

// ============================================================
// LOAD SISWA
// ============================================================

async function loadSiswa() {
  const tbody =
    document.getElementById(
      "daftarSiswa"
    );

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="9" class="table-state">
        Memuat data siswa...
      </td>
    </tr>
  `;

  try {
    if (!supabase) {
      throw new Error(
        "Supabase belum terhubung."
      );
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("siswa")
        .select(`
          id,
          nama,
          nis,
          kelas,
          tahun_ajaran,
          tempat_lahir,
          tanggal_lahir,
          jenis_kelamin,
          nama_wali,
          nomor_hp_ortu,
          orang_tua_id,
          alamat,
          mulai_bulan,
          mulai_tahun,
          kode_akses,
          orang_tua:orang_tua_id (
            id,
            nama,
            email
          )
        `)
        .order(
          "nama",
          {
            ascending: true,
          }
        );

    if (error) {
      throw error;
    }

    semuaSiswa =
      data || [];

    if (!semuaSiswa.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="table-state">
            Belum ada data siswa.
          </td>
        </tr>
      `;

      return;
    }

    renderDaftarSiswa(
      semuaSiswa
    );
  } catch (error) {
    console.error(
      "Error load siswa:",
      error
    );

    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="table-state table-state-error">
          Gagal memuat data siswa.
        </td>
      </tr>
    `;
  }
}

// ============================================================
// RENDER DAFTAR
// ============================================================

function renderDaftarSiswa(
  dataSiswa
) {
  const tbody =
    document.getElementById(
      "daftarSiswa"
    );

  if (!tbody) return;

  if (
    !dataSiswa ||
    !dataSiswa.length
  ) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="table-state">
          Data siswa tidak ditemukan.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    dataSiswa
      .map(
        (siswa) => {

          const orangTuaNama =
            siswa.orang_tua?.nama ||
            siswa.orang_tua?.email ||
            siswa.nama_wali ||
            "Belum ditautkan";
          const kodeAkses = siswa.kode_akses || "";

          return `
            <tr>

              <td>
                ${escapeHtml(
                  siswa.nama || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  siswa.nis || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  siswa.kelas || "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  siswa.tahun_ajaran ||
                    "-"
                )}
              </td>

              <td>
                ${escapeHtml(
                  orangTuaNama
                )}
              </td>

              <td>
                ${escapeHtml(
                  siswa.nomor_hp_ortu ||
                    "-"
                )}
              </td>

              <td>
                <div style="display:flex;flex-direction:column;gap:6px;min-width:145px;">
                  <code style="font-weight:700;letter-spacing:.06em;">
                    ${escapeHtml(kodeAkses || "Belum dibuat")}
                  </code>
                  <div style="display:flex;gap:5px;flex-wrap:wrap;">
                    ${kodeAkses
                      ? `
                        <button class="btn secondary small" type="button" onclick="window.__app.salinKodeAkses('${escapeJs(kodeAkses)}')">Salin</button>
                        <button class="btn ghost small" type="button" onclick="window.__app.buatAtauRegenerasiKodeAkses('${escapeJs(siswa.id)}', true)">Regenerasi</button>
                      `
                      : `
                        <button class="btn secondary small" type="button" onclick="window.__app.buatAtauRegenerasiKodeAkses('${escapeJs(siswa.id)}', false)">Buat Kode</button>
                      `}
                  </div>
                </div>
              </td>

              <td>
                ${escapeHtml(
                  formatBergabungSiswa(
                    siswa
                  )
                )}
              </td>

              <td>
                <div class="table-actions">
                  <button class="btn secondary small" type="button" onclick="window.__app.bukaFormSiswa('${escapeJs(siswa.id)}')">Edit</button>
                  <button class="btn danger small" type="button" onclick="window.__app.hapusSiswa('${escapeJs(siswa.id)}')">Hapus</button>
                </div>
              </td>
            </tr>
          `;
        }
      )
      .join("");
}

// ============================================================
// PREVIEW
// ============================================================

function renderImportPreview(
  fileName
) {
  const status =
    document.getElementById(
      "gtrImportStatus"
    );

  const preview =
    document.getElementById(
      "gtrImportPreview"
    );

  if (!status || !preview) {
    return;
  }

  status.innerHTML = `
    <div class="gtr-import-summary">

      <div class="gtr-import-stat">
        <strong>
          ${importRows.length}
        </strong>

        <span>
          Total baris
        </span>
      </div>

      <div class="gtr-import-stat good">
        <strong>
          ${importValidRows.length}
        </strong>

        <span>
          Siap diimport
        </span>
      </div>

      <div class="gtr-import-stat bad">
        <strong>
          ${importInvalidRows.length}
        </strong>

        <span>
          Perlu diperbaiki
        </span>
      </div>

    </div>

    <div class="gtr-import-file">
      📄 ${escapeHtml(
        fileName
      )}
    </div>
  `;

  const previewRows =
    importRows.slice(
      0,
      30
    );

  preview.innerHTML = `

    <div class="gtr-import-preview-title">

      <strong>
        Preview Data
      </strong>

      <span>
        ${
          importRows.length >
          30
            ? "Menampilkan 30 baris pertama"
            : "Semua baris"
        }
      </span>

    </div>

    <div class="gtr-import-table-wrap">

      <table class="gtr-import-table">

        <thead>
          <tr>
            <th>Baris</th>
            <th>Nama</th>
            <th>NIS</th>
            <th>Kelas</th>
            <th>Tahun Ajaran</th>
            <th>Bergabung</th>
            <th>Status</th>
            <th>Masalah</th>
          </tr>
        </thead>

        <tbody>

          ${previewRows
            .map(
              (row) => {

                const valid =
                  row.errors
                    .length ===
                  0;

                return `
                  <tr
                    class="${
                      valid
                        ? ""
                        : "is-invalid"
                    }"
                  >

                    <td>
                      ${row.rowNumber}
                    </td>

                    <td>
                      ${escapeHtml(
                        row.nama
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        row.nis
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        row.kelas
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        row.tahun_ajaran ||
                          "-"
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        formatBergabungSiswa(
                          row
                        )
                      )}
                    </td>

                    <td>
                      ${
                        valid
                          ? `
                            <span class="gtr-import-ok">
                              ✓ Valid
                            </span>
                          `
                          : `
                            <span class="gtr-import-invalid">
                              ! Perlu diperbaiki
                            </span>
                          `
                      }
                    </td>

                    <td>
                      ${
                        row.errors
                          .length
                          ? row.errors
                              .map(
                                (e) =>
                                  `<div>${escapeHtml(
                                    e
                                  )}</div>`
                              )
                              .join("")
                          : `
                            <span class="gtr-import-muted">
                              —
                            </span>
                          `
                      }
                    </td>

                  </tr>
                `;
              }
            )
            .join("")}

        </tbody>

      </table>

    </div>

    <div class="gtr-import-actions">

      <button
        type="button"
        class="btn ghost"
        id="gtrBtnBatalImport"
      >
        Batal
      </button>

      <button
        type="button"
        class="btn"
        id="gtrBtnImportSekarang"
        ${
          importValidRows.length
            ? ""
            : "disabled"
        }
      >
        Import ${
          importValidRows.length
        } Data
      </button>

    </div>
  `;

  document
    .getElementById(
      "gtrBtnBatalImport"
    )
    ?.addEventListener(
      "click",
      tutupImportSiswa
    );

  document
    .getElementById(
      "gtrBtnImportSekarang"
    )
    ?.addEventListener(
      "click",
      importSekarang
    );
}

// ============================================================
// IMPORT KE DATABASE
// ============================================================

async function importSekarang() {
  if (
    currentUserRole !==
    "admin"
  ) {
    notifySiswa("Hanya admin yang dapat melakukan import data siswa.", "warning");
    return;
  }

  if (!supabase) {
    notifySiswa("Supabase belum terhubung.", "error");
    return;
  }

  if (
    !importValidRows.length
  ) {
    notifySiswa("Tidak ada data valid untuk diimport.", "warning");
    return;
  }

  const btn =
    document.getElementById(
      "gtrBtnImportSekarang"
    );

  const total =
    importValidRows.length;

  if (btn) {
    btn.disabled = true;

    btn.textContent =
      `Mengimport 0/${total}...`;
  }

  try {
    let berhasil = 0;

    for (
      let i = 0;
      i < total;
      i +=
        IMPORT_CHUNK_SIZE
    ) {

      const chunk =
        importValidRows.slice(
          i,
          i +
            IMPORT_CHUNK_SIZE
        );

      const payload =
        chunk.map(
          (row) => ({

            nama:
              row.nama,

            nis:
              row.nis,

            tempat_lahir:
              row.tempat_lahir,

            tanggal_lahir:
              row.tanggal_lahir,

            alamat:
              row.alamat,

            nama_wali:
              row.nama_wali,

            nomor_hp_ortu:
              row.nomor_hp_ortu,

            kelas:
              row.kelas,

            tahun_ajaran:
              row.tahun_ajaran,

            jenis_kelamin:
              row.jenis_kelamin,

            mulai_bulan:
              row.mulai_bulan,

            mulai_tahun:
              row.mulai_tahun,

            orang_tua_id:
              null,

            kode_akses:
              generateKodeAkses(),

          })
        );

      const {
        error,
      } =
        await supabase
          .from("siswa")
          .insert(
            payload
          );

      if (error) {
        throw error;
      }

      berhasil +=
        chunk.length;

      if (btn) {
        btn.textContent =
          `Mengimport ${berhasil}/${total}...`;
      }
    }

    notifySiswa(`Berhasil mengimport ${berhasil} data siswa.`, "success");

    tutupImportSiswa();

    await loadSiswa();

  } catch (error) {

    console.error(
      "Gagal import siswa:",
      error
    );

    notifySiswa("Import berhenti: " + (error?.message || "Terjadi kesalahan."), "error");

    if (btn) {

      btn.disabled = false;

      btn.textContent =
        `Import ${total} Data`;

    }
  }
}

// ============================================================
// TUTUP IMPORT
// ============================================================

function tutupImportSiswa() {
  document
    .getElementById(
      "modalImportSiswa"
    )
    ?.remove();

  importRows = [];
  importValidRows = [];
  importInvalidRows = [];
}

// ============================================================
// HELPER
// ============================================================

function normalizePhone(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  let phone =
    String(value)
      .trim()
      .replace(
        /[^\d+]/g,
        ""
      );

  if (
    phone.startsWith(
      "+62"
    )
  ) {
    phone =
      "0" +
      phone.slice(3);

  } else if (
    phone.startsWith(
      "62"
    )
  ) {
    phone =
      "0" +
      phone.slice(2);
  }

  return phone;
}

function formatBergabungSiswa(
  siswa
) {
  const bulan =
    Number(
      siswa?.mulai_bulan ||
        0
    );

  const tahun =
    Number(
      siswa?.mulai_tahun ||
        0
    );

  if (
    !Number.isInteger(
      bulan
    ) ||
    bulan < 1 ||
    bulan > 12 ||
    !Number.isInteger(
      tahun
    ) ||
    tahun < 2000
  ) {
    return "-";
  }

  const names = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return `${
    names[
      bulan - 1
    ]
  } ${tahun}`;
}

function setValue(
  id,
  value
) {
  const el =
    document.getElementById(
      id
    );

  if (el) {
    el.value =
      value ?? "";
  }
}

function getValue(
  id
) {
  return (
    document.getElementById(
      id
    )?.value?.trim() ||
    ""
  );
}

function escapeHtml(
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

function escapeJs(
  value
) {
  return String(
    value ?? ""
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    )
    .replace(
      /\n/g,
      "\\n"
    )
    .replace(
      /\r/g,
      "\\r"
    );
}

// ============================================================
// DELETE SISWA
// ============================================================

async function hapusSiswa(id) {
  if (!id) return;
  if (!supabase) {
    notifySiswa("Supabase belum terhubung.", "error");
    return;
  }

  if (!confirm("Hapus data siswa ini? Tindakan ini tidak dapat dibatalkan.")) {
    return;
  }

  try {
    const { error } = await supabase
      .from("siswa")
      .delete()
      .eq("id", id);

    if (error) throw error;

    notifySiswa("Data siswa berhasil dihapus.", "success");
    await loadSiswa();
  } catch (error) {
    console.error("Gagal menghapus siswa:", error);
    notifySiswa(
      "Gagal menghapus siswa: " +
        (error?.message || "Terjadi kesalahan."),
      "error"
    );
  }
}

// ============================================================
// IMPORT SISWA
// ============================================================

function bukaImportSiswa() {
  notifySiswa(
    "Fitur import sedang dipulihkan. Silakan gunakan tambah siswa sementara waktu.",
    "info"
  );
}

// ============================================================
// GLOBAL
// ============================================================

window.bukaImportSiswa =
  bukaImportSiswa;

window.tutupImportSiswa =
  tutupImportSiswa;
