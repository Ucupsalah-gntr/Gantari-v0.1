// ============================================================
// GANTARIKU — STATUS SPP ORANG TUA REALTIME FIX
// Memperbarui halaman Status SPP tanpa refresh manual.
// Hanya aktif untuk role orang tua dan saat halaman spp-anak terbuka.
// ============================================================

(function () {
  "use strict";

  let channel = null;
  let startedKey = "";
  let refreshTimer = null;
  let loading = false;
  let refreshAgain = false;

  const REFRESH_DELAY = 450;

  function getRole() {
    try {
      if (typeof currentUserRole !== "undefined" && currentUserRole) {
        return String(currentUserRole).toLowerCase();
      }
    } catch (_) {}

    return String(window.currentUserRole || "").toLowerCase();
  }

  function getUserKey() {
    try {
      if (typeof currentUser !== "undefined" && currentUser) {
        return String(
          currentUser.user_id ||
          currentUser.id ||
          currentUser.email ||
          "ortu"
        );
      }
    } catch (_) {}

    return "ortu";
  }

  function getCurrentNav() {
    try {
      if (typeof currentNav !== "undefined" && currentNav) {
        return String(currentNav);
      }
    } catch (_) {}

    return String(window.currentNav || "");
  }

  function isStatusSppPage() {
    return getRole() === "ortu" && getCurrentNav() === "spp-anak";
  }

  async function refreshStatusSpp(reason) {
    if (!window.supabase || !isStatusSppPage()) return;

    if (loading) {
      refreshAgain = true;
      return;
    }

    const loader =
      window.__app && typeof window.__app.loadSppAnak === "function"
        ? window.__app.loadSppAnak
        : window.loadSppAnak;

    if (typeof loader !== "function") return;

    loading = true;
    refreshAgain = false;

    try {
      await loader();
      console.log("Gantariku: Status SPP diperbarui", reason || "");
    } catch (error) {
      console.error("Gantariku: refresh Status SPP gagal:", error);
    } finally {
      loading = false;

      if (refreshAgain && isStatusSppPage()) {
        scheduleRefresh("ada perubahan saat refresh berjalan");
      }
    }
  }

  function scheduleRefresh(reason) {
    if (!isStatusSppPage()) return;

    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshStatusSpp(reason);
    }, REFRESH_DELAY);
  }

  function stopRealtime() {
    clearTimeout(refreshTimer);

    if (channel && window.supabase) {
      try {
        window.supabase.removeChannel(channel);
      } catch (error) {
        console.warn("Gantariku: gagal melepas channel Status SPP:", error);
      }
    }

    channel = null;
    startedKey = "";
  }

  function startRealtime() {
    if (!window.supabase || getRole() !== "ortu") return;

    const key = `ortu:${getUserKey()}`;

    if (channel && startedKey === key) return;

    stopRealtime();
    startedKey = key;

    channel = window.supabase
      .channel(`gantariku-spp-ortu-${getUserKey()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spp"
        },
        () => scheduleRefresh("data SPP berubah")
      )
      .subscribe((status) => {
        console.log("Gantariku Status SPP realtime:", status);

        if (status === "SUBSCRIBED") {
          scheduleRefresh("realtime tersambung");
        }
      });
  }

  function boot() {
    if (!window.supabase || getRole() !== "ortu") {
      stopRealtime();
      return;
    }

    startRealtime();

    if (isStatusSppPage()) {
      scheduleRefresh("sinkronisasi halaman");
    }
  }

  // Setelah login dan setelah router berpindah halaman, sinkronisasi tetap dicoba.
  const originalGoTo =
    window.__app && typeof window.__app.goTo === "function"
      ? window.__app.goTo
      : null;

  if (originalGoTo) {
    window.__app.goTo = function () {
      const result = originalGoTo.apply(this, arguments);
      setTimeout(boot, 60);
      return result;
    };
  }

  const bootTimer = setInterval(() => {
    if (!window.supabase || getRole() !== "ortu") return;

    boot();
    clearInterval(bootTimer);
  }, 500);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) boot();
  });

  window.addEventListener("focus", boot);

  window.addEventListener("beforeunload", stopRealtime);

  window.gantarikuStartSppOrtuRealtime = boot;
  window.gantarikuStopSppOrtuRealtime = stopRealtime;
})();
