// Offline regression tests for the AlinmaPay payment flow. Run with:  npm run test:payments
//
// What it does: bundles the REAL functions/api/payments/{callback,status}.ts and functions/_lib/env.ts with esbuild
// (already installed as a dependency of wrangler), then drives them against an in-memory fake of the orders table and
// a mocked gateway. No network, no real credentials (a random key is generated per run), no database, no payments.
//
// The rule these tests protect: an order is NEVER `paid` without verified evidence, and a gateway complaint about
// OUR request (619, 622, 225 ...) never tells a possibly-charged customer "no charge" (`failed`).
import assert from "node:assert/strict";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outdir = mkdtempSync(join(tmpdir(), "las-payments-test-"));
await build({
  entryPoints: {
    callback: join(root, "functions/api/payments/callback.ts"),
    status: join(root, "functions/api/payments/status.ts"),
    env: join(root, "functions/_lib/env.ts"),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outdir,
  logLevel: "error",
});
const load = (name) => import(pathToFileURL(join(outdir, `${name}.js`)).href);
const [cb, st, envMod] = await Promise.all([load("callback"), load("status"), load("env")]);

// ---- fakes -----------------------------------------------------------------------------------------------
const KEY = randomBytes(32).toString("hex");
const PW = "pw-" + randomBytes(6).toString("hex");
const SERVICE_KEY = "sb_secret_" + randomBytes(6).toString("hex");
const env = {
  ALINMAPAY_ENV: "sandbox",
  ALINMAPAY_MERCHANT_KEY: KEY,
  ALINMAPAY_TERMINAL_ID: "TERTEST1",
  ALINMAPAY_TERMINAL_PASSWORD: PW,
  ALINMAPAY_PAY_REQUEST_URL: "https://pg.alinmapay.com.sa/SB_Transactions/v2/payments/pay-request",
  ALINMAPAY_MERCHANT_IP: "203.0.113.9",
  SITE_URL: "http://localhost:8788",
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
};

const db = new Map();
const logs = [];
let gatewayCalls = 0;
let gatewayBodies = [];
let gatewayImpl = () => {
  throw new Error("gateway not expected");
};
let emails = [];
let resendImpl = () => new Response(JSON.stringify({ id: "email-id" }), { status: 200 });
const realFetch = globalThis.fetch;
const realLog = console.log;
const realError = console.error;

const fakeFetch = async (url, init = {}) => {
  url = String(url);
  if (url.includes("alinmapay.com.sa")) {
    gatewayCalls++;
    const body = JSON.parse(init.body);
    gatewayBodies.push(body);
    return gatewayImpl(body);
  }
  if (url.startsWith("https://api.resend.com/")) {
    const body = JSON.parse(init.body);
    emails.push({ authorization: init.headers?.Authorization, ...body });
    return resendImpl(body);
  }
  const u = new URL(url);
  const table = u.pathname.replace("/rest/v1/", "");
  if (table !== "orders") throw new Error("unexpected table " + table);
  const q = u.searchParams;
  const eq = (k) => (q.get(k)?.startsWith("eq.") ? q.get(k).slice(3) : undefined);
  let rows = [...db.values()];
  if (eq("order_number")) rows = rows.filter((r) => r.order_number === eq("order_number"));
  if (eq("payment_status")) rows = rows.filter((r) => r.payment_status === eq("payment_status"));
  if (eq("checkout_fingerprint")) rows = rows.filter((r) => r.checkout_fingerprint === eq("checkout_fingerprint"));
  if (q.get("created_at")?.startsWith("gte.")) rows = rows.filter((r) => r.created_at >= q.get("created_at").slice(4));
  if (q.get("or")) {
    const lt = q.get("or").match(/payment_checked_at\.lt\.([^,)]+)/)?.[1];
    rows = rows.filter((r) => r.payment_checked_at == null || (lt && r.payment_checked_at < lt));
  }
  if ((init.method ?? "GET") === "PATCH") {
    const patch = JSON.parse(init.body);
    rows.forEach((r) => Object.assign(r, patch));
    const prefer = init.headers?.Prefer ?? "";
    return new Response(prefer.includes("return=representation") ? JSON.stringify(rows) : "", { status: 200 });
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
  emails = [];
  resendImpl = () => new Response(JSON.stringify({ id: "email-id" }), { status: 200 });
  gatewayCalls = 0;
  gatewayBodies = [];
  gatewayImpl = () => {
    throw new Error("gateway not expected");
  };
});

