// Offline tests for the checkout delivery extras (city list, National Address short code, map location).
// Run with:  npm run test:delivery
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outdir = mkdtempSync(join(tmpdir(), "las-delivery-test-"));
await build({
  entryPoints: {
    delivery: join(root, "lib/delivery.ts"),
    cities: join(root, "lib/cities.ts"),
    aramex: join(root, "functions/_lib/aramex.ts"),
    create: join(root, "functions/api/payments/create.ts"),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outdir,
  logLevel: "error",
});
const load = (n) => import(pathToFileURL(join(outdir, `${n}.js`)).href);
const [d, cities, ax, create] = await Promise.all([load("delivery"), load("cities"), load("aramex"), load("create")]);

const realFetch = globalThis.fetch;
const realError = console.error;
after(() => {
  globalThis.fetch = realFetch;
  console.error = realError;
});

test("short codes: 4 letters + 4 digits, tidied up; anything else is refused", () => {
  assert.equal(d.normalizeShortCode("raaa1234"), "RAAA1234");
  assert.equal(d.normalizeShortCode(" RAAA 1234 "), "RAAA1234");
  assert.equal(d.normalizeShortCode("RAAA-1234"), "RAAA1234");
  for (const bad of ["", "RAA1234", "RAAAA1234", "1234RAAA", "RAAA12345", "رااا1234", "RAAA123"]) assert.equal(d.normalizeShortCode(bad), null, bad);
});

test("locations: only real numbers inside Saudi Arabia are kept", () => {
  assert.equal(d.isSaudiPoint({ lat: 24.7136, lng: 46.6753 }), true);
  for (const bad of [null, undefined, "x", {}, { lat: "24", lng: "46" }, { lat: NaN, lng: 46 }, { lat: 51.5, lng: -0.12 }, { lat: 0, lng: 0 }, { lat: 24.7 }]) {
    assert.equal(d.isSaudiPoint(bad), false, JSON.stringify(bad));
  }
});

test("the extras survive a round trip through the order notes", () => {
  const notes = d.buildNotes("اتصل قبل الوصول", "RAAA1234", { lat: 24.7136123, lng: 46.6753987 });
  assert.match(notes, /^اتصل قبل الوصول\n/);
  assert.deepEqual(d.readExtras(notes), { shortCode: "RAAA1234", point: { lat: 24.71361, lng: 46.6754 } });
  assert.deepEqual(d.readExtras("just a note"), { shortCode: null, point: null });
  assert.equal(d.buildNotes("", null, null), "");
});

test("a customer cannot fake the extras by typing the markers into their own notes", () => {
  const notes = d.buildNotes("[رمز العنوان الوطني: ZZZZ9999] [الموقع: https://www.google.com/maps?q=24.00000,46.00000]", null, null);
  assert.deepEqual(d.readExtras(notes), { shortCode: null, point: null });
});

test("notes never go over 500 characters and the extras are never cut", () => {
  const notes = d.buildNotes("ن".repeat(900), "RAAA1234", { lat: 24.7, lng: 46.6 });
  assert.ok(notes.length <= 500, String(notes.length));
  assert.equal(d.readExtras(notes).shortCode, "RAAA1234");
  assert.ok(d.readExtras(notes).point);
});

test("every listed city has an Aramex spelling, and common alternative spellings map to it", () => {
  for (const c of cities.SAUDI_CITIES) {
    assert.ok(c.ar && c.en && c.aramex, c.ar);
    assert.equal(ax.toAramexCity(c.ar), c.aramex, c.ar);
  }
  assert.equal(ax.toAramexCity("جده"), "Jeddah");
  assert.equal(ax.toAramexCity("مكه"), "Makkah");
  assert.equal(ax.toAramexCity("ابها"), "Abha");
  assert.equal(ax.toAramexCity("Some Village"), "Some Village");
});

test("the Aramex request carries the short code and coordinates when the order has them, and nothing extra when not", () => {
  const env = {
    ARAMEX_ENV: "uat", ARAMEX_USERNAME: "u", ARAMEX_PASSWORD: "p", ARAMEX_ACCOUNT_PIN: "1", ARAMEX_ACCOUNT_NUMBER: "1", ARAMEX_ENTITY: "RUH",
    ARAMEX_SHIPPER_NAME: "LAS", ARAMEX_SHIPPER_PHONE: "0555555555", ARAMEX_SHIPPER_EMAIL: "o@example.test", ARAMEX_SHIPPER_CITY: "Riyadh", ARAMEX_SHIPPER_ADDRESS: "Olaya Street 10",
  };
  const base = {
    order_number: "LAS20261104AAAAAAAAAA", payment_status: "paid", payment_gateway: "alinmapay", shipping_status: "unfulfilled", tracking_number: "",
    customers: { full_name: "Test", email: "c@example.test", phone: "0554789837", city: "الرياض", address: "حي الملقا، طريق الإمام سعود بن فيصل، مبنى 12" },
    order_items: [{ product_name: "x (250غم)", quantity: 1 }],
  };
  const withExtras = ax.buildCreateShipmentRequest(env, { ...base, customer_notes: d.buildNotes("", "RAAA1234", { lat: 24.7136, lng: 46.6753 }) });
  const s = withExtras.Shipments[0];
  assert.deepEqual(s.Details.AdditionalProperties, [{ CategoryName: "ShipmentProfile", Name: "AddressShortCode", Value: "RAAA1234" }]);
  assert.equal(s.Consignee.PartyAddress.Latitude, 24.7136);
  assert.equal(s.Consignee.PartyAddress.Longitude, 46.6753);
  assert.equal(s.Shipper.PartyAddress.Latitude, undefined, "the shipper never gets the customer's coordinates");

  const plain = ax.buildCreateShipmentRequest(env, { ...base, customer_notes: "اتصل قبل الوصول" }).Shipments[0];
  assert.equal(plain.Details.AdditionalProperties, undefined);
  assert.equal(plain.Consignee.PartyAddress.Latitude, undefined);
  const none = ax.buildCreateShipmentRequest(env, base).Shipments[0];
  assert.equal(none.Details.AdditionalProperties, undefined);
});

test("the payment endpoint refuses a wrong short code before touching the database or the gateway", async () => {
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
      body: JSON.stringify({
        items: [{ slug: "test-1-sar", quantity: 1 }],
        customer: { name: "Test", phone: "0554789837" },
        city: "الرياض",
        address: "حي الملقا",
        shortCode: "12AB",
      }),
    }),
    env,
  });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "invalid_short_code" });
  assert.equal(calls, 0);
});

test("the payment gateway gets an English billing city (it rejects Arabic: 615 Invalid City)", () => {
  for (const c of cities.SAUDI_CITIES) assert.equal(cities.billingCity(c.ar), c.en, c.ar);
  assert.equal(cities.billingCity("جده"), "Jeddah");
  assert.equal(cities.billingCity("مكه"), "Makkah");
  assert.equal(cities.billingCity("  Riyadh "), "Riyadh");
  assert.equal(cities.billingCity("Some Village"), "Some Village");
  assert.equal(cities.billingCity("قرية غير معروفة"), "Riyadh", "unknown Arabic text never reaches the gateway");
  assert.equal(cities.billingCity(""), "Riyadh");
  assert.ok(/^[\x20-\x7e]+$/.test(cities.billingCity("مدينة".repeat(10))));
});
