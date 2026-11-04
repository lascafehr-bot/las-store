// Optional delivery extras: the Saudi National Address short code and the customer's map location.
// They are saved inside the order's notes as two readable lines (so staff and the emails show them without any new
// database column), and read back from there when the Aramex shipment is created.

const SHORT_CODE = /^[A-Z]{4}[0-9]{4}$/;
const CODE_LINE = /\[رمز العنوان الوطني: ([A-Z]{4}[0-9]{4})\]/;
const GEO_LINE = /\[الموقع: https:\/\/www\.google\.com\/maps\?q=(-?[0-9]{1,3}\.[0-9]{3,6}),(-?[0-9]{1,3}\.[0-9]{3,6})\]/;

/** "raaa 1234" -> "RAAA1234"; null when it is not 4 letters + 4 digits. */
export function normalizeShortCode(input: string): string | null {
  const s = (input ?? "").toUpperCase().replace(/[\s-]/g, "");
  return SHORT_CODE.test(s) ? s : null;
}

export type GeoPoint = { lat: number; lng: number };

/** A point that is plausibly inside Saudi Arabia (rough box), with finite numbers. */
export function isSaudiPoint(p: unknown): p is GeoPoint {
  if (!p || typeof p !== "object") return false;
  const { lat, lng } = p as Record<string, unknown>;
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && lat >= 16 && lat <= 33 && lng >= 34 && lng <= 56;
}

const round = (n: number) => n.toFixed(5);

/** The customer's own notes plus the extras, 500 characters at most (the extras are never cut). */
export function buildNotes(notes: string, shortCode: string | null, point: GeoPoint | null): string {
  const extras = [
    shortCode ? `[رمز العنوان الوطني: ${shortCode}]` : "",
    point ? `[الموقع: https://www.google.com/maps?q=${round(point.lat)},${round(point.lng)}]` : "",
  ].filter(Boolean);
  const tail = extras.join("\n");
  const room = 500 - (tail ? tail.length + 1 : 0);
  const own = (notes ?? "").replace(/\[(?:رمز العنوان الوطني|الموقع):[^\]]*\]/g, "").trim().slice(0, Math.max(0, room));
  return [own, tail].filter(Boolean).join("\n");
}

export function readExtras(notes: string): { shortCode: string | null; point: GeoPoint | null } {
  const code = CODE_LINE.exec(notes ?? "")?.[1] ?? null;
  const g = GEO_LINE.exec(notes ?? "");
  const point = g ? { lat: Number(g[1]), lng: Number(g[2]) } : null;
  return { shortCode: code, point: point && isSaudiPoint(point) ? point : null };
}
