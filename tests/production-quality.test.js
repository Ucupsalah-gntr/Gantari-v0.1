import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("production shell memiliki struktur minimum dan urutan dependency yang aman", () => {
  const html = read("index.html");

  assert.match(html, /<meta charset="UTF-8">/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /id="app"/);
  assert.match(html, /js\/supabase\.js/);
  assert.match(html, /js\/state\.js/);
  assert.match(html, /js\/config\.js/);
  assert.match(html, /js\/auth\.js/);
  assert.match(html, /js\/app\.js/);

  const supabasePos = html.indexOf('src="js/supabase.js"');
  const statePos = html.indexOf('src="js/state.js"');
  const configPos = html.indexOf('src="js/config.js"');
  const authPos = html.indexOf('src="js/auth.js"');
  const appPos = html.indexOf('src="js/app.js"');

  assert.ok(supabasePos < statePos);
  assert.ok(statePos < configPos);
  assert.ok(configPos < authPos);
  assert.ok(authPos < appPos);
});

test("semua file JavaScript utama ada", () => {
  const required = [
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
    "js/app.js"
  ];

  for (const file of required) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `File wajib hilang: ${file}`);
  }
});

test("tidak ada script produksi yang memuat pola legacy mobile patch", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /mobile-ux-gantariku\.js/);
});

test("app shell menyediakan guard navigasi berdasarkan role", () => {
  const app = read("js/app.js");
  assert.match(app, /NAV_CONFIG\[currentUserRole\]/);
  assert.match(app, /const allowed = nav\.some\(/);
  assert.match(app, /if \(!allowed\)/);
});

test("utils menyediakan notifikasi aplikasi dan state tombol busy", () => {
  const utils = read("js/utils.js");
  assert.match(utils, /function appNotify\(/);
  assert.match(utils, /function setButtonBusy\(/);
});

test("workflow CI menjalankan syntax check, unit test, dan E2E", () => {
  const workflow = read(".github/workflows/main.yml");
  assert.match(workflow, /node --check/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run test:e2e/);
  assert.match(workflow, /playwright install --with-deps chromium/);
});

test("package scripts menyediakan test unit dan browser", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.test, "node --test");
  assert.equal(pkg.scripts["test:e2e"], "playwright test");
  assert.ok(pkg.devDependencies?.["@playwright/test"]);
});
