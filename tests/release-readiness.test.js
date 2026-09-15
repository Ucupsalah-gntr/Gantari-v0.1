import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const SOURCE_FILES = [
  "index.html",
  "playwright.config.js",
  ".github/workflows/main.yml",
  "js/supabase.js",
  "js/state.js",
  "js/config.js",
  "js/auth.js",
  "js/utils.js",
  "js/dashboard.js",
  "js/siswa.js",
  "js/spp.js",
  "js/spp-payment-method.js",
  "js/absensi-siswa.js",
  "js/guru.js",
  "js/absensi-guru.js",
  "js/rekap-absensi.js",
  "js/perkembangan.js",
  "js/perkembangan-history-fix.js",
  "js/orangtua.js",
  "js/export-notifikasi.js",
  "js/app.js",
];

test("release gate: semua source utama tersedia", () => {
  for (const file of SOURCE_FILES) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `Source wajib hilang: ${file}`);
  }
});

test("release gate: seluruh script lokal di index benar-benar ada", () => {
  const html = read("index.html");
  const scripts = [...html.matchAll(/<script[^>]+src=[\"']([^\"']+)[\"']/gi)]
    .map((match) => match[1])
    .filter((src) => !/^https?:\/\//i.test(src));

  assert.ok(scripts.length > 0, "Tidak ada script aplikasi di index.html");

  for (const src of scripts) {
    assert.ok(fs.existsSync(path.join(ROOT, src)), `Script index tidak ditemukan: ${src}`);
  }
});

test("release gate: dependency inti tetap berurutan dan bootstrap berada terakhir", () => {
  const html = read("index.html");
  const order = [
    'src="js/supabase.js"',
    'src="js/state.js"',
    'src="js/config.js"',
    'src="js/auth.js"',
    'src="js/utils.js"',
    'src="js/app.js"',
  ];

  let previous = -1;
  for (const marker of order) {
    const position = html.indexOf(marker);
    assert.notEqual(position, -1, `Script wajib tidak ditemukan: ${marker}`);
    assert.ok(position > previous, `Urutan dependency rusak pada ${marker}`);
    previous = position;
  }
});

test("release gate: tidak ada legacy mobile patch yang direferensikan", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /mobile-ux-gantariku\.js/i);
});

test("release gate: source tidak mengandung debugger atau service-role secret marker", () => {
  const contents = SOURCE_FILES.map(read).join("\n");

  assert.doesNotMatch(contents, /(^|\n)\s*debugger\s*;?/);
  assert.doesNotMatch(contents, /SUPABASE_SERVICE_ROLE|SUPABASE_SERVICE_KEY/i);
  assert.doesNotMatch(contents, /PASTE_YOUR_(SUPABASE|SERVICE|API)/i);
});

test("release gate: Supabase client hanya menggunakan publishable/anon key", () => {
  const supabase = read("js/supabase.js");
  assert.match(supabase, /SUPABASE_URL\s*=\s*[\"']https:\/\/.+\.supabase\.co[\"']/);
  assert.match(supabase, /SUPABASE_ANON_KEY\s*=/);
  assert.doesNotMatch(supabase, /service_role/i);
});

test("release gate: role resmi dan seluruh menu memiliki route handler", () => {
  const config = read("js/config.js");
  const app = read("js/app.js");

  for (const role of ["admin", "guru", "ortu"]) {
    assert.match(config, new RegExp(`${role}\\s*:`));
  }

  const ids = [...config.matchAll(/id:\s*[\"']([^\"']+)[\"']/g)].map((match) => match[1]);
  assert.ok(ids.length > 0, "Tidak ada menu terdaftar");
  assert.equal(new Set(ids).size, ids.length, "Ada ID menu duplikat di konfigurasi");

  for (const id of ids) {
    assert.match(app, new RegExp(`case\\s+[\"']${id.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}[\"']\\s*:`), `Route ${id} tidak memiliki case di app.js`);
  }
});

test("release gate: CI memiliki permission read-only dan menjalankan semua lapisan test", () => {
  const workflow = read(".github/workflows/main.yml");
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /node --check/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run test:e2e/);
});

test("release gate: Playwright memakai URL produksi dengan override opsional", () => {
  const config = read("playwright.config.js");
  assert.match(config, /GANTARIKU_URL/);
  assert.match(config, /https:\/\/gantariku\.vercel\.app\//);
});
