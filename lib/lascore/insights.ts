import { amountOf, csvCell, customerOf, type LascoreOrder } from "@/lib/lascore/orders";

// Customers and sales reports are derived only from PAID orders (refunded ones are subtracted), so they always agree
// with the Orders and Payments screens. Nothing here reads or writes the database.

export type CustomerSummary = {
  key: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  orders: number;
  total: number;
  firstAt: string;
  lastAt: string;
};

function customerKey(phone: string, email: string, name: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length >= 9 ? digits.slice(-9) : digits; // 0501112233 and +966501112233 are the same person
  return local || email.trim().toLowerCase() || name.trim().toLowerCase();
}

export function groupCustomers(orders: LascoreOrder[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();
  for (const o of orders) {
    if (o.payment_status !== "paid") continue;
    const c = customerOf(o);
    const key = customerKey(c?.phone ?? "", c?.email ?? "", c?.full_name ?? "");
    if (!key) continue;
    const at = o.paid_at ?? o.created_at;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        name: c?.full_name ?? "",
        phone: c?.phone ?? "",
        email: c?.email ?? "",
        city: c?.city ?? "",
        orders: 1,
        total: amountOf(o),
        firstAt: at,
        lastAt: at,
      });
      continue;
    }
    existing.orders += 1;
    existing.total += amountOf(o);
    if (at < existing.firstAt) existing.firstAt = at;
    if (at > existing.lastAt) {
      existing.lastAt = at;
      // keep the newest contact details
      existing.name = c?.full_name || existing.name;
      existing.phone = c?.phone || existing.phone;
      existing.email = c?.email || existing.email;
      existing.city = c?.city || existing.city;
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function customersCsv(rows: CustomerSummary[]): string {
  const header = ["name", "phone", "email", "city", "orders", "total_sar", "first_order", "last_order"];
  const lines = rows.map((c) =>
    [c.name, c.phone, c.email, c.city, c.orders, c.total.toFixed(2), c.firstAt, c.lastAt].map(csvCell).join(","),
  );
  return `﻿${[header.join(","), ...lines].join("\r\n")}`;
}

/** Saudi calendar day (YYYY-MM-DD) of a timestamp. */
export function riyadhDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date(iso));
}

export type DayTotal = { day: string; orders: number; revenue: number };

/** Paid orders count as revenue, refunded ones are left out. Days with no sales are included as zero. */
export function salesByDay(orders: LascoreOrder[], days: number, now = new Date()): DayTotal[] {
  const out: DayTotal[] = [];
  for (let i = days - 1; i >= 0; i--) out.push({ day: riyadhDay(new Date(now.getTime() - i * 86400000).toISOString()), orders: 0, revenue: 0 });
  const index = new Map(out.map((d) => [d.day, d]));
  for (const o of orders) {
    if (o.payment_status !== "paid") continue;
    const bucket = index.get(riyadhDay(o.paid_at ?? o.created_at));
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue += amountOf(o);
  }
  return out;
}

export type ProductTotal = { name: string; quantity: number; revenue: number };

export function topProducts(orders: LascoreOrder[], limit = 10): ProductTotal[] {
  const map = new Map<string, ProductTotal>();
  for (const o of orders) {
    if (o.payment_status !== "paid") continue;
    for (const item of o.order_items ?? []) {
      const entry = map.get(item.product_name) ?? { name: item.product_name, quantity: 0, revenue: 0 };
      entry.quantity += Number(item.quantity) || 0;
      entry.revenue += Number(item.subtotal) || 0;
      map.set(item.product_name, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function cityTotals(orders: LascoreOrder[], limit = 8): { city: string; orders: number; revenue: number }[] {
  const map = new Map<string, { city: string; orders: number; revenue: number }>();
  for (const o of orders) {
    if (o.payment_status !== "paid") continue;
    const city = customerOf(o)?.city?.trim() || "—";
    const entry = map.get(city) ?? { city, orders: 0, revenue: 0 };
    entry.orders += 1;
    entry.revenue += amountOf(o);
    map.set(city, entry);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function dailyCsv(rows: DayTotal[]): string {
  return `﻿${["day,orders,revenue_sar", ...rows.map((d) => `${d.day},${d.orders},${d.revenue.toFixed(2)}`)].join("\r\n")}`;
}
