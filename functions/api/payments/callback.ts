// AlinmaPay receipt URL (guide §4.1 / §7). Receives `data` (Base64 + AES encrypted) and `termId`.
// The encrypted body only proves the notice came from the gateway and tells us which order it is about;
// the order's final state always comes from a server-to-server Inquiry (guide §5.2).
import { decryptReceipt, type ReceiptPayload } from "../../_lib/alinmapay";
import { requireEnv, type Env, type PagesFunction } from "../../_lib/env";
import { getOrder, reconcileOrder, setPaymentReference } from "../../_lib/store";

const back = (request: Request, orderNumber?: string) =>
  Response.redirect(new URL(`/order/confirmation${orderNumber ? `?id=${encodeURIComponent(orderNumber)}` : ""}`, request.url).toString(), 303);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireEnv(env);
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return new Response("Bad request", { status: 400 });
    }
    const data = form.get("data");
    const termId = form.get("termId");
    if (typeof data !== "string" || typeof termId !== "string" || termId !== env.ALINMAPAY_TERMINAL_ID) {
      return new Response("Bad request", { status: 400 });
    }

    let payload: ReceiptPayload;
    try {
      payload = decryptReceipt(data, env.ALINMAPAY_MERCHANT_KEY);
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    const orderNumber = String(payload?.orderDetails?.orderId ?? "");
    const order = await getOrder(env, orderNumber);
    if (!order) return new Response("Bad request", { status: 400 });

    if (!order.payment_reference && payload.transactionId) {
      await setPaymentReference(env, order.order_number, String(payload.transactionId));
      order.payment_reference = String(payload.transactionId);
    }
    await reconcileOrder(env, order);
    return back(request, order.order_number);
  } catch (err) {
    console.error("payments/callback failed:", err instanceof Error ? err.message : err);
    return new Response("Temporarily unavailable", { status: 503 });
  }
};

// A customer who opens the receipt URL directly just goes to the confirmation page.
export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const id = new URL(request.url).searchParams.get("id") ?? undefined;
  return back(request, id && /^LAS[0-9]{8}[0-9A-F]{10}$/.test(id) ? id : undefined);
};
