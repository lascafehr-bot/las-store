import type { CategoryId } from "./config";

export type ProductColor = {
  id: string;
  label: string;
  labelEn: string;
  swatch: string;
  images: string[];
};

export type LocalizedText = {
  ar: string;
  en: string;
};

export type CoffeeProfile = {
  origin?: LocalizedText;
  altitude?: LocalizedText;
  process?: LocalizedText;
  processDescription?: LocalizedText;
  roastNotes?: LocalizedText;
  flavors?: LocalizedText;
  variety?: LocalizedText;
};

export type BeanWeight = {
  id: string;
  label: string;
  labelEn: string;
  price?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  category: CategoryId;
  image: string;
  images?: string[];
  colors?: ProductColor[];
  specs?: string[];
  coffeeProfile?: CoffeeProfile;
  weights?: BeanWeight[];
  featured?: boolean;
  badge?: string;
};

export const BEAN_WEIGHTS: BeanWeight[] = [
  { id: "100g", label: "100غم", labelEn: "100g" },
  { id: "250g", label: "250غم", labelEn: "250g" },
  { id: "1kg", label: "1كغم", labelEn: "1kg" },
];

export const PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "las-mug",
    name: "مق LAS",
    nameEn: "LAS Mug",
    description:
      "صُمم مق LAS ليكون رفيقك اليومي أينما كنت، سواء في المنزل، أو المكتب، أو أثناء التنقل. يجمع بين التصميم الأنيق والأداء العملي، مع هيكل سهل الحمل يحافظ على مشروبك بدرجة الحرارة المثالية لفترة أطول.",
    descriptionEn:
      "Designed to be your daily companion at home, the office, or on the go — elegant design meets practical performance.",
    price: 99,
    category: "merch",
    image: "/products/las-mug/grey-front.png",
    images: [
      "/products/las-mug/grey-front.png",
      "/products/las-mug/grey-side.png",
      "/products/las-mug/pink-front.png",
      "/products/las-mug/pink-side.png",
    ],
    colors: [
      {
        id: "grey",
        label: "رمادي",
        labelEn: "Grey",
        swatch: "#4a4a4a",
        images: ["/products/las-mug/grey-front.png", "/products/las-mug/grey-side.png"],
      },
      {
        id: "pink",
        label: "وردي",
        labelEn: "Pink",
        swatch: "#c9a0a0",
        images: ["/products/las-mug/pink-front.png", "/products/las-mug/pink-side.png"],
      },
    ],
    specs: [
      "تصميم أنيق وعصري.",
      "مزود بمقبض يجعله سهل الحمل ومناسب للاستخدام اليومي.",
      "محكم الإغلاق مع زر أمان لمنع التسرب.",
      "يحافظ على حرارة المشروبات لأكثر من 3 ساعات.",
      "يحافظ على برودة المشروبات لأكثر من 6 ساعات.",
      "متوفر بلونين: الرمادي والوردي، بتدرجات تناسب الجميع.",
    ],
    featured: true,
    badge: "جديد",
  },
  {
    id: "3",
    slug: "hambela-natural",
    name: "همبيلا مجففة",
    nameEn: "Hambela Dried",
    description:
      "قهوة قوجي مجففة نابضة بالحياة، تفتتح بحلاوة اليوسفي اللامعة والعصيرة مع انتعاش حمضي منعش. أزهار الياسمين الرقيقة تضيف أناقة وعمقاً عطرياً، بينما نوتات الزبيب المركّزة تضيف طبقة من غنى الفاكهة المجففة الناضجة. بقوام مستدير دبقي ونهاية حلوة طويلة، قهوة راقية تحتفي بطبيعة همبيلا.",
    descriptionEn:
      "A vibrant Guji dried (natural) coffee that opens with bright, juicy mandarin sweetness and a refreshing citrus lift. Delicate jasmine florals add elegance, while raisin notes bring ripe dried-fruit richness. Round, syrupy body and a long sweet finish.",
    price: 53,
    category: "coffee",
    image: "/products/hambela-natural/front.png",
    images: ["/products/hambela-natural/front.png", "/products/hambela-natural/side.png"],
    coffeeProfile: {
      origin: { ar: "أثيوبيا — همبيلا", en: "Ethiopia — Hambela" },
      altitude: { ar: "1850-2200 متر", en: "1850–2200 m" },
      process: { ar: "مجفف", en: "Natural / dried" },
      flavors: { ar: "يوسفي، ياسمين، زبيب، قوام ممتلئ", en: "Mandarin, jasmine, raisin, full body" },
    },
    weights: [
      { id: "250g", label: "250غم", labelEn: "250g", price: 53 },
      { id: "1kg", label: "1كغم", labelEn: "1kg", price: 145 },
    ],
    featured: true,
  },
  {
    id: "4",
    slug: "salvador-la-majada",
    name: "سلفادور لاماجادا مغسول",
    nameEn: "Salvador La Majada Washed",
    description:
      "تتم زراعة المحصول في مزارع لاماجادا في منطقة أبيانكا، ويتم زراعتها في عدة أنواع من التربة المختلفة، وحصادها يكون خلال الفترة مابين «نوفمبر-أبريل».",
    descriptionEn:
      "Grown at La Majada farms in Apaneca, harvested between November and April across several soil types.",
    price: 48,
    category: "coffee",
    image: "/products/salvador-la-majada/front.png",
    images: ["/products/salvador-la-majada/front.png", "/products/salvador-la-majada/side.png"],
    coffeeProfile: {
      origin: { ar: "أبييانكا — أهواتشابان", en: "Apaneca — Ahuachapán" },
      altitude: { ar: "1300-1400 متر", en: "1300–1400 m" },
      process: { ar: "مغسول", en: "Washed" },
      processDescription: {
        ar: "تتم المعالجة في محطات معالجة «سان خوسيه دي لاماجادا»، في الجبال المحيطة للمزرعة، حيث تُغسل الحبوب بالمياه العذبة ثم تُجفف تحت أشعة الشمس على أسرة التجفيف.",
        en: "Processed at San José de La Majada stations in the surrounding mountains: washed with fresh mountain water, then sun-dried on raised beds.",
      },
      flavors: {
        ar: "كراميل، حلاوة، حمضية ناعمة، بندق محمص، قوام ممتلئ",
        en: "Caramel, sweetness, soft acidity, roasted hazelnut, full body",
      },
      variety: {
        ar: "بوربون أحمر — كاتيمور — باكاس",
        en: "Red Bourbon — Catimor — Pacas",
      },
    },
    weights: [
      { id: "250g", label: "250غم", labelEn: "250g", price: 48 },
      { id: "1kg", label: "1كغم", labelEn: "1kg", price: 155 },
    ],
    featured: true,
  },
  {
    id: "5",
    slug: "monte-natural",
    name: "مونتي مجفف",
    nameEn: "Monte Dried",
    description:
      "في أعالي جبال ويلا الكولومبية، وبين ارتفاعات تتراوح من 1800 إلى 2200 متر، تنمو حبوب مونتي من سلالتي كاستيو وكاتورا.",
    descriptionEn:
      "From the Huila mountains of Colombia, at 1800–2200 m, Monte is grown from Castillo and Caturra.",
    price: 56,
    category: "coffee",
    image: "/products/monte-natural/front.png",
    images: ["/products/monte-natural/front.png", "/products/monte-natural/side.png"],
    coffeeProfile: {
      origin: { ar: "كولومبيا — ويلا", en: "Colombia — Huila" },
      altitude: { ar: "1800-2200 متر", en: "1800–2200 m" },
      process: { ar: "مجفف", en: "Natural / dried" },
      processDescription: {
        ar: "تُقطف الثمار في ذروة نضجها، ثم تُترك لتجف تحت أشعة الشمس. تتميز مونتي بطابع فاكهي مع لمحات من الكرز وحلاوة طبيعية متوازنة، وقوام ممتلئ.",
        en: "Cherries are picked at peak ripeness and sun-dried. Fruity character with cherry notes, balanced natural sweetness, and a full body.",
      },
      flavors: { ar: "فاكهية، حلاوة، بخاري، كرز", en: "Fruity, sweetness, steam-like, cherry" },
      variety: { ar: "كاستيو — كاتورا", en: "Castillo — Caturra" },
    },
    weights: [
      { id: "250g", label: "250غم", labelEn: "250g", price: 56 },
      { id: "1kg", label: "1كغم", labelEn: "1kg", price: 150 },
    ],
    featured: true,
  },
];

