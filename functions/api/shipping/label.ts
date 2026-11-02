// POST /api/shipping/label — an active staff member gets a fresh label link for an order that already has an Aramex tracking number.
// Body: { orderNumber }
import { AramexError, printLabel, requireAramexEnv } from "../../_lib/aramex";
import type { Env, PagesFunction } from "../../_lib/env";
import { requireStaff } from "../../_lib/staff";
import { HttpError, getOrderForShipping } from "../../_lib/store";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    try {
      requireAramexEnv(env);
    } catch (err) {
      console.error("shipping/label:", err instanceof Error ? err.message : err);
      return json({ error: "not_configured" }, 503);
    }
    const origin = request.headers.get("Origin");
    if (origin && env.SITE_URL && origin !== new URL(env.SITE_URL).origin) return json({ error: "forbidden" }, 403);

    await requireStaff(env, request);

    let body: { orderNumber?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "invalid_request" }, 400);
    }
    const order = await getOrderForShipping(env, typeof body.orderNumber === "string" ? body.orderNumber : "");
    if (!order) return json({ error: "not_found" }, 404);
    if (!order.tracking_number || order.tracking_number.startsWith("ARAMEX-PENDING-")) return json({ error: "no_shipment" }, 409);

    return json({ orderNumber: order.order_number, awb: order.tracking_number, labelUrl: await printLabel(env, order.tracking_number) });
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    if (err instanceof AramexError) {
      console.error(`shipping/label: aramex ${err.kind}: ${err.messages[0] ?? err.message}`);
      return json(err.kind === "rejected" ? { error: "aramex_rejected", messages: err.messages } : { error: "aramex_unavailable" }, err.kind === "rejected" ? 422 : 502);
    }
    console.error("shipping/label failed:", err instanceof Error ? err.message : err);
    return json({ error: "shipping_unavailable" }, 502);
  }
};
