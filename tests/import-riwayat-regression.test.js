import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("import siswa: save safety fix dimuat setelah importer", () => {
  const html = read("index.html");
  const importer = html.indexOf('src="js/siswa-import.js"');
  const saveFix = html.indexOf('src="js/siswa-import-save-fix.js"');

  assert.ok(importer >= 0, "Importer siswa tidak ditemukan di index.html");
  assert.ok(saveFix > importer, "Save safety fix harus dimuat setelah importer");
});

test("import siswa: Tahun Ajaran kosong diberi fallback aman sebelum insert", () => {
  const fix = read("js/siswa-import-save-fix.js");

  assert.match(fix, /DEFAULT_TAHUN_AJARAN\s*=\s*[\"']2025\/2026[\"']/);
  assert.match(fix, /fillMissingTahunAjaran/);
  assert.match(fix, /lastYear/);
  assert.match(fix, /row\.tahun_ajaran\s*=\s*DEFAULT_TAHUN_AJARAN/);
  assert.doesNotMatch(fix, /ada data siswa tanpa Tahun Ajaran/);
});

test("rekap absensi: admin dan guru sama-sama memakai tampilan ringkas per tanggal", () => {
  const html = read("index.html");
  const rekap = html.indexOf('src="js/rekap-absensi.js"');
  const uxFix = html.indexOf('src="js/riwayat-absensi-ux-fix.js"');

  assert.ok(rekap >= 0, "rekap-absensi.js tidak ditemukan di index.html");
  assert.ok(uxFix > rekap, "UX fix absensi harus dimuat setelah rekap-absensi.js");

  const fix = read("js/riwayat-absensi-ux-fix.js");
  assert.match(fix, /renderRiwayatAbsen/);
  assert.match(fix, /renderRekap/);
  assert.match(fix, /loadRiwayatAbsensi/);
  assert.match(fix, /loadRekapAbsensi/);
  assert.match(fix, /groupByDate/);
  assert.match(fix, /<details class="gtr-riwayat-day">/);
  assert.match(fix, /counts: \{ H: 0, I: 0, S: 0, A: 0 \}/);
});

test("absensi compact: CSS tersedia dan responsif", () => {
  const html = read("index.html");
  const css = html.indexOf('href="css/riwayat-absensi-compact.css"');
  assert.ok(css >= 0, "CSS absensi compact belum dimuat");

  const stylesheet = read("css/riwayat-absensi-compact.css");
  assert.match(stylesheet, /\.gtr-riwayat-day/);
  assert.match(stylesheet, /@media \(max-width:620px\)/);
});
