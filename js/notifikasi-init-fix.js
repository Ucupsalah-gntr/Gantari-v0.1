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
  let bootKey = "";
  let adminRealtimeHandedOff = false;
  let adminTogglePatched = false;

  const REFRESH_DELAY = 450;
  const POLLING_INTERVAL = 15000;

  // currentUserRole/currentUser dideklarasikan di scope global aplikasi,
  // jadi jangan hanya mengandalkan window.currentUserRole.
  function getRole() {
    try {
      if (typeof currentUserRole !== "undefined" && currentUserRole) {
        return String(currentUserRole).toLowerCase();
      }
    } catch (_) {}

    return String(window.currentUserRole || "").toLowerCase();
  }

  function getCurrentUser() {
    try {
      if (typeof currentUser !== "undefined" && currentUser) {
        return currentUser;
      }
    } catch (_) {}

    return window.currentUser || {};
  }

  function roleSupported() {
    return ["admin", "ortu"].includes(getRole());
  }

  function getUserKey() {
    const user = getCurrentUser();
    return String(
      user.id ||
      user.user_id ||
      user.email ||
      getRole()
    );
  }

  function getSessionKey() {
    return `${getRole()}:${getUserKey()}`;
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
    // Jangan mereset bootKey di sini.
    // Jika channel realtime reconnect, kita tidak ingin memicu
    // "initial sync" berulang yang membuat UI berkedip.
  }

  function handoffAdminRealtime() {
    if (getRole() !== "admin" || adminRealtimeHandedOff) return;

    // Sebelumnya Admin sudah punya realtime lama dari export-notifikasi.js.
    // Matikan channel lama sekali, lalu gunakan channel stabil di file ini.
    if (typeof window.stopRealtimeNotifications === "function") {
      try {
        window.stopRealtimeNotifications();
      } catch (error) {
        console.warn("Gantariku: gagal menghentikan realtime Admin lama:", error);
      }
    } else if (typeof stopRealtimeNotifications === "function") {
      try {
        stopRealtimeNotifications();
      } catch (error) {
        console.warn("Gantariku: gagal menghentikan realtime Admin lama:", error);
      }
    }

    adminRealtimeHandedOff = true;
  }

  function patchAdminToggle() {
    if (getRole() !== "admin" || adminTogglePatched) return;

    const app = window.__app;
    if (!app || typeof app.toggleNotifikasi !== "function") return;

    const originalToggle = app.toggleNotifikasi;

    app.toggleNotifikasi = function (...args) {
      // Pakai wrapper UX yang sudah dipasang ke window.toggleNotifikasi.
      if (typeof window.toggleNotifikasi === "function") {
        return window.toggleNotifikasi(...args);
      }

      return originalToggle.apply(this, args);
    };

    adminTogglePatched = true;
  }

  function startRealtime() {
    if (!window.supabase || !roleSupported()) return;

    const key = getSessionKey();

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
          channel = null;
          startedKey = "";
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

      scheduleRefresh("fallback 15 detik");
      startRealtime();
    }, POLLING_INTERVAL);
  }

  function boot(forceRefresh = false) {
    if (!window.supabase || !roleSupported()) return;

    const key = getSessionKey();
    const isNewSession = bootKey !== key;

    handoffAdminRealtime();
    patchAdminToggle();
    startRealtime();

    if (isNewSession || !pollingTimer) {
      bootKey = key;
      startPollingFallback();
      scheduleRefresh("initial sync");
      return;
    }

    if (forceRefresh) {
      scheduleRefresh("focus/visibility sync");
    }
  }

  // Auth/login pada aplikasi selesai secara asynchronous.
  // Poll ini hanya menunggu sampai role tersedia. Setelah boot pertama,
  // ia tidak lagi memicu "initial sync" terus-menerus.
  bootTimer = setInterval(() => {
    if (!window.supabase || !roleSupported()) return;
    boot(false);
  }, 500);

  setTimeout(() => {
    clearInterval(bootTimer);
  }, 60000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      boot(true);
    }
  });

  window.addEventListener("focus", () => {
    boot(true);
  });

  window.gantarikuStartNotifikasiRealtime = boot;
  window.gantarikuStopNotifikasiRealtime = stopRealtime;
})();
