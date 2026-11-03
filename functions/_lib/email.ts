// Order emails through Resend (https://resend.com/docs/api-reference/emails/send-email).
//  - owner alert when an order becomes `paid` or `review`
//  - payment receipt to the customer when an order becomes `paid` and they gave an email
// Everything here is best effort: callers must never let an email problem affect a payment.
import { STORE_CONFIG } from "../../lib/config";
import type { Env } from "./env";
import { formatAmount } from "./alinmapay";

export type EmailOrder = {
  order_number: string;
  total_amount: string | number;
  payment_response_code: string;
  customer_notes: string;
  customers: { full_name: string; email: string; phone: string; city: string; address: string } | null;
  order_items: { product_name: string; quantity: number; unit_price: string | number; subtotal: string | number }[];
};

type Message = { to: string; subject: string; html: string; text: string; replyTo?: string };

/** Every customer-supplied value goes through this before it is placed in HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain syntax check, also rejecting anything with whitespace/control characters (header injection). */
export function isEmailAddress(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/.test(value);
}

const money = (v: string | number) => `${formatAmount(v)} ر.س / SAR`;

function itemsTable(order: EmailOrder): string {
  const rows = (order.order_items ?? [])
    .map(
      (i) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${escapeHtml(i.product_name)}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${escapeHtml(i.quantity)}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left" dir="ltr">${escapeHtml(formatAmount(i.subtotal))}</td></tr>`,
    )
    .join("");
  return (
    `<table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="background:#f5f1ec">` +
    `<th style="padding:6px 8px;text-align:right">المنتج / Item</th><th style="padding:6px 8px">الكمية / Qty</th>` +
    `<th style="padding:6px 8px;text-align:left">المجموع / Subtotal</th></tr></thead><tbody>${rows}</tbody></table>`
  );
}

function itemsText(order: EmailOrder): string {
  return (order.order_items ?? []).map((i) => `- ${i.product_name} x${i.quantity} = ${formatAmount(i.subtotal)}`).join("\n");
}

const wrap = (inner: string) =>
  `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px;margin:auto;color:#2b2118;line-height:1.6">${inner}</div>`;

/** The owner's alert. `status` is what the order just became. */
export function buildOwnerEmail(order: EmailOrder, status: "paid" | "review", to: string): Message {
  const c = order.customers;
  const paid = status === "paid";
  const headline = paid ? "تم الدفع بنجاح — طلب جديد" : "طلب يحتاج مراجعة يدوية";
  const subject = `${paid ? "طلب جديد مدفوع" : "طلب يحتاج مراجعة"} ${order.order_number}`;
  const reason = paid
    ? ""
    : `<p style="background:#fff3cd;padding:8px 12px;border-radius:6px">السبب (الرمز): <b dir="ltr">${escapeHtml(order.payment_response_code)}</b>. ` +
      `تحقق من العملية في لوحة AlinmaPay قبل أي إجراء. قد يكون العميل قد دفع فعلاً.</p>`;
  const customerBlock = c
    ? `<p><b>الاسم:</b> ${escapeHtml(c.full_name)}<br><b>الجوال:</b> <span dir="ltr">${escapeHtml(c.phone)}</span><br>` +
      `<b>البريد:</b> <span dir="ltr">${escapeHtml(c.email || "-")}</span><br><b>المدينة:</b> ${escapeHtml(c.city)}<br>` +
      `<b>العنوان:</b> ${escapeHtml(c.address)}</p>`
    : "<p>بيانات العميل غير متوفرة</p>";
  const notes = order.customer_notes ? `<p><b>ملاحظات العميل:</b> ${escapeHtml(order.customer_notes)}</p>` : "";
  const html = wrap(
    `<h2 style="margin:0 0 8px">${headline}</h2><p><b>رقم الطلب:</b> <span dir="ltr">${escapeHtml(order.order_number)}</span><br>` +
      `<b>الإجمالي:</b> ${escapeHtml(money(order.total_amount))}</p>${reason}${itemsTable(order)}${customerBlock}${notes}`,
  );
  const text =
    `${headline}\nرقم الطلب: ${order.order_number}\nالإجمالي: ${formatAmount(order.total_amount)} SAR\n` +
    (paid ? "" : `السبب (الرمز): ${order.payment_response_code}\n`) +
    `${itemsText(order)}\n` +
    (c ? `الاسم: ${c.full_name}\nالجوال: ${c.phone}\nالبريد: ${c.email || "-"}\nالمدينة: ${c.city}\nالعنوان: ${c.address}\n` : "") +
    (order.customer_notes ? `ملاحظات: ${order.customer_notes}\n` : "");
  return { to, subject, html, text };
}

