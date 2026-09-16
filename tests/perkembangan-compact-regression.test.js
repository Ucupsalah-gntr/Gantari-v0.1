import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("perkembangan compact UX: assets dimuat setelah modul perkembangan", () => {
  const html = read("index.html");
  const base = html.indexOf('src="js/perkembangan.js"');
  const historyFix = html.indexOf('src="js/perkembangan-history-fix.js"');
  const compact = html.indexOf('src="js/perkembangan-compact-ux.js"');
  const init = html.indexOf('src="js/perkembangan-compact-ux-init.js"');

  assert.ok(base >= 0, "perkembangan.js tidak ditemukan");
  assert.ok(historyFix > base, "history fix harus setelah perkembangan.js");
  assert.ok(compact > historyFix, "compact UX harus setelah history fix");
  assert.ok(init > compact, "compact init harus dimuat setelah app.js context tersedia");
});

test("perkembangan compact UX: histori dikelompokkan per siswa dan tanggal", () => {
  const source = read("js/perkembangan-compact-ux.js");
  assert.match(source, /assessments: new Map\(\)/);
  assert.match(source, /const assessmentKey = row\.tanggal/);
  assert.match(source, /student\.history = \[\.\.\.student\.assessments\.values\(\)\]/);
  assert.match(source, /student\.count = student\.history\.length/);
});

test("perkembangan compact UX: tetap punya ringkasan dan histori detail", () => {
  const source = read("js/perkembangan-compact-ux.js");
  assert.match(source, /Penilaian Terbaru/);
  assert.match(source, /Histori Penilaian/);
  assert.match(source, /gtr-perk-card/);
  assert.match(source, /gtr-perk-history-item/);
});

test("perkembangan compact UX: stylesheet responsive tersedia", () => {
  const css = read("css/perkembangan-compact-ux.css");
  assert.match(css, /\.gtr-perk-card/);
  assert.match(css, /\.gtr-perk-history-item/);
  assert.match(css, /@media \(max-width:760px\)/);
  assert.match(css, /@media \(max-width:390px\)/);
});
