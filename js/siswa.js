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
        style="
          display:none;
          padding:20px;
          border-bottom:1px solid var(--line);
        "
      >

        <h3 id="judulFormSiswa" style="margin-top:0;">
          Tambah Siswa Baru
        </h3>

        <form id="formSiswa">

          <input
            type="hidden"
            id="siswaId"
          >

          <div
            style="
              display:grid;
              grid-template-columns:repeat(
                auto-fit,
                minmax(220px,1fr)
              );
              gap:15px;
            "
          >

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

              <small style="color:var(--ink-soft);">
                Hubungkan bila akun orang tua sudah dibuat.
              </small>
            </div>

            <div class="form-group">
              <label>Kode Akses Anak</label>

              <div style="display:flex;gap:8px;align-items:center;">
                <input
                  type="text"
                  id="siswaKodeAkses"
                  readonly
                  placeholder="Dibuat setelah siswa disimpan"
                  style="flex:1;text-transform:uppercase;letter-spacing:.08em;font-weight:700;"
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

              <small style="color:var(--ink-soft);">
                Berikan kode ini kepada orang tua. Kode hanya untuk satu siswa.
              </small>
            </div>

            <div class="form-group">
              <label>Mulai Bergabung</label>

              <input
                type="month"
                id="siswaMulaiBergabung"
              >

              <small style="color:var(--ink-soft);">
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

          <div
            style="
              display:flex;
              gap:10px;
              margin-top:20px;
              flex-wrap:wrap;
            "
          >

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

        <div style="overflow-x:auto;">

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
                <td colspan="9" style="text-align:center;">
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
  alert(`Kode akses ${kode} berhasil disalin.`);
}

function salinKodeAksesDariForm() {
  salinKodeAkses(document.getElementById("siswaKodeAkses")?.value);
}

