export const STORE_CONFIG = {
  name: "متجر لاس",
  nameEn: "LAS Store",
  tagline: "منتجات لاس CAFE — جودة تُذاق",
  taglineEn: "LAS CAFE products — quality you can taste",
  companyName: "LAS CAFE",
  phone: "+966566659710",
  whatsapp: "966566659710",
  email: "lascafehr@gmail.com",
  instagram: "https://instagram.com/lascafe.sa",
  websiteUrl: "https://lascafe.sa",
  storeUrl: "https://store.lascafe.sa",
  branches: [
    { name: "فرع العليا — الرياض", nameEn: "Olaya Branch — Riyadh" },
    { name: "فرع الملقا — الرياض", nameEn: "Al Malqa Branch — Riyadh" },
    { name: "فرع جدة", nameEn: "Jeddah Branch" },
  ],
} as const;

export type CategoryId = "coffee" | "merch";

export const CATEGORIES: {
  id: CategoryId;
  label: string;
  labelEn: string;
  description: string;
}[] = [
  {
    id: "coffee",
    label: "قهوة",
    labelEn: "Coffee",
    description: "محاصيل مختصة محمصة في LAS",
  },
  {
    id: "merch",
    label: "منتجات لاس",
    labelEn: "LAS Merch",
    description: "أكواب وإكسسوارات لاس",
  },
];

export function formatPrice(sar: number): string {
  return `${sar.toLocaleString("ar-SA")} ر.س`;
}

export function buildWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${STORE_CONFIG.whatsapp}?text=${encoded}`;
}

export function buildOrderMessage(
  productName: string,
  price: number,
  options?: { color?: string },
): string {
  const colorLine = options?.color ? `\n🎨 اللون: ${options.color}` : "";
  return `السلام عليكم، أود طلب:\n\n📦 ${productName}${colorLine}\n💰 ${formatPrice(price)}\n\nمن متجر لاس`;
}
