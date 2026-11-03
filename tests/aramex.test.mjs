// Offline tests for the Aramex shipping code. Run with:  npm run test:aramex
// Bundles the REAL functions/_lib/aramex.ts and functions/api/shipping/*.ts with esbuild and drives them against an
// in-memory fake database, a fake Supabase Auth and a fake Aramex. No network, no real credentials (all random).
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outdir = mkdtempSync(join(tmpdir(), "las-aramex-test-"));
await build({
  entryPoints: {
    aramex: join(root, "functions/_lib/aramex.ts"),
    create: join(root, "functions/api/shipping/create.ts"),
    label: join(root, "functions/api/shipping/label.ts"),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outdir,
  logLevel: "error",
});
const load = (n) => import(pathToFileURL(join(outdir, `${n}.js`)).href);
const [ax, createEp, labelEp] = await Promise.all([load("aramex"), load("create"), load("label")]);

// ---- fakes -----------------------------------------------------------------------------------------------
const rnd = (p) => p + randomBytes(6).toString("hex");
const SECRETS = { user: rnd("user-"), pass: rnd("pass-"), pin: String(100000 + Math.floor(Math.random() * 899999)), service: rnd("sb_secret_") };
const env = {
  SITE_URL: "https://shop.example.test",
  SUPABASE_URL: "https://db.example.test",
  SUPABASE_SERVICE_ROLE_KEY: SECRETS.service,
  ARAMEX_ENV: "uat",
  ARAMEX_USERNAME: SECRETS.user,
  ARAMEX_PASSWORD: SECRETS.pass,
  ARAMEX_ACCOUNT_PIN: SECRETS.pin,
  ARAMEX_ACCOUNT_NUMBER: "1234567",
  ARAMEX_ENTITY: "RUH",
  ARAMEX_SHIPPER_NAME: "LAS CAFE",
  ARAMEX_SHIPPER_PHONE: "0555555555",
  ARAMEX_SHIPPER_EMAIL: "ops@example.test",
  ARAMEX_SHIPPER_CITY: "الرياض",
  ARAMEX_SHIPPER_ADDRESS: "Olaya Street, Building 10, Riyadh",
  ARAMEX_BASE_URL: "https://aramex.test/json/",
};

const TOKENS = { admin: "tok-admin-" + "a".repeat(30), staff: "tok-staff-" + "b".repeat(30), inactive: "tok-inactive-" + "c".repeat(24), noprofile: "tok-noprofile-" + "d".repeat(22) };
const USERS = {
  [TOKENS.admin]: { id: "11111111-1111-4111-8111-111111111111", profile: { role: "admin", is_active: true } },
  [TOKENS.staff]: { id: "22222222-2222-4222-8222-222222222222", profile: { role: "user", is_active: true } },
  [TOKENS.inactive]: { id: "33333333-3333-4333-8333-333333333333", profile: { role: "user", is_active: false } },
  [TOKENS.noprofile]: { id: "44444444-4444-4444-8444-444444444444", profile: null },
};

const db = new Map();
const logs = [];
let aramexCalls = [];
let aramexImpl;
let failFinish = false;
let emails = [];
let resendStatus = 200;
const okAramex = (awb = "44100000001") => () =>
  new Response(JSON.stringify({ HasErrors: false, Notifications: [], Shipments: [{ ID: awb, HasErrors: false, Notifications: [], ShipmentLabel: { LabelURL: "https://labels.example.test/" + awb + ".pdf" } }] }), { status: 200 });
const realFetch = globalThis.fetch;
const realLog = console.log;
const realError = console.error;

const fakeFetch = async (url, init = {}) => {
  url = String(url);
  if (url.startsWith(env.ARAMEX_BASE_URL)) {
    const operation = url.slice(env.ARAMEX_BASE_URL.length);
    aramexCalls.push({ operation, body: JSON.parse(init.body) });
    if (aramexImpl.delay) await new Promise((r) => setTimeout(r, aramexImpl.delay));
    return aramexImpl.run(operation);
  }
  if (url === "https://api.resend.com/emails") {
    emails.push(JSON.parse(init.body));
    return new Response("{}", { status: resendStatus });
  }
  const u = new URL(url);
  if (u.hostname !== "db.example.test") throw new Error("unexpected host " + u.hostname);
  if (u.pathname === "/auth/v1/user") {
    const token = (init.headers?.Authorization ?? "").replace("Bearer ", "");
    const user = USERS[token];
    return user ? new Response(JSON.stringify({ id: user.id, email: "x@example.test" }), { status: 200 }) : new Response("{}", { status: 401 });
  }
  if (u.pathname === "/rest/v1/profiles") {
    const id = u.searchParams.get("id").slice(3);
    const user = Object.values(USERS).find((x) => x.id === id);
    return new Response(JSON.stringify(user?.profile ? [user.profile] : []), { status: 200 });
  }
  if (u.pathname !== "/rest/v1/orders") throw new Error("unexpected path " + u.pathname);
  const q = u.searchParams;
  const eq = (k) => (q.get(k)?.startsWith("eq.") ? q.get(k).slice(3) : undefined);
  let rows = [...db.values()];
  if (eq("order_number") !== undefined) rows = rows.filter((r) => r.order_number === eq("order_number"));
  if (eq("payment_status") !== undefined) rows = rows.filter((r) => r.payment_status === eq("payment_status"));
  if (eq("tracking_number") !== undefined) rows = rows.filter((r) => r.tracking_number === eq("tracking_number"));
  if ((init.method ?? "GET") === "PATCH") {
    const patch = JSON.parse(init.body);
    if (failFinish && patch.shipping_status === "packed") rows = [];
    rows.forEach((r) => Object.assign(r, patch));
    return new Response((init.headers?.Prefer ?? "").includes("return=representation") ? JSON.stringify(rows) : "", { status: 200 });
  }
  return new Response(JSON.stringify(rows), { status: 200 });
};

before(() => {
  globalThis.fetch = fakeFetch;
  console.log = (...a) => logs.push(a.join(" "));
  console.error = (...a) => logs.push("ERR " + a.join(" "));
});
after(() => {
  globalThis.fetch = realFetch;
  console.log = realLog;
  console.error = realError;
});
beforeEach(() => {
  aramexCalls = [];
  aramexImpl = { run: okAramex() };
  failFinish = false;
  emails = [];
  resendStatus = 200;
});

let counter = 0;
const mkOrder = (o = {}) => {
  counter++;
  const order = {
    order_number: "LAS20261102" + (0xb00000 + counter).toString(16).toUpperCase().padStart(10, "0"),
    payment_status: "paid",
    payment_gateway: "alinmapay",
    shipping_status: "unfulfilled",
    tracking_number: "",
    customers: { full_name: "عبدالله الاختبار", email: "customer@example.test", phone: "0554789837", city: "الرياض", address: "حي النخيل، شارع الأمير محمد بن سلمان، مبنى 12، شقة 3، بجوار المسجد الكبير" },
    order_items: [{ product_name: "أوغندا - روينزوري - مجفف (250غم)", quantity: 2 }],
    ...o,
  };
  db.set(order.order_number, order);
  return order;
};
const call = (ep, body, { token = TOKENS.admin, headers = {} } = {}) =>
  ep.onRequestPost({
    request: new Request("https://shop.example.test/api/shipping/x", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    env: call.env ?? env,
  });
const create = (body, opts) => call(createEp, body, opts);
const row = (o) => db.get(o.order_number);

// ---- pure functions ----------------------------------------------------------------------------------------
describe("phone numbers", () => {
  test("Saudi mobile numbers become Aramex's 966 format", () => {
    for (const input of ["0554789837", "+966554789837", "966554789837", "00966554789837", "٠٥٥٤٧٨٩٨٣٧", "554789837", "055 478 9837", "+966 (55) 478-9837"]) {
      assert.equal(ax.normalizePhone(input), "966554789837", input);
    }
  });
  test("anything that is not a Saudi mobile is passed through as digits only", () => {
    assert.equal(ax.normalizePhone("+971 50 123 4567"), "971501234567");
    assert.equal(ax.normalizePhone(""), "");
  });
});

describe("address lines (Aramex: 50 characters per line, 3 lines)", () => {
  test("long addresses are split on word boundaries, in order, 50 characters at most per line", () => {
    const text = "حي النخيل، شارع الأمير محمد بن سلمان، مبنى 12، شقة 3، بجوار المسجد الكبير";
    const lines = ax.splitAddress(text);
    assert.ok(lines.length >= 2 && lines.length <= 3);
    for (const l of lines) assert.ok(l.length <= 50, l);
    assert.equal(lines.join(" "), text);
  });
  test("a single word longer than a line is cut, nothing crashes", () => {
    const lines = ax.splitAddress("x".repeat(120));
    assert.deepEqual(lines.map((l) => l.length), [50, 50, 20]);
  });
  test("empty address gives no lines", () => assert.deepEqual(ax.splitAddress("   "), []));
  test("more than 3 lines of text keep the first three", () => assert.equal(ax.splitAddress(Array(40).fill("word").join(" ")).length, 3));
});

describe("cities", () => {
  test("the cities in Aramex's own samples map to Aramex's spelling; others pass through", () => {
    assert.equal(ax.toAramexCity("الرياض"), "Riyadh");
    assert.equal(ax.toAramexCity(" جدة "), "Jeddah");
    assert.equal(ax.toAramexCity("مكة المكرمة"), "Makkah");
    assert.equal(ax.toAramexCity("Abha"), "Abha");
    assert.equal(ax.toAramexCity("القصيم"), "القصيم");
  });
});

describe("weight", () => {
  test("the weight is read from the item name (grams and kilograms, Arabic digits too)", () => {
    assert.equal(ax.weightFromName("أوغندا - روينزوري - مجفف (250غم)"), 0.25);
    assert.equal(ax.weightFromName("اليمن (125غم)"), 0.125);
    assert.equal(ax.weightFromName("سلفادور (1كغم)"), 1);
    assert.equal(ax.weightFromName("سلفادور (١كغم)"), 1);
    assert.equal(ax.weightFromName("Hambela (250g)"), 0.25);
    assert.equal(ax.weightFromName("مق لاس (رمادي)"), null);
  });
  test("1كغم is a kilogram, never one gram", () => assert.notEqual(ax.weightFromName("1كغم"), 0.001));
  test("parcel weight = items x quantity + packaging, rounded up", () => {
    assert.equal(ax.estimateWeightKg(env, [{ product_name: "x (250غم)", quantity: 2 }]), 0.65);
    assert.equal(ax.estimateWeightKg(env, [{ product_name: "x (1كغم)", quantity: 1 }, { product_name: "y (250غم)", quantity: 1 }]), 1.4);
    assert.equal(ax.estimateWeightKg(env, [{ product_name: "مق لاس", quantity: 1 }]), 0.65); // 0.5 default + 0.15 packaging
    assert.equal(ax.estimateWeightKg({ ...env, ARAMEX_PACKAGING_KG: "0.2", ARAMEX_DEFAULT_ITEM_KG: "0.4" }, [{ product_name: "مق", quantity: 1 }]), 0.6);
  });
});

describe("the CreateShipments request", () => {
  const order = () => ({ ...mkOrder(), });
  test("respects Aramex's field rules and carries the order number", () => {
    const o = order();
    const r = ax.buildCreateShipmentRequest(env, o, {}, 1_700_000_000_000);
    const s = r.Shipments[0];
    assert.equal(s.Reference1, o.order_number);
    assert.equal(r.Transaction.Reference1, o.order_number);
    for (const p of [s.Shipper, s.Consignee]) {
      const a = p.PartyAddress;
      assert.ok(a.Line1.length >= 4 && [a.Line1, a.Line2, a.Line3].every((l) => l.length <= 50));
      assert.ok(p.Contact.PersonName.length <= 50 && p.Contact.CompanyName.length <= 50);
      assert.match(p.Contact.PhoneNumber1, /^9665\d{8}$/);
      assert.match(p.Contact.EmailAddress, /@/);
      assert.equal(a.CountryCode, "SA");
    }
    assert.equal(s.Shipper.PartyAddress.City, "Riyadh");
    assert.equal(s.Consignee.PartyAddress.City, "Riyadh");
    assert.equal(s.Consignee.Contact.EmailAddress, "customer@example.test");
    assert.equal(s.Details.PaymentType, "P");
    assert.equal(s.Details.ProductGroup, "DOM");
    assert.equal(s.Details.ProductType, "ONP");
    assert.equal(s.Details.NumberOfPieces, 1);
    assert.deepEqual(s.Details.ActualWeight, { Unit: "KG", Value: 0.65 });
    assert.equal(s.ShippingDateTime, "/Date(1700000000000+0300)/");
    assert.equal(r.LabelInfo.ReportType, "URL");
    assert.equal(r.ClientInfo.AccountEntity, "RUH");
    assert.equal(r.ClientInfo.Version, "v1.0");
  });
  test("the customer's email is optional at checkout, but Aramex needs one: the shop's email is used", () => {
    for (const email of ["", "not an email", "a b@example.test", "x".repeat(60) + "@example.test"]) {
      const r = ax.buildCreateShipmentRequest(env, { ...order(), customers: { ...order().customers, email } });
      assert.equal(r.Shipments[0].Consignee.Contact.EmailAddress, "ops@example.test", JSON.stringify(email));
    }
  });
  test("very long names are cut to 50 characters", () => {
    const r = ax.buildCreateShipmentRequest(env, { ...order(), customers: { ...order().customers, full_name: "ع".repeat(90) } });
    assert.equal(r.Shipments[0].Consignee.Contact.PersonName.length, 50);
  });
  test("a too-short address still gives Aramex a valid first line", () => {
    const r = ax.buildCreateShipmentRequest(env, { ...order(), customers: { ...order().customers, address: "ab" } });
    assert.ok(r.Shipments[0].Consignee.PartyAddress.Line1.length >= 4);
  });
  test("product group, product type, label template and description are settings", () => {
    const r = ax.buildCreateShipmentRequest({ ...env, ARAMEX_PRODUCT_TYPE: "CDS", ARAMEX_PRODUCT_GROUP: "DOM", ARAMEX_LABEL_REPORT_ID: "9201", ARAMEX_GOODS_DESCRIPTION: "Roasted coffee" }, order());
    assert.equal(r.Shipments[0].Details.ProductType, "CDS");
    assert.equal(r.LabelInfo.ReportID, 9201);
    assert.equal(r.Shipments[0].Details.DescriptionOfGoods, "Roasted coffee");
  });
  test("an order without customer details is refused", () => {
    assert.throws(() => ax.buildCreateShipmentRequest(env, { ...order(), customers: null }), (e) => e instanceof ax.AramexError);
  });
});

describe("configuration", () => {
  test("missing settings are named, values are never shown", () => {
    const rest = { ...env };
    delete rest.ARAMEX_USERNAME;
    delete rest.ARAMEX_ACCOUNT_PIN;
    assert.throws(() => ax.requireAramexEnv(rest), /ARAMEX_USERNAME, ARAMEX_ACCOUNT_PIN/);
  });
  test("ARAMEX_ENV must be uat or production, there is no default", () => {
    assert.throws(() => ax.requireAramexEnv({ ...env, ARAMEX_ENV: "live" }), /uat.*production/);
    assert.throws(() => ax.requireAramexEnv({ ...env, ARAMEX_ENV: "" }), /ARAMEX_ENV/);
  });
  test("production on a local address is refused (a development machine must use the test system)", () => {
    assert.throws(() => ax.requireAramexEnv({ ...env, ARAMEX_ENV: "production", SITE_URL: "http://localhost:8788" }), /local address/);
    assert.doesNotThrow(() => ax.requireAramexEnv({ ...env, ARAMEX_ENV: "production" }));
    assert.doesNotThrow(() => ax.requireAramexEnv(env));
  });
});

// ---- the create endpoint -----------------------------------------------------------------------------------
describe("POST /api/shipping/create", () => {
  test("an admin creates the shipment: tracking number saved, order packed, label returned, Aramex called once", async () => {
    const o = mkOrder();
    const res = await create({ orderNumber: o.order_number });
    assert.equal(res.status, 200);
    const j = await res.json();
    assert.equal(j.awb, "44100000001");
    assert.ok(j.labelUrl.endsWith("44100000001.pdf"));
    assert.equal(j.weightKg, 0.65);
    assert.equal(row(o).tracking_number, "44100000001");
    assert.equal(row(o).shipping_status, "packed");
    assert.equal(row(o).payment_status, "paid");
    assert.equal(aramexCalls.length, 1);
    assert.equal(aramexCalls[0].operation, "CreateShipments");
    assert.equal(aramexCalls[0].body.Shipments[0].Reference1, o.order_number);
  });

  test("an active staff member (role user) may create it too", async () => {
    const o = mkOrder();
    assert.equal((await create({ orderNumber: o.order_number }, { token: TOKENS.staff })).status, 200);
  });

  test("no token, a bad token, an inactive user and a user without a profile are all refused before Aramex is called", async () => {
    const o = mkOrder();
    assert.equal((await create({ orderNumber: o.order_number }, { token: null })).status, 401);
    assert.equal((await create({ orderNumber: o.order_number }, { token: "garbage-token-" + "z".repeat(30) })).status, 401);
    assert.equal((await create({ orderNumber: o.order_number }, { token: TOKENS.inactive })).status, 403);
    assert.equal((await create({ orderNumber: o.order_number }, { token: TOKENS.noprofile })).status, 403);
    assert.equal(aramexCalls.length, 0);
    assert.equal(row(o).tracking_number, "");
  });

  test("orders that are not paid never reach Aramex", async () => {
    for (const status of ["pending", "failed", "cancelled", "review"]) {
      const o = mkOrder({ payment_status: status });
      const res = await create({ orderNumber: o.order_number });
      assert.equal(res.status, 409, status);
      assert.equal((await res.json()).error, "not_paid");
      assert.equal(row(o).tracking_number, "");
    }
    assert.equal(aramexCalls.length, 0);
  });

  test("an order that already has a tracking number is not shipped again", async () => {
    const o = mkOrder({ tracking_number: "44199999999" });
    const res = await create({ orderNumber: o.order_number });
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), { error: "already_shipped", awb: "44199999999" });
    assert.equal(aramexCalls.length, 0);
  });

  test("two clicks at the same moment create exactly one shipment", async () => {
    const o = mkOrder();
    aramexImpl = { run: okAramex("44100000777"), delay: 25 };
    const results = await Promise.all([create({ orderNumber: o.order_number }), create({ orderNumber: o.order_number }), create({ orderNumber: o.order_number }, { token: TOKENS.staff })]);
    const statuses = results.map((r) => r.status).sort();
    assert.deepEqual(statuses, [200, 409, 409]);
    assert.equal(aramexCalls.length, 1);
    assert.equal(row(o).tracking_number, "44100000777");
  });

  test("when Aramex refuses, the admin sees Aramex's message, the order is untouched and the claim is given back", async () => {
    const o = mkOrder();
    aramexImpl = { run: () => new Response(JSON.stringify({ HasErrors: true, Notifications: [{ Code: "ERR61", Message: "City is not valid" }], Shipments: [] }), { status: 200 }) };
    const res = await create({ orderNumber: o.order_number });
    assert.equal(res.status, 422);
    const j = await res.json();
    assert.equal(j.error, "aramex_rejected");
    assert.ok(j.messages[0].includes("City is not valid"));
    assert.equal(row(o).tracking_number, "");
    assert.equal(row(o).shipping_status, "unfulfilled");
    // the admin corrects the city and tries again
    aramexImpl = { run: okAramex("44100000555") };
    const retry = await create({ orderNumber: o.order_number, city: "Dammam", weightKg: 1.2 });
    assert.equal(retry.status, 200);
    const last = aramexCalls.at(-1).body.Shipments[0];
    assert.equal(last.Consignee.PartyAddress.City, "Dammam");
    assert.equal(last.Details.ActualWeight.Value, 1.2);
    assert.equal(row(o).tracking_number, "44100000555");
  });

  test("a shipment-level refusal (no tracking number in the answer) is also an error", async () => {
    const o = mkOrder();
    aramexImpl = { run: () => new Response(JSON.stringify({ HasErrors: false, Shipments: [{ ID: "", HasErrors: true, Notifications: [{ Code: "ERR01", Message: "Bad phone" }] }] }), { status: 200 }) };
    const res = await create({ orderNumber: o.order_number });
    assert.equal(res.status, 422);
    assert.equal(row(o).tracking_number, "");
  });

  test("Aramex unreachable or answering garbage -> 502, claim given back, nothing saved", async () => {
    const a = mkOrder();
    aramexImpl = { run: () => { throw new Error("network down"); } };
    assert.equal((await create({ orderNumber: a.order_number })).status, 502);
    assert.equal(row(a).tracking_number, "");
    const b = mkOrder();
    aramexImpl = { run: () => new Response("<html>bad gateway</html>", { status: 502 }) };
    assert.equal((await create({ orderNumber: b.order_number })).status, 502);
    assert.equal(row(b).tracking_number, "");
  });

  test("the live Aramex system is never used for a test (sandbox) payment", async () => {
    const o = mkOrder({ payment_gateway: "alinmapay-sandbox" });
    const live = { ...env, ARAMEX_ENV: "production" };
    call.env = live;
    try {
      const res = await create({ orderNumber: o.order_number });
      assert.equal(res.status, 409);
      assert.equal((await res.json()).error, "test_order_on_live_aramex");
      assert.equal(aramexCalls.length, 0);
      const real = mkOrder({ payment_gateway: "alinmapay" });
      assert.equal((await create({ orderNumber: real.order_number })).status, 200);
    } finally {
      call.env = undefined;
    }
    // on the Aramex test system a sandbox payment is fine
    const t = mkOrder({ payment_gateway: "alinmapay-sandbox" });
    assert.equal((await create({ orderNumber: t.order_number })).status, 200);
  });

  test("shipping that is not configured answers 503 and touches nothing", async () => {
    const o = mkOrder();
    call.env = { ...env, ARAMEX_USERNAME: "" };
    try {
      assert.equal((await create({ orderNumber: o.order_number })).status, 503);
    } finally {
      call.env = undefined;
    }
    assert.equal(aramexCalls.length, 0);
  });

  test("bad input: another origin, invalid weight, invalid body, unknown or malformed order numbers", async () => {
    const o = mkOrder();
    assert.equal((await create({ orderNumber: o.order_number }, { headers: { Origin: "https://evil.example" } })).status, 403);
    assert.equal((await create({ orderNumber: o.order_number, weightKg: 99 })).status, 400);
    assert.equal((await create({ orderNumber: o.order_number, weightKg: "abc" })).status, 400);
    assert.equal((await create("{not json")).status, 400);
    assert.equal((await create({ orderNumber: "LAS20261102FFFFFFFFFF" })).status, 404);
    assert.equal((await create({ orderNumber: "x; drop table orders" })).status, 404);
    assert.equal(aramexCalls.length, 0);
  });

  test("created at Aramex but the order could not be saved: no second shipment is possible and the admin gets the tracking number", async () => {
    const o = mkOrder();
    failFinish = true;
    const res = await create({ orderNumber: o.order_number });
    assert.equal(res.status, 500);
    const j = await res.json();
    assert.equal(j.error, "created_but_not_saved");
    assert.equal(j.awb, "44100000001");
    assert.ok(row(o).tracking_number.startsWith("ARAMEX-PENDING-"), "the claim stays, so nobody can create a duplicate");
    failFinish = false;
    assert.equal((await create({ orderNumber: o.order_number })).status, 409);
    assert.equal(aramexCalls.length, 1);
  });
});

