// ============================================================
// GANTARIKU — BERANDA GURU / BU VIKA
// Visual + navigation helper only. Tidak mengubah data transaksi.
// ============================================================

function guruEscape(value) {
  if (typeof escapeHtml === "function") return escapeHtml(value ?? "");
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderBerandaGuru() {
  const name = guruEscape(currentUser?.nama || "Bu Vika");
  const now = typeof getNowWIB === "function" ? getNowWIB() : new Date();
  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(now);

  return `
    <div id="guruHome">
      <section class="guru-welcome-hero">
        <div class="guru-welcome-copy">
          <div class="guru-eyebrow">
            Gantari · Ruang Kerja Guru
          </div>

          <h2>Selamat datang, ${name} <span aria-hidden="true">🌼</span></h2>

          <p>
            Semoga hari ini menjadi hari yang menyenangkan
            untuk belajar dan menari bersama anak-anak.
          </p>

          <div class="guru-date-chip">${guruEscape(dateLabel)}</div>
        </div>

        <div class="guru-welcome-art" aria-hidden="true">
          <div class="guru-art-glow"></div>
          <div class="guru-teacher-emblem">
            <span class="guru-teacher-emblem-icon">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <use href="assets/gantariku-icons.svg#icon-teacher"></use>
              </svg>
            </span>
            <span>Bu Vika</span>
          </div>
          <img
            src="assets/dashboard-character.png"
            alt=""
            loading="lazy"
          >
        </div>
      </section>

      <div class="guru-home-grid">

        <section class="guru-card guru-today-card">
          <div class="guru-card-head">
            <span class="guru-card-icon teacher">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <use href="assets/gantariku-icons.svg#icon-teacher"></use>
              </svg>
            </span>
            <div>
              <div class="guru-card-title">Hari Ini</div>
              <div class="guru-card-sub">Kehadiran Bu Vika</div>
            </div>
          </div>

          <div class="guru-today-status">
            <span class="guru-status-check">✓</span>
            <div>
              <strong>Siap mendampingi anak-anak</strong>
              <span>Catat kehadiran saat kelas dimulai.</span>
            </div>
          </div>
        </section>

        <section class="guru-card guru-action-card">
          <div class="guru-card-head">
            <span class="guru-card-icon action">
              <img src="assets/icon-orangtua-kehadiran.png" alt="">
            </span>
            <div>
              <div class="guru-card-title">Yang Perlu Bu Vika Lakukan</div>
              <div class="guru-card-sub">Akses cepat untuk kegiatan utama</div>
            </div>
          </div>

          <div class="guru-actions">
            <button type="button" class="guru-action" onclick="window.__app.goTo('input-absen')">
              <span class="guru-action-icon blue">
                <img src="assets/icon-orangtua-kehadiran.png" alt="">
              </span>
              <span>
                <strong>Input Absensi</strong>
                <small>Catat kehadiran anak-anak</small>
              </span>
              <b>→</b>
            </button>

            <button type="button" class="guru-action" onclick="window.__app.goTo('perkembangan-input')">
              <span class="guru-action-icon green">
                <img src="assets/icon-orangtua-perkembangan.png" alt="">
              </span>
              <span>
                <strong>Perkembangan Anak</strong>
                <small>Isi catatan perkembangan siswa</small>
              </span>
              <b>→</b>
            </button>
          </div>
        </section>

        <section class="guru-card guru-message-card">
          <div class="guru-message-flower" aria-hidden="true">
            <img src="assets/gantariku-decoration-elements.png" alt="">
          </div>
          <p>
            “Setiap anak punya waktunya masing-masing
            untuk bersinar.”
          </p>
          <span>Terima kasih sudah menemani mereka, Bu Vika. 🌱</span>
        </section>

        <section class="guru-card guru-journey-card">
          <div class="guru-card-head">
            <span class="guru-card-icon growth">
              <img src="assets/icon-orangtua-perkembangan.png" alt="">
            </span>
            <div>
              <div class="guru-card-title">Perjalanan Belajar Anak-anak</div>
              <div class="guru-card-sub">Sedikit demi sedikit, mereka bertumbuh.</div>
            </div>
          </div>

          <p>
            Catatan kecil hari ini bisa menjadi bagian penting
            dari perjalanan mereka di masa depan.
          </p>

          <button type="button" class="guru-soft-link" onclick="window.__app.goTo('perkembangan-input')">
            Lihat perkembangan anak →
          </button>
        </section>

        <section class="guru-card guru-agenda-card">
          <div class="guru-card-head">
            <span class="guru-card-icon agenda">
              <img src="assets/icon-orangtua-kehadiran.png" alt="">
            </span>
            <div>
              <div class="guru-card-title">Fokus Hari Ini</div>
              <div class="guru-card-sub">Ruang kerja Bu Vika</div>
            </div>
          </div>

          <div class="guru-agenda-list">
            <div><span>01</span><strong>Input absensi kelas</strong><small>Mulai dari kelas yang sedang berjalan.</small></div>
            <div><span>02</span><strong>Amati perkembangan anak</strong><small>Tambahkan catatan kecil yang bermakna.</small></div>
            <div><span>03</span><strong>Rapikan catatan</strong><small>Pastikan data hari ini sudah tersimpan.</small></div>
          </div>
        </section>

        <section class="guru-bottom-banner">
          <div>
            <strong>Ruang kecil untuk guru yang berdampak besar.</strong>
            <span>Gantariku membantu Bu Vika fokus pada anak, bukan pada kerumitan administrasi.</span>
          </div>
          <img src="assets/gantariku-decoration-elements.png" alt="" aria-hidden="true">
        </section>

      </div>
    </div>
  `;
}
