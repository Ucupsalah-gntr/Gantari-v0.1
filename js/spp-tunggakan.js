// ============================================================
// GANTARIKU — PEMBUATAN TAGIHAN TUNGGAKAN
// Membuat beberapa bulan sekaligus dan melewati tagihan yang sudah ada.
// ============================================================

function gtrBulanBerjalanMulai(startValue, endValue) {
  const start = String(startValue || "").split("-").map(Number);
  const end = String(endValue || "").split("-").map(Number);
  if (start.length !== 2 || end.length !== 2 || start.some(Number.isNaN) || end.some(Number.isNaN)) return [];

  const result = [];
  let year = start[0];
  let month = start[1];
  const endKey = end[0] * 12 + end[1];

  while (year * 12 + month <= endKey) {
    result.push({ tahun: year, bulan: month });
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return result;
}

function tutupModalTunggakan() {
  document.getElementById("gtrTunggakanModal")?.remove();
}

async function bukaBuatTagihanTunggakan() {
  if (currentUserRole !== "admin") {
    appNotify("Fitur ini hanya untuk admin.");
    return;
  }

  if (!supabase) {
    appNotify("Supabase belum terhubung.");
    return;
  }

  let siswa = [];
  try {
    const { data, error } = await supabase
      .from("siswa")
      .select("id,nama,nis,kelas,tahun_ajaran,tanggal_masuk,tanggal_keluar")
      .order("nama", { ascending: true });
    if (error) throw error;
    siswa = (data || []).filter((row) => !row.tanggal_keluar);
  } catch (error) {
    console.error("Load siswa untuk tunggakan:", error);
    appNotify("Gagal memuat daftar siswa.");
    return;
  }

  if (!siswa.length) {
    appNotify("Belum ada siswa aktif yang dapat dibuatkan tagihan.");
    return;
  }

  tutupModalTunggakan();
  const now = getNowWIB();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const defaultStudent = typeof sppTahunanSiswa !== "undefined" && sppTahunanSiswa.length
    ? sppTahunanSiswa.find((s) => siswa.some((x) => String(x.id) === String(s.id)))?.id
    : siswa[0].id;

  const options = siswa.map((s) => `
    <option value="${escapeHtml(s.id)}">${escapeHtml(s.nama)}${s.kelas ? ` — ${escapeHtml(s.kelas)}` : ""}</option>
  `).join("");

  const modal = document.createElement("div");
  modal.id = "gtrTunggakanModal";
  modal.className = "gtr-modal-backdrop";
  modal.innerHTML = `
    <div class="gtr-modal-card spp-tunggakan-modal-card">
      <div class="gtr-modal-head">
        <div>
          <h3>Buat Tagihan Tunggakan</h3>
          <div class="form-help">Buat beberapa bulan sekaligus. Bulan yang sudah memiliki tagihan akan dilewati.</div>
        </div>
        <button type="button" class="btn ghost" id="gtrTunggakanClose">×</button>
      </div>
      <form id="gtrTunggakanForm">
        <div class="form-group">
          <label>Siswa</label>
          <select id="gtrTunggakanSiswa" required>${options}</select>
        </div>
        <div class="gtr-tunggakan-grid">
          <div class="form-group">
            <label>Mulai Bulan</label>
            <input type="month" id="gtrTunggakanMulai" value="${currentMonth}" required>
          </div>
          <div class="form-group">
            <label>Sampai Bulan</label>
            <input type="month" id="gtrTunggakanSampai" value="${currentMonth}" required>
          </div>
        </div>
        <div class="form-group">
          <label>Nominal per bulan (Rp)</label>
          <input type="number" id="gtrTunggakanNominal" min="1" step="1000" placeholder="Contoh: 150000" required>
        </div>
        <div id="gtrTunggakanPreview" class="spp-tunggakan-preview"></div>
        <div class="gtr-modal-actions">
          <button type="button" class="btn ghost" id="gtrTunggakanCancel">Batal</button>
          <button type="submit" class="btn" id="gtrTunggakanSubmit">Buat Tagihan</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const siswaSelect = document.getElementById("gtrTunggakanSiswa");
  if (defaultStudent) siswaSelect.value = defaultStudent;

  const updatePreview = () => {
    const months = gtrBulanBerjalanMulai(
      document.getElementById("gtrTunggakanMulai")?.value,
      document.getElementById("gtrTunggakanSampai")?.value
    );
    const nominal = Number(document.getElementById("gtrTunggakanNominal")?.value || 0);
    const total = months.length * nominal;
    const preview = document.getElementById("gtrTunggakanPreview");
    if (!preview) return;
    preview.innerHTML = months.length
      ? `<strong>${months.length} bulan</strong> · Maksimal ${formatRupiah(total)} sebelum melewati tagihan yang sudah ada.`
      : `<span class="text-danger">Rentang bulan tidak valid.</span>`;
  };

  ["gtrTunggakanMulai", "gtrTunggakanSampai", "gtrTunggakanNominal"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updatePreview);
  });
  updatePreview();

  document.getElementById("gtrTunggakanClose")?.addEventListener("click", tutupModalTunggakan);
  document.getElementById("gtrTunggakanCancel")?.addEventListener("click", tutupModalTunggakan);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) tutupModalTunggakan();
  });

  document.getElementById("gtrTunggakanForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const siswaId = siswaSelect.value;
    const mulai = document.getElementById("gtrTunggakanMulai").value;
    const sampai = document.getElementById("gtrTunggakanSampai").value;
    const nominal = Number(document.getElementById("gtrTunggakanNominal").value);
    const months = gtrBulanBerjalanMulai(mulai, sampai);
    const siswaTerpilih = siswa.find((x) => String(x.id) === String(siswaId));

    if (!siswaTerpilih || !months.length || !nominal || nominal < 1) {
      appNotify("Lengkapi siswa, rentang bulan, dan nominal dengan benar.");
      return;
    }

    const button = document.getElementById("gtrTunggakanSubmit");
    setButtonBusy(button, true, "Membuat...");

    try {
      const { data: existing, error: existingError } = await supabase
        .from("spp")
        .select("bulan,tahun")
        .eq("siswa_id", siswaId)
        .gte("tahun", months[0].tahun)
        .lte("tahun", months[months.length - 1].tahun);
      if (existingError) throw existingError;

      const existingKeys = new Set((existing || []).map((row) => `${row.tahun}-${row.bulan}`));
      const missing = months.filter((m) => !existingKeys.has(`${m.tahun}-${m.bulan}`));

      if (!missing.length) {
        appNotify("Semua bulan dalam rentang tersebut sudah memiliki tagihan.");
        tutupModalTunggakan();
        return;
      }

      if (!window.confirm(
        `Buat ${missing.length} tagihan untuk ${siswaTerpilih.nama}?\n\n` +
        `Rentang: ${mulai} s/d ${sampai}\n` +
        `Nominal: ${formatRupiah(nominal)} per bulan\n\n` +
        `Bulan yang sudah ada akan dilewati.`
      )) return;

      const payload = missing.map((m) => ({
        siswa_id: siswaId,
        bulan: m.bulan,
        tahun: m.tahun,
        nominal,
        status: "Belum Bayar"
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("spp")
        .insert(payload)
        .select("id,bulan,tahun");
      if (insertError) throw insertError;

      appNotify(`Berhasil membuat ${inserted?.length || payload.length} tagihan tunggakan untuk ${siswaTerpilih.nama}.`);
      tutupModalTunggakan();
      await loadSpp();
    } catch (error) {
      console.error("Buat tagihan tunggakan:", error);
      if (error?.code === "23505") {
        appNotify("Sebagian tagihan sudah ada. Silakan muat ulang data SPP.");
      } else {
        appNotify("Gagal membuat tagihan tunggakan:\n\n" + (error?.message || "Terjadi kesalahan."));
      }
    } finally {
      setButtonBusy(button, false);
    }
  });
}

// Tambahkan tombol tanpa mengganti renderSpp yang sudah stabil.
const gtrOriginalLoadSpp = window.loadSpp;
if (typeof gtrOriginalLoadSpp === "function" && !window.__gtrTunggakanWrapped) {
  window.__gtrTunggakanWrapped = true;
  window.loadSpp = async function (...args) {
    const result = await gtrOriginalLoadSpp.apply(this, args);
    if (currentUserRole === "admin") {
      const toolbar = document.querySelector(".spp-toolbar");
      if (toolbar && !document.getElementById("btnBuatTunggakan")) {
        const button = document.createElement("button");
        button.id = "btnBuatTunggakan";
        button.className = "btn secondary";
        button.type = "button";
        button.textContent = "⚡ Buat Tunggakan";
        button.addEventListener("click", bukaBuatTagihanTunggakan);
        toolbar.insertBefore(button, toolbar.lastElementChild);
      }
    }
    return result;
  };
}
