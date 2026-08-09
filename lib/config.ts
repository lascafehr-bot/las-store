export const STORE_CONFIG = {
  name: "متجر لاس",
  nameEn: "LAS Store",
  tagline: "قهوة ومنتجات لاس — ببساطة",
  taglineEn: "LAS CAFE products — simply",
  companyName: "LAS CAFE",
  phone: "+966566659710",
  whatsapp: "966566659710",
  email: "lascafehr@gmail.com",
  instagram: "https://instagram.com/lascafe.sa",
  websiteUrl: "https://lascafe.sa",
  storeUrl: "https://shop.lascafe.sa",
  b2b: {
    phone: "+966566659710",
    email: "lascafehr@gmail.com",
    whatsapp: "966566659710",
    catalogPdf: "/downloads/wholesale-catalog.pdf",
  },
  compliance: {
    commercialRegister: "—", // TODO: from LAS team
    vatNumber: "—", // TODO: from LAS team
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
  pillLabel: string;
  labelEn: string;
  description: string;
}[] = [
  {
    id: "coffee",
    label: "محاصيل",
    pillLabel: "قهوة",
    labelEn: "Coffee",
    description: "حبوب وأرباع",
  },
  {
    id: "merch",
    label: "منتجات",
    pillLabel: "منتجات لاس",
    labelEn: "Merch",
    description: "أكواب وإكسسوارات",
  },
  {
    id: "bundles",
    label: "بوكسات العروض",
    pillLabel: "بوكسات",
    labelEn: "Bundles",
    description: "باقات جاهزة",
  },
];

export const POLICIES = {
  shipping: {
    title: "سياسة الشحن",
    slug: "shipping",
  },
  returns: {
    title: "سياسة الاستبدال والارجاع",
    slug: "returns",
  },
  privacy: {
    title: "سياسة الخصوصية",
    slug: "privacy",
  },
} as const;

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

export function buildB2BWhatsAppUrl(): string {
  return buildWhatsAppUrl(
    "السلام عليكم، أود الاستفسار عن أسعار الجملة / B2B من متجر لاس.",
  );
}
