// Server-side environment for Cloudflare Pages Functions.
// Every value here is a secret or server-only setting: set them in the Cloudflare
// Pages dashboard (or .dev.vars locally). Never prefix them with NEXT_PUBLIC_.
export interface Env {
  ALINMAPAY_MERCHANT_KEY: string;
  ALINMAPAY_TERMINAL_ID: string;
  ALINMAPAY_TERMINAL_PASSWORD: string;
  // Defaults to the SANDBOX URL. Set to the production URL only when going live.
  ALINMAPAY_PAY_REQUEST_URL?: string;
  // Public https origin of the store, e.g. https://shop.lascafe.sa (used for the receipt URL).
  SITE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// Minimal Cloudflare Pages Functions handler type.
export type PagesFunction<E> = (ctx: { request: Request; env: E }) => Response | Promise<Response>;

export const ALINMAPAY_SANDBOX_URL =
  "https://pg.alinmapay.com.sa/SB_Transactions/v2/payments/pay-request";

export function requireEnv(env: Env): void {
  const missing = (
    [
      "ALINMAPAY_MERCHANT_KEY",
      "ALINMAPAY_TERMINAL_ID",
      "ALINMAPAY_TERMINAL_PASSWORD",
      "SITE_URL",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ] as const
  ).filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing server configuration: ${missing.join(", ")}`);
}