// ---- helpers ---------------------------------------------------------------------------------------------
const sha = (s) => createHash("sha256").update(s).digest("hex");
const ceil2 = (v) => (Math.ceil(Number(v) * 100 - 1e-9) / 100).toFixed(2);
const respSig = (tx, code, amount, key = KEY) => sha([tx, key, code, ceil2(amount)].join("|"));
let counter = 0;
const mkOrder = (o = {}) => {
  counter++;
  const order = {
    order_number: "LAS20261012" + (0xa00000 + counter).toString(16).toUpperCase().padStart(10, "0"),
    total_amount: "74.00",
    payment_status: "pending",
    payment_reference: "26285" + String(100000000000 + counter),
    checkout_fingerprint: null,
    created_at: new Date().toISOString(),
    payment_checked_at: null,
    payment_response_code: "",
    customer_notes: "",
    customers: { full_name: "Test Customer", email: "customer@example.test", phone: "0500000000", city: "Riyadh", address: "1 Test St" },
    order_items: [{ product_name: "Uganda (250g)", quantity: 2, unit_price: "37.00", subtotal: "74.00" }],
    ...o,
  };
  db.set(order.order_number, order);
  return order;
};
const receipt = (order, o = {}) => {
  const code = o.code ?? "000";
  const amount = o.amount ?? order.total_amount;
  const tx = o.tx ?? order.payment_reference;
  const payload = {
    transactionId: tx,
    responseCode: code,
    signature: o.sig ?? respSig(tx, code, amount),
    amountDetails: { amount },
    orderDetails: { orderId: o.orderId ?? order.order_number },
  };
  const cipher = createCipheriv("aes-256-ecb", Buffer.from(o.encKey ?? KEY, "hex"), null);
  return Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]).toString("base64");
};
const post = async (data, termId = env.ALINMAPAY_TERMINAL_ID, opts = {}) => {
  const form = new FormData();
  if (data != null) form.set("data", data);
  if (termId != null) form.set("termId", termId);
  const res = await cb.onRequestPost({
    request: new Request("http://localhost:8788/api/payments/callback", { method: "POST", body: form }),
    env: opts.env ?? env,
    waitUntil: opts.waitUntil,
  });
  return res.status;
};
const poll = async (order, e = env) => {
  const res = await st.onRequestGet({ request: new Request(`http://localhost:8788/api/payments/status?order=${order.order_number}`), env: e });
  return res.json();
};
// The real sandbox's inquiry signature does not validate under guide §6, so by default it is invalid here too.
const inquiry = (order, o = {}) => {
  const code = o.code ?? "000";
  const tx = o.tx ?? order.payment_reference;
  const amount = o.amount ?? order.total_amount;
  return new Response(
    JSON.stringify({
      responseCode: code,
      result: o.result ?? "SUCCESS",
      responseDescription: "x",
      transactionId: tx,
      orderDetails: { orderId: o.orderId ?? order.order_number },
      terminalId: o.terminal ?? env.ALINMAPAY_TERMINAL_ID,
      amountDetails: { amount: ceil2(amount), originalAmount: ceil2(amount) },
      signature: o.validOwnSig ? respSig(tx, code, amount) : "f".repeat(64),
    }),
    { status: 200 },
  );
};
const row = (o) => db.get(o.order_number);

