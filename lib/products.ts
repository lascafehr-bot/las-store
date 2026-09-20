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
  brew?: LocalizedText;
  weight?: LocalizedText;
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
    name: "مق لاس",
    nameEn: "LAS Mug",
    description:
      "صُمم مق لاس ليكون رفيقك اليومي أينما كنت، سواء في المنزل، أو المكتب، أو أثناء التنقل. يجمع بين التصميم الأنيق والأداء العملي، مع هيكل سهل الحمل يحافظ على مشروبك بدرجة الحرارة المثالية لفترة أطول.",
    descriptionEn:
      "Designed to be your daily companion at home, the office, or on the go — elegant design meets practical performance.",
    price: 29,
    category: "merch",
    image: "/products/las-mug/grey-front.png",
    images: [
      "/products/las-mug/grey-front.png",
      "/products/las-mug/grey-side.png",
      "/products/las-mug/beige-front.png",
      "/products/las-mug/beige-side.png",
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
        label: "بيج",
        labelEn: "Beige",
        swatch: "#c4b5a5",
        images: ["/products/las-mug/beige-front.png", "/products/las-mug/beige-side.png"],
      },
    ],
    specs: [
      "تصميم أنيق وعصري.",
      "محكم الإغلاق مع زر أمان لمنع التسرب.",
      "يحافظ على حرارة المشروبات لأكثر من 3 ساعات.",
      "يحافظ على برودة المشروبات لأكثر من 6 ساعات.",
      "متوفر بلونين: الرمادي والبيج، بتدرجات تناسب الجميع.",
    ],
    featured: true,
    badge: "جديد",
  },
  {
    id: "2",
    slug: "las-granola",
    name: "جرانولا لاس",
    nameEn: "LAS Granola",
    description:
      "جرانولا خاصة تُحضّر وتُحمّص داخل المقهى بعناية، بمزيج من الشوفان والمكسرات والبذور والفواكه المجففة، لتمنحك قوامًا مقرمشًا ونكهة متوازنة. خيار صحي ومغذٍ، مناسب للرياضيين ولوجبة الإفطار أو كوجبة خفيفة خلال اليوم.",
    descriptionEn:
      "A house granola prepared and roasted in the café, with oats, nuts, seeds, and dried fruit. Crisp texture and a balanced flavor. A nourishing option for breakfast or a snack.",
    price: 26,
    category: "merch",
    image: "/products/las-granola/granola-jar.png",
    images: ["/products/las-granola/granola-jar.png"],
    specs: [
      "التحضير: تُحضّر وتُحمّص داخل المقهى.",
      "المكونات: الشوفان، المكسرات،زبيب.",
      "مناسبة للإفطار أو كوجبة خفيفة.",
      "الحفظ: تُحفظ في مكان بارد وجاف داخل عبوة محكمة الإغلاق.",
      "الوزن: 170 جم.",
    ],
    featured: true,
  },
  {
    id: "3",
    slug: "hambela-natural",
    name: "أثيوبيا - همبيلا - مجفف",
    nameEn: "Ethiopia — Hambela Natural",
    description:
      "من مرتفعات همبيلا في إثيوبيا، تنمو حبوب هذا المحصول في بيئة مثالية وارتفاعات شاهقة، ما يمنحها طابعًا عطريًا مميزًا ونكهات فاكهية زاهية تجمع بين اليوسفي والياسمين والزبيب، بحموضة منعشة وقوام مستدير ونهاية حلوة طويلة.",
    descriptionEn:
      "From the Hambela highlands of Ethiopia, this coffee grows in an ideal setting at high altitude, with an aromatic character and bright fruit notes of mandarin, jasmine, and raisin, refreshing acidity, a round body, and a long sweet finish.",
    price: 47,
    category: "coffee",
    image: "/products/hambela-natural/store.png",
    images: [
      "/products/hambela-natural/store.png",
      "/products/hambela-natural/life-1.jpg",
      "/products/hambela-natural/life-2.jpg",
    ],
    coffeeProfile: {
      origin: { ar: "إثيوبيا — همبيلا", en: "Ethiopia — Hambela" },
      process: { ar: "مجفف", en: "Natural" },
      processDescription: {
        ar: "تُنتقى ثمار القهوة الناضجة بعناية، ثم تُجفف كاملة تحت أشعة الشمس مع تقليبها باستمرار لضمان تجفيف متوازن. تُسهم هذه المعالجة في إبراز حلاوة المحصول ونكهاته الفاكهية والعطرية، بقوام مستدير ونهاية حلوة وممتدة.",
        en: "Ripe cherries are selected with care, then dried whole in the sun and turned continuously for even drying. This process brings out the coffee’s sweetness and fruit and floral notes, with a round body and a long sweet finish.",
      },
      flavors: {
        ar: "يوسفي • ياسمين • زبيب",
        en: "Mandarin • jasmine • raisin",
      },
    },
    weights: [
      { id: "250g", label: "250غم", labelEn: "250g", price: 47 },
      { id: "1kg", label: "1كغم", labelEn: "1kg", price: 160 },
    ],
    featured: true,
  },
  {
    id: "4",
    slug: "salvador-la-majada",
    name: "سلفادور - لاماجادا - مغسول",
    nameEn: "Salvador — La Majada Washed",
    description:
      "من أراضي السلفادور، يأتي محصول لاماجادا بطابع غني يجمع بين حلاوة الكراميل وإيحاءات البندق المحمص، مع حمضية ناعمة وقوام ممتلئ يمنح الكوب عمقًا وتوازنًا واضحًا.",
    descriptionEn:
      "From El Salvador, La Majada has a rich character of caramel sweetness and roasted hazelnut, with soft acidity and a full body.",
    price: 45,
    category: "coffee",
    image: "/products/salvador-la-majada/store.png",
    images: [
      "/products/salvador-la-majada/store.png",
      "/products/salvador-la-majada/life-1.jpg",
      "/products/salvador-la-majada/life-2.jpg",
    ],
    coffeeProfile: {
      origin: { ar: "السلفادور – لاماجادا", en: "El Salvador — La Majada" },
      process: { ar: "مغسول", en: "Washed" },
      processDescription: {
        ar: "تخضع حبوب لاماجادا للمعالجة المغسولة، حيث تُزال طبقات الثمرة وتُغسل الحبوب بعناية قبل تجفيفها، مما يبرز نقاء الكوب ووضوح نكهاته، ويحافظ على توازن خصائص المحصول.",
        en: "La Majada is washed: the fruit layers are removed and the beans are washed with care before drying, for a clean cup and a clear, balanced profile.",
      },
      roastNotes: { ar: "متوسط", en: "Medium" },
      flavors: {
        ar: "كراميل • حلاوة • بندق محمص • حمضية ناعمة • قوام ممتلئ",
        en: "Caramel • sweetness • roasted hazelnut • soft acidity • full body",
      },
      brew: { ar: "إسبريسو", en: "Espresso" },
      weight: { ar: "250 جم", en: "250g" },
    },
    weights: [
      { id: "250g", label: "250غم", labelEn: "250g", price: 45 },
      { id: "1kg", label: "1كغم", labelEn: "1kg", price: 145 },
    ],
    featured: true,
  },
  {
    id: "5",
    slug: "monte-natural",
    name: "كولومبيا - مونتي - مجفف",
    nameEn: "Colombia — Monte Natural",
    description:
      "من كولومبيا، يأتي محصول مونتي بطابع فاكهي واضح وحلاوة متوازنة، مع إيحاءات الكرز وقوام ممتلئ يمنح الكوب حضورًا غنيًا ومتناسقًا.\n\nتخضع الحبوب للمعالجة المجففة، مما يبرز حلاوتها الطبيعية ويعزز طابعها الفاكهي، لتقدم كوبًا غنيًا وممتدًا بتوازن لطيف بين الحلاوة والفاكهية.",
    descriptionEn:
      "From Colombia, Monte has a clear fruit character and balanced sweetness, with cherry notes and a full body.\n\nThe beans are naturally processed, which brings out their sweetness and fruit, for a rich cup with a gentle balance of sweetness and fruit.",
    price: 49,
    category: "coffee",
    image: "/products/monte-natural/store.png",
    images: [
      "/products/monte-natural/store.png",
      "/products/monte-natural/life-1.jpg",
      "/products/monte-natural/life-2.jpg",
    ],
    coffeeProfile: {
      origin: { ar: "كولومبيا", en: "Colombia" },
      process: { ar: "مجفف", en: "Natural" },
      processDescription: {
        ar: "معالجة مجففة، تُجفف فيها حبوب القهوة داخل الثمرة للحفاظ على الحلاوة الطبيعية وإبراز الخصائص الفاكهية للمحصول.",
        en: "Natural process: the coffee dries in the fruit to keep its natural sweetness and fruit character.",
      },
      roastNotes: { ar: "متوسط", en: "Medium" },
      flavors: {
        ar: "فاكهية • حلاوة • كرز • قوام ممتلئ",
        en: "Fruity • sweetness • cherry • full body",
      },
      brew: { ar: "مناسب للـ V60 والإسبريسو", en: "Suitable for V60 and espresso" },
      weight: { ar: "250 جم", en: "250g" },
    },
    weights: [
      { id: "250g", label: "250غم", labelEn: "250g", price: 49 },
      { id: "1kg", label: "1كغم", labelEn: "1kg", price: 165 },
    ],
    featured: true,
  },
  {
    id: "6",
    slug: "yemeni-premium",
    name: "اليمن - مجفف لاهوائي",
    nameEn: "Yemen — Natural Anaerobic",
    description:
      "من أعالي جبال اليمن، يأتي محصول يعكس تفرّد بيئته وطبيعة أرضه، بطابع غني ومتوازن يجمع بين حلاوة ناعمة وإيحاءات الفانيلا والفواكه الاستوائية، مع لمسات اللوز والزبيب ونهاية حلوة ممتدة.",
    descriptionEn:
      "From the high mountains of Yemen, a coffee that reflects its place: rich and balanced, with soft sweetness, vanilla and tropical fruit, almond and raisin, and a long sweet finish.",
    price: 45,
    category: "coffee",
    image: "/products/yemeni-premium/store.png",
    images: [
      "/products/yemeni-premium/store.png",
      "/products/yemeni-premium/life-1.jpg",
      "/products/yemeni-premium/life-2.jpg",
    ],
    coffeeProfile: {
      origin: { ar: "اليمن", en: "Yemen" },
      process: { ar: "مجفف لاهوائي (Natural Anaerobic)", en: "Natural Anaerobic" },
      processDescription: {
        ar: "تُنتقى الثمار الناضجة بعناية، ثم تخضع لتخمير لاهوائي داخل بيئة محكمة قبل تجفيفها طبيعيًا، مما يعزز الحلاوة والطابع الفاكهي مع الحفاظ على قوام غني وتوازن واضح.",
        en: "Ripe cherries are selected with care, then fermented in a sealed anaerobic environment before natural drying, which builds sweetness and fruit while keeping a rich body and clear balance.",
      },
      roastNotes: { ar: "متوسطة", en: "Medium" },
      flavors: {
        ar: "فانيلا • فواكه استوائية • لوز • زبيب",
        en: "Vanilla • tropical fruit • almond • raisin",
      },
      brew: { ar: "مناسب للـ V60 والإسبريسو", en: "Suitable for V60 and espresso" },
      weight: { ar: "125 جم", en: "125g" },
    },
    weights: [
      { id: "125g", label: "125غم", labelEn: "125g", price: 45 },
      { id: "1kg", label: "1كغم", labelEn: "1kg", price: 265 },
    ],
    featured: true,
  },
  {
    id: "7",
    slug: "colombia-strawberry",
    name: "كولومبيا - كاستيلينا - إنفيوجن",
    nameEn: "Colombia — Castellina Infusion",
    description:
      "من قلب كولومبيا، يأتي هذا المحصول من سلالة Pink Bourbon بطابع فاكهي واضح، تبرز فيه حلاوة الفراولة ونضارة الخوخ، مع لمسات من الشعير وقوام ممتلئ ونهاية حلوة وممتدة.",
    descriptionEn:
      "From Colombia, this Pink Bourbon lot has a clear fruit character, with strawberry sweetness and peach freshness, barley notes, a full body, and a long sweet finish.",
    price: 48,
    category: "coffee",
    image: "/products/colombia-strawberry/store.png",
    images: [
      "/products/colombia-strawberry/store.png",
      "/products/colombia-strawberry/life-1.jpg",
      "/products/colombia-strawberry/life-2.jpg",
    ],
    coffeeProfile: {
      origin: { ar: "كولومبيا", en: "Colombia" },
      variety: { ar: "Pink Bourbon", en: "Pink Bourbon" },
      process: { ar: "Infusion", en: "Infusion" },
      processDescription: {
        ar: "تُعالج الحبوب بطريقة التشريب (Infusion)، حيث تُدمج نكهات الفراولة خلال إحدى مراحل المعالجة لتعزيز الطابع الفاكهي وإبراز حضوره في الكوب.",
        en: "Processed by infusion, with strawberry notes introduced during processing to lift the fruit character in the cup.",
      },
      roastNotes: {
        ar: "محمص بعناية لإبراز خصائص المحصول ونكهاته",
        en: "Roasted with care to show the lot’s character and flavors",
      },
      flavors: {
        ar: "فراولة • خوخ • شعير • قوام ممتلئ",
        en: "Strawberry • peach • barley • full body",
      },
      brew: { ar: "مناسب للـ V60", en: "Suitable for V60" },
      weight: { ar: "125 جم", en: "125g" },
    },
    weights: [
      { id: "125g", label: "125غم", labelEn: "125g", price: 48 },
      { id: "1kg", label: "1كغم", labelEn: "1kg", price: 275 },
    ],
    featured: true,
  },
  {
    id: "8",
    slug: "colombia-melo-yelo",
    name: "كولومبيا - ميلو يلو - إنفيوجن",
    nameEn: "Colombia — Melo Yelo Infusion",
    description:
      "من مرتفعات ويلا في كولومبيا، يأتي ميلو يلو بطابع فاكهي واضح وقوام ممتلئ. يُقطف بعناية، ثم يخضع لتخمير هوائي لمدة 12 ساعة، يليه تجفيف طبيعي بطيء لمدة 12–16 يومًا مع تقليب مستمر.\n\nوالنتيجة كوب غني بالحلاوة الطبيعية وإيحاءات الخوخ، بقوام ممتلئ وتوازن وامتداد مميز.",
    descriptionEn:
      "From the Huila highlands of Colombia, Melo Yelo has a clear fruit character and a full body. It is picked with care, then aerobically fermented for 12 hours, then slow-dried naturally for 12–16 days with constant turning.\n\nThe cup is rich in natural sweetness and peach, with a full body, balance, and a distinct finish.",
    price: 43,
    category: "coffee",
    image: "/products/colombia-melo-yelo/store.png",
    images: [
      "/products/colombia-melo-yelo/store.png",
      "/products/colombia-melo-yelo/life-1.jpg",
      "/products/colombia-melo-yelo/life-2.jpg",
    ],
    coffeeProfile: {
      origin: { ar: "كولومبيا – ويلا", en: "Colombia — Huila" },
      process: { ar: "تخمير هوائي وتجفيف طبيعي", en: "Aerobic fermentation and natural drying" },
      processDescription: {
        ar: "تخمير هوائي لمدة 12 ساعة، يليه تجفيف طبيعي بطيء لمدة 12–16 يومًا مع تقليب مستمر للحفاظ على جودة الحبوب وإبراز خصائصها الطبيعية.",
        en: "Aerobic fermentation for 12 hours, then slow natural drying for 12–16 days with constant turning, to keep bean quality and show its natural character.",
      },
      roastNotes: { ar: "متوسط", en: "Medium" },
      flavors: {
        ar: "فاكهية • خوخ • قوام ممتلئ",
        en: "Fruity • peach • full body",
      },
      brew: { ar: "مناسب للـ V60 والإسبريسو", en: "Suitable for V60 and espresso" },
      weight: { ar: "125 جم", en: "125g" },
    },
    weights: [
      { id: "125g", label: "125غم", labelEn: "125g", price: 43 },
      { id: "1kg", label: "1كغم", labelEn: "1kg", price: 225 },
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
  return Boolean(product.weights?.some((w) => w.id === "1kg"));
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