// ---- the label endpoint ------------------------------------------------------------------------------------
describe("the shipped email", () => {
  const mailEnv = { ...env, RESEND_API_KEY: rnd("re_"), EMAIL_FROM: "LAS <orders@example.test>" };
  const withMail = async (fn) => {
    call.env = mailEnv;
    try {
      await fn();
    } finally {
      call.env = undefined;
    }
  };
  test("a paid live order: the customer gets one email with the tracking number, replies go to the shop", () =>
    withMail(async () => {
      const o = mkOrder();
      const res = await create({ orderNumber: o.order_number });
      assert.equal(res.status, 200);
      assert.equal(emails.length, 1);
      assert.deepEqual(emails[0].to, ["customer@example.test"]);
      assert.match(emails[0].html, /44100000001/);
      assert.match(emails[0].text, /44100000001/);
      assert.match(emails[0].subject, new RegExp(o.order_number));
      assert.ok(emails[0].reply_to);
    }));
  test("a test (sandbox) order is never emailed", () =>
    withMail(async () => {
      const o = mkOrder({ payment_gateway: "alinmapay-sandbox" });
      assert.equal((await create({ orderNumber: o.order_number })).status, 200);
      assert.equal(emails.length, 0);
    }));
  test("no email when the customer gave none or a bad one", () =>
    withMail(async () => {
      for (const email of ["", "not-an-email", "a b@c.d"]) {
        const o = mkOrder({ customers: { ...mkOrder().customers, email } });
        assert.equal((await create({ orderNumber: o.order_number })).status, 200);
      }
      assert.equal(emails.length, 0);
    }));
  test("email not configured: shipment still works, nothing sent", async () => {
    const o = mkOrder();
    assert.equal((await create({ orderNumber: o.order_number })).status, 200);
    assert.equal(emails.length, 0);
  });
  test("the email service failing never undoes the shipment", () =>
    withMail(async () => {
      resendStatus = 500;
      const o = mkOrder();
      const res = await create({ orderNumber: o.order_number });
      assert.equal(res.status, 200);
      assert.equal((await res.json()).awb, "44100000001");
      assert.equal(row(o).tracking_number, "44100000001");
    }));
  test("customer-supplied text is escaped in the email", () =>
    withMail(async () => {
      const o = mkOrder({ customers: { ...mkOrder().customers, full_name: "<script>alert(1)</script>" } });
      await create({ orderNumber: o.order_number });
      assert.ok(!emails[0].html.includes("<script>"));
    }));
});