// ---- paid only with verified evidence --------------------------------------------------------------------
describe("an order becomes paid only with verified evidence", () => {
  test("verified receipt + inquiry SUCCESS/000 + matching fields -> paid (the real sandbox behaviour)", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    assert.equal(await post(receipt(o)), 303);
    assert.equal(row(o).payment_status, "paid");
    assert.equal(row(o).payment_response_code, "000");
    assert.ok(row(o).paid_at);
  });

  test("the inquiry request carries merchantIp, country, paymentType 10 and no plaintext key", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    await post(receipt(o));
    const body = gatewayBodies[0];
    assert.equal(body.merchantIp, "203.0.113.9");
    assert.equal(body.customer.billingAddressCountry, "SA");
    assert.equal(body.paymentType, "10");
    assert.ok(!JSON.stringify(body).includes(KEY));
  });

  test("duplicate callbacks keep it paid and ask the gateway only once", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    const d = receipt(o);
    await post(d);
    await post(d);
    await post(d);
    assert.equal(row(o).payment_status, "paid");
    assert.equal(gatewayCalls, 1);
  });

  test("a tampered receipt signature (and invalid inquiry signature) -> review, not paid", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    await post(receipt(o, { sig: "a".repeat(64) }));
    assert.equal(row(o).payment_status, "review");
    assert.equal(row(o).payment_response_code, "BAD_SIGNATURE");
  });

  test("a receipt validly signed for a different amount -> review, not paid", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    await post(receipt(o, { amount: "1.00" }));
    assert.equal(row(o).payment_status, "review");
  });

  test("a receipt for a different transaction than the one we created -> review, not paid", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    await post(receipt(o, { tx: "2628599999999999999" }));
    assert.equal(row(o).payment_status, "review");
  });

  test("no payment reference stored when the receipt arrives -> the receipt is never trusted", async () => {
    const o = mkOrder({ payment_reference: "" });
    gatewayImpl = () => inquiry(o, { tx: "2628511111111111111" });
    await post(receipt(o, { tx: "2628511111111111111" }));
    assert.equal(row(o).payment_status, "review");
  });

  test("a receipt encrypted with another key is rejected (400) and the gateway is not asked", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    assert.equal(await post(receipt(o, { encKey: randomBytes(32).toString("hex") })), 400);
    assert.equal(row(o).payment_status, "pending");
    assert.equal(gatewayCalls, 0);
  });

  test("a callback for another terminal is rejected (400)", async () => {
    const o = mkOrder();
    assert.equal(await post(receipt(o), "TEROTHER"), 400);
    assert.equal(gatewayCalls, 0);
    assert.equal(row(o).payment_status, "pending");
  });

  test("inquiry amount differs from the order total -> review (MISMATCH)", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o, { amount: "1.00" });
    await post(receipt(o));
    assert.equal(row(o).payment_status, "review");
    assert.equal(row(o).payment_response_code, "MISMATCH");
  });

  test("inquiry for another terminal -> review", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o, { terminal: "TEROTHER" });
    await post(receipt(o));
    assert.equal(row(o).payment_status, "review");
  });

  test("same cart already paid within 30 minutes -> review (DUPLICATE_PAYMENT)", async () => {
    const fp = "b".repeat(64);
    mkOrder({ checkout_fingerprint: fp, payment_status: "paid", created_at: new Date(Date.now() - 60_000).toISOString() });
    const o = mkOrder({ checkout_fingerprint: fp });
    gatewayImpl = () => inquiry(o);
    await post(receipt(o));
    assert.equal(row(o).payment_status, "review");
    assert.equal(row(o).payment_response_code, "DUPLICATE_PAYMENT");
  });

  test("status endpoint without a receipt and with an invalid inquiry signature -> review, not paid", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    assert.equal((await poll(o)).status, "review");
  });

  test("status endpoint with a valid inquiry signature -> paid (original behaviour kept)", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o, { validOwnSig: true });
    assert.equal((await poll(o)).status, "paid");
  });
});

