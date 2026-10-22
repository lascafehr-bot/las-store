import type { SupabaseClient } from "@supabase/supabase-js";

// Only PAID orders (and the few that need a person's review) are shown in LASCORE. Pending, failed and cancelled
// checkout attempts exist in the database so the payment can be matched, but they are never listed here.

export type PaymentStatus = "paid" | "review" | "refunded" | "pending" | "failed" | "cancelled";
export type ShippingStatus = "unfulfilled" | "packed" | "shipped" | "delivered";
export type Scope = "live" | "test" | "all";

export type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
};

export type OrderCustomer = {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
};

export type LascoreOrder = {
  id: string;
  order_number: string;
  total_amount: number | string;
  payment_status: string;
  order_status: string;
  shipping_status: string;
  tracking_number: string;
  created_at: string;
  paid_at: string | null;
  payment_reference: string;
  payment_gateway: string;
  payment_response_code: string;
  customer_notes: string;
  customers: OrderCustomer | OrderCustomer[] | null;
  order_items: OrderItem[] | null;
};

export const ORDER_SELECT =
  "id, order_number, total_amount, payment_status, order_status, shipping_status, tracking_number, created_at, paid_at, " +
  "payment_reference, payment_gateway, payment_response_code, customer_notes, " +
  "customers(full_name, email, phone, city, address), order_items(product_name, quantity, unit_price, subtotal)";

export const SHIPPING_STEPS: { id: ShippingStatus; label: string }[] = [
  { id: "unfulfilled", label: "بانتظار التجهيز" },
  { id: "packed", label: "تم التجهيز" },
  { id: "shipped", label: "تم الشحن" },
  { id: "delivered", label: "تم التسليم" },
];

export const PAYMENT_LABELS: Record<string, string> = {
  paid: "مدفوع",
  review: "يحتاج مراجعة",
  refunded: "مسترد",
  pending: "بانتظار الدفع",
  failed: "فشل الدفع",
  cancelled: "ملغي",
};

// Why an order was sent to manual review (orders.payment_response_code).
export const REVIEW_REASONS: Record<string, string> = {
  DUPLICATE_PAYMENT: "دُفع نفس الطلب مرتين — يلزم استرداد إحدى الدفعتين.",
  MISMATCH: "بيانات الدفع لا تطابق الطلب (المبلغ أو الرقم المرجعي).",
  BAD_SIGNATURE: "تعذّر التحقق من توقيع البنك على نتيجة الدفع.",
};

export function shippingLabel(status: string): string {
  return SHIPPING_STEPS.find((s) => s.id === status)?.label ?? status;
}

export function isTestGateway(gateway: string): boolean {
  return gateway === "alinmapay-sandbox";
}

export function gatewaysForScope(scope: Scope): string[] | null {
  if (scope === "live") return ["alinmapay"];
  if (scope === "test") return ["alinmapay-sandbox"];
  return null;
}

export function customerOf(order: LascoreOrder): OrderCustomer | null {
  return Array.isArray(order.customers) ? (order.customers[0] ?? null) : order.customers;
}

export function amountOf(order: { total_amount: number | string }): number {
  return Number(order.total_amount) || 0;
}

export function formatSar(value: number): string {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ر.س`;
}

// Saudi time, Gregorian calendar, Latin digits, 24-hour clock ("22/10/2026, 13:11"). Plain "ar-SA" would print
// Islamic-calendar dates, and Arabic AM/PM marks scramble the reading order inside right-to-left lines.
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Riyadh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFormat.format(d);
}

/** Start of "today" in Saudi time (UTC+3, no daylight saving), as an ISO timestamp. */
export function startOfTodayRiyadh(now = new Date()): string {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(now); // YYYY-MM-DD
  return new Date(`${day}T00:00:00+03:00`).toISOString();
}

export function whatsappLink(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `966${digits.slice(1)}`;
  return digits.length >= 11 ? `https://wa.me/${digits}` : null;
}

type FetchOptions = {
  statuses: PaymentStatus[];
  scope: Scope;
  /** hide delivered orders (shipping work list) */
  excludeDelivered?: boolean;
  sortBy?: "paid_at" | "created_at";
  ascending?: boolean;
  limit?: number;
};

