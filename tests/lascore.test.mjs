// Offline tests for the LASCORE admin screens' pure logic (lib/lascore/orders.ts). Run with:  npm run test:lascore
// Bundles the real module with esbuild (same approach as tests/payments.test.mjs); no network, no database.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outdir = mkdtempSync(join(tmpdir(), "las-lascore-test-"));
await build({ entryPoints: { orders: join(root, "lib/lascore/orders.ts"), insights: join(root, "lib/lascore/insights.ts") }, bundle: true, platform: "node", format: "esm", outdir, logLevel: "error" });
const m = await import(pathToFileURL(join(outdir, "orders.js")).href);
const ins = await import(pathToFileURL(join(outdir, "insights.js")).href);

test("review reasons: ours, gateway codes, and unknown", () => {
  assert.match(m.reviewReason("DUPLICATE_PAYMENT"), /مرتين/);
  assert.match(m.reviewReason("BAD_SIGNATURE"), /توقيع/);
  assert.match(m.reviewReason("622"), /622/); // a gateway code is explained, never shown blank
  assert.match(m.reviewReason("622"), /خُصم/); // and warns the customer may have been charged
  assert.equal(m.reviewReason(""), null);
  assert.equal(m.reviewReason("whatever"), null);
});

test("WhatsApp link from Saudi phone formats", () => {
  for (const phone of ["0501112233", "+966 50 111 2233", "00966501112233", "966501112233"]) {
    assert.equal(m.whatsappLink(phone), "https://wa.me/966501112233", phone);
  }
  assert.equal(m.whatsappLink("123"), null);
  assert.equal(m.whatsappLink(""), null);
});

test("'today' starts at midnight in Saudi time (UTC+3), not UTC", () => {
  // 00:30 on 22 Oct in Riyadh is 21:30 on 21 Oct UTC: today already began at 21:00 UTC on the 21st.
  assert.equal(m.startOfTodayRiyadh(new Date("2026-10-21T21:30:00Z")), "2026-10-21T21:00:00.000Z");
  assert.equal(m.startOfTodayRiyadh(new Date("2026-10-22T20:59:00Z")), "2026-10-21T21:00:00.000Z"); // 23:59 Riyadh
  assert.equal(m.startOfTodayRiyadh(new Date("2026-10-22T21:00:00Z")), "2026-10-22T21:00:00.000Z"); // new day
});

test("dates: Saudi time, Gregorian, Latin digits, 24-hour", () => {
  assert.equal(m.formatDateTime("2026-10-22T05:16:00Z"), "22/10/2026, 08:16");
  assert.equal(m.formatDateTime(null), "—");
  assert.equal(m.formatDateTime("not a date"), "—");
});

test("scope filters map to the right gateway labels", () => {
  assert.deepEqual(m.gatewaysForScope("live"), ["alinmapay"]);
  assert.deepEqual(m.gatewaysForScope("test"), ["alinmapay-sandbox"]);
  assert.equal(m.gatewaysForScope("all"), null);
  assert.equal(m.isTestGateway("alinmapay-sandbox"), true);
  assert.equal(m.isTestGateway("alinmapay"), false);
});

test("customer can arrive as an object or a one-item array", () => {
  const c = { full_name: "A", email: "", phone: "1", city: "C", address: "D" };
  assert.equal(m.customerOf({ customers: c }).full_name, "A");
  assert.equal(m.customerOf({ customers: [c] }).full_name, "A");
  assert.equal(m.customerOf({ customers: null }), null);
  assert.equal(m.amountOf({ total_amount: "105.50" }), 105.5);
  assert.equal(m.amountOf({ total_amount: "oops" }), 0);
});

test("payments CSV: Excel BOM, 2-decimals, quoting, and spreadsheet-formula neutralised", () => {
  const rows = [
    { order_number: "LAS1", payment_status: "paid", paid_at: "2026-10-22T05:16:00Z", total_amount: "29", payment_reference: "TX1", payment_gateway: "alinmapay",
      customers: { full_name: '=HYPERLINK("http://x","y")', email: "", phone: "+966501112233", city: "Riyadh, KSA", address: "" } },
    { order_number: "LAS2", payment_status: "refunded", paid_at: null, total_amount: 94, payment_reference: "", payment_gateway: "alinmapay-sandbox",
      customers: { full_name: 'Say "hi"', email: "", phone: "@cmd", city: "-1", address: "" } },
  ];
  const csv = m.paymentsCsv(rows);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  const lines = csv.slice(1).split("\r\n");
  assert.equal(lines[0], "order_number,payment_status,paid_at,amount_sar,transaction_id,gateway,customer,phone,city");
  assert.ok(lines[1].includes(",29.00,"), "amount has two decimals");
  assert.ok(lines[1].includes(`"'=HYPERLINK(""http://x"",""y"")"`), "formula prefixed with ' and quoted");
  assert.ok(lines[1].includes('"Riyadh, KSA"'), "comma is quoted");
  assert.ok(lines[2].includes("'@cmd") && lines[2].includes("'-1"), "@ and - prefixed");
  assert.ok(lines[2].includes('"Say ""hi"""'), "quotes doubled");
  assert.ok(!lines[1].includes(",=HYPERLINK"), "no raw formula cell");
});

