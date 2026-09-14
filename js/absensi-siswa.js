// ============================================================
      // VIEW: INPUT ABSENSI (guru)
      // ============================================================
      function renderInputAbsen() {
        const todayStr = new Date().toISOString().slice(0, 10);
        return `
          <div class="section">
            <div class="section-head">
              <h2>Input Absensi</h2>
              <div class="controls">
                <select id="inputAbsenKelas"><option value="">Pilih kelas...</option></select>
                <input type="date" id="inputAbsenTanggal" value="${todayStr}">
                <button class="btn secondary" onclick="window.__app.loadFormInputAbsen()">Tampilkan</button>
              </div>
            </div>
            <div class="section-body">
              <table>
                <thead><tr><th>Nama</th><th>NIS</th><th>Status</th><th>Keterangan</th></tr></thead>
                <tbody id="daftarInputAbsen">
                  <tr><td colspan="4" style="text-align:center;">Pilih kelas dan tanggal, lalu klik Tampilkan.</td></tr>
                </tbody>
              </table>
              <div style="margin-top:16px;">
                <button class="btn" id="btnSimpanAbsen" onclick="window.__app.simpanAbsensiMassal()" style="display:none;">Simpan Absensi</button>
              </div>
            </div>
          </div>
        `;
      }

      async function loadFormInputAbsen() {
        const kelas = document.getElementById("inputAbsenKelas")?.value;
        const tanggal = document.getElementById("inputAbsenTanggal")?.value;
        const tbody = document.getElementById("daftarInputAbsen");
        const btnSimpan = document.getElementById("btnSimpanAbsen");
        if (!tbody) return;

        if (!kelas || !tanggal) {
          tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Pilih kelas dan tanggal terlebih dahulu.</td></tr>`;
          if (btnSimpan) btnSimpan.style.display = "none";
          return;
        }

        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Memuat siswa...</td></tr>`;

        try {
          const { data: daftarSiswa, error: siswaError } = await supabase
            .from("siswa")
            .select("id, nama, nis")
            .eq("kelas", kelas)
            .order("nama", { ascending: true });
          if (siswaError) throw siswaError;

          if (!daftarSiswa || daftarSiswa.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Tidak ada siswa di kelas ini.</td></tr>`;
            if (btnSimpan) btnSimpan.style.display = "none";
            return;
          }

          const { data: absensiExisting, error: absensiError } = await supabase
            .from("absensi")
            .select("id, siswa_id, status, keterangan")
            .eq("tanggal", tanggal)
            .in("siswa_id", daftarSiswa.map((s) => s.id));
          if (absensiError) throw absensiError;

          const absensiMap = {};
          (absensiExisting || []).forEach((a) => {
            absensiMap[a.siswa_id] = a;
          });

          tbody.innerHTML = daftarSiswa
            .map((s) => {
              const existing = absensiMap[s.id];
              const statusTerpilih = existing ? existing.status : "H";
              const keteranganNilai = existing ? existing.keterangan || "" : "";
              const opsiStatus = Object.entries(ABSEN_STATUS_LABELS)
                .map(([kode, label]) => `<option value="${kode}" ${kode === statusTerpilih ? "selected" : ""}>${label}</option>`)
                .join("");

              return `
                <tr data-siswa-id="${s.id}" data-absensi-id="${existing ? existing.id : ""}">
                  <td>${s.nama || "-"}</td>
                  <td>${s.nis || "-"}</td>
                  <td><select class="absen-status">${opsiStatus}</select></td>
                  <td><input type="text" class="absen-keterangan" value="${keteranganNilai}" placeholder="Opsional"></td>
                </tr>
              `;
            })
            .join("");

          if (btnSimpan) btnSimpan.style.display = "inline-block";
        } catch (error) {
          console.error("Error load form absensi:", error);
          tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#E11D48;">Gagal memuat data siswa.</td></tr>`;
        }
      }

      async function simpanAbsensiMassal() {
        if (!supabase) {
          alert("Supabase belum terhubung.");
          return;
        }

        const tanggal = document.getElementById("inputAbsenTanggal")?.value;
        const btnSimpan = document.getElementById("btnSimpanAbsen");
        const baris = document.querySelectorAll("#daftarInputAbsen tr[data-siswa-id]");

        if (!tanggal || baris.length === 0) {
          alert("Tidak ada data untuk disimpan.");
          return;
        }

        if (btnSimpan) {
          btnSimpan.disabled = true;
          btnSimpan.textContent = "Menyimpan...";
        }

        try {
          const dataUpdate = [];
          const dataInsert = [];

          baris.forEach((tr) => {
            const siswaId = tr.getAttribute("data-siswa-id");
            const absensiId = tr.getAttribute("data-absensi-id");
            const status = tr.querySelector(".absen-status").value;
            const keterangan = tr.querySelector(".absen-keterangan").value.trim();
            const record = {
              siswa_id: siswaId,
              tanggal,
              status,
              keterangan: keterangan || null,
              input_oleh: currentUser ? currentUser.id : null,
            };

            if (absensiId) dataUpdate.push({ id: absensiId, ...record });
            else dataInsert.push(record);
          });

          if (dataInsert.length > 0) {
            const { error } = await supabase.from("absensi").insert(dataInsert);
            if (error) throw error;
          }

          for (const item of dataUpdate) {
            const { id, ...record } = item;
            const { error } = await supabase.from("absensi").update(record).eq("id", id);
            if (error) throw error;
          }

          alert("Absensi berhasil disimpan!");
          await loadFormInputAbsen();
        } catch (error) {
          console.error("Error simpan absensi:", error);
          alert("Gagal menyimpan absensi:\n\n" + error.message);
        } finally {
          if (btnSimpan) {
            btnSimpan.disabled = false;
            btnSimpan.textContent = "Simpan Absensi";
          }
        }
      }