// ---- real payment outcomes -------------------------------------------------------------------------------
describe("real payment outcomes are settled correctly", () => {
  for (const [code, label] of [["605", "invalid CVV"], ["237", "session timeout"], ["604", "invalid card number"], ["617", "invalid expiry"]]) {
    test(`inquiry FAILURE ${code} (${label}) -> failed, never paid`, async () => {
      const o = mkOrder();
      gatewayImpl = () => inquiry(o, { code, result: "FAILURE" });
      await post(receipt(o, { code }));
      assert.equal(row(o).payment_status, "failed");
      assert.ok(!row(o).paid_at);
    });
  }

  test("inquiry FAILURE 624 (cancelled by the user) -> cancelled", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o, { code: "624", result: "FAILURE" });
    await post(receipt(o, { code: "624" }));
    assert.equal(row(o).payment_status, "cancelled");
  });

  test("a success receipt does not override an inquiry FAILURE -> failed (the inquiry decides)", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o, { code: "605", result: "FAILURE" });
    await post(receipt(o));
    assert.equal(row(o).payment_status, "failed");
  });

  test("a replayed valid receipt on an already failed order changes nothing and asks nobody", async () => {
    const o = mkOrder({ payment_status: "failed", payment_response_code: "605" });
    await post(receipt(o));
    assert.equal(row(o).payment_status, "failed");
    assert.equal(gatewayCalls, 0);
  });
});

// ---- the money trap: gateway complains about OUR request -------------------------------------------------
describe("a gateway complaint about our request never becomes 'failed'", () => {
  for (const code of ["619", "622", "225", "248", "201", "609", "612", "207"]) {
    test(`inquiry FAILURE ${code} -> review (a person checks it), never failed or paid`, async () => {
      const o = mkOrder();
      gatewayImpl = () => inquiry(o, { code, result: "FAILURE" });
      await post(receipt(o));
      assert.equal(row(o).payment_status, "review");
      assert.equal(row(o).payment_response_code, code);
      assert.ok(!row(o).paid_at);
    });
  }
});

// ---- the gateway is down or answers garbage --------------------------------------------------------------
describe("inquiry failures leave the order pending", () => {
  test("network failure -> 503 and pending", async () => {
    const o = mkOrder();
    gatewayImpl = () => {
      throw new Error("network down");
    };
    assert.equal(await post(receipt(o)), 503);
    assert.equal(row(o).payment_status, "pending");
  });

  test("non-JSON answer -> 503 and pending", async () => {
    const o = mkOrder();
    gatewayImpl = () => new Response("<html>502</html>", { status: 502 });
    assert.equal(await post(receipt(o)), 503);
    assert.equal(row(o).payment_status, "pending");
  });

  test("TIMEOUT result -> stays pending", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o, { result: "TIMEOUT", code: "237" });
    await post(receipt(o));
    assert.equal(row(o).payment_status, "pending");
  });
});

// ---- configuration guard ---------------------------------------------------------------------------------
describe("requireEnv", () => {
  const production = {
    ...env,
    ALINMAPAY_ENV: "production",
    ALINMAPAY_PAY_REQUEST_URL: "https://pg.alinmapay.com.sa/Transactions/v2/payments/pay-request",
    SITE_URL: "https://shop.example.sa",
    SUPABASE_URL: "https://abcdefgh.supabase.co",
  };
  test("production without ALINMAPAY_MERCHANT_IP is refused", () => {
    const rest = { ...production };
    delete rest.ALINMAPAY_MERCHANT_IP;
    assert.throws(() => envMod.requireEnv(rest), /ALINMAPAY_MERCHANT_IP/);
  });
  test("production with a valid IP is accepted", () => {
    assert.doesNotThrow(() => envMod.requireEnv(production));
  });
  test("a malformed IP is refused in any environment", () => {
    for (const bad of ["999.1.1.1", "not-an-ip", "1.2.3", "<your-public-ip>"]) {
      assert.throws(() => envMod.requireEnv({ ...env, ALINMAPAY_MERCHANT_IP: bad }), /ALINMAPAY_MERCHANT_IP/, bad);
    }
  });
  test("sandbox without an IP is allowed (check:payments warns about it)", () => {
    const rest = { ...env };
    delete rest.ALINMAPAY_MERCHANT_IP;
    assert.doesNotThrow(() => envMod.requireEnv(rest));
  });
});

