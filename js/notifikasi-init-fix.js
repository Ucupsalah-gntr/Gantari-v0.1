// ============================================================
// GANTARIKU — NOTIFIKASI AUTO INIT
// Badge notifikasi dimuat otomatis setelah role/login siap.
// ============================================================

(function () {
  let attempts = 0;
  const maxAttempts = 40;

  const timer = setInterval(() => {
    attempts += 1;

    if (!window.supabase || !window.currentUserRole) {
      if (attempts >= maxAttempts) clearInterval(timer);
      return;
    }

    clearInterval(timer);

    setTimeout(() => {
      if (typeof window.loadNotifikasi !== "function") return;
      window.loadNotifikasi().catch((error) => {
        console.error("Gantariku: auto-load notifikasi gagal:", error);
      });
    }, 350);
  }, 250);
})();