export function isBeanProduct(product: Product): boolean {
  return product.category === "coffee";
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: CategoryId): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.featured);
}

export function getAllProductSlugs(): string[] {
  return PRODUCTS.map((p) => p.slug);
}

export function localized(text: LocalizedText | undefined, locale: "ar" | "en"): string {
  if (!text) return "";
  return locale === "en" ? text.en || text.ar : text.ar;
}

export function getBeanWeights(product: Product): BeanWeight[] {
  return product.weights?.length ? product.weights : BEAN_WEIGHTS;
}

export function getCatalogPrice(product: Product): number {
  return getCatalogWeight(product)?.price ?? product.price;
}

export function getCatalogWeight(product: Product): BeanWeight | undefined {
  if (!product.weights?.length) return undefined;
  const priced = product.weights.filter((w) => (w.price ?? 0) > 0);
  return priced.find((w) => w.id === "250g") ?? priced[0];
}

export function hasKilogramOption(product: Product): boolean {
  return Boolean(product.weights?.some((w) => w.id === "1kg" && (w.price ?? 0) > 0));
}

export function getOriginCountry(product: Product, locale: "ar" | "en"): string {
  const origin = localized(product.coffeeProfile?.origin, locale);
  if (!origin) return "";
  return origin.split(/\s*[—–-]\s*/)[0]?.trim() || origin;
}

export function sortBeanProducts(products: Product[], locale: "ar" | "en"): Product[] {
  return [...products].sort((a, b) => {
    const priceCmp = getCatalogPrice(a) - getCatalogPrice(b);
    if (priceCmp !== 0) return priceCmp;
    return getOriginCountry(a, locale).localeCompare(
      getOriginCountry(b, locale),
      locale === "en" ? "en" : "ar",
      { sensitivity: "base" },
    );
  });
}