// ---- order emails ----------------------------------------------------------------------------------------
describe("order emails", () => {
  const RESEND_KEY = "re_" + randomBytes(8).toString("hex");
  const emailEnv = {
    ...env,
    RESEND_API_KEY: RESEND_KEY,
    EMAIL_FROM: "LAS CAFE <orders@example.test>",
    ORDER_ALERT_EMAIL: "owner@example.test",
  };
  const pay = async (o, opts = {}) => {
    gatewayImpl = () => inquiry(o);
    return post(receipt(o), env.ALINMAPAY_TERMINAL_ID, { env: emailEnv, ...opts });
  };

  test("paid -> one owner alert and one customer receipt", async () => {
    const o = mkOrder();
    assert.equal(await pay(o), 303);
    assert.equal(row(o).payment_status, "paid");
    assert.equal(emails.length, 2);
    const owner = emails.find((e) => e.to[0] === "owner@example.test");
    const customer = emails.find((e) => e.to[0] === "customer@example.test");
    assert.ok(owner && customer);
    assert.ok(owner.subject.includes(o.order_number));
    assert.equal(owner.authorization, "Bearer " + RESEND_KEY);
    assert.equal(owner.from, "LAS CAFE <orders@example.test>");
    assert.ok(customer.html.includes(o.order_number) && customer.html.includes("74.00"));
    assert.ok(customer.html.includes("ليست فاتورة ضريبية"), "the receipt must say it is not a tax invoice");
  });

  test("review -> owner alert only, with the gateway code, and no customer email", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    await post(receipt(o, { sig: "a".repeat(64) }), env.ALINMAPAY_TERMINAL_ID, { env: emailEnv });
    assert.equal(row(o).payment_status, "review");
    assert.equal(emails.length, 1);
    assert.equal(emails[0].to[0], "owner@example.test");
    assert.ok(emails[0].html.includes("BAD_SIGNATURE"));
  });

  test("a gateway complaint about our request (622) -> owner alert with the code", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o, { code: "622", result: "FAILURE" });
    await post(receipt(o), env.ALINMAPAY_TERMINAL_ID, { env: emailEnv });
    assert.equal(row(o).payment_status, "review");
    assert.equal(emails.length, 1);
    assert.ok(emails[0].html.includes("622"));
  });

  test("failed and cancelled orders send no email", async () => {
    const a = mkOrder();
    gatewayImpl = () => inquiry(a, { code: "605", result: "FAILURE" });
    await post(receipt(a, { code: "605" }), env.ALINMAPAY_TERMINAL_ID, { env: emailEnv });
    const b = mkOrder();
    gatewayImpl = () => inquiry(b, { code: "624", result: "FAILURE" });
    await post(receipt(b, { code: "624" }), env.ALINMAPAY_TERMINAL_ID, { env: emailEnv });
    assert.equal(row(a).payment_status, "failed");
    assert.equal(row(b).payment_status, "cancelled");
    assert.equal(emails.length, 0);
  });

  test("duplicate callbacks send the emails only once", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    const d = receipt(o);
    for (let i = 0; i < 3; i++) await post(d, env.ALINMAPAY_TERMINAL_ID, { env: emailEnv });
    assert.equal(row(o).payment_status, "paid");
    assert.equal(emails.length, 2);
  });

  test("two callbacks arriving at the same moment still send the emails only once", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    const d = receipt(o);
    const results = await Promise.all([
      post(d, env.ALINMAPAY_TERMINAL_ID, { env: emailEnv }),
      post(d, env.ALINMAPAY_TERMINAL_ID, { env: emailEnv }),
      post(d, env.ALINMAPAY_TERMINAL_ID, { env: emailEnv }),
    ]);
    assert.deepEqual(results, [303, 303, 303]);
    assert.equal(row(o).payment_status, "paid");
    assert.ok(gatewayCalls >= 2, "the race really happened: several callbacks asked the gateway at once");
    assert.equal(emails.length, 2);
  });

  test("the status page path also notifies, once", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o, { validOwnSig: true });
    assert.equal((await poll(o, emailEnv)).status, "paid");
    assert.equal((await poll(o, emailEnv)).status, "paid");
    assert.equal(emails.length, 2);
  });

  test("the email service answering 500 never changes the payment result", async () => {
    const o = mkOrder();
    resendImpl = () => new Response("down", { status: 500 });
    assert.equal(await pay(o), 303);
    assert.equal(row(o).payment_status, "paid");
  });

  test("the email service being unreachable never changes the payment result", async () => {
    const o = mkOrder();
    resendImpl = () => {
      throw new Error("network down");
    };
    assert.equal(await pay(o), 303);
    assert.equal(row(o).payment_status, "paid");
  });

  test("email not configured -> nothing is sent and the order is still paid", async () => {
    const o = mkOrder();
    gatewayImpl = () => inquiry(o);
    await post(receipt(o));
    assert.equal(row(o).payment_status, "paid");
    assert.equal(emails.length, 0);
  });

  test("a customer without an email gets no receipt, the owner still gets the alert", async () => {
    const o = mkOrder({ customers: { full_name: "No Email", email: "", phone: "0500000000", city: "Riyadh", address: "1 Test St" } });
    await pay(o);
    assert.deepEqual(emails.map((e) => e.to[0]), ["owner@example.test"]);
  });

  test("a malformed customer email (spaces, newline, extra recipient) is never used", async () => {
    for (const bad of ["a b@example.test", "x@example.test" + String.fromCharCode(10) + "Bcc: evil@example.test", "x@example.test,evil@example.test"]) {
      emails = [];
      const o = mkOrder({ customers: { full_name: "Bad", email: bad, phone: "0500000000", city: "Riyadh", address: "1 Test St" } });
      await pay(o);
      assert.deepEqual(emails.map((e) => e.to[0]), ["owner@example.test"], bad);
    }
  });

  test("customer-supplied HTML is escaped in both emails", async () => {
    const o = mkOrder({
      customer_notes: '"><img src=x onerror=alert(1)>',
      customers: { full_name: "<script>alert(1)</script>", email: "customer@example.test", phone: "0500000000", city: "Riyadh", address: "<b>x</b>" },
    });
    await pay(o);
    assert.equal(emails.length, 2);
    for (const e of emails) {
      assert.ok(!e.html.includes("<script>") && !e.html.includes("<img") && !e.html.includes("<b>x"), e.to[0]);
    }
    assert.ok(emails.find((e) => e.to[0] === "owner@example.test").html.includes("&lt;script&gt;"));
  });

  test("with waitUntil the callback does not wait for the emails, and they are still sent", async () => {
    const o = mkOrder();
    const pending = [];
    assert.equal(await pay(o, { waitUntil: (p) => pending.push(p) }), 303);
    assert.equal(pending.length, 1);
    await Promise.all(pending);
    assert.equal(emails.length, 2);
  });
});

// ---- hygiene ---------------------------------------------------------------------------------------------
describe("logs", () => {
  test("never contain the merchant key, terminal password, service key or a 64-hex signature", () => {
    const text = logs.join("\n");
    for (const secret of [KEY, PW, SERVICE_KEY]) assert.ok(!text.includes(secret));
    assert.ok(!/re_[0-9a-f]{16}/.test(text), "the email service key must never be logged");
    for (const personal of ["customer@example.test", "1 Test St", "0500000000", "Test Customer"]) {
      assert.ok(!text.includes(personal), "customer data must not appear in logs: " + personal);
    }
    assert.ok(!/[0-9a-fA-F]{64}/.test(text));
  });
});