const order = (o) => ({ payment_status: "paid", total_amount: 10, created_at: o.paid_at, order_items: [], customers: null, ...o });
const cust = (phone, name = "A", city = "جدة") => ({ full_name: name, email: "", phone, city, address: "" });

test("customers: same person across phone formats is grouped; unpaid and refunded are ignored", () => {
  const rows = ins.groupCustomers([
    order({ paid_at: "2026-10-01T10:00:00Z", total_amount: 40, customers: cust("0501112233", "Old") }),
    order({ paid_at: "2026-10-05T10:00:00Z", total_amount: 60, customers: cust("+966 50 111 2233", "New") }),
    order({ paid_at: "2026-10-06T10:00:00Z", payment_status: "refunded", total_amount: 99, customers: cust("0501112233") }),
    order({ paid_at: "2026-10-06T10:00:00Z", payment_status: "review", total_amount: 99, customers: cust("0509998877", "B") }),
    order({ paid_at: "2026-10-07T10:00:00Z", total_amount: 5, customers: cust("0509998877", "B") }),
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].orders, 2);
  assert.equal(rows[0].total, 100);
  assert.equal(rows[0].name, "New"); // newest details win
  assert.equal(rows[1].total, 5);
});

test("sales by day: Saudi days, zero-filled, paid only", () => {
  const now = new Date("2026-10-22T10:00:00Z");
  const days = ins.salesByDay(
    [
      order({ paid_at: "2026-10-21T21:30:00Z", total_amount: 30 }), // 00:30 on the 22nd in Riyadh
      order({ paid_at: "2026-10-20T09:00:00Z", total_amount: 20 }),
      order({ paid_at: "2026-10-20T09:00:00Z", payment_status: "refunded", total_amount: 500 }),
    ],
    3,
    now,
  );
  assert.deepEqual(days.map((d) => d.day), ["2026-10-20", "2026-10-21", "2026-10-22"]);
  assert.deepEqual(days.map((d) => d.revenue), [20, 0, 30]);
});

test("top products and CSV safety", () => {
  const items = (n, q, s) => [{ product_name: n, quantity: q, unit_price: s / q, subtotal: s }];
  const top = ins.topProducts([
    order({ paid_at: "2026-10-01T00:00:00Z", order_items: [...items("قهوة", 2, 74), ...items("كوب", 1, 50)] }),
    order({ paid_at: "2026-10-02T00:00:00Z", order_items: items("قهوة", 1, 37) }),
    order({ paid_at: "2026-10-02T00:00:00Z", payment_status: "failed", order_items: items("قهوة", 9, 999) }),
  ]);
  assert.deepEqual(top.map((p) => [p.name, p.quantity, p.revenue]), [["قهوة", 3, 111], ["كوب", 1, 50]]);
  const csv = ins.customersCsv([{ key: "k", name: "=cmd()", phone: "1", email: "", city: "x", orders: 1, total: 1, firstAt: "a", lastAt: "b" }]);
  assert.match(csv, /'=cmd\(\)/);
});

test("Aramex numbers: only plain digits count as an Aramex shipment", () => {
  assert.equal(m.isAramexAwb("44100000001"), true);
  assert.equal(m.isAramexAwb(" 44100000001 "), true);
  for (const t of ["", "ARAMEX-PENDING-abc", "SMSA-123", "123", "1234567890123456"]) assert.equal(m.isAramexAwb(t), false, t);
});

test("shipping calls: send the staff token, never crash, explain failures in Arabic", async () => {
  const realFetch = globalThis.fetch;
  const calls = [];
  const db = (token) => ({ auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null } }) } });
  try {
    globalThis.fetch = async (url, init) => (calls.push({ url, init }), new Response(JSON.stringify({ awb: "44100000001", labelUrl: "https://l.test/a.pdf" }), { status: 200 }));
    const ok = await m.createAramexShipment(db("tok-" + "a".repeat(30)), "LAS20261102ABCDEF0123");
    assert.deepEqual(ok, { ok: true, awb: "44100000001", labelUrl: "https://l.test/a.pdf" });
    assert.equal(calls[0].url, "/api/shipping/create");
    assert.equal(calls[0].init.headers.Authorization, "Bearer tok-" + "a".repeat(30));
    assert.equal(JSON.parse(calls[0].init.body).orderNumber, "LAS20261102ABCDEF0123");

    await m.getAramexLabel(db("tok-" + "a".repeat(30)), "LAS20261102ABCDEF0123");
    assert.equal(calls[1].url, "/api/shipping/label");

    const noSession = await m.createAramexShipment(db(null), "X");
    assert.equal(noSession.ok, false);
    assert.equal(calls.length, 2); // no request without a session

    globalThis.fetch = async () => new Response(JSON.stringify({ error: "aramex_rejected", messages: ["Invalid city"] }), { status: 422 });
    const rej = await m.createAramexShipment(db("tok-" + "a".repeat(30)), "X");
    assert.equal(rej.ok, false);
    assert.match(rej.message, /Invalid city/);

    globalThis.fetch = async () => new Response(JSON.stringify({ error: "already_shipped" }), { status: 409 });
    assert.match((await m.createAramexShipment(db("tok-" + "a".repeat(30)), "X")).message, /من قبل/);

    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.equal((await m.createAramexShipment(db("tok-" + "a".repeat(30)), "X")).ok, false);
  } finally {
    globalThis.fetch = realFetch;
  }
});
