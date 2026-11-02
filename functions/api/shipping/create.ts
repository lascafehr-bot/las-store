// POST /api/shipping/create — an active staff member creates the Aramex shipment for a PAID order.
// Body: { orderNumber, weightKg?, city? }  (weightKg and city let the admin correct what Aramex rejected).
// Safety: staff only, paid orders only, one shipment per order (claimed in the database), live Aramex only for live payments.
import { AramexError, createShipment, requireAramexEnv } from "../../_lib/aramex";
import type { Env, PagesFunction } from "../../_lib/env";
import { requireStaff } from "../../_lib/staff";
import { HttpError, claimShipment, finishShipment, getOrderForShipping, releaseShipment } from "../../_lib/store";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let marker = "";
  let orderNumber = "";
  try {
    try {
      requireAramexEnv(env);
    } catch (err) {
      console.error("shipping/create:", err instanceof Error ? err.message : err);
      return json({ error: "not_configured" }, 503);
    }

    // Same-origin only (the admin screens live on the store's own address).
    const origin = request.headers.get("Origin");
    if (origin && env.SITE_URL && origin !== new URL(env.SITE_URL).origin) return json({ error: "forbidden" }, 403);
    if (Number(request.headers.get("Content-Length") ?? 0) > 5_000) return json({ error: "too_large" }, 413);

    await requireStaff(env, request);

    let body: { orderNumber?: unknown; weightKg?: unknown; city?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "invalid_request" }, 400);
    }
    orderNumber = typeof body.orderNumber === "string" ? body.orderNumber : "";
    const weightKg = body.weightKg == null ? undefined : Number(body.weightKg);
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 50) : undefined;
    if (weightKg !== undefined && !(weightKg >= 0.05 && weightKg <= 30)) return json({ error: "invalid_weight" }, 400);

    const order = await getOrderForShipping(env, orderNumber);
    if (!order) return json({ error: "not_found" }, 404);
    if (order.payment_status !== "paid") return json({ error: "not_paid" }, 409);
    if (order.tracking_number) {
      return order.tracking_number.startsWith("ARAMEX-PENDING-")
        ? json({ error: "in_progress" }, 409)
        : json({ error: "already_shipped", awb: order.tracking_number }, 409);
    }
    // A test order (sandbox payment) must never create a real, billed Aramex shipment.
    if (env.ARAMEX_ENV === "production" && order.payment_gateway !== "alinmapay") return json({ error: "test_order_on_live_aramex" }, 409);

    marker = `ARAMEX-PENDING-${crypto.randomUUID()}`;
    if (!(await claimShipment(env, orderNumber, marker))) {
      marker = "";
      return json({ error: "in_progress" }, 409);
    }

    const created = await createShipment(env, order, { weightKg, city });
    if (!(await finishShipment(env, orderNumber, marker, created.awb))) {
      // The shipment exists at Aramex but the order could not be updated: keep the claim (no duplicate) and tell the admin.
      console.error(`shipping/create: shipment created but order not updated order=${orderNumber} awb=${created.awb}`);
      return json({ error: "created_but_not_saved", awb: created.awb, labelUrl: created.labelUrl }, 500);
    }
    marker = "";
    return json({ orderNumber, awb: created.awb, labelUrl: created.labelUrl, weightKg: created.weightKg });
  } catch (err) {
    if (marker) {
      // Aramex refused or could not be reached: give the claim back so the admin can correct the data and retry.
      try {
        await releaseShipment(env, orderNumber, marker);
      } catch (releaseErr) {
        console.error(`shipping/create: could not release the claim order=${orderNumber}:`, releaseErr instanceof Error ? releaseErr.message : releaseErr);
      }
    }
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    if (err instanceof AramexError) {
      console.error(`shipping/create: aramex ${err.kind} order=${orderNumber}: ${err.messages[0] ?? err.message}`);
      if (err.kind === "rejected") return json({ error: "aramex_rejected", messages: err.messages }, 422);
      return json({ error: "aramex_unavailable" }, 502);
    }
    console.error("shipping/create failed:", err instanceof Error ? err.message : err);
    return json({ error: "shipping_unavailable" }, 502);
  }
};
