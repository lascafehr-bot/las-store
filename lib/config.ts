export const STORE_CONFIG = {
  name: "متجر لاس",
  nameEn: "LAS Store",
  tagline: "قهوة ومنتجات لاس — ببساطة",
  taglineEn: "LAS CAFE products — simply",
  companyName: "LAS CAFE",
  phone: "+966566659710",
  whatsapp: "966566659710",
  storeWhatsapp: "", // public store WhatsApp — not ready yet
  email: "lascafehr@gmail.com",
  instagram: "https://www.instagram.com/las_cafe0",
  tiktok: "https://www.tiktok.com/@las_cafe",
  websiteUrl: "https://lascafe.sa",
  storeUrl: "https://shop.lascafe.sa",
  b2b: {
    phone: "+966566659710",
    email: "lascafehr@gmail.com",
    whatsapp: "966566659710",
    catalogPdf: "/downloads/wholesale-catalog.pdf",
  },
  compliance: {
    commercialRegister: "7012799859",
    vatNumber: "312699743300003",
  },
  analyticsId: "", // TODO: G-XXXXXXXXXX
  branches: [
    { name: "فرع العليا — الرياض", nameEn: "Olaya Branch — Riyadh" },
    { name: "فرع الملقا — الرياض", nameEn: "Al Malqa Branch — Riyadh" },
    { name: "فرع جدة", nameEn: "Jeddah Branch" },
  ],
} as const;

export type CategoryId = "coffee" | "merch" | "bundles";

export const CATEGORIES: {
  id: CategoryId;
  label: string;
  labelEn: string;
  pillLabel: string;
  pillLabelEn: string;
  description: string;
}[] = [
  {
    id: "coffee",
    label: "محاصيل",
    labelEn: "Coffee",
    pillLabel: "محاصيل",
    pillLabelEn: "Coffee",
    description: "حبوب وأرباع",
  },
  {
    id: "merch",
    label: "منتجات لاس",
    labelEn: "LAS Products",
    pillLabel: "منتجات لاس",
    pillLabelEn: "LAS Products",
    description: "أكواب وإكسسوارات",
  },
  {
    id: "bundles",
    label: "بوكسات العروض",
    labelEn: "Bundles",
    pillLabel: "بوكسات",
    pillLabelEn: "Bundles",
    description: "باقات جاهزة",
  },
];

export const POLICIES = {
  shipping: {
    title: "سياسة الشحن والتوصيل",
    titleEn: "Shipping & Delivery Policy",
    slug: "shipping",
  },
  returns: {
    title: "سياسة الاستبدال والاسترجاع",
    titleEn: "Returns & Exchange Policy",
    slug: "returns",
  },
  privacy: {
    title: "سياسة الخصوصية",
    titleEn: "Privacy Policy",
    slug: "privacy",
  },
} as const;

export function formatPrice(sar: number): string {
  return `${sar.toLocaleString("en-US")} ر.س`;
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

export function buildB2BWhatsAppUrl(): string {
  return buildWhatsAppUrl(
    "السلام عليكم، أود الاستفسار عن أسعار الجملة / B2B من متجر لاس.",
  );
}
