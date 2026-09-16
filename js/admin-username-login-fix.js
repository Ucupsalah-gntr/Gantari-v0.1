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

  function prepareLoginInput() {
    const input = document.getElementById("loginEmail");
    if (!input) return;

    // Username bukan alamat email, jadi matikan validasi email HTML5
    // agar form tetap bisa disubmit saat Admin mengetik username.
    input.type = "text";
    input.setAttribute("autocomplete", "username");
    input.setAttribute("placeholder", "Email atau username Admin");
  }

  // auth.js membuat form login secara dinamis, jadi pantau DOM.
  const observer = new MutationObserver(prepareLoginInput);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  prepareLoginInput();

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
      // Handler asli tetap menjalankan seluruh proses login yang sudah stabil.
      emailInput.value = ADMIN_AUTH_EMAIL;
    },
    true
  );

  // Kembalikan username yang diketik setelah event utama sempat membaca email.
  document.addEventListener(
    "submit",
    function (event) {
      const form = event.target;
      if (!form || form.id !== "loginForm") return;

      // Jangan mengganggu submit email biasa.
      const input = document.getElementById("loginEmail");
      if (!input) return;

      // Delay cukup panjang agar handler login asli selesai membaca value.
      setTimeout(() => {
        if (document.body.contains(input)) {
          input.type = "text";
        }
      }, 500);
    },
    false
  );
})();
