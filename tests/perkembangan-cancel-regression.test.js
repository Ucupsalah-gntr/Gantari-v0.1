import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("form perkembangan memiliki kontrol batal/tutup", () => {
  const fix = read("js/perkembangan-cancel-fix.js");
  assert.match(fix, /Batal \/ Tutup/);
  assert.match(fix, /data-gtr-perk-cancel/);
  assert.match(fix, /resetAndClose/);
  assert.match(fix, /form\.reset\(\)/);
  assert.match(fix, /Buka Form Penilaian/);
});

test("index memuat fix setelah app utama", () => {
  const html = read("index.html");
  const app = html.indexOf('src="js/app.js"');
  const fix = html.indexOf('src="js/perkembangan-cancel-fix.js"');
  assert.ok(app >= 0, "app.js tidak ditemukan");
  assert.ok(fix > app, "fix cancel harus dimuat setelah app.js");
});

test("cancel control tidak menggunakan submit", () => {
  const fix = read("js/perkembangan-cancel-fix.js");
  assert.match(fix, /cancelButton\.type = "button"/);
  assert.match(fix, /openButton\.type = "button"/);
});