describe("POST /api/shipping/label", () => {
  const label = (body, opts) => call(labelEp, body, opts);
  test("returns a fresh label link for a shipped order", async () => {
    const o = mkOrder({ tracking_number: "44100000321" });
    aramexImpl = { run: () => new Response(JSON.stringify({ HasErrors: false, ShipmentLabel: { LabelURL: "https://labels.example.test/new.pdf" } }), { status: 200 }) };
    const res = await label({ orderNumber: o.order_number });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).labelUrl, "https://labels.example.test/new.pdf");
    assert.equal(aramexCalls[0].operation, "PrintLabel");
    assert.equal(aramexCalls[0].body.ShipmentNumber, "44100000321");
  });
  test("needs staff, a real tracking number, and passes Aramex's refusal on", async () => {
    const none = mkOrder();
    assert.equal((await label({ orderNumber: none.order_number }, { token: null })).status, 401);
    assert.equal((await label({ orderNumber: none.order_number })).status, 409);
    const pending = mkOrder({ tracking_number: "ARAMEX-PENDING-abc" });
    assert.equal((await label({ orderNumber: pending.order_number })).status, 409);
    const shipped = mkOrder({ tracking_number: "44100000999" });
    aramexImpl = { run: () => new Response(JSON.stringify({ HasErrors: true, Notifications: [{ Code: "ERR", Message: "Shipment not found" }] }), { status: 200 }) };
    assert.equal((await label({ orderNumber: shipped.order_number })).status, 422);
  });
});

// ---- hygiene -----------------------------------------------------------------------------------------------
describe("logs", () => {
  test("never contain Aramex logins, the PIN, the database key, access tokens or the customer's phone and address", () => {
    const text = logs.join("\n");
    for (const secret of [SECRETS.user, SECRETS.pass, SECRETS.pin, SECRETS.service, ...Object.keys(USERS)]) assert.ok(!text.includes(secret), "leaked: " + secret.slice(0, 8));
    for (const personal of ["0554789837", "966554789837", "النخيل", "customer@example.test"]) assert.ok(!text.includes(personal), "customer data in logs: " + personal);
  });
});
