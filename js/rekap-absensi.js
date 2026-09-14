// ============================================================
      // VIEW: REKAP ABSENSI (admin) & RIWAYAT ABSENSI (guru)
      // ============================================================
      function renderRekap() {
        const todayStr = new Date().toISOString().slice(0, 10);
        return `
          <div class="section">
            <div class="section-head">
              <h2>Rekap Absensi</h2>
              <div class="controls">
                <select id="rekapKelas"><option value="">Semua kelas</option></select>
                <input type="date" id="rekapDari" value="${todayStr}">
                <input type="date" id="rekapSampai" value="${todayStr}">
                <button class="btn secondary" onclick="window.__app.loadRekapAbsensi()">Tampilkan</button>
                <button class="btn secondary" onclick="window.__app.exportRekapAbsensiCsv()">⬇ Export CSV</button>
              </div>
            </div>
            <div class="section-body">
              <table>
                <thead><tr><th>Tanggal</th><th>Nama</th><th>Kelas</th><th>Status</th><th>Keterangan</th></tr></thead>
                <tbody id="daftarRekapAbsensi">
                  <tr><td colspan="5" style="text-align:center;">Pilih rentang tanggal, lalu klik Tampilkan.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      function renderRiwayatAbsen() {
        const todayStr = new Date().toISOString().slice(0, 10);
        return `
          <div class="section">
            <div class="section-head">
              <h2>Riwayat Absensi</h2>
              <div class="controls">
                <select id="riwayatKelas"><option value="">Semua kelas</option></select>
                <input type="date" id="riwayatDari" value="${todayStr}">
                <input type="date" id="riwayatSampai" value="${todayStr}">
                <button class="btn secondary" onclick="window.__app.loadRiwayatAbsensi()">Tampilkan</button>
              </div>
            </div>
            <div class="section-body">
              <table>
                <thead><tr><th>Tanggal</th><th>Nama</th><th>Kelas</th><th>Status</th><th>Keterangan</th></tr></thead>
                <tbody id="daftarRiwayatAbsensi">
                  <tr><td colspan="5" style="text-align:center;">Pilih rentang tanggal, lalu klik Tampilkan.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      async function loadAbsensiRange(kelasSelectId, dariId, sampaiId, tbodyId) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody || !supabase) return;

        const kelas = document.getElementById(kelasSelectId)?.value;
        const dari = document.getElementById(dariId)?.value;
        const sampai = document.getElementById(sampaiId)?.value;

        if (!dari || !sampai) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Pilih rentang tanggal terlebih dahulu.</td></tr>`;
          return;
        }

        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Memuat data...</td></tr>`;

        try {
          const { data, error } = await supabase
            .from("absensi")
            .select("tanggal, status, keterangan, siswa:siswa_id ( nama, kelas )")
            .gte("tanggal", dari)
            .lte("tanggal", sampai)
            .order("tanggal", { ascending: false });
          if (error) throw error;

          let hasil = data || [];
          if (kelas) hasil = hasil.filter((a) => a.siswa?.kelas === kelas);

          if (hasil.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada data absensi pada rentang ini.</td></tr>`;
            return;
          }

          tbody.innerHTML = hasil
            .map(
              (a) => `
            <tr>
              <td>${a.tanggal || "-"}</td>
              <td>${a.siswa?.nama || "-"}</td>
              <td>${a.siswa?.kelas || "-"}</td>
              <td><span class="badge ${statusBadgeAbsensi(a.status)}">${labelStatusAbsensi(a.status)}</span></td>
              <td>${a.keterangan || "-"}</td>
            </tr>
          `
            )
            .join("");
        } catch (error) {
          console.error("Error load absensi range:", error);
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#E11D48;">Gagal memuat data.</td></tr>`;
        }
      }

      function loadRekapAbsensi() {
        loadAbsensiRange("rekapKelas", "rekapDari", "rekapSampai", "daftarRekapAbsensi");
      }

      function loadRiwayatAbsensi() {
        loadAbsensiRange("riwayatKelas", "riwayatDari", "riwayatSampai", "daftarRiwayatAbsensi");
      }