function buatKodeAksesDariForm() {
  const id = document.getElementById("siswaId")?.value;
  if (!id) {
    alert("Simpan data siswa terlebih dahulu, lalu buat kode akses.");
    return;
  }
  const kodeLama = document.getElementById("siswaKodeAkses")?.value;
  buatAtauRegenerasiKodeAkses(id, Boolean(kodeLama)).catch((error) => {
    console.error("Error kode akses:", error);
    alert(error.message || "Gagal membuat kode akses.");
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
      alert(`Kode akses untuk ${siswa.nama || "siswa"}: ${kode}`);
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
    alert("Supabase belum terhubung.");
    return;
  }

  const siswa =
    (semuaSiswa || []).find(
      (x) => String(x.id) === String(id)
    );

  if (!siswa) {
    alert("Data siswa tidak ditemukan.");
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
    alert("Supabase belum terhubung.");
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
    alert(
      "Nama, NIS, dan Kelas wajib diisi."
    );
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

    alert(
      id
        ? "Data siswa berhasil diperbarui!"
        : "Siswa berhasil ditambahkan!"
    );

    tutupFormSiswa();

    await loadSiswa();
  } catch (error) {
    console.error(
      "Error simpan siswa:",
      error
    );

    alert(
      "Gagal menyimpan siswa:\n\n" +
        (
          error?.message ||
          "Terjadi kesalahan."
        )
    );
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
      <td colspan="9" style="text-align:center;">
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
          <td colspan="9" style="text-align:center;">
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
        <td
          colspan="9"
          style="text-align:center;color:#E11D48;"
        >
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
        <td colspan="9" style="text-align:center;">
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

                <div
                  style="
                    display:flex;
                    gap:6px;
                    flex-wrap:wrap;
                  "
                >

                  <button
                    class="btn ghost small"
                    type="button"
                    onclick="
                      window.__app.editSiswa(
                        '${escapeJs(
                          siswa.id
                        )}'
                      )
                    "
                  >
                    Edit
                  </button>

                  <button
                    class="btn ghost small"
                    type="button"
                    onclick="
                      window.__app.hapusSiswa(
                        '${escapeJs(
                          siswa.id
                        )}',
                        '${escapeJs(
                          siswa.nama ||
                            "Siswa"
                        )}'
                      )
                    "
                  >
                    Hapus
                  </button>

                </div>

              </td>

            </tr>
          `;
        }
      )
      .join("");
}

// ============================================================
// CARI SISWA
// ============================================================

function cariSiswa() {
  const input =
    document.getElementById(
      "cariSiswa"
    );

  if (!input) return;

  const keyword =
    input.value
      .toLowerCase()
      .trim();

  const hasil =
    (semuaSiswa || [])
      .filter(
        (siswa) => {

          const text = [
            siswa.nama,
            siswa.nis,
            siswa.kelas,
            siswa.tahun_ajaran,
            siswa.nama_wali,
            siswa.nomor_hp_ortu,
          ]
            .map(
              (x) =>
                String(
                  x || ""
                ).toLowerCase()
            )
            .join(" ");

          return text.includes(
            keyword
          );
        }
      );

  renderDaftarSiswa(
    hasil
  );
}

// ============================================================
// HAPUS
// ============================================================

async function hapusSiswa(
  id,
  nama
) {
  if (!supabase) {
    alert(
      "Supabase belum terhubung."
    );

    return;
  }

  const konfirmasi =
    confirm(
      `Yakin ingin menghapus data siswa "${nama}"?\n\n` +
      `Data terkait seperti absensi, SPP, dan perkembangan ` +
      `mungkin juga ikut terdampak tergantung aturan foreign key database.`
    );

  if (!konfirmasi) {
    return;
  }

  try {
    const {
      error,
    } =
      await supabase
        .from("siswa")
        .delete()
        .eq("id", id);

    if (error) {
      throw error;
    }

    alert(
      "Data siswa berhasil dihapus."
    );

    await loadSiswa();
  } catch (error) {
    console.error(
      "Error hapus siswa:",
      error
    );

    alert(
      "Gagal menghapus siswa:\n\n" +
        (
          error?.message ||
          "Terjadi kesalahan."
        )
    );
  }
}

// ============================================================
// IMPORT DATA SISWA
// FORMAT:
// A No
// B Nama
// C NIS
// D TTL
// E Alamat
// F Nama Wali
// G No. HP
// H Kelas
// I Mulai bergabung
// ============================================================

const IMPORT_CHUNK_SIZE =
  200;

let importRows = [];
let importValidRows = [];
let importInvalidRows = [];

// ============================================================
// SHEETJS
// ============================================================

async function ensureXLSX() {
  if (window.XLSX) {
    return window.XLSX;
  }

  return new Promise(
    (resolve, reject) => {

      const existing =
        document.querySelector(
          'script[data-gantariku-xlsx="1"]'
        );

      if (existing) {

        existing.addEventListener(
          "load",
          () => {

            if (window.XLSX) {
              resolve(
                window.XLSX
              );
            } else {
              reject(
                new Error(
                  "Library Excel tidak tersedia."
                )
              );
            }

          }
        );

        existing.addEventListener(
          "error",
          () => {
            reject(
              new Error(
                "Gagal memuat library Excel."
              )
            );
          }
        );

        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.src =
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

      script.async = true;

      script.dataset
        .gantarikuXlsx =
        "1";

      script.onload =
        () => {

          if (window.XLSX) {
            resolve(
              window.XLSX
            );
          } else {
            reject(
              new Error(
                "Library Excel tidak tersedia."
              )
            );
          }

        };

      script.onerror =
        () => {

          reject(
            new Error(
              "Tidak dapat memuat library Excel. Periksa koneksi internet."
            )
          );

        };

      document.head.appendChild(
        script
      );

    }
  );
}

// ============================================================
// BACA FILE
// ============================================================

async function bacaFileImport(
  file
) {
  if (!file) {
    throw new Error(
      "File belum dipilih."
    );
  }

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  if (
    ![
      "xlsx",
      "xls",
      "csv",
    ].includes(
      extension
    )
  ) {
    throw new Error(
      "Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv."
    );
  }

  const XLSXLib =
    await ensureXLSX();

  const buffer =
    await file.arrayBuffer();

  const workbook =
    XLSXLib.read(
      buffer,
      {
        type: "array",
        cellDates: true,
      }
    );

  const sheetName =
    workbook
      .SheetNames?.[0];

  if (!sheetName) {
    throw new Error(
      "Sheet Excel tidak ditemukan."
    );
  }

  const sheet =
    workbook.Sheets[
      sheetName
    ];

  const rows =
    XLSXLib.utils.sheet_to_json(
      sheet,
      {
        header: 1,
        raw: true,
        defval: "",
        blankrows: false,
      }
    );

  if (!rows.length) {
    throw new Error(
      "File tidak berisi data."
    );
  }

  let headerIndex = -1;

  for (
    let i = 0;
    i <
      Math.min(
        rows.length,
        20
      );
    i++
  ) {

    const row =
      rows[i] || [];

    const joined =
      row
        .map(
          (value) =>
            String(
              value ?? ""
            )
              .trim()
              .toLowerCase()
        )
        .join("|");

    if (
      joined.includes(
        "nis"
      ) &&
      joined.includes(
        "ttl"
      ) &&
      joined.includes(
        "alamat"
      ) &&
      joined.includes(
        "kelas"
      )
    ) {
      headerIndex = i;
      break;
    }
  }

  if (
    headerIndex === -1
  ) {
    headerIndex = 0;
  }

  const dataRows =
    rows
      .slice(
        headerIndex + 1
      )
      .filter(
        (row) => {

          const nama =
            String(
              row?.[1] ??
                ""
            ).trim();

          const nis =
            String(
              row?.[2] ??
                ""
            ).trim();

          return (
            nama !== "" ||
            nis !== ""
          );
        }
      );

  if (!dataRows.length) {
    throw new Error(
      "Tidak ditemukan data siswa setelah header."
    );
  }

  return dataRows;
}

// ============================================================
// MAP IMPORT
// ============================================================

function mapImportRow(
  row,
  index
) {
  const nama =
    String(
      row?.[1] ?? ""
    ).trim();

  const nis =
    String(
      row?.[2] ?? ""
    ).trim();

  const ttl =
    String(
      row?.[3] ?? ""
    ).trim();

  const alamat =
    String(
      row?.[4] ?? ""
    ).trim();

  const namaWali =
    String(
      row?.[5] ?? ""
    ).trim();

  const nomorHpOrtu =
    normalizePhone(
      row?.[6] ?? ""
    );

  const kelas =
    String(
      row?.[7] ?? ""
    ).trim();

  const mulaiBergabung =
    row?.[8] ?? "";

  const errors = [];

  if (!nama) {
    errors.push(
      "Nama siswa kosong"
    );
  }

  if (!nis) {
    errors.push(
      "NIS kosong"
    );
  }

  if (!kelas) {
    errors.push(
      "Kelas kosong"
    );
  }

  const {
    tempatLahir,
    tanggalLahir,
  } =
    parseTTL(
      ttl
    );

  if (
    ttl &&
    !tanggalLahir
  ) {
    errors.push(
      "Format TTL tidak dapat dibaca"
    );
  }

  const mulai =
    parseBulanTahunExcel(
      mulaiBergabung
    );

  if (
    mulaiBergabung !== "" &&
    (
      mulai.bulan ===
        null ||
      mulai.tahun ===
        null
    )
  ) {
    errors.push(
      "Format Mulai bergabung tidak dapat dibaca"
    );
  }

  const tahunAjaran =
    hitungTahunAjaranMulai(
      mulai.bulan,
      mulai.tahun
    );

  if (!tahunAjaran) {
    errors.push(
      "Tahun ajaran tidak dapat dihitung dari Mulai bergabung"
    );
  }

  return {
    rowNumber:
      index + 2,

    nama,

    nis,

    tempat_lahir:
      tempatLahir ||
      null,

    tanggal_lahir:
      tanggalLahir ||
      null,

    alamat:
      alamat ||
      null,

    nama_wali:
      namaWali ||
      null,

    nomor_hp_ortu:
      nomorHpOrtu ||
      null,

    kelas,

    tahun_ajaran:
      tahunAjaran,

    jenis_kelamin:
      null,

    mulai_bulan:
      mulai.bulan,

    mulai_tahun:
      mulai.tahun,

    orang_tua_id:
      null,

    errors,
  };
}

// ============================================================
// TTL
// ============================================================

function parseTTL(
  ttl
) {
  if (!ttl) {
    return {
      tempatLahir: "",
      tanggalLahir: null,
    };
  }

  const parts =
    String(ttl)
      .split(",")
      .map(
        (x) =>
          x.trim()
      )
      .filter(Boolean);

  if (
    parts.length >= 2
  ) {
    return {
      tempatLahir:
        parts
          .slice(
            0,
            parts.length -
              1
          )
          .join(", ")
          .trim(),

      tanggalLahir:
        parseFlexibleDate(
          parts[
            parts.length -
              1
          ]
        ),
    };
  }

  return {
    tempatLahir: "",
    tanggalLahir:
      parseFlexibleDate(
        ttl
      ),
  };
}

// ============================================================
// PARSE TANGGAL
// ============================================================

function parseFlexibleDate(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    value instanceof Date
  ) {
    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return null;
    }

    return formatDateISO(
      value
    );
  }

  const text =
    String(value)
      .trim();

  if (!text) {
    return null;
  }

  let match =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (match) {
    return `${match[1]}-${String(
      match[2]
    ).padStart(
      2,
      "0"
    )}-${String(
      match[3]
    ).padStart(
      2,
      "0"
    )}`;
  }

  match =
    text.match(
      /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
    );

  if (match) {
    return `${match[3]}-${String(
      match[2]
    ).padStart(
      2,
      "0"
    )}-${String(
      match[1]
    ).padStart(
      2,
      "0"
    )}`;
  }

  const bulanMap = {
    januari: 1,
    jan: 1,

    februari: 2,
    feb: 2,

    maret: 3,
    mar: 3,

    april: 4,
    apr: 4,

    mei: 5,
    may: 5,

    juni: 6,
    jun: 6,

    juli: 7,
    jul: 7,

    agustus: 8,
    agu: 8,
    ags: 8,

    september: 9,
    sep: 9,

    oktober: 10,
    okt: 10,

    november: 11,
    nov: 11,

    desember: 12,
    des: 12,
  };

  match =
    text.match(
      /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i
    );

  if (match) {
    const tanggal =
      Number(
        match[1]
      );

    const bulan =
      bulanMap[
        match[2].toLowerCase()
      ];

    const tahun =
      Number(
        match[3]
      );

    if (
      bulan &&
      tanggal >= 1 &&
      tanggal <= 31
    ) {
      return `${tahun}-${String(
        bulan
      ).padStart(
        2,
        "0"
      )}-${String(
        tanggal
      ).padStart(
        2,
        "0"
      )}`;
    }
  }

  return null;
}

// ============================================================
// MULAI BERGABUNG
// ============================================================

function parseBulanTahunExcel(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return {
      bulan: null,
      tahun: null,
    };
  }

  if (
    value instanceof Date
  ) {
    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return {
        bulan: null,
        tahun: null,
      };
    }

    return {
      bulan:
        value.getMonth() +
        1,

      tahun:
        value.getFullYear(),
    };
  }

  if (
    typeof value ===
    "number"
  ) {
    if (
      window.XLSX?.SSF &&
      typeof
        window.XLSX
          .SSF
          .parse_date_code ===
        "function"
    ) {
      const parsed =
        window.XLSX.SSF.parse_date_code(
          value
        );

      if (parsed) {
        return {
          bulan:
            Number(
              parsed.m
            ),

          tahun:
            Number(
              parsed.y
            ),
        };
      }
    }

    const date =
      new Date(
        Math.round(
          (
            value -
            25569
          ) *
            86400 *
            1000
        )
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return {
        bulan:
          date.getUTCMonth() +
          1,

        tahun:
          date.getUTCFullYear(),
      };
    }

    return {
      bulan: null,
      tahun: null,
    };
  }

  const text =
    String(value)
      .trim();

  let match =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (match) {
    return {
      tahun:
        Number(
          match[1]
        ),

      bulan:
        Number(
          match[2]
        ),
    };
  }

  match =
    text.match(
      /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
    );

  if (match) {
    return {
      bulan:
        Number(
          match[2]
        ),

      tahun:
        Number(
          match[3]
        ),
    };
  }

  const parsed =
    parseFlexibleDate(
      text
    );

  if (parsed) {
    const [
      tahun,
      bulan,
    ] =
      parsed.split("-");

    return {
      bulan:
        Number(
          bulan
        ),

      tahun:
        Number(
          tahun
        ),
    };
  }

  return {
    bulan: null,
    tahun: null,
  };
}

function parseMonthInput(
  value
) {
  if (!value) {
    return {
      bulan: null,
      tahun: null,
    };
  }

  const match =
    String(value).match(
      /^(\d{4})-(\d{1,2})$/
    );

  if (!match) {
    return {
      bulan: null,
      tahun: null,
    };
  }

  return {
    tahun:
      Number(
        match[1]
      ),

    bulan:
      Number(
        match[2]
      ),
  };
}

function hitungTahunAjaranMulai(
  bulan,
  tahun
) {
  if (
    !bulan ||
    !tahun
  ) {
    return null;
  }

  const b =
    Number(
      bulan
    );

  const y =
    Number(
      tahun
    );

  if (
    !Number.isInteger(
      b
    ) ||
    !Number.isInteger(
      y
    )
  ) {
    return null;
  }

  if (
    b < 1 ||
    b > 12 ||
    y < 2000 ||
    y > 2100
  ) {
    return null;
  }

  return b >= 7
    ? `${y}/${y + 1}`
    : `${y - 1}/${y}`;
}

function formatDateISO(
  date
) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(
    2,
    "0"
  )}-${String(
    date.getDate()
  ).padStart(
    2,
    "0"
  )}`;
}

