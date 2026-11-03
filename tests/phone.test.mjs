// Offline tests for the checkout phone rule. Run with:  npm run test:phone
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outdir = mkdtempSync(join(tmpdir(), "las-phone-test-"));
await build({
  entryPoints: { phone: join(root, "lib/phone.ts"), create: join(root, "functions/api/payments/create.ts") },
  bundle: true,
  platform: "node",
  format: "esm",
  outdir,
  logLevel: "error",
});
const load = (n) => import(pathToFileURL(join(outdir, `${n}.js`)).href);
const [{ saudiMobile }, create] = await Promise.all([load("phone"), load("create")]);

const realFetch = globalThis.fetch;
const realError = console.error;
after(() => {
  globalThis.fetch = realFetch;
  console.error = realError;
});

test("every usual way of writing a Saudi mobile gives the same 966 number", () => {
  for (const p of ["0554789837", "554789837", "+966554789837", "966554789837", "00966554789837", "055 478 9837", "+966 (55) 478-9837", "٠٥٥٤٧٨٩٨٣٧", "۰۵۵۴۷۸۹۸۳۷"]) {
    assert.equal(saudiMobile(p), "966554789837", p);
  }
});

test("anything else is refused", () => {
  for (const p of ["", "abc", "0112345678", "05547898", "05547898371", "+971501234567", "966112345678", "123456789"]) {
    assert.equal(saudiMobile(p), null, p);
  }
});

test("the payment endpoint refuses a bad phone before touching the database or the gateway", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("must not be called");
  };
  console.error = () => {};
  const env = {
    ALINMAPAY_ENV: "sandbox",
    ALINMAPAY_MERCHANT_KEY: "ab".repeat(32),
    ALINMAPAY_TERMINAL_ID: "TERTEST1",
    ALINMAPAY_TERMINAL_PASSWORD: "pw-test",
    ALINMAPAY_PAY_REQUEST_URL: "https://pg.alinmapay.com.sa/SB_Transactions/v2/payments/pay-request",
    ALINMAPAY_MERCHANT_IP: "203.0.113.9",
    SITE_URL: "http://localhost:8788",
    SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test",
  };
  const res = await create.onRequestPost({
    request: new Request("http://localhost:8788/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ slug: "x", quantity: 1 }], customer: { name: "Test", phone: "12345" }, city: "Riyadh", address: "1 Test St" }),
    }),
    env,
  });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "invalid_phone" });
  assert.equal(calls, 0);
});
