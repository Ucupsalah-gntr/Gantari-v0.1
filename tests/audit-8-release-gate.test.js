import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function extractLocalScripts(html) {
  return [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((src) => src.startsWith("js/") || src.startsWith("./js/"))
    .map((src) => src.replace(/^\.\//, ""));
}

test("Audit 8: release gate — source inti dan dependency tersedia", () => {
  const html = read("index.html");
  const scripts = extractLocalScripts(html);

  assert.ok(scripts.length > 0, "Tidak ada script lokal yang direferensikan");
  for (const script of scripts) {
    assert.ok(fs.existsSync(path.join(ROOT, script)), `Script lokal hilang: ${script}`);
  }
});

test("Audit 8: release gate — tidak ada secret service-role di source browser", () => {
  const files = ["index.html", "js/supabase.js", "js/auth.js", "js/app.js"];
  for (const file of files) {
    const text = read(file);
    assert.doesNotMatch(text, /service_role/i, `Marker service_role ditemukan di ${file}`);
    assert.doesNotMatch(text, /SUPABASE_SERVICE_ROLE/i, `Service role variable ditemukan di ${file}`);
  }
});

test("Audit 8: release gate — Supabase browser config memakai publishable/anon key", () => {
  const text = read("js/supabase.js");
  assert.match(text, /SUPABASE_ANON_KEY/);
  assert.doesNotMatch(text, /sb_secret_/i);
});

test("Audit 8: release gate — CI permission tetap read-only", () => {
  const workflow = read(".github/workflows/main.yml");
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
});

test("Audit 8: release gate — write authorization test tetap opt-in", () => {
  const text = read("tests/e2e/audit-7-3c-write-authorization.spec.js");
  assert.match(text, /GTR_TEST_WRITE_MODE/);
  assert.match(text, /test\.skip\(/);
});

test("Audit 8: release gate — production smoke test memakai URL produksi yang dapat dioverride", () => {
  const config = read("playwright.config.js");
  assert.match(config, /process\.env\.GANTARIKU_URL/);
  assert.match(config, /https:\/\/gantariku\.vercel\.app\//);
});

test("Audit 8: release gate — package lock tersedia untuk npm ci", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.devDependencies?.["@playwright/test"]);
  assert.ok(fs.existsSync(path.join(ROOT, "package-lock.json")));
});
