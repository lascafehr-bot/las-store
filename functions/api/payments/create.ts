// POST /api/payments/create — validates the cart, saves a pending order, starts the AlinmaPay payment.
import { initiatePayment, formatAmount } from "../../_lib/alinmapay";
import { requireEnv, type Env, type PagesFunction } from "../../_lib/env";
import { HttpError, createOrder, newOrderNumber, priceItems, setPaymentReference, type ClientItem } from "../../_lib/store";

// Guide §4.1 leg 2: "merchant should do the form post to target URL with payment id".
// If the sandbox rejects POST on the hosted page, change this single value to "GET".
const HOSTED_PAGE_METHOD: "POST" | "GET" = "POST";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireEnv(env);

    // Same-origin only: this endpoint creates orders.
    const origin = request.headers.get("Origin");
    if (origin && origin !== new URL(env.SITE_URL).origin) return json({ error: "forbidden" }, 403);
    if (Number(request.headers.get("Content-Length") ?? 0) > 20_000) return json({ error: "too_large" }, 413);

    const body = (await request.json()) as {
      items: ClientItem[];
      customer: { name: string; phone: string; email?: string };
      city: string;
      address: string;
      notes?: string;
    };

    const name = clean(body.customer?.name, 100);
    const phone = clean(body.customer?.phone, 20);
    const email = clean(body.customer?.email, 50);
    const city = clean(body.city, 30);
    const address = clean(body.address, 150);
    if (!name || !phone || !city || !address) throw new HttpError(400, "invalid_details");
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, "invalid_details");

    const { items, total } = priceItems(body.items);
    const orderNumber = newOrderNumber();

    await createOrder(env, { orderNumber, name, email, phone, city, address, notes: clean(body.notes, 500), total, items });

    const payment = await initiatePayment(env, {
      orderId: orderNumber,
      amount: formatAmount(total),
      description: `LAS Store order ${orderNumber}`,
      email: email || undefined,
      mobile: phone.replace(/[^0-9]/g, "").slice(0, 12) || undefined,
      street: address,
      city,
      receiptUrl: `${new URL(env.SITE_URL).origin}/api/payments/callback`,
    });

    // Only ever send the customer to AlinmaPay's own https hosted page.
    const host = new URL(payment.linkUrl).hostname;
    if (new URL(payment.linkUrl).protocol !== "https:" || !(host === "alinmapay.com.sa" || host.endsWith(".alinmapay.com.sa"))) {
      throw new Error("Unexpected hosted payment page URL");
    }

    await setPaymentReference(env, orderNumber, payment.transactionId);

    return json({
      orderNumber,
      total,
      redirect: { method: HOSTED_PAGE_METHOD, url: `${payment.linkUrl}${payment.transactionId}` },
    });
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error("payments/create failed:", err instanceof Error ? err.message : err);
    return json({ error: "payment_unavailable" }, 502);
  }
};
