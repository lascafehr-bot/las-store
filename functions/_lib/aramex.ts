// Aramex Shipping Services API (JSON web service): create a shipment for a PAID order and get its tracking number
// (AWB) and label. Field rules come from Aramex's "Shipping Services API" manual and the sample requests Aramex sent.
//
// Nothing here is called automatically: the endpoints in functions/api/shipping/ call it when an admin asks for it.
// Secrets are never logged, and request/response bodies are never logged.
import { isLocalHost, type Env } from "./env";

const BASE = {
  production: "https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/",
  uat: "https://ws.uat.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/",
} as const;

/** What the shipping code needs to know about an order (read from the database by getOrderForShipping). */
export type ShippingOrder = {
  order_number: string;
  payment_status: string;
  payment_gateway: string;
  shipping_status: string;
  tracking_number: string;
  customers: { full_name: string; email: string; phone: string; city: string; address: string } | null;
  order_items: { product_name: string; quantity: number }[];
};

export class AramexError extends Error {
  constructor(
    public kind: "rejected" | "unavailable" | "bad_response",
    message: string,
    public messages: string[] = [],
  ) {
    super(message);
  }
}

// ---- configuration ---------------------------------------------------------------------------------------------

const REQUIRED = [
  "ARAMEX_ENV",
  "ARAMEX_USERNAME",
  "ARAMEX_PASSWORD",
  "ARAMEX_ACCOUNT_PIN",
  "ARAMEX_ACCOUNT_NUMBER",
  "ARAMEX_ENTITY",
  "ARAMEX_SHIPPER_NAME",
  "ARAMEX_SHIPPER_PHONE",
  "ARAMEX_SHIPPER_EMAIL",
  "ARAMEX_SHIPPER_CITY",
  "ARAMEX_SHIPPER_ADDRESS",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

/** Throws (naming only the settings, never values) when shipping is not fully and safely configured. */
export function requireAramexEnv(env: Env): void {
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing shipping configuration: ${missing.join(", ")}`);
  if (env.ARAMEX_ENV !== "uat" && env.ARAMEX_ENV !== "production") throw new Error('ARAMEX_ENV must be "uat" or "production"');
  if (env.ARAMEX_ENV === "production" && env.SITE_URL) {
    let host = "";
    try {
      host = new URL(env.SITE_URL).hostname;
    } catch {
      /* SITE_URL is validated elsewhere */
    }
    // Real shipments are billed to the account: a development machine must use the Aramex test system.
    if (host && isLocalHost(host)) throw new Error("ARAMEX_ENV is production but SITE_URL is a local address: use uat");
  }
}

const baseUrl = (env: Env) => env.ARAMEX_BASE_URL || BASE[env.ARAMEX_ENV === "production" ? "production" : "uat"];
const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? n : fallback;
};

// ---- small, testable pieces --------------------------------------------------------------------------------------

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAsciiDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));

/** Saudi mobile numbers to Aramex's format (966 + 9 digits). Anything else is passed through as digits. */
export function normalizePhone(input: string): string {
  let d = toAsciiDigits(input ?? "").replace(/\D/g, "");
  if (d.startsWith("00966")) d = d.slice(2);
  if (d.startsWith("05") && d.length === 10) d = "966" + d.slice(1);
  else if (d.startsWith("5") && d.length === 9) d = "966" + d;
  return d;
}

/** Aramex allows 50 characters per address line and three lines: split on word boundaries, never lose the start. */
export function splitAddress(address: string, max = 50, lines = 3): string[] {
  const words = (address ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (let word of words) {
    while (word.length > max) {
      if (cur) { out.push(cur); cur = ""; }
      out.push(word.slice(0, max));
      word = word.slice(max);
    }
    if (!cur) cur = word;
    else if ((cur + " " + word).length <= max) cur += " " + word;
    else { out.push(cur); cur = word; }
  }
  if (cur) out.push(cur);
  return out.slice(0, lines);
}

// Only the cities Aramex's own samples spell out are mapped; any other city is sent as typed and Aramex answers with
// its own message if it does not know it (the admin can then correct it). Extend after checking Aramex's city list.
const CITY_MAP: Record<string, string> = {
  الرياض: "Riyadh",
  جدة: "Jeddah",
  جده: "Jeddah",
  الدمام: "Dammam",
  مكة: "Makkah",
  مكه: "Makkah",
  "مكة المكرمة": "Makkah",
  "مكه المكرمه": "Makkah",
};
export function toAramexCity(city: string): string {
  const c = (city ?? "").replace(/\s+/g, " ").trim();
  return (CITY_MAP[c] ?? c).slice(0, 50);
}

/** Kilograms from an item name such as "... (250غم)" or "... (1كغم)", or null when the name carries no weight. */
export function weightFromName(name: string): number | null {
  const s = toAsciiDigits(name ?? "");
  const kg = s.match(/(\d+(?:[.,]\d+)?)\s*(?:كغم|كجم|كيلو|kg)/i);
  if (kg) return Number(kg[1].replace(",", "."));
  const g = s.match(/(\d+(?:[.,]\d+)?)\s*(?:غم|جم|غرام|جرام|gr|g)(?![A-Za-z])/i);
  if (g) return Number(g[1].replace(",", ".")) / 1000;
  return null;
}

/** Parcel weight: every item's weight x quantity, plus packaging, rounded UP to 0.01 kg (minimum 0.1 kg). */
export function estimateWeightKg(env: Env, items: { product_name: string; quantity: number }[]): number {
  const fallback = num(env.ARAMEX_DEFAULT_ITEM_KG, 0.5);
  const total = (items ?? []).reduce((sum, i) => sum + (weightFromName(i.product_name) ?? fallback) * Math.max(1, Number(i.quantity) || 1), 0);
  const kg = total + num(env.ARAMEX_PACKAGING_KG, 0.15);
  return Math.max(0.1, Math.ceil(kg * 100 - 1e-9) / 100);
}

const EMAIL = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;
const limit = (s: string, n: number) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// ---- request building --------------------------------------------------------------------------------------------

const clientInfo = (env: Env) => ({
  UserName: env.ARAMEX_USERNAME,
  Password: env.ARAMEX_PASSWORD,
  Version: "v1.0",
  AccountNumber: env.ARAMEX_ACCOUNT_NUMBER,
  AccountPin: env.ARAMEX_ACCOUNT_PIN,
  AccountEntity: env.ARAMEX_ENTITY,
  AccountCountryCode: env.ARAMEX_COUNTRY || "SA",
  Source: 24, // as in Aramex's sample requests
  PreferredLanguageCode: null,
});

const labelInfo = (env: Env) => ({ ReportID: num(env.ARAMEX_LABEL_REPORT_ID, 9729), ReportType: "URL" });

function party(o: { name: string; phone: string; email: string; address: string; city: string; account: string; country: string }) {
  const [l1, l2 = "", l3 = ""] = splitAddress(o.address);
  const line1 = (l1 ?? "").length >= 4 ? l1 : `${l1 ?? ""} ${o.city}`.trim().padEnd(4, ".");
  const phone = normalizePhone(o.phone);
  return {
    Reference1: "",
    AccountNumber: o.account,
    PartyAddress: { Line1: line1, Line2: l2, Line3: l3, City: o.city, PostCode: "", CountryCode: o.country, StateOrProvinceCode: "" },
    Contact: {
      PersonName: limit(o.name, 50),
      CompanyName: limit(o.name, 50),
      PhoneNumber1: phone.slice(0, 30),
      PhoneNumber2: "",
      CellPhone: phone.slice(0, 30),
      EmailAddress: o.email,
      Type: "",
    },
  };
}

export type ShipmentOptions = { weightKg?: number; city?: string };

/** The CreateShipments request for one order. Pure: no network, no clock except the shipping date. */
export function buildCreateShipmentRequest(env: Env, order: ShippingOrder, opts: ShipmentOptions = {}, now = Date.now()) {
  const c = order.customers;
  if (!c) throw new AramexError("rejected", "The order has no customer details", ["order has no customer"]);
  const country = env.ARAMEX_COUNTRY || "SA";
  const weight = opts.weightKg ?? estimateWeightKg(env, order.order_items);
  const when = `/Date(${now}+0300)/`;
  const fallbackEmail = env.ARAMEX_SHIPPER_EMAIL as string;
  const email = EMAIL.test(c.email ?? "") && (c.email ?? "").length <= 50 ? c.email : fallbackEmail; // Aramex: email is mandatory
  const city = toAramexCity(opts.city || c.city);

  return {
    ClientInfo: clientInfo(env),
    LabelInfo: labelInfo(env),
    Shipments: [
      {
        Reference1: order.order_number,
        Shipper: party({
          name: env.ARAMEX_SHIPPER_NAME as string,
          phone: env.ARAMEX_SHIPPER_PHONE as string,
          email: fallbackEmail,
          address: env.ARAMEX_SHIPPER_ADDRESS as string,
          city: toAramexCity(env.ARAMEX_SHIPPER_CITY as string),
          account: env.ARAMEX_ACCOUNT_NUMBER as string,
          country,
        }),
        Consignee: party({ name: c.full_name, phone: c.phone, email, address: c.address, city, account: "", country }),
        ShippingDateTime: when,
        DueDate: when,
        Comments: "",
        Details: {
          ActualWeight: { Unit: "KG", Value: weight },
          ChargeableWeight: { Unit: "KG", Value: weight },
          DescriptionOfGoods: limit(env.ARAMEX_GOODS_DESCRIPTION || "Coffee", 100),
          GoodsOriginCountry: country,
          NumberOfPieces: 1,
          ProductGroup: env.ARAMEX_PRODUCT_GROUP || "DOM",
          ProductType: env.ARAMEX_PRODUCT_TYPE || "ONP",
          PaymentType: "P", // prepaid: the transport is billed to LAS CAFE's account, the customer already paid online
          PaymentOptions: "",
          Services: "",
          Items: [],
        },
      },
    ],
    Transaction: { Reference1: order.order_number, Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
  };
}

// ---- calling Aramex ------------------------------------------------------------------------------------------------

type Notification = { Code?: string; Message?: string };
type AramexAnswer = {
  HasErrors?: boolean;
  Notifications?: Notification[];
  Shipments?: { ID?: string; HasErrors?: boolean; Notifications?: Notification[]; ShipmentLabel?: { LabelURL?: string } }[];
  ShipmentLabel?: { LabelURL?: string };
};

const messagesOf = (...lists: (Notification[] | undefined)[]) =>
  lists.flatMap((l) => l ?? []).map((n) => limit(`${n.Code ?? ""}: ${n.Message ?? ""}`, 200)).filter((m) => m !== ":");

async function call(env: Env, operation: "CreateShipments" | "PrintLabel", body: unknown): Promise<AramexAnswer> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl(env)}${operation}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new AramexError("unavailable", "Aramex could not be reached");
  }
  const text = await res.text();
  let answer: AramexAnswer;
  try {
    answer = JSON.parse(text);
  } catch {
    throw new AramexError("bad_response", `Aramex answered with something that is not JSON (HTTP ${res.status})`);
  }
  if (answer.HasErrors) {
    const m = messagesOf(answer.Notifications, ...(answer.Shipments ?? []).map((s) => s.Notifications));
    throw new AramexError("rejected", m[0] ?? "Aramex rejected the request", m);
  }
  return answer;
}

export type CreatedShipment = { awb: string; labelUrl: string; weightKg: number };

/** Creates the shipment at Aramex. Throws AramexError; on success returns the tracking number and the label link. */
export async function createShipment(env: Env, order: ShippingOrder, opts: ShipmentOptions = {}): Promise<CreatedShipment> {
  const request = buildCreateShipmentRequest(env, order, opts);
  const answer = await call(env, "CreateShipments", request);
  const s = answer.Shipments?.[0];
  if (!s || s.HasErrors || !s.ID) {
    const m = messagesOf(s?.Notifications, answer.Notifications);
    throw new AramexError("rejected", m[0] ?? "Aramex did not return a tracking number", m);
  }
  console.log(`aramex shipment created order=${order.order_number} awb=${s.ID} env=${env.ARAMEX_ENV}`);
  return { awb: String(s.ID), labelUrl: s.ShipmentLabel?.LabelURL ?? "", weightKg: request.Shipments[0].Details.ActualWeight.Value };
}

/** Asks Aramex for the label of an existing shipment again (the link from the first call can expire). */
export async function printLabel(env: Env, awb: string): Promise<string> {
  const answer = await call(env, "PrintLabel", {
    ClientInfo: clientInfo(env),
    LabelInfo: labelInfo(env),
    OriginEntity: env.ARAMEX_ENTITY,
    ProductGroup: env.ARAMEX_PRODUCT_GROUP || "DOM",
    ShipmentNumber: awb,
    Transaction: { Reference1: awb, Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
  });
  const url = answer.ShipmentLabel?.LabelURL ?? "";
  if (!url) throw new AramexError("bad_response", "Aramex returned no label link");
  return url;
}
