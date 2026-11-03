// Saudi mobile numbers: Aramex's courier must be able to call the customer, so checkout only accepts a real one.
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

/** "0554789837", "+966 55 478 9837", "٠٥٥٤٧٨٩٨٣٧" … -> "966554789837"; null when it is not a Saudi mobile number. */
export function saudiMobile(input: string): string | null {
  let d = (input ?? "")
    .replace(/[٠-٩]/g, (c) => String(ARABIC_INDIC.indexOf(c)))
    .replace(/[۰-۹]/g, (c) => String(PERSIAN.indexOf(c)))
    .replace(/\D/g, "");
  if (d.startsWith("00966")) d = d.slice(2);
  if (d.startsWith("05") && d.length === 10) d = "966" + d.slice(1);
  else if (d.startsWith("5") && d.length === 9) d = "966" + d;
  return /^9665\d{8}$/.test(d) ? d : null;
}
