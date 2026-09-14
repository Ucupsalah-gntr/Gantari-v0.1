// ============================================================
// GANTARIKU — APPLICATION STATE
// Shared runtime state. Keep data here intentionally small and explicit.
// ============================================================

var AppState = {
  user: null,
  role: null,
  nav: "dasbor",
  siswa: [],
  orangTua: []
};

// Backward-compatible aliases for existing feature modules.
// New code should prefer AppState.
var currentUser = null;
var currentUserRole = null;
var currentNav = "dasbor";
var semuaSiswa = [];
var semuaOrangTua = [];
