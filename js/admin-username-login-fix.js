// ============================================================
// GANTARIKU — ADMIN USERNAME LOGIN FIX
// Admin dapat login dengan username tanpa mengubah Supabase Auth.
// Guru + Orang Tua tetap memakai mekanisme email yang lama.
// ============================================================

(function () {
  "use strict";

  const ADMIN_USERNAME = "IbukEkaCantik";
  const ADMIN_AUTH_EMAIL = "admin@sekolah.id";

  function normalise(value) {
    return String(value || "").trim().toLowerCase();
  }

  document.addEventListener(
    "submit",
    function (event) {
      const form = event.target;

      if (!form || form.id !== "loginForm") return;

      const emailInput = document.getElementById("loginEmail");
      if (!emailInput) return;

      if (normalise(emailInput.value) !== normalise(ADMIN_USERNAME)) {
        return;
      }

      // Ubah hanya nilai yang dibaca handleLogin() menjadi email Auth Admin.
      // Handler asli tetap menjalankan seluruh proses login, role check,
      // render aplikasi, realtime notification, dan logout yang sudah stabil.
      emailInput.value = ADMIN_AUTH_EMAIL;
    },
    true
  );

  // Sedikit penjelasan di UI tanpa mengubah alur login lama.
  document.addEventListener("input", function (event) {
    const input = event.target;
    if (!input || input.id !== "loginEmail") return;

    input.setAttribute(
      "placeholder",
      "Email atau username Admin"
    );
  });
})();