// ============================================================
// DUPLIKAT
// ============================================================

function cekDuplikatDalamFile(
  rows
) {
  const seen =
    new Map();

  rows.forEach(
    (row) => {

      const key =
        String(
          row.nis ||
            ""
        )
          .trim()
          .toLowerCase();

      if (!key) return;

      if (!seen.has(key)) {
        seen.set(
          key,
          []
        );
      }

      seen
        .get(key)
        .push(row);
    }
  );

  seen.forEach(
    (list) => {

      if (
        list.length >
        1
      ) {
        list.forEach(
          (row) => {

            if (
              !row.errors.includes(
                "NIS duplikat di dalam file"
              )
            ) {
              row.errors.push(
                "NIS duplikat di dalam file"
              );
            }

          }
        );
      }

    }
  );
}

async function cekDatabase(
  rows
) {
  if (!supabase) {
    throw new Error(
      "Supabase belum terhubung."
    );
  }

  const nisList =
    [
      ...new Set(
        rows
          .filter(
            (x) =>
              x.nis
          )
          .map(
            (x) =>
              String(
                x.nis
              ).trim()
          )
      ),
    ];

  if (
    !nisList.length
  ) {
    return [];
  }

  const existing = [];

  for (
    let i = 0;
    i <
      nisList.length;
    i += 200
  ) {

    const chunk =
      nisList.slice(
        i,
        i + 200
      );

    const {
      data,
      error,
    } =
      await supabase
        .from("siswa")
        .select(
          "id,nis,nama"
        )
        .in(
          "nis",
          chunk
        );

    if (error) {
      throw error;
    }

    existing.push(
      ...(data || [])
    );
  }

  return existing;
}

