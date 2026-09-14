// ============================================================
      // ABSENSI GURU / PELATIH
      // ============================================================
      function renderAbsensiGuruAdmin() {
        const todayStr = new Date().toISOString().slice(0, 10);
        return `
          <div class="section">
            <div class="section-head">
              <h2>Absensi Guru & Pelatih</h2>
              <div class="controls">
                <input type="date" id="guruAbsenTanggalDari" value="${todayStr}">
                <input type="date" id="guruAbsenTanggalSampai" value="${todayStr}">
                <select id="guruAbsenStatus">
                  <option value="">Semua status</option>
                  <option value="H">Hadir</option>
                  <option value="I">Izin</option>
                  <option value="S">Sakit</option>
                  <option value="A">Alpa</option>
                </select>
                <button class="btn secondary" onclick="window.__app.loadAbsensiGuruAdmin()">Tampilkan</button>
                <button class="btn secondary" onclick="window.__app.exportAbsensiGuruCsv()">⬇ Export CSV</button>
              </div>
            </div>
            <div class="section-body">
              <table>
                <thead><tr><th>Tanggal</th><th>Guru / Pelatih</th><th>Status</th><th>Keterangan</th></tr></thead>
                <tbody id="daftarAbsensiGuru"><tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr></tbody>
              </table>
            </div>
          </div>
        `;
      }

      async function loadAbsensiGuruAdmin() {
        const tbody = document.getElementById("daftarAbsensiGuru");
        if (!tbody || !supabase) return;
        const dari = document.getElementById("guruAbsenTanggalDari")?.value;
        const sampai = document.getElementById("guruAbsenTanggalSampai")?.value;
        const status = document.getElementById("guruAbsenStatus")?.value;
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Memuat data...</td></tr>`;
        try {
          let query = supabase
            .from("absensi_guru")
            .select("id, tanggal, status, keterangan, guru:guru_id ( nama, email )")
            .gte("tanggal", dari)
            .lte("tanggal", sampai)
            .order("tanggal", { ascending: false });
          if (status) query = query.eq("status", status);
          const { data, error } = await query;
          if (error) throw error;
          if (!data?.length) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada absensi guru pada periode ini.</td></tr>`;
            return;
          }
          tbody.innerHTML = data.map(a => `
            <tr>
              <td>${a.tanggal || "-"}</td>
              <td>${a.guru?.nama || "-"}<br><span style="font-size:11px;color:var(--ink-soft);">${a.guru?.email || ""}</span></td>
              <td><span class="badge ${statusBadgeAbsensi(a.status)}">${labelStatusAbsensi(a.status)}</span></td>
              <td>${a.keterangan || "-"}</td>
            </tr>
          `).join("");
        } catch (error) {
          console.error("Error load absensi guru admin:", error);
          tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#E11D48;">Gagal memuat absensi guru. Pastikan tabel <strong>absensi_guru</strong> sudah dibuat di Supabase.</td></tr>`;
        }
      }

      function renderAbsensiSaya() {
        const todayStr = new Date().toISOString().slice(0, 10);
        return `
          <div class="section">
            <div class="section-head">
              <h2>Kehadiran Saya</h2>
              <span class="badge badge-muted">${currentUser?.nama || "Guru"}</span>
            </div>
            <div class="section-body">
              <form id="formAbsensiSaya" onsubmit="event.preventDefault(); window.__app.simpanAbsensiSaya(event); return false;">
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;">
                  <div class="form-group"><label>Tanggal</label><input type="date" id="guruSayaTanggal" value="${todayStr}" required></div>
                  <div class="form-group"><label>Status</label><select id="guruSayaStatus"><option value="H">Hadir</option><option value="I">Izin</option><option value="S">Sakit</option><option value="A">Alpa</option></select></div>
                  <div class="form-group"><label>Keterangan</label><input type="text" id="guruSayaKeterangan" placeholder="Opsional"></div>
                </div>
                <div style="margin-top:18px;display:flex;gap:10px;align-items:center;">
                  <button type="submit" class="btn" id="btnSimpanAbsensiSaya">Simpan Kehadiran</button>
                  <span style="font-size:12px;color:var(--ink-soft);">Satu catatan per tanggal.</span>
                </div>
              </form>
            </div>
          </div>
          <div class="section">
            <div class="section-head"><h2>Riwayat Kehadiran Saya</h2></div>
            <div class="section-body">
              <table>
                <thead><tr><th>Tanggal</th><th>Status</th><th>Keterangan</th></tr></thead>
                <tbody id="riwayatAbsensiSaya"><tr><td colspan="3" style="text-align:center;">Memuat data...</td></tr></tbody>
              </table>
            </div>
          </div>
        `;
      }

      async function loadAbsensiSaya() {
        const tbody = document.getElementById("riwayatAbsensiSaya");
        if (!tbody || !supabase || !currentUser) return;
        try {
          const { data, error } = await supabase
            .from("absensi_guru")
            .select("tanggal, status, keterangan")
            .eq("guru_id", currentUser.id)
            .order("tanggal", { ascending: false })
            .limit(30);
          if (error) throw error;
          if (!data?.length) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Belum ada riwayat kehadiran.</td></tr>`;
            return;
          }
          tbody.innerHTML = data.map(a => `
            <tr><td>${a.tanggal || "-"}</td><td><span class="badge ${statusBadgeAbsensi(a.status)}">${labelStatusAbsensi(a.status)}</span></td><td>${a.keterangan || "-"}</td></tr>
          `).join("");
        } catch (error) {
          console.error("Error load riwayat absensi saya:", error);
          tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#E11D48;">Gagal memuat riwayat. Pastikan tabel <strong>absensi_guru</strong> sudah dibuat.</td></tr>`;
        }

      }

      async function simpanAbsensiSaya(event) {
        if (event) event.preventDefault();
        if (!supabase || !currentUser) return;

        if (currentUserRole !== "guru") {
          alert("Hanya akun guru/pelatih yang dapat mengisi kehadiran sendiri.");
          return;
        }

        const btn = document.getElementById("btnSimpanAbsensiSaya");
        const tanggal = document.getElementById("guruSayaTanggal")?.value;
        const status = document.getElementById("guruSayaStatus")?.value;
        const keterangan = document.getElementById("guruSayaKeterangan")?.value.trim() || null;
        if (!tanggal || !status) return;

        btn.disabled = true;
        btn.textContent = "Menyimpan...";

        try {
          // Gunakan UPSERT langsung. Ini menghindari race-condition dan juga
          // menangani data lama yang sudah ada tetapi tidak terbaca oleh query
          // pengecekan sebelumnya. Constraint unik: (guru_id, tanggal).
          const { error } = await supabase
            .from("absensi_guru")
            .upsert(
              { guru_id: currentUser.id, tanggal, status, keterangan },
              { onConflict: "guru_id,tanggal" }
            );

          if (error) throw error;

          alert("✅ Kehadiran berhasil disimpan.");
          const ketEl = document.getElementById("guruSayaKeterangan");
          if (ketEl) ketEl.value = "";
          await loadAbsensiSaya();
        } catch (error) {
          console.error("Error simpan absensi guru:", error);
          alert("Gagal menyimpan kehadiran:\n\n" + (error?.message || "Terjadi kesalahan."));
        } finally {
          btn.disabled = false;
          btn.textContent = "Simpan Kehadiran";
        }
      }
