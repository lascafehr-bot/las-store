// GET /api/health — "ok" when the store can reach its database. For the uptime monitor, which also keeps the free
// Supabase project from pausing. Returns no order or customer data: it looks up an order number that cannot exist.
import type { Env, PagesFunction } from "../_lib/env";
import { getOrder } from "../_lib/store";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("database settings are missing");
    await getOrder(env, "LAS00000000AAAAAAAAAA");
    return json({ status: "ok" });
  } catch (err) {
    console.error("health failed:", err instanceof Error ? err.message : err);
    return json({ status: "error" }, 503);
  }
};
