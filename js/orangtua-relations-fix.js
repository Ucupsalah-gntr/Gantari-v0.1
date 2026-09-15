// ============================================================
// GANTARIKU — ORANG TUA RELATION FIX
// Sumber anak mengikuti relasi yang benar di tabel siswa.orang_tua_id.
// ============================================================

async function pastikanAnakOrangTuaDimuat() {
  if (!supabase || !currentUser) return;

  if (anakOrangTuaList.length > 0) return;

  try {
    const { data, error } = await withRequestTimeout(
      supabase
        .from("siswa")
        .select("id,nama,nis,kelas,tahun_ajaran,tanggal_keluar,orang_tua_id")
        .eq("orang_tua_id", currentUser.id)
        .order("nama", { ascending: true }),
      "daftar anak"
    );

    if (error) throw error;

    anakOrangTuaList = (data || [])
      .filter(Boolean)
      .sort((a, b) => String(a.nama || "").localeCompare(String(b.nama || ""), "id"));

    if (!anakTerpilihId && anakOrangTuaList.length > 0) {
      anakTerpilihId = anakOrangTuaList[0].id;
    }
  } catch (error) {
    console.error("Error load relasi anak orang tua:", error);
    anakOrangTuaList = [];
  }
}

// Reset cache ketika berpindah akun.
const _gtrOriginalLogout = typeof logout === "function" ? logout : null;
if (_gtrOriginalLogout && !window.__gtrLogoutRelationWrapped) {
  window.__gtrLogoutRelationWrapped = true;
}
