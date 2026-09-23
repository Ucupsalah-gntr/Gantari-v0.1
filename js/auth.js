/* ============================================================
   GANTARIKU - AUTH.JS
   Login + Register Orang Tua
   Cocok dengan app.js saat ini
   Logo tidak memakai file eksternal
   ============================================================ */


/* ============================================================
   LOAD PROFILE PENGGUNA
   ============================================================ */

async function loadUserProfile(userId) {

  if (!userId) return null;

  try {

    const { data, error } = await supabase
      .from("pengguna")
      .select(`
        id,
        user_id,
        nama,
        email,
        role,
        nomor_hp,
        alamat
      `)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {

      console.error(
        "Profile error:",
        error
      );

      return null;
    }

    return data || null;

  } catch (error) {

    console.error(
      "loadUserProfile error:",
      error
    );

    return null;
  }
}


/* ============================================================
   TOGGLE PASSWORD
   ============================================================ */

function togglePassword(inputId, button) {

  const input =
    document.getElementById(inputId);

  if (!input || !button) return;

  if (input.type === "password") {

    input.type = "text";

    button.textContent = "🙈";

    button.setAttribute(
      "aria-label",
      "Sembunyikan password"
    );

  } else {

    input.type = "password";

    button.textContent = "👁";

    button.setAttribute(
      "aria-label",
      "Tampilkan password"
    );

  }
}


/* ============================================================
   STYLE
   ============================================================ */

