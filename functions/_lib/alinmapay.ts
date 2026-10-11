// AlinmaPay Payment Gateway — API Specification v3.7 (hosted payment page).
//  §4.1  pay-request (paymentType 1) -> transactionId + paymentLink.linkUrl
//  §5.2  inquiry (paymentType 10)    -> authoritative result of a transaction
//  §6    signature = SHA-256( trackId|terminalId|password|merchantKey|amount|currency )
//  §7    receipt-URL response: data=<Base64(AES(JSON))>&termId=<terminal>, key = merchant key (hex)
import { createDecipheriv } from "node:crypto";
import type { Env } from "./env";
import { ALINMAPAY_SANDBOX_URL } from "./env";

export const CURRENCY = "SAR";

export function formatAmount(value: number | string): string {
  return Number(value).toFixed(2);
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Request signature (§6): trackId is the merchant order id. */
export async function requestSignature(
  env: Env,
  orderId: string,
  amount: string,
  currency = CURRENCY,
): Promise<string> {
  return sha256Hex(
    [orderId, env.ALINMAPAY_TERMINAL_ID, env.ALINMAPAY_TERMINAL_PASSWORD, env.ALINMAPAY_MERCHANT_KEY, amount, currency].join("|"),
  );
}

function payRequestUrl(env: Env): string {
  return env.ALINMAPAY_PAY_REQUEST_URL || ALINMAPAY_SANDBOX_URL;
}

/** Recorded on each order so sandbox (test) payments are never mistaken for real ones. */
export function gatewayLabel(env: Env): string {
  return env.ALINMAPAY_ENV === "production" ? "alinmapay" : "alinmapay-sandbox";
}

/** Guide §7 Java sample: amount.setScale(2, RoundingMode.CEILING). */
export function ceil2(value: number | string): string {
  const n = Number(value);
  return (Math.ceil(n * 100 - 1e-9) / 100).toFixed(2);
}

/**
 * Response signature (guide §6): SHA-256( PaymentId|merchantKey|responseCode|amount ).
 * PaymentId is taken to be the gateway transactionId. The exact inputs are confirmed against real
 * sandbox responses (ALINMAPAY_SIGNATURE_MODE=log), then enforced.
 */
export async function responseSignatureValid(
  env: Env,
  r: { transactionId?: string; responseCode?: string; amount?: string | number; signature?: string },
): Promise<boolean> {
  if (!r.signature || !r.transactionId || !r.responseCode || r.amount == null || r.amount === "") return false;
  const expected = await sha256Hex([r.transactionId, env.ALINMAPAY_MERCHANT_KEY, r.responseCode, ceil2(r.amount)].join("|"));
  return expected.toLowerCase() === String(r.signature).toLowerCase();
}

type GatewayJson = {
  responseCode?: string;
  responseDescription?: string;
  result?: string;
  transactionId?: string;
  paymentLink?: { linkUrl?: string };
  orderDetails?: { orderId?: string };
  amountDetails?: { amount?: string | number };
  terminalId?: string;
  signature?: string;
};

async function postJson(env: Env, body: Record<string, unknown>): Promise<GatewayJson> {
  // Guide §3: recommended connection timeout is 60 seconds.
  const res = await fetch(payRequestUrl(env), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`AlinmaPay returned a non-JSON response (HTTP ${res.status})`);
  }
}

export type InitiatedPayment = { transactionId: string; linkUrl: string };