// ============================================================
// MODAL IMPORT + CSS
// ============================================================

function injectImportStyles() {
  if (
    document.getElementById(
      "gtr-import-styles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "gtr-import-styles";

  style.textContent = `
    .gtr-import-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      background: rgba(47,43,42,.55);
      backdrop-filter: blur(4px);
    }

    .gtr-import-modal {
      width: min(1100px, 100%);
      max-height: 92vh;
      overflow: hidden;
      background: #fffdf9;
      border: 1px solid #e7ddd0;
      border-radius: 20px;
      box-shadow: 0 25px 80px rgba(45,35,28,.25);
    }

    .gtr-import-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 22px;
      border-bottom: 1px solid #eee5d9;
    }

    .gtr-import-header h2 {
      margin: 0 0 5px;
      color: #393536;
      font-size: 20px;
    }

    .gtr-import-header p {
      margin: 0;
      color: #776d63;
      font-size: 13px;
    }

    .gtr-import-close {
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 10px;
      background: #f3ece3;
      color: #5f5750;
      font-size: 24px;
      cursor: pointer;
    }

    .gtr-import-content {
      padding: 20px;
      max-height: calc(92vh - 90px);
      overflow: auto;
    }

    .gtr-import-upload {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 26px 18px;
      margin-bottom: 16px;
      text-align: center;
      background: linear-gradient(
        180deg,
        #fff7dc,
        #fffdf9
      );
      border: 1px dashed #dcc79c;
      border-radius: 16px;
    }

    .gtr-import-icon {
      width: 50px;
      height: 50px;
      display: grid;
      place-items: center;
      margin-bottom: 4px;
      background: #fff0c3;
      border-radius: 15px;
      font-size: 25px;
    }

    .gtr-import-upload strong {
      color: #413b38;
      font-size: 14px;
    }

    .gtr-import-upload span {
      color: #7a7066;
      font-size: 12px;
    }

    .gtr-import-upload input {
      display: none;
    }

    .gtr-import-upload label {
      margin-top: 9px;
      cursor: pointer;
    }

    .gtr-import-upload small {
      max-width: 800px;
      margin-top: 5px;
      color: #81766b;
      font-size: 11px;
      line-height: 1.5;
    }

    .gtr-import-summary {
      display: grid;
      grid-template-columns: repeat(3,minmax(0,1fr));
      gap: 10px;
      margin-bottom: 10px;
    }

    .gtr-import-stat {
      padding: 12px;
      background: #f5efe7;
      border-radius: 12px;
      text-align: center;
    }

    .gtr-import-stat strong {
      display: block;
      font-size: 20px;
      color: #403a37;
    }

    .gtr-import-stat span {
      font-size: 11px;
      color: #7c7268;
    }

    .gtr-import-stat.good {
      background: #eaf7e9;
    }

    .gtr-import-stat.good strong {
      color: #2d9143;
    }

    .gtr-import-stat.bad {
      background: #fff0ec;
    }

    .gtr-import-stat.bad strong {
      color: #c44945;
    }

    .gtr-import-file {
      margin-bottom: 14px;
      color: #766c62;
      font-size: 12px;
    }

    .gtr-import-preview-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 15px 0 9px;
    }

    .gtr-import-preview-title strong {
      color: #403a37;
    }

    .gtr-import-preview-title span {
      color: #877c71;
      font-size: 11px;
    }

    .gtr-import-table-wrap {
      overflow: auto;
      max-height: 390px;
      border: 1px solid #e8ded2;
      border-radius: 12px;
    }

    .gtr-import-table {
      width: 100%;
      min-width: 900px;
      border-collapse: collapse;
      font-size: 12px;
    }

    .gtr-import-table th {
      position: sticky;
      top: 0;
      z-index: 1;
      padding: 10px;
      background: #f4ecde;
      color: #62594f;
      text-align: left;
      white-space: nowrap;
    }

    .gtr-import-table td {
      padding: 9px 10px;
      border-top: 1px solid #eee7de;
      color: #514b46;
      vertical-align: top;
    }

    .gtr-import-table tr.is-invalid {
      background: #fff7f4;
    }

    .gtr-import-ok,
    .gtr-import-invalid {
      display: inline-block;
      padding: 4px 7px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }

    .gtr-import-ok {
      background: #e8f6ea;
      color: #2c9144;
    }

    .gtr-import-invalid {
      background: #fbe8e5;
      color: #c44843;
    }

    .gtr-import-muted {
      color: #aaa098;
    }

    .gtr-import-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 15px;
    }

    @media (max-width:700px) {
      .gtr-import-backdrop {
        padding: 8px;
      }

      .gtr-import-modal {
        max-height: 95vh;
        border-radius: 17px;
      }

      .gtr-import-content {
        max-height: calc(95vh - 88px);
        padding: 14px;
      }

      .gtr-import-header {
        padding: 16px;
      }

      .gtr-import-summary {
        grid-template-columns: 1fr;
      }

      .gtr-import-actions {
        flex-direction: column;
      }

      .gtr-import-actions .btn {
        width: 100%;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}

// ============================================================
// BUKA MODAL IMPORT
// ============================================================

function bukaImportSiswa() {
  if (
    currentUserRole !==
    "admin"
  ) {
    alert(
      "Fitur import hanya tersedia untuk admin."
    );
    return;
  }

  injectImportStyles();

  const old =
    document.getElementById(
      "modalImportSiswa"
    );

  if (old) {
    old.remove();
  }

  const modal =
    document.createElement(
      "div"
    );

  modal.id =
    "modalImportSiswa";

  modal.innerHTML = `
    <div class="gtr-import-backdrop">

      <div class="gtr-import-modal">

        <div class="gtr-import-header">

          <div>
            <h2>
              Import Data Siswa
            </h2>

            <p>
              Gunakan file Excel siswa yang biasa dipakai sekolah.
            </p>
          </div>

          <button
            type="button"
            class="gtr-import-close"
            id="gtrCloseImport"
          >
            ×
          </button>

        </div>

        <div class="gtr-import-content">

          <div class="gtr-import-upload">

            <div class="gtr-import-icon">
              📊
            </div>

            <strong>
              Pilih file Excel / CSV
            </strong>

            <span>
              .xlsx · .xls · .csv
            </span>

            <input
              type="file"
              id="gtrInputFileSiswa"
              accept=".xlsx,.xls,.csv"
            >

            <label
              for="gtrInputFileSiswa"
              class="btn"
            >
              Pilih File
            </label>

            <small>
              Format:
              No · Nama · NIS · TTL · Alamat ·
              Nama Wali · No. HP · Kelas · Mulai bergabung
            </small>

          </div>

          <div id="gtrImportStatus"></div>

          <div id="gtrImportPreview"></div>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(
    modal
  );

  document
    .getElementById(
      "gtrCloseImport"
    )
    ?.addEventListener(
      "click",
      tutupImportSiswa
    );

  document
    .querySelector(
      "#modalImportSiswa .gtr-import-backdrop"
    )
    ?.addEventListener(
      "click",
      (event) => {

        if (
          event.target.classList.contains(
            "gtr-import-backdrop"
          )
        ) {
          tutupImportSiswa();
        }

      }
    );

  document
    .getElementById(
      "gtrInputFileSiswa"
    )
    ?.addEventListener(
      "change",
      handleImportFile
    );
}

// ============================================================
// HANDLE FILE
// ============================================================

async function handleImportFile(
  event
) {
  const file =
    event.target.files?.[0];

  if (!file) return;

  const status =
    document.getElementById(
      "gtrImportStatus"
    );

  const preview =
    document.getElementById(
      "gtrImportPreview"
    );

  if (status) {
    status.innerHTML = `
      <div
        class="gtr-import-loading"
        style="
          padding:12px;
          border-radius:10px;
          background:#f5efe7;
          color:#6f665d;
        "
      >
        ⏳ Membaca dan memeriksa file...
      </div>
    `;
  }

  if (preview) {
    preview.innerHTML =
      "";
  }

  try {
    const rawRows =
      await bacaFileImport(
        file
      );

    const mapped =
      rawRows.map(
        (row, index) =>
          mapImportRow(
            row,
            index
          )
      );

    cekDuplikatDalamFile(
      mapped
    );

    const existing =
      await cekDatabase(
        mapped
      );

    const existingMap =
      new Map(
        existing.map(
          (x) => [
            String(
              x.nis
            )
              .trim()
              .toLowerCase(),
            x,
          ]
        )
      );

    mapped.forEach(
      (row) => {

        const key =
          String(
            row.nis ||
              ""
          )
            .trim()
            .toLowerCase();

        const existingStudent =
          existingMap.get(
            key
          );

        if (
          existingStudent
        ) {
          row.errors.push(
            `NIS sudah terdaftar (${existingStudent.nama || "siswa lain"})`
          );
        }

      }
    );

    importRows =
      mapped;

    importValidRows =
      mapped.filter(
        (row) =>
          row.errors.length ===
          0
      );

    importInvalidRows =
      mapped.filter(
        (row) =>
          row.errors.length >
          0
      );

    renderImportPreview(
      file.name
    );

  } catch (error) {

    console.error(
      "Import siswa:",
      error
    );

    if (status) {
      status.innerHTML = `
        <div
          style="
            padding:12px;
            border-radius:10px;
            background:#fcebe7;
            color:#b84242;
            font-size:13px;
          "
        >
          ❌ ${escapeHtml(
            error?.message ||
              "Gagal membaca file."
          )}
        </div>
      `;
    }
  }
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
    alert(
      "Hanya admin yang dapat melakukan import data siswa."
    );
    return;
  }

  if (!supabase) {
    alert(
      "Supabase belum terhubung."
    );
    return;
  }

  if (
    !importValidRows.length
  ) {
    alert(
      "Tidak ada data valid untuk diimport."
    );
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

    alert(
      `Berhasil mengimport ${berhasil} data siswa.`
    );

    tutupImportSiswa();

    await loadSiswa();

  } catch (error) {

    console.error(
      "Gagal import siswa:",
      error
    );

    alert(
      "Import berhenti.\n\n" +
        (
          error?.message ||
          "Terjadi kesalahan."
        )
    );

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
// GLOBAL
// ============================================================

window.bukaImportSiswa =
  bukaImportSiswa;

window.tutupImportSiswa =
  tutupImportSiswa;