export async function fetchOrders(
  supabase: SupabaseClient,
  opts: FetchOptions,
): Promise<{ rows: LascoreOrder[]; error: string }> {
  let query = supabase.from("orders").select(ORDER_SELECT).in("payment_status", opts.statuses);
  const gateways = gatewaysForScope(opts.scope);
  if (gateways) query = query.in("payment_gateway", gateways);
  if (opts.excludeDelivered) query = query.neq("shipping_status", "delivered");
  query = query
    .order(opts.sortBy ?? "paid_at", { ascending: opts.ascending ?? false, nullsFirst: false })
    .limit(opts.limit ?? 200);

  const { data, error } = await query;
  if (error) return { rows: [], error: "تعذّر تحميل الطلبات. حاول مرة أخرى." };
  return { rows: (data ?? []) as unknown as LascoreOrder[], error: "" };
}

async function updateOrder(
  supabase: SupabaseClient,
  id: string,
  changes: Record<string, string>,
): Promise<{ ok: boolean; message: string }> {
  // .select() makes the database return the changed row, so a silent "0 rows updated" can be detected.
  const { data, error } = await supabase.from("orders").update(changes).eq("id", id).select("id");
  if (error) return { ok: false, message: "رفض النظام هذا التعديل. تحقق من صلاحياتك." };
  if (!data || data.length === 0) return { ok: false, message: "لم يتم الحفظ. حدّث الصفحة وحاول مرة أخرى." };
  return { ok: true, message: "" };
}

export function saveShipping(supabase: SupabaseClient, id: string, status: ShippingStatus, tracking: string) {
  return updateOrder(supabase, id, { shipping_status: status, tracking_number: tracking.trim().slice(0, 80) });
}

/** Admin only (enforced by the database): resolve a review order, or record a refund made in AlinmaPay's portal. */
export function setPaymentStatus(supabase: SupabaseClient, id: string, status: "paid" | "refunded") {
  return updateOrder(
    supabase,
    id,
    status === "paid" ? { payment_status: "paid", paid_at: new Date().toISOString() } : { payment_status: "refunded" },
  );
}

function csvCell(value: string | number): string {
  const text = String(value);
  // Neutralise spreadsheet formulas ("=", "+", "-", "@") in customer-supplied text.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function paymentsCsv(rows: LascoreOrder[]): string {
  const header = ["order_number", "payment_status", "paid_at", "amount_sar", "transaction_id", "gateway", "customer", "phone", "city"];
  const lines = rows.map((o) => {
    const c = customerOf(o);
    return [
      o.order_number,
      o.payment_status,
      o.paid_at ?? "",
      amountOf(o).toFixed(2),
      o.payment_reference,
      o.payment_gateway,
      c?.full_name ?? "",
      c?.phone ?? "",
      c?.city ?? "",
    ]
      .map(csvCell)
      .join(",");
  });
  return `﻿${[header.join(","), ...lines].join("\r\n")}`; // BOM so Excel reads Arabic correctly
}

export type DashboardStats = {
  paidToday: number;
  revenueToday: number;
  paidLast7Days: number;
  revenueLast7Days: number;
  waitingToShip: number;
  needsReview: number;
};

export async function fetchDashboardStats(
  supabase: SupabaseClient,
  scope: Scope,
): Promise<{ stats: DashboardStats | null; error: string }> {
  const gateways = gatewaysForScope(scope);
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const today = startOfTodayRiyadh();

  let recent = supabase.from("orders").select("total_amount, paid_at").eq("payment_status", "paid").gte("paid_at", since).limit(5000);
  let waiting = supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid").in("shipping_status", ["unfulfilled", "packed"]);
  let review = supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "review");
  if (gateways) {
    recent = recent.in("payment_gateway", gateways);
    waiting = waiting.in("payment_gateway", gateways);
    review = review.in("payment_gateway", gateways);
  }

  const [r, w, v] = await Promise.all([recent, waiting, review]);
  if (r.error || w.error || v.error) return { stats: null, error: "تعذّر تحميل الإحصائيات." };

  const rows = (r.data ?? []) as { total_amount: number | string; paid_at: string }[];
  const todayRows = rows.filter((x) => x.paid_at >= today);
  const sum = (list: typeof rows) => list.reduce((s, x) => s + (Number(x.total_amount) || 0), 0);
  return {
    stats: {
      paidToday: todayRows.length,
      revenueToday: sum(todayRows),
      paidLast7Days: rows.length,
      revenueLast7Days: sum(rows),
      waitingToShip: w.count ?? 0,
      needsReview: v.count ?? 0,
    },
    error: "",
  };
}