/** Leg 1 of the hosted flow (§4.1): get the payment id and the hosted page URL. */
export async function initiatePayment(
  env: Env,
  p: {
    orderId: string;
    amount: string;
    description: string;
    email?: string;
    mobile?: string;
    receiptUrl: string;
    street?: string;
    city?: string;
  },
): Promise<InitiatedPayment> {
  const customer: Record<string, string> = { billingAddressCountry: "SA" };
  if (p.email) customer.customerEmail = p.email;
  if (p.mobile) customer.mobileNumber = p.mobile;
  if (p.street) customer.billingAddressStreet = p.street.slice(0, 150);
  if (p.city) customer.billingAddressCity = p.city.slice(0, 30);

  const res = await postJson(env, {
    terminalId: env.ALINMAPAY_TERMINAL_ID,
    password: env.ALINMAPAY_TERMINAL_PASSWORD,
    signature: await requestSignature(env, p.orderId, p.amount),
    paymentType: "1",
    amount: p.amount,
    currency: CURRENCY,
    order: { orderId: p.orderId, description: p.description.slice(0, 100) },
    customer,
    additionalDetails: { userData: JSON.stringify({ receiptUrl: p.receiptUrl }) },
  });

  // §4.1 sample: responseCode "001" = Transaction Initiated
  if (res.responseCode !== "001" || !res.transactionId || !res.paymentLink?.linkUrl) {
    throw new Error(`AlinmaPay rejected the payment request (${res.responseCode ?? "no code"}: ${res.responseDescription ?? "unknown"})`);
  }
  return { transactionId: String(res.transactionId), linkUrl: String(res.paymentLink.linkUrl) };
}

export type PaymentOutcome = {
  result: "SUCCESS" | "FAILURE" | "TIMEOUT" | "UNKNOWN";
  responseCode: string;
  description: string;
  transactionId: string;
  orderId: string;
  amount: string;
  terminalId: string;
  /** null = the response carried no signature */
  signatureValid: boolean | null;
};

/** §5.2 Transaction inquiry — the authoritative source of a payment's result. */
export async function inquirePayment(
  env: Env,
  p: { transactionId: string; orderId: string; amount: string },
): Promise<PaymentOutcome> {
  const res = await postJson(env, {
    referenceId: p.transactionId,
    terminalId: env.ALINMAPAY_TERMINAL_ID,
    password: env.ALINMAPAY_TERMINAL_PASSWORD,
    signature: await requestSignature(env, p.orderId, p.amount),
    paymentType: "10",
    amount: p.amount,
    currency: CURRENCY,
    order: { orderId: p.orderId },
  });
  const result = String(res.result ?? "").toUpperCase();
  const signatureValid = res.signature
    ? await responseSignatureValid(env, {
        transactionId: res.transactionId,
        responseCode: res.responseCode,
        amount: res.amountDetails?.amount,
        signature: res.signature,
      })
    : null;
  return {
    result: result === "SUCCESS" || result === "FAILURE" || result === "TIMEOUT" ? result : "UNKNOWN",
    responseCode: String(res.responseCode ?? ""),
    description: String(res.responseDescription ?? ""),
    transactionId: String(res.transactionId ?? ""),
    orderId: String(res.orderDetails?.orderId ?? ""),
    amount: res.amountDetails?.amount != null ? formatAmount(res.amountDetails.amount) : "",
    terminalId: String(res.terminalId ?? ""),
    signatureValid,
  };
}

/**
 * §7 — decrypt the receipt-URL `data` field: Base64 -> AES (key = merchant key, hex -> bytes).
 * The guide's Java sample uses Cipher.getInstance("AES"), which is AES/ECB/PKCS5Padding.
 */
export type ReceiptPayload = {
  transactionId?: string;
  responseCode?: string;
  signature?: string;
  amountDetails?: { amount?: string | number };
  orderDetails?: { orderId?: string };
};

export function decryptReceipt(data: string, merchantKeyHex: string): ReceiptPayload {
  const key = Buffer.from(merchantKeyHex, "hex");
  const algorithm = key.length === 16 ? "aes-128-ecb" : key.length === 24 ? "aes-192-ecb" : "aes-256-ecb";
  // ECB has no IV; the Workers runtime requires an explicit empty buffer (Node also accepts null).
  const decipher = createDecipheriv(algorithm, key, Buffer.alloc(0));
  const plain = Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]);
  return JSON.parse(plain.toString("utf8"));
}
