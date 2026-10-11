// Server-side order persistence (Supabase PostgREST with the service-role key) and pricing.
import { getBeanWeights, getProductBySlug, isBeanProduct } from "../../lib/products";
import type { Env } from "./env";
import { formatAmount, inquirePayment } from "./alinmapay";

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
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
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
};

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
    `orders?order_number=eq.${orderNumber}&select=order_number,total_amount,payment_status,payment_reference&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function setPaymentReference(env: Env, orderNumber: string, transactionId: string): Promise<void> {
  await rest(env, `orders?order_number=eq.${orderNumber}&payment_status=eq.pending`, {
    method: "PATCH",
    body: JSON.stringify({ payment_reference: transactionId }),
  });
}

/** Moves a *pending* order to its final state; a settled order is never overwritten. */
async function settle(
  env: Env,
  orderNumber: string,
  status: "paid" | "failed" | "cancelled" | "review",
  responseCode: string,
): Promise<void> {
  await rest(env, `orders?order_number=eq.${orderNumber}&payment_status=eq.pending`, {
    method: "PATCH",
    body: JSON.stringify({
      payment_status: status,
      payment_response_code: responseCode,
      ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}),
    }),
  });
}

/**
 * Asks AlinmaPay (Inquiry, guide §5.2) what really happened and updates a pending order.
 * The decision is based only on this server-to-server answer — never on browser parameters.
 */
export async function reconcileOrder(env: Env, order: StoredOrder): Promise<StoredOrder["payment_status"]> {
  if (order.payment_status !== "pending" || !order.payment_reference) return order.payment_status;

  const amount = formatAmount(order.total_amount);
  const out = await inquirePayment(env, { transactionId: order.payment_reference, orderId: order.order_number, amount });

  if (out.result === "SUCCESS" && out.responseCode === "000") {
    const matches =
      out.orderId === order.order_number &&
      out.terminalId === env.ALINMAPAY_TERMINAL_ID &&
      formatAmount(out.amount) === amount;
    await settle(env, order.order_number, matches ? "paid" : "review", out.responseCode);
    return matches ? "paid" : "review";
  }
  if (out.result === "FAILURE") {
    // 624 = "Transaction canceled by the user" (guide §14)
    const status = out.responseCode === "624" ? "cancelled" : "failed";
    await settle(env, order.order_number, status, out.responseCode);
    return status;
  }
  return "pending"; // TIMEOUT / unknown / request in progress: keep waiting, never guess
}

