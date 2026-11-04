// Server-side order persistence (Supabase PostgREST with the service-role key) and pricing.
import { getBeanWeights, getProductBySlug, isBeanProduct } from "../../lib/products";
import type { Env } from "./env";
import { formatAmount, gatewayLabel, INQUIRY_REQUEST_ERROR_CODES, inquirePayment } from "./alinmapay";
import { notifyOrderSettled, type EmailOrder } from "./email";
import type { ShippingOrder } from "./aramex";

export type ClientItem = { slug: string; color?: string; weight?: string; quantity: number };
export type PricedItem = { name: string; unit_price: number; quantity: number; slug: string; options: string };

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Prices always come from the catalog on the server; the browser's prices are ignored. */
export function priceItems(items: ClientItem[]): { items: PricedItem[]; total: number } {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new HttpError(400, "invalid_cart");
  }
  const priced = items.map((raw) => {
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new HttpError(400, "invalid_cart");
    const product = typeof raw.slug === "string" ? getProductBySlug(raw.slug) : undefined;
    if (!product) throw new HttpError(400, "invalid_cart");

    let unit = product.price;
    if (isBeanProduct(product)) {
      const weight = getBeanWeights(product).find((w) => w.label === raw.weight || w.labelEn === raw.weight);
      if (!weight) throw new HttpError(400, "invalid_cart");
      unit = weight.price ?? 0;
    }
    if (!(unit > 0)) throw new HttpError(400, "invalid_cart");

    const options = [raw.color, raw.weight].filter((v) => typeof v === "string" && v).join(" · ");
    return { name: product.name, unit_price: unit, quantity, slug: product.slug, options };
  });
  const total = priced.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  return { items: priced, total: Math.round(total * 100) / 100 };
}

/** Merchant order id: alphanumeric only (guide §4.1: avoid spaces and special characters). */
export function newOrderNumber(): string {
  const d = new Date();
  const date = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `LAS${date}${rand}`;
}

async function rest<T = unknown>(env: Env, path: string, init: RequestInit & { prefer?: string } = {}): Promise<T | null> {
  const { prefer, ...rest } = init;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      // Legacy service_role keys are JWTs and go in both headers. The newer sb_secret_… keys are NOT JWTs:
      // Supabase documents them as apikey-header only, so no Authorization header is sent for those.
      ...(env.SUPABASE_SERVICE_ROLE_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } : {}),
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Supabase ${path.split("?")[0]} failed (HTTP ${res.status})`);
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}

export type StoredOrder = {
  order_number: string;
  total_amount: string | number;
  payment_status: "pending" | "paid" | "failed" | "cancelled" | "review";
  payment_reference: string;
  checkout_fingerprint: string | null;
  created_at: string;
};

const ORDER_COLUMNS = "order_number,total_amount,payment_status,payment_reference,checkout_fingerprint,created_at";

/**
 * Identifies "the same checkout": same phone, same cart, same total. Used to stop a customer who already
 * paid (but closed the tab, so the cart was never cleared) from paying for the same cart twice.
 */
export async function checkoutFingerprint(phone: string, items: PricedItem[], total: number): Promise<string> {
  const lines = items.map((i) => `${i.slug}|${i.options}|${i.quantity}`).sort().join(";");
  const data = new TextEncoder().encode(`${phone.replace(/\D/g, "")}#${lines}#${total.toFixed(2)}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function findRecentOrders(env: Env, fingerprint: string, minutes = 30): Promise<StoredOrder[]> {
  if (!/^[0-9a-f]{64}$/.test(fingerprint)) return [];
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const rows = await rest<StoredOrder[]>(
    env,
    `orders?checkout_fingerprint=eq.${fingerprint}&created_at=gte.${since}&select=${ORDER_COLUMNS}&order=created_at.desc&limit=5`,
  );
  return rows ?? [];
}

