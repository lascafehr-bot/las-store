// Offline tests for GET /api/health. Run with:  npm run test:health
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outdir = mkdtempSync(join(tmpdir(), "las-health-test-"));
await build({ entryPoints: { health: join(root, "functions/api/health.ts") }, bundle: true, platform: "node", format: "esm", outdir, logLevel: "error" });
const { onRequestGet } = await import(pathToFileURL(join(outdir, "health.js")).href);

const env = { SUPABASE_URL: "https://db.example.test", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test_key" };
const realFetch = globalThis.fetch;
const realError = console.error;
after(() => {
  globalThis.fetch = realFetch;
  console.error = realError;
});

test("ok when the database answers (an empty result is fine)", async () => {
  let asked = "";
  globalThis.fetch = async (url) => ((asked = String(url)), new Response("[]", { status: 200 }));
  const res = await onRequestGet({ request: new Request("https://x.test/api/health"), env });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
  assert.match(asked, /^https:\/\/db\.example\.test\/rest\/v1\/orders\?/);
});

test("503 and no details when the database is unreachable or refuses", async () => {
  console.error = () => {};
  for (const impl of [async () => new Response("denied", { status: 403 }), async () => { throw new Error("network down sb_secret_test_key"); }]) {
    globalThis.fetch = impl;
    const res = await onRequestGet({ request: new Request("https://x.test/api/health"), env });
    assert.equal(res.status, 503);
    const text = await res.text();
    assert.deepEqual(JSON.parse(text), { status: "error" });
    assert.ok(!text.includes("sb_secret"));
  }
});

test("503 when the database settings are missing", async () => {
  console.error = () => {};
  const res = await onRequestGet({ request: new Request("https://x.test/api/health"), env: {} });
  assert.equal(res.status, 503);
});
