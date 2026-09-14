// ============================================================
// SUPABASE CONFIGURATION
// ============================================================
var SUPABASE_URL = "https://uwrbirojmuudshhrrcgt.supabase.co";
var SUPABASE_ANON_KEY = "sb_publishable_SP0aUTX9jn9p1Kzv74S_Fg_eT4Hrs5E";

var isConfigured =
  /^https:\/\/.+\.supabase\.co$/.test(SUPABASE_URL) &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.includes("PASTE_YOUR");

var supabase = null;

// Seluruh aplikasi menunggu Promise ini sehingga file-file JS lain
// boleh dipisah tanpa risiko Supabase belum selesai dimuat.
var gantarikuSupabaseReady = (async function () {
  if (!isConfigured) return false;

  try {
    var module = await import("https://esm.sh/@supabase/supabase-js@2");
    var createClient = module.createClient;
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  } catch (err) {
    console.error("Gagal memuat Supabase SDK:", err);
    supabase = null;
    return false;
  }
})();