export async function createOrder(
  env: Env,
  o: {
    orderNumber: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    notes: string;
    total: number;
    items: PricedItem[];
    fingerprint: string;
  },
): Promise<void> {
  await rest(env, "rpc/store_create_order", {
    method: "POST",
    body: JSON.stringify({
      p_order_number: o.orderNumber,
      p_full_name: o.name,
      p_email: o.email,
      p_phone: o.phone,
      p_city: o.city,
      p_address: o.address,
      p_notes: o.notes,
      p_total: o.total,
      p_fingerprint: o.fingerprint,
      p_gateway: gatewayLabel(env),
      p_items: o.items.map((i) => ({
        name: i.options ? `${i.name} (${i.options})` : i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    }),
  });
}

export async function getOrder(env: Env, orderNumber: string): Promise<StoredOrder | null> {
  if (!/^LAS[0-9]{8}[0-9A-F]{10}$/.test(orderNumber)) return null;
  const rows = await rest<StoredOrder[]>(
    env,
    `orders?order_number=eq.${orderNumber}&select=${ORDER_COLUMNS}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function setPaymentReference(env: Env, orderNumber: string, transactionId: string): Promise<void> {
  await rest(env, `orders?order_number=eq.${orderNumber}&payment_status=eq.pending`, {
    method: "PATCH",
    body: JSON.stringify({ payment_reference: transactionId }),
  });
}

/**
 * Atomically "claims" the right to ask AlinmaPay about an order, at most once per `minSeconds`.
 * Stops anyone hammering the public status endpoint from turning into a flood of gateway calls.
 */
export async function claimInquiry(env: Env, orderNumber: string, minSeconds: number): Promise<boolean> {
  const cutoff = new Date(Date.now() - minSeconds * 1000).toISOString();
  const rows = await rest<unknown[]>(
    env,
    `orders?order_number=eq.${orderNumber}&payment_status=eq.pending&or=(payment_checked_at.is.null,payment_checked_at.lt.${cutoff})`,
    { method: "PATCH", prefer: "return=representation", body: JSON.stringify({ payment_checked_at: new Date().toISOString() }) },
  );
  return Array.isArray(rows) && rows.length > 0;
}

/** Moves a *pending* order to its final state; a settled order is never overwritten. */
async function settle(
  env: Env,
  orderNumber: string,
  status: "paid" | "failed" | "cancelled" | "review",
  responseCode: string,
): Promise<boolean> {
  const rows = await rest<unknown[]>(env, `orders?order_number=eq.${orderNumber}&payment_status=eq.pending&select=order_number`, {
    method: "PATCH",
    prefer: "return=representation",
    body: JSON.stringify({
      payment_status: status,
      payment_response_code: responseCode,
      payment_gateway: gatewayLabel(env),
      ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}),
    }),
  });
  // true only when THIS call moved the order out of "pending" (a duplicate callback finds nothing to update).
  return Array.isArray(rows) && rows.length > 0;
}

/** The order with its customer and items, for the notification emails. */
export async function getOrderForEmail(env: Env, orderNumber: string): Promise<EmailOrder | null> {
  if (!/^LAS[0-9]{8}[0-9A-F]{10}$/.test(orderNumber)) return null;
  const select =
    "order_number,total_amount,payment_response_code,customer_notes," +
    "customers(full_name,email,phone,city,address),order_items(product_name,quantity,unit_price,subtotal)";
  const rows = await rest<EmailOrder[]>(env, `orders?order_number=eq.${orderNumber}&select=${select}&limit=1`);
  return rows?.[0] ?? null;
}

/** The order with what Aramex needs (customer, items, payment and shipping state). */
export async function getOrderForShipping(env: Env, orderNumber: string): Promise<ShippingOrder | null> {
  if (!/^LAS[0-9]{8}[0-9A-F]{10}$/.test(orderNumber)) return null;
  const select =
    "order_number,payment_status,payment_gateway,shipping_status,tracking_number,customer_notes," +
    "customers(full_name,email,phone,city,address),order_items(product_name,quantity)";
  const rows = await rest<ShippingOrder[]>(env, `orders?order_number=eq.${orderNumber}&select=${select}&limit=1`);
  return rows?.[0] ?? null;
}

/**
 * Claims the right to create the shipment for a PAID order that has no tracking number yet, by writing a unique marker
 * into tracking_number. Only one caller can win, so two clicks (or two admins) can never create two shipments.
 */
export async function claimShipment(env: Env, orderNumber: string, marker: string): Promise<boolean> {
  const rows = await rest<unknown[]>(
    env,
    `orders?order_number=eq.${orderNumber}&payment_status=eq.paid&tracking_number=eq.&select=order_number`,
    { method: "PATCH", prefer: "return=representation", body: JSON.stringify({ tracking_number: marker }) },
  );
  return Array.isArray(rows) && rows.length > 0;
}

/** Replaces the claim marker with the real tracking number and marks the order as packed. */
export async function finishShipment(env: Env, orderNumber: string, marker: string, awb: string): Promise<boolean> {
  const rows = await rest<unknown[]>(
    env,
    `orders?order_number=eq.${orderNumber}&tracking_number=eq.${encodeURIComponent(marker)}&select=order_number`,
    { method: "PATCH", prefer: "return=representation", body: JSON.stringify({ tracking_number: awb, shipping_status: "packed" }) },
  );
  return Array.isArray(rows) && rows.length > 0;
}

/** Gives the claim back after Aramex refused (or could not be reached), so the admin can fix the data and try again. */
export async function releaseShipment(env: Env, orderNumber: string, marker: string): Promise<void> {
  await rest(env, `orders?order_number=eq.${orderNumber}&tracking_number=eq.${encodeURIComponent(marker)}`, {
    method: "PATCH",
    body: JSON.stringify({ tracking_number: "" }),
  });
}

/**
 * Settles to "paid" or "review" and, only when this call really changed the order, sends the notification emails.
 * An email problem is logged and swallowed: it can never change or undo the payment outcome.
 */
async function settleAndNotify(
  env: Env,
  orderNumber: string,
  status: "paid" | "review",
  responseCode: string,
  waitUntil?: (promise: Promise<unknown>) => void,
): Promise<void> {
  const changed = await settle(env, orderNumber, status, responseCode);
  if (!changed) return;
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.log(`order email skipped order=${orderNumber} (email not configured)`);
    return;
  }
  const job = (async () => {
    try {
      const order = await getOrderForEmail(env, orderNumber);
      if (order) await notifyOrderSettled(env, order, status);
    } catch (err) {
      console.error(`order email failed order=${orderNumber}: ${err instanceof Error ? err.message : "error"}`);
    }
  })();
  if (waitUntil) waitUntil(job);
  else await job;
}

/** The payment could not even be started (e.g. the gateway rejected the request). */
export async function failOrder(env: Env, orderNumber: string, code: string): Promise<void> {
  await settle(env, orderNumber, "failed", code);
}

/**
 * Asks AlinmaPay (Inquiry, guide §5.2) what really happened and updates a pending order.
 * The decision is based only on this server-to-server answer — never on browser parameters.
 */
export async function reconcileOrder(
  env: Env,
  order: StoredOrder,
  // receiptVerified: the caller (the receipt-URL callback) has already verified the receipt's own signature
  // (guide §6) AND that its order, transaction, amount and response code match this order.
  opts: { receiptVerified?: boolean; waitUntil?: (promise: Promise<unknown>) => void } = {},
): Promise<StoredOrder["payment_status"]> {
  if (order.payment_status !== "pending" || !order.payment_reference) return order.payment_status;

  const amount = formatAmount(order.total_amount);
  const out = await inquirePayment(env, { transactionId: order.payment_reference, orderId: order.order_number, amount });
  // Diagnostics only: the outcome the gateway reported (no keys, signatures or card data).
  console.log(`alinmapay inquiry order=${order.order_number} result=${out.result} code=${out.responseCode} description="${out.description}"`);

  if (out.result === "SUCCESS" && out.responseCode === "000") {
    // Authenticity: a valid signature (guide §6) is required, from one of two sources: the inquiry response's
    // own signature, or the receipt's signature already verified by the callback (the inquiry signature's formula
    // is not documented and did not validate against the real sandbox). No "log only" mode.
    // The log line holds only the order number, booleans and formula names — never a signature or key.
    console.log(
      `alinmapay signature check order=${order.order_number} valid=${out.signatureValid} receiptVerified=${Boolean(opts.receiptVerified)}` +
        (out.signatureHints.length ? ` otherFormulaMatched=[${out.signatureHints.join("; ")}]` : ""),
    );

    const matches =
      out.orderId === order.order_number &&
      out.terminalId === env.ALINMAPAY_TERMINAL_ID &&
      out.transactionId === order.payment_reference &&
      formatAmount(out.amount) === amount;
    if (!matches) {
      await settleAndNotify(env, order.order_number, "review", "MISMATCH", opts.waitUntil);
      return "review";
    }
    if (out.signatureValid !== true && opts.receiptVerified !== true) {
      await settleAndNotify(env, order.order_number, "review", "BAD_SIGNATURE", opts.waitUntil);
      return "review";
    }
    // Same cart + phone already paid in the last 30 minutes: flag for a manual refund instead of double-fulfilling.
    // Earlier pending orders for the same cart are checked first, so the earliest paid order always wins.
    if (order.checkout_fingerprint) {
      const recent = await findRecentOrders(env, order.checkout_fingerprint);
      for (const other of recent) {
        if (other.order_number === order.order_number) continue;
        let state = other.payment_status;
        if (state === "pending" && other.payment_reference && other.created_at < order.created_at) {
          state = await reconcileOrder(env, other); // only recurses into strictly earlier orders
        }
        if (state === "paid") {
          await settleAndNotify(env, order.order_number, "review", "DUPLICATE_PAYMENT", opts.waitUntil);
          return "review";
        }
      }
    }
    await settleAndNotify(env, order.order_number, "paid", out.responseCode, opts.waitUntil);
    return "paid";
  }
  if (out.result === "FAILURE") {
    // The gateway rejected our inquiry request / merchant setup (e.g. 619 country, 622 IP, 225 password), which says
    // nothing reliable about the payment itself, and the customer may well have been charged. Never settle it as
    // "failed" (that tells them "no charge" and cannot be undone): a person checks it against the dashboard.
    if (INQUIRY_REQUEST_ERROR_CODES.has(out.responseCode)) {
      console.log(`alinmapay inquiry rejected order=${order.order_number} code=${out.responseCode} -> review`);
      await settleAndNotify(env, order.order_number, "review", out.responseCode, opts.waitUntil);
      return "review";
    }
    // 624 = "Transaction canceled by the user" (guide §14)
    const status = out.responseCode === "624" ? "cancelled" : "failed";
    await settle(env, order.order_number, status, out.responseCode);
    return status;
  }
  return "pending"; // TIMEOUT / unknown / request in progress: keep waiting, never guess
}

