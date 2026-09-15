// ============================================================
// GANTARIKU — SHARED HTML ESCAPE HELPER
// ============================================================
// Dipakai oleh modul yang menampilkan data database ke HTML.
// Menjaga nama/email/data lain tidak dirender sebagai HTML mentah.

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
