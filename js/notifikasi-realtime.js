// ============================================================
// GANTARIKU — NOTIFIKASI REALTIME
// Satu listener untuk Admin + Orangtua.
// Tidak mengganti loadNotifikasi(); hanya memicu refresh otomatis.
// ============================================================

(function () {
  let channel = null;
  let refreshTimer = null;
  let startedForUser = "";

  const REFRESH_DELAY = 500;
  const FALLBACK_INTERVAL = 15000;

  function scheduleRefresh(reason) {
    clearTimeout(refreshTimer);

    refreshTimer = setTimeout(async () => {
      if (typeof window.loadNotifikasi !== "function") return;
      if (!window.supabase || !window.currentUserRole) return;

      try {
        await window.loadNotifikasi();
        console.log("Gantariku: notifikasi diperbarui realtime", reason || "");
      } catch (error) {
        console.error("Gantariku: refresh notifikasi gagal:", error);
      }
    }, REFRESH_DELAY);
  }

  function stopRealtime() {
    if (channel && window.supabase) {
      try {
        window.supabase.removeChannel(channel);
      } catch (error) {
        console.warn("Gantariku: gagal melepas channel notifikasi:", error);
      }
    }

    channel = null;
    startedForUser = "";
  }

  function getUserKey() {
    const user = window.supabase?.auth?.getUser;
    return String(
      window.currentUser?.id ||
      window.currentUser?.user_id ||
      window.currentUser?.email ||
      window.currentUserRole ||
      ""
    );
  }

  function startRealtime() {
    if (!window.supabase || !window.currentUserRole) return;

    const role = String(window.currentUserRole).toLowerCase();
    if (!["admin", "ortu"].includes(role)) return;

    const userKey = getUserKey() + ":" + role;
    if (channel && startedForUser === userKey) return;

    stopRealtime();
    startedForUser = userKey;

    channel = window.supabase
      .channel("gantariku-notifikasi-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "spp" },
        () => scheduleRefresh("spp")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "perkembangan" },
        () => scheduleRefresh("perkembangan")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "absensi" },
        () => scheduleRefresh("absensi siswa")
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "absensi_guru" },
        () => scheduleRefresh("absensi guru")
      )
      .subscribe((status) => {
        console.log("Gantariku notifikasi realtime:", status);

        if (status === "SUBSCRIBED") {
          // Pastikan badge langsung sinkron setelah channel aktif.
          scheduleRefresh("connected");
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(
            "Gantariku: Realtime Supabase belum aktif. Fallback polling tetap berjalan."
          );
        }
      });
  }

  // Fallback ringan: bila Supabase Realtime belum diaktifkan untuk tabel,
  // badge tetap diperbarui tanpa perlu klik tombol.
  setInterval(() => {
    if (!window.supabase || !window.currentUserRole) return;
    const role = String(window.currentUserRole).toLowerCase();
    if (["admin", "ortu"].includes(role)) {
      scheduleRefresh("polling fallback");
      startRealtime();
    }
  }, FALLBACK_INTERVAL);

  // Saat tab kembali aktif, sinkronkan sekali.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      startRealtime();
      scheduleRefresh("tab active");
    }
  });

  window.addEventListener("focus", () => {
    startRealtime();
    scheduleRefresh("window focus");
  });

  // Login/auth kadang selesai setelah seluruh script dimuat.
  const bootTimer = setInterval(() => {
    if (!window.supabase || !window.currentUserRole) return;
    startRealtime();
  }, 500);

  setTimeout(() => clearInterval(bootTimer), 60000);

  // Bisa dipanggil modul auth bila user logout/login tanpa reload.
  window.gantarikuStartNotifikasiRealtime = startRealtime;
  window.gantarikuStopNotifikasiRealtime = stopRealtime;
})();