/** Payment receipt for the customer. This is a receipt, NOT a tax invoice, and says so. */
export function buildCustomerEmail(order: EmailOrder, to: string): Message {
  const name = order.customers?.full_name ?? "";
  const subject = `تم استلام دفعتك — Payment received ${order.order_number}`;
  const html = wrap(
    `<h2 style="margin:0 0 8px">شكراً ${escapeHtml(name)}، تم استلام دفعتك</h2>` +
      `<p style="margin:0 0 12px">Thank you${name ? `, ${escapeHtml(name)}` : ""}. Your payment was received.</p>` +
      `<p><b>رقم الطلب / Order number:</b> <span dir="ltr">${escapeHtml(order.order_number)}</span><br>` +
      `<b>الإجمالي / Total:</b> ${escapeHtml(money(order.total_amount))}</p>${itemsTable(order)}` +
      `<p style="margin-top:14px">سنتواصل معك لتأكيد التوصيل. للمتابعة عبر واتساب: ` +
      `<a href="https://wa.me/${STORE_CONFIG.whatsapp}">+${STORE_CONFIG.whatsapp}</a><br>` +
      `We will contact you to confirm delivery. WhatsApp: <a href="https://wa.me/${STORE_CONFIG.whatsapp}">+${STORE_CONFIG.whatsapp}</a></p>` +
      `<p style="font-size:12px;color:#777">هذه رسالة تأكيد دفع وليست فاتورة ضريبية. / This is a payment confirmation, not a tax invoice.<br>` +
      `${escapeHtml(STORE_CONFIG.companyName)} — السجل التجاري ${escapeHtml(STORE_CONFIG.compliance.commercialRegister)} — الرقم الضريبي ${escapeHtml(STORE_CONFIG.compliance.vatNumber)}</p>`,
  );
  const text =
    `تم استلام دفعتك / Payment received\nرقم الطلب / Order: ${order.order_number}\nالإجمالي / Total: ${formatAmount(order.total_amount)} SAR\n` +
    `${itemsText(order)}\nواتساب / WhatsApp: +${STORE_CONFIG.whatsapp}\n` +
    `هذه رسالة تأكيد دفع وليست فاتورة ضريبية. / This is a payment confirmation, not a tax invoice.`;
  return { to, subject, html, text, replyTo: STORE_CONFIG.email };
}

/** "Your order has shipped" with the Aramex tracking number. */
export function buildShippedEmail(order: { order_number: string; customers: { full_name: string } | null }, awb: string, to: string): Message {
  const name = order.customers?.full_name ?? "";
  const link = `https://www.aramex.com/track/results?ShipmentNumber=${encodeURIComponent(awb)}`;
  const subject = `تم شحن طلبك — Your order has shipped ${order.order_number}`;
  const html = wrap(
    `<h2 style="margin:0 0 8px">تم شحن طلبك${name ? `، ${escapeHtml(name)}` : ""}</h2>` +
      `<p style="margin:0 0 12px">Your order has been handed to Aramex${name ? `, ${escapeHtml(name)}` : ""}.</p>` +
      `<p><b>رقم الطلب / Order number:</b> <span dir="ltr">${escapeHtml(order.order_number)}</span><br>` +
      `<b>رقم التتبع (أرامكس) / Aramex tracking number:</b> <span dir="ltr">${escapeHtml(awb)}</span></p>` +
      `<p><a href="${escapeHtml(link)}">تتبع شحنتك / Track your shipment</a></p>` +
      `<p style="font-size:12px;color:#777">للاستفسار راسلنا على / Questions: ${escapeHtml(STORE_CONFIG.email)}<br>${escapeHtml(STORE_CONFIG.companyName)}</p>`,
  );
  const text =
    `تم شحن طلبك / Your order has shipped\nرقم الطلب / Order: ${order.order_number}\nرقم التتبع (أرامكس) / Aramex tracking: ${awb}\n` +
    `${link}\n${STORE_CONFIG.email}`;
  return { to, subject, html, text, replyTo: STORE_CONFIG.email };
}

/** Tells the customer their parcel is on its way. Never throws; logs by kind only. */
export async function notifyShipped(
  env: Env,
  order: { order_number: string; payment_gateway: string; customers: { full_name: string; email: string } | null },
  awb: string,
): Promise<void> {
  const to = order.customers?.email;
  // Test (sandbox) orders carry made-up customers: never email them.
  if (order.payment_gateway !== "alinmapay" || !isEmailAddress(to) || !env.RESEND_API_KEY || !env.EMAIL_FROM) return;
  try {
    await sendEmail(env, buildShippedEmail(order, awb, to));
    console.log(`shipped email sent order=${order.order_number}`);
  } catch (err) {
    console.error(`shipped email failed order=${order.order_number}: ${err instanceof Error ? err.message : "error"}`);
  }
}

/** One call to Resend. Returns false when email is not configured. Throws (without the body) on API errors. */
export async function sendEmail(env: Env, msg: Message): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Email API failed (HTTP ${res.status})`);
  return true;
}

/**
 * Sends the owner alert (paid or review) and, for paid orders, the customer receipt.
 * Never throws: every failure is logged by kind only (no addresses, no names, no keys).
 */
export async function notifyOrderSettled(env: Env, order: EmailOrder, status: "paid" | "review"): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.log(`order email skipped order=${order.order_number} (email not configured)`);
    return;
  }
  try {
    const jobs: { kind: "owner" | "customer"; run: Promise<boolean> }[] = [];
    if (isEmailAddress(env.ORDER_ALERT_EMAIL)) {
      jobs.push({ kind: "owner", run: sendEmail(env, buildOwnerEmail(order, status, env.ORDER_ALERT_EMAIL)) });
    }
    const customerEmail = order.customers?.email;
    if (status === "paid" && isEmailAddress(customerEmail)) {
      jobs.push({ kind: "customer", run: sendEmail(env, buildCustomerEmail(order, customerEmail)) });
    }
    const results = await Promise.allSettled(jobs.map((j) => j.run));
    results.forEach((r, i) => {
      const kind = jobs[i].kind;
      if (r.status === "fulfilled") console.log(`order email sent order=${order.order_number} kind=${kind}`);
      else console.error(`order email failed order=${order.order_number} kind=${kind}: ${r.reason instanceof Error ? r.reason.message : "error"}`);
    });
  } catch (err) {
    console.error(`order email failed order=${order.order_number}: ${err instanceof Error ? err.message : "error"}`);
  }
}
