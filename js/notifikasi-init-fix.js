// ============================================================
// GANTARIKU — NOTIFIKASI REALTIME INIT
// Admin + Orangtua
// ============================================================
//
// Tujuan:
// 1. Badge/notifikasi otomatis diperbarui tanpa harus klik 🔔.
// 2. Perubahan SPP / perkembangan / absensi memicu refresh.
// 3. Tetap memakai loadNotifikasi() yang sudah ada untuk masing-masing role.
// 4. Ada fallback polling ringan jika Supabase Realtime belum aktif.
// ============================================================

(function () {
  let channel = null;
  let refreshTimer = null;
  let pollingTimer = null;
  let bootTimer = null;
  let startedKey = "";

  const REFRESH_DELAY = 450;
  const POLLING_INTERVAL = 15000;

  function getRole() {
    return String(window.currentUserRole || "").toLowerCase();
  }

  function roleSupported() {
    return ["admin", "ortu"].includes(getRole());
  }

  function getUserKey() {
    const user = window.currentUser || {};
    return String(
      user.id ||
      user.user_id ||
      user.email ||
      getRole()
    );
  }

  function scheduleRefresh(reason) {
    clearTimeout(refreshTimer);

    refreshTimer = setTimeout(async () => {
      if (!window.supabase || !roleSupported()) return;
      if (typeof window.loadNotifikasi !== "function") return;

      try {
        await window.loadNotifikasi();
        console.log("Gantariku: notifikasi diperbarui", reason || "");
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
    startedKey = "";
  }

  function startRealtime() {
    if (!window.supabase || !roleSupported()) return;

    const key = `${getRole()}:${getUserKey()}`;

    if (channel && startedKey === key) return;

    stopRealtime();
    startedKey = key;

    channel = window.supabase
      .channel(`gantariku-notifikasi-${getRole()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spp"
        },
        () => scheduleRefresh("spp berubah")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "perkembangan"
        },
        () => scheduleRefresh("perkembangan berubah")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "absensi"
        },
        () => scheduleRefresh("absensi siswa berubah")
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "absensi_guru"
        },
        () => scheduleRefresh("absensi guru berubah")
      )
      .subscribe((status) => {
        console.log("Gantariku notifikasi realtime:", status);

        if (status === "SUBSCRIBED") {
          scheduleRefresh("realtime tersambung");
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(
            "Gantariku: Supabase Realtime belum aktif untuk salah satu tabel. Fallback polling tetap berjalan."
          );
        }
      });
  }

  function startPollingFallback() {
    clearInterval(pollingTimer);

    pollingTimer = setInterval(() => {
      if (!window.supabase || !roleSupported()) return;

      // Polling hanya sebagai pengaman. Saat Realtime aktif,
      // refresh tetap dilakukan sangat jarang (15 detik).
      scheduleRefresh("fallback 15 detik");
      startRealtime();
    }, POLLING_INTERVAL);
  }

  function boot() {
    if (!window.supabase || !roleSupported()) return;

    startRealtime();
    startPollingFallback();
    scheduleRefresh("initial sync");
  }

  // Auth/login pada aplikasi selesai secara asynchronous.
  bootTimer = setInterval(() => {
    if (!window.supabase || !roleSupported()) return;
    boot();
  }, 500);

  // Tidak perlu memeriksa login terus-menerus setelah 60 detik.
  setTimeout(() => {
    clearInterval(bootTimer);
  }, 60000);

  // Saat tab kembali aktif, sinkronkan badge.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      boot();
    }
  });

  window.addEventListener("focus", () => {
    boot();
  });

  window.gantarikuStartNotifikasiRealtime = boot;
  window.gantarikuStopNotifikasiRealtime = stopRealtime;
})();
