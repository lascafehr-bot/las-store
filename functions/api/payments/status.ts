// GET /api/payments/status?order=LAS... — verified payment state for the confirmation page.
// If the order is still pending it asks AlinmaPay (Inquiry) first, so a missed callback cannot leave it stale.
import { requireEnv, type Env, type PagesFunction } from "../../_lib/env";
import { claimInquiry, getOrder, reconcileOrder } from "../../_lib/store";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    requireEnv(env);
    const orderNumber = new URL(request.url).searchParams.get("order") ?? "";
    const order = await getOrder(env, orderNumber);
    if (!order) return json({ error: "not_found" }, 404);

    let status = order.payment_status;
    if (status === "pending") {
      try {
        // At most one gateway inquiry per order every 5 seconds, however often this endpoint is called.
        if (await claimInquiry(env, order.order_number, 5)) status = await reconcileOrder(env, order);
      } catch (err) {
        console.error("payments/status inquiry failed:", err instanceof Error ? err.message : err);
      }
    }
    return json({ orderNumber: order.order_number, status, total: Number(order.total_amount) });
  } catch (err) {
    console.error("payments/status failed:", err instanceof Error ? err.message : err);
    return json({ error: "unavailable" }, 503);
  }
};
