// Server-side environment for Cloudflare Pages Functions.
// Every value here is a secret or server-only setting: set them in the Cloudflare
// Pages dashboard (or .dev.vars locally). Never prefix them with NEXT_PUBLIC_.
export interface Env {
  ALINMAPAY_MERCHANT_KEY: string;
  ALINMAPAY_TERMINAL_ID: string;
  ALINMAPAY_TERMINAL_PASSWORD: string;
  // Explicit on purpose, no default: "sandbox" or "production". Drives the order label and safety checks.
  ALINMAPAY_ENV: string;
  // Sandbox: optional (defaults to the guide's sandbox URL). Production: required, never defaulted.
  ALINMAPAY_PAY_REQUEST_URL?: string;
  // "log" (default): check AlinmaPay's response signature and log the result only.
  // "enforce": a missing/invalid signature sends the order to manual review. Switch after the sandbox run proves it.
  ALINMAPAY_SIGNATURE_MODE?: string;
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
      "ALINMAPAY_ENV",
      "ALINMAPAY_MERCHANT_KEY",
      "ALINMAPAY_TERMINAL_ID",
      "ALINMAPAY_TERMINAL_PASSWORD",
      "SITE_URL",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ] as const
  ).filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing server configuration: ${missing.join(", ")}`);
  if (env.ALINMAPAY_ENV !== "sandbox" && env.ALINMAPAY_ENV !== "production") {
    throw new Error('ALINMAPAY_ENV must be "sandbox" or "production"');
  }
  if (env.ALINMAPAY_ENV === "production" && !env.ALINMAPAY_PAY_REQUEST_URL) {
    throw new Error("ALINMAPAY_PAY_REQUEST_URL must be set explicitly when ALINMAPAY_ENV is production");
  }
  if (env.ALINMAPAY_SIGNATURE_MODE && !["log", "enforce"].includes(env.ALINMAPAY_SIGNATURE_MODE)) {
    throw new Error('ALINMAPAY_SIGNATURE_MODE must be "log" or "enforce"');
  }
  if (!/^[0-9a-fA-F]+$/.test(env.ALINMAPAY_MERCHANT_KEY) || ![32, 48, 64].includes(env.ALINMAPAY_MERCHANT_KEY.length)) {
    throw new Error("ALINMAPAY_MERCHANT_KEY has an unexpected format (expected 32/48/64 hex characters)");
  }
}