function injectAuthStyles() {

  if (
    document.getElementById(
      "gantariku-auth-style"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "gantariku-auth-style";

  style.textContent = `

    .gtr-auth-page {
      min-height: 100vh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 24px;

      position: relative;
      overflow: hidden;

      background:
        radial-gradient(circle at 12% 14%, rgba(255, 209, 47, .28), transparent 27%),
        radial-gradient(circle at 88% 86%, rgba(101, 169, 199, .22), transparent 30%),
        radial-gradient(circle at 52% 8%, rgba(168, 215, 177, .20), transparent 24%),
        linear-gradient(135deg, #FFF7D6 0%, #FFFDF8 52%, #EAF6F0 100%);
    }


    .gtr-auth-card {

      position: relative;
      z-index: 3;
      width: 100%;
      max-width: 470px;

      box-sizing: border-box;

      background: #fffaf1;

      border-radius: 30px;

      padding: 34px;

      box-shadow:
        0 25px 70px
        rgba(0,0,0,.22);
    }


    /* ========================================================
       LOGO
       ======================================================== */

    .gtr-auth-page::after{
      content:"";
      position:absolute;
      right:-40px;
      bottom:-36px;
      width:min(58vw,760px);
      height:min(58vw,760px);
      background:url("assets/illustration-gambang-semarang.svg") right bottom / contain no-repeat;
      z-index:1;
      pointer-events:none;
      opacity:.98;
    }

    .gtr-brand {

      display: flex;

      flex-direction: column;

      align-items: center;

      justify-content: center;

      margin-bottom: 25px;
    }


    .gtr-logo-box {

      display: flex;

      align-items: center;

      justify-content: center;

      background: #fff;

      border-radius: 18px;

      padding: 12px 22px;

      box-shadow:
        0 8px 22px
        rgba(0,0,0,.08);

      margin-bottom: 16px;
    }


    .gtr-logo-icon {

      width: 54px;

      height: 54px;

      border-radius: 15px;

      display: flex;

      align-items: center;

      justify-content: center;

      background:
        linear-gradient(
          135deg,
          #f0c24f,
          #d49a42
        );

      font-size: 28px;

      margin-right: 12px;

      box-shadow:
        0 5px 12px
        rgba(182,133,50,.20);
    }


    .gtr-logo-text {

      display: flex;

      flex-direction: column;

      line-height: 1;
    }


    .gtr-logo-name {

      font-family:
        "Space Grotesk",
        Inter,
        sans-serif;

      font-size: 28px;

      font-weight: 800;

      color: #403935;

      letter-spacing: -.7px;
    }


    .gtr-logo-sub {

      margin-top: 5px;

      font-size: 10px;

      font-weight: 600;

      color: #887466;

      letter-spacing: .1px;
    }


    /* ========================================================
       TITLE
       ======================================================== */

    .gtr-auth-title {

      margin: 0;

      text-align: center;

      font-size: 24px;

      line-height: 1.25;

      font-weight: 800;

      color: #463a35;
    }


    .gtr-auth-subtitle {

      margin: 7px 0 24px;

      text-align: center;

      font-size: 14px;

      line-height: 1.5;

      color: #826f64;
    }


    /* ========================================================
       FORM
       ======================================================== */

    .gtr-auth-form {

      display: flex;

      flex-direction: column;

      gap: 14px;
    }


    .gtr-auth-field {

      display: flex;

      flex-direction: column;

      gap: 7px;
    }


    .gtr-auth-field label {

      font-size: 13px;

      font-weight: 700;

      color: #5b4b42;
    }


    .gtr-auth-input-wrap {

      position: relative;

      width: 100%;
    }


    .gtr-auth-input {

      width: 100%;

      height: 46px;

      box-sizing: border-box;

      border: 1px solid #dfd0bf;

      border-radius: 13px;

      background: #fff;

      color: #403833;

      padding: 0 14px;

      font-size: 14px;

      outline: none;

      transition: .2s ease;
    }


    .gtr-auth-input.password-input {

      padding-right: 48px;
    }


    .gtr-auth-input:focus {

      border-color: #bd8249;

      box-shadow:
        0 0 0 3px
        rgba(189,130,73,.12);
    }


    /* ========================================================
       PASSWORD BUTTON
       ======================================================== */

    .gtr-auth-eye {

      position: absolute;

      right: 7px;

      top: 50%;

      transform:
        translateY(-50%);

      width: 34px;

      height: 34px;

      display: flex;

      align-items: center;

      justify-content: center;

      border: none;

      border-radius: 9px;

      background: transparent;

      color: #756258;

      font-size: 17px;

      cursor: pointer;
    }


    .gtr-auth-eye:hover {

      background: #f8eee1;
    }


    /* ========================================================
       BUTTON
       ======================================================== */

    .gtr-auth-button {

      width: 100%;

      height: 46px;

      box-sizing: border-box;

      border-radius: 13px;

      font-size: 14px;

      font-weight: 800;

      cursor: pointer;

      transition: .2s ease;
    }


    .gtr-auth-primary {

      border: none;

      background: #bd8249;

      color: #fff;

      margin-top: 4px;
    }


    .gtr-auth-primary:hover {

      transform:
        translateY(-1px);

      filter:
        brightness(.97);
    }


    .gtr-auth-secondary {

      border: 1px solid #d9b58f;

      background: transparent;

      color: #9d6838;
    }


    .gtr-auth-secondary:hover {

      background: #fff1df;
    }


    /* ========================================================
       MESSAGE
       ======================================================== */

    .gtr-auth-message {

      display: none;

      padding: 11px 13px;

      border-radius: 12px;

      font-size: 13px;

      line-height: 1.45;

      margin-bottom: 2px;
    }


    .gtr-auth-message.show {

      display: block;
    }


    .gtr-auth-error {

      background: #fff0ed;

      border:
        1px solid #efc5bd;

      color: #9d473b;
    }


    .gtr-auth-success {

      background: #edf8e9;

      border:
        1px solid #c5ddbb;

      color: #4e753f;
    }


    /* ========================================================
       DIVIDER
       ======================================================== */

    .gtr-auth-divider {

      display: flex;

      align-items: center;

      gap: 10px;

      margin: 20px 0;

      color: #a08e80;

      font-size: 12px;
    }


    .gtr-auth-divider::before,
    .gtr-auth-divider::after {

      content: "";

      flex: 1;

      height: 1px;

      background: #e2d7cc;
    }


    /* ========================================================
       BOTTOM NOTE
       ======================================================== */

    .gtr-auth-note {

      margin-top: 10px;

      text-align: center;

      color: #9c8d80;

      font-size: 11px;

      line-height: 1.5;
    }


    .gtr-auth-back {

      margin-top: 15px;

      text-align: center;

      color: #827267;

      font-size: 13px;
    }


    .gtr-auth-link {

      border: none;

      background: none;

      color: #a76c38;

      font-size: inherit;

      font-weight: 800;

      cursor: pointer;

      padding: 0;
    }


    .gtr-auth-link:hover {

      text-decoration:
        underline;
    }


    .gtr-auth-loading {

      opacity: .65;

      pointer-events: none;
    }


    /* ========================================================
       MOBILE
       ======================================================== */

    @media (max-width: 760px) {
      .gtr-auth-page::after{
        right:-120px;
        bottom:-50px;
        width:520px;
        height:520px;
        opacity:.14;
      }
    }

    @media (max-width: 520px) {

      .gtr-auth-page {

        padding: 14px;
      }


      .gtr-auth-card {

        padding: 24px 18px;

        border-radius: 24px;
      }


      .gtr-logo-name {

        font-size: 24px;
      }


      .gtr-logo-icon {

        width: 48px;

        height: 48px;

        font-size: 24px;
      }

    }

  `;

  document.head.appendChild(style);
}


/* ============================================================
   MESSAGE HELPER
   ============================================================ */

function setAuthMessage(
  message,
  type = "error"
) {

  const box =
    document.getElementById(
      "authMessage"
    );

  if (!box) return;

  box.textContent =
    message || "";

  box.className =
    "gtr-auth-message show " +
    (
      type === "success"
        ? "gtr-auth-success"
        : "gtr-auth-error"
    );
}


function clearAuthMessage() {

  const box =
    document.getElementById(
      "authMessage"
    );

  if (!box) return;

  box.textContent = "";

  box.className =
    "gtr-auth-message";
}


/* ============================================================
   BRAND HTML
   ============================================================ */

function renderGantariBrand() {

  return `

    <div class="gtr-brand">

      <div class="gtr-logo-box">

        <img
          src="assets/logo-gantari.png"
          alt="Gantari — Rumah Belajar Inklusi"
          style="display:block;width:min(270px,82vw);height:auto;max-height:88px;object-fit:contain;"
        >

        <div class="gtr-logo-text" style="display:none;">

          <div class="gtr-logo-name">
            Gantari
          </div>

          <div class="gtr-logo-sub">
            Rumah Belajar Inklusi
          </div>

        </div>

      </div>

    </div>

  `;
}


/* ============================================================
   LOGIN PAGE HTML
   ============================================================ */

function renderLoginPage() {

  injectAuthStyles();

  return `

    <div class="gtr-auth-page">

      <div class="gtr-auth-card">

        ${renderGantariBrand()}


        <h1 class="gtr-auth-title">
          Selamat Datang di Gantariku
        </h1>


        <p class="gtr-auth-subtitle">
          Rumah Belajar Inklusi
        </p>


        <div
          id="authMessage"
          class="gtr-auth-message"
        ></div>


        <form
          id="loginForm"
          class="gtr-auth-form"
        >

          <div class="gtr-auth-field">

            <label for="loginEmail">
              Email
            </label>

            <input
              type="email"
              id="loginEmail"
              class="gtr-auth-input"
              placeholder="Masukkan email"
              autocomplete="email"
              required
            >

          </div>


          <div class="gtr-auth-field">

            <label for="loginPassword">
              Password
            </label>

            <div class="gtr-auth-input-wrap">

              <input
                type="password"
                id="loginPassword"
                class="gtr-auth-input password-input"
                placeholder="Masukkan password"
                autocomplete="current-password"
                required
              >

              <button
                type="button"
                class="gtr-auth-eye"
                onclick="
                  togglePassword(
                    'loginPassword',
                    this
                  )
                "
                aria-label="Tampilkan password"
              >
                👁
              </button>

            </div>

          </div>


          <button
            type="submit"
            id="loginButton"
            class="gtr-auth-button gtr-auth-primary"
          >
            Masuk
          </button>

        </form>


        <div class="gtr-auth-divider">
          atau
        </div>


        <button
          type="button"
          class="gtr-auth-button gtr-auth-secondary"
          onclick="renderRegister()"
        >
          Daftar sebagai Orang Tua
        </button>


        <div class="gtr-auth-note">
          Orang tua dapat membuat akun sendiri,
          kemudian menghubungkan anak dengan kode akses.
        </div>

      </div>

    </div>

  `;
}


/* ============================================================
   RENDER LOGIN
   ============================================================ */

function renderLogin() {

  injectAuthStyles();

  const app =
    document.getElementById(
      "app"
    );

  if (!app) return;

  app.innerHTML =
    renderLoginPage();


  const form =
    document.getElementById(
      "loginForm"
    );

  if (form) {

    form.addEventListener(
      "submit",
      handleLogin
    );

  }
}


/* ============================================================
   LOGIN HANDLER
   ============================================================ */

async function handleLogin(event) {

  event.preventDefault();

  clearAuthMessage();


  const emailInput =
    document.getElementById(
      "loginEmail"
    );

  const passwordInput =
    document.getElementById(
      "loginPassword"
    );

  const button =
    document.getElementById(
      "loginButton"
    );


  if (
    !emailInput ||
    !passwordInput ||
    !button
  ) {
    return;
  }


  const email =
    emailInput.value
      .trim()
      .toLowerCase();

  const password =
    passwordInput.value;


  if (!email || !password) {

    setAuthMessage(
      "Email dan password harus diisi."
    );

    return;
  }


  button.disabled = true;

  button.textContent =
    "Memproses...";

  button.classList.add(
    "gtr-auth-loading"
  );


  try {

    if (
      typeof supabase ===
      "undefined" ||
      !supabase?.auth
    ) {

      throw new Error(
        "Supabase belum tersedia."
      );

    }


    const {
      data,
      error
    } =
      await supabase.auth
        .signInWithPassword({
          email,
          password
        });


    if (error) {

      throw new Error(
        "Email atau password salah."
      );

    }


    if (!data?.user) {

      throw new Error(
        "Akun pengguna tidak ditemukan."
      );

    }


    const profile =
      await loadUserProfile(
        data.user.id
      );


    if (!profile) {

      await supabase.auth.signOut();

      throw new Error(
        "Profil pengguna tidak ditemukan. Hubungi admin sekolah."
      );

    }


    currentUser =
      profile;

    currentUserRole =
      profile.role;


    if (
      typeof NAV_CONFIG !==
      "undefined" &&
      !NAV_CONFIG[currentUserRole]
    ) {

      await supabase.auth.signOut();

      currentUser = null;

      currentUserRole = null;

      throw new Error(
        "Role akun tidak dikenali."
      );

    }


    if (
      typeof NAV_CONFIG !==
      "undefined" &&
      NAV_CONFIG[currentUserRole]?.[0]?.id
    ) {

      currentNav =
        NAV_CONFIG[
          currentUserRole
        ][0].id;

    } else {

      currentNav =
        "dasbor";

    }


    renderApp();


    if (
      typeof startRealtimeNotifications ===
      "function"
    ) {

      try {

        startRealtimeNotifications();

      } catch (error) {

        console.warn(
          "Realtime gagal dimulai:",
          error
        );

      }

    }


  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    try {

      if (
        typeof supabase !==
        "undefined" &&
        supabase?.auth
      ) {

        await supabase.auth
          .signOut();

      }

    } catch (e) {}


    currentUser = null;

    currentUserRole = null;


    setAuthMessage(
      error?.message ||
      "Login gagal."
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "Masuk";

    button.classList.remove(
      "gtr-auth-loading"
    );

  }
}


/* ============================================================
   REGISTER PAGE
   ============================================================ */

function renderRegister() {

  injectAuthStyles();

  const app =
    document.getElementById(
      "app"
    );

  if (!app) return;


  app.innerHTML = `

    <div class="gtr-auth-page">

      <div class="gtr-auth-card">

        ${renderGantariBrand()}


        <h1 class="gtr-auth-title">
          Daftar Akun Orang Tua
        </h1>


        <p class="gtr-auth-subtitle">
          Buat akun untuk memantau
          anak melalui Gantariku.
        </p>


        <div
          id="authMessage"
          class="gtr-auth-message"
        ></div>


        <form
          id="registerForm"
          class="gtr-auth-form"
        >

          <div class="gtr-auth-field">

            <label for="registerNama">
              Nama Orang Tua
            </label>

            <input
              type="text"
              id="registerNama"
              class="gtr-auth-input"
              placeholder="Nama lengkap"
              autocomplete="name"
              required
            >

          </div>


          <div class="gtr-auth-field">

            <label for="registerEmail">
              Email
            </label>

            <input
              type="email"
              id="registerEmail"
              class="gtr-auth-input"
              placeholder="Email aktif"
              autocomplete="email"
              required
            >

          </div>


          <div class="gtr-auth-field">

            <label for="registerPassword">
              Password
            </label>

            <div class="gtr-auth-input-wrap">

              <input
                type="password"
                id="registerPassword"
                class="gtr-auth-input password-input"
                placeholder="Minimal 8 karakter"
                autocomplete="new-password"
                minlength="8"
                required
              >

              <button
                type="button"
                class="gtr-auth-eye"
                onclick="
                  togglePassword(
                    'registerPassword',
                    this
                  )
                "
                aria-label="Tampilkan password"
              >
                👁
              </button>

            </div>

          </div>


          <div class="gtr-auth-field">

            <label for="registerPassword2">
              Ulangi Password
            </label>

            <div class="gtr-auth-input-wrap">

              <input
                type="password"
                id="registerPassword2"
                class="gtr-auth-input password-input"
                placeholder="Ulangi password"
                autocomplete="new-password"
                minlength="8"
                required
              >

              <button
                type="button"
                class="gtr-auth-eye"
                onclick="
                  togglePassword(
                    'registerPassword2',
                    this
                  )
                "
                aria-label="Tampilkan password"
              >
                👁
              </button>

            </div>

          </div>


          <button
            type="submit"
            id="registerButton"
            class="gtr-auth-button gtr-auth-primary"
          >
            Buat Akun
          </button>

        </form>


        <div class="gtr-auth-back">

          Sudah punya akun?

          <button
            type="button"
            class="gtr-auth-link"
            onclick="renderLogin()"
          >
            Kembali ke Login
          </button>

        </div>

      </div>

    </div>

  `;


  const form =
    document.getElementById(
      "registerForm"
    );

  if (form) {

    form.addEventListener(
      "submit",
      handleRegister
    );

  }
}


/* ============================================================
   REGISTER HANDLER
   ============================================================ */

async function handleRegister(event) {

  event.preventDefault();

  clearAuthMessage();


  const namaInput =
    document.getElementById(
      "registerNama"
    );

  const emailInput =
    document.getElementById(
      "registerEmail"
    );

  const passwordInput =
    document.getElementById(
      "registerPassword"
    );

  const password2Input =
    document.getElementById(
      "registerPassword2"
    );

  const button =
    document.getElementById(
      "registerButton"
    );


  if (
    !namaInput ||
    !emailInput ||
    !passwordInput ||
    !password2Input ||
    !button
  ) {
    return;
  }


  const nama =
    namaInput.value.trim();

  const email =
    emailInput.value
      .trim()
      .toLowerCase();

  const password =
    passwordInput.value;

  const password2 =
    password2Input.value;


  if (!nama) {

    setAuthMessage(
      "Nama orang tua wajib diisi."
    );

    return;
  }


  if (!email) {

    setAuthMessage(
      "Email wajib diisi."
    );

    return;
  }


  if (password.length < 8) {

    setAuthMessage(
      "Password minimal 8 karakter."
    );

    return;
  }


  if (password !== password2) {

    setAuthMessage(
      "Password dan konfirmasi password tidak sama."
    );

    return;
  }


  button.disabled = true;

  button.textContent =
    "Membuat akun...";

  button.classList.add(
    "gtr-auth-loading"
  );


  try {

    const {
      data,
      error
    } =
      await supabase.auth.signUp({

        email,

        password,

        options: {

          data: {

            nama: nama,

            registration_type:
              "ortu"

          }

        }

      });


    if (error) {

      throw error;
    }


    if (!data?.user) {

      throw new Error(
        "Akun gagal dibuat."
      );

    }


    /*
     * Confirm Email harus OFF.
     */

    if (!data.session) {

      throw new Error(
        "Akun berhasil dibuat tetapi belum langsung masuk. Pastikan Confirm Email di Supabase sudah OFF."
      );

    }


    currentUser =
      data.user;


    /*
     * Tunggu trigger
     * membuat profile pengguna.
     */

    let profile =
      null;


    for (
      let i = 0;
      i < 8;
      i++
    ) {

      profile =
        await loadUserProfile(
          data.user.id
        );


      if (profile) {
        break;
      }


      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );

    }


    if (!profile) {

      throw new Error(
        "Akun berhasil dibuat, tetapi profil orang tua belum siap. Coba login kembali."
      );

    }


    if (
      profile.role !==
      "ortu"
    ) {

      await supabase.auth.signOut();

      currentUser = null;

      currentUserRole = null;

      throw new Error(
        "Role akun tidak sesuai."
      );

    }


    currentUser =
      profile;

    currentUserRole =
      "ortu";


    currentNav =
      NAV_CONFIG.ortu?.[0]?.id ||
      "ringkasan";


    renderApp();


    if (
      typeof startRealtimeNotifications ===
      "function"
    ) {

      try {

        startRealtimeNotifications();

      } catch (error) {

        console.warn(
          "Realtime gagal dimulai:",
          error
        );

      }

    }


    if (
      typeof showToast ===
      "function"
    ) {

      setTimeout(() => {

        try {

          showToast(
            "Akun orang tua berhasil dibuat."
          );

        } catch (e) {}

      }, 500);

    }


  } catch (error) {

    console.error(
      "Register error:",
      error
    );


    setAuthMessage(
      error?.message ||
      "Pendaftaran gagal."
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "Buat Akun";

    button.classList.remove(
      "gtr-auth-loading"
    );

  }
}


/* ============================================================
   LOGOUT
   ============================================================ */

async function logout() {

  try {

    if (
      typeof stopRealtimeNotifications ===
      "function"
    ) {

      try {

        await stopRealtimeNotifications();

      } catch (error) {

        console.warn(
          "Realtime gagal dihentikan:",
          error
        );

      }

    }


    if (
      typeof supabase !==
      "undefined" &&
      supabase?.auth
    ) {

      const {
        error
      } =
        await supabase.auth
          .signOut();


      if (error) {

        console.error(
          "Supabase logout error:",
          error
        );

      }

    }

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  } finally {

    currentUser = null;

    currentUserRole = null;

    currentNav = "dasbor";


    try {

      if (
        typeof anakOrangTuaList !==
        "undefined"
      ) {

        anakOrangTuaList = [];

      }

    } catch (e) {}


    try {

      if (
        typeof anakTerpilihId !==
        "undefined"
      ) {

        anakTerpilihId = null;

      }

    } catch (e) {}


    renderLogin();

  }
}


/* ============================================================
   EXPORT GLOBAL
   ============================================================ */

window.loadUserProfile =
  loadUserProfile;

window.togglePassword =
  togglePassword;

window.renderLoginPage =
  renderLoginPage;

window.renderLogin =
  renderLogin;

window.renderRegister =
  renderRegister;

window.handleLogin =
  handleLogin;

window.handleRegister =
  handleRegister;

window.logout =
  logout;


/* ============================================================
   END AUTH.JS
   ============================================================ */
