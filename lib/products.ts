import type { CategoryId } from "./config";

export type ProductColor = {
  id: string;
  label: string;
  labelEn: string;
  swatch: string;
  images: string[];
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
  featured?: boolean;
  badge?: string;
};

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
    id: "2",
    slug: "ethiopian-guji",
    name: "محصول إثيوبي قوجي",
    nameEn: "Ethiopian Guji",
    description:
      "قهوة متوازنة تعكس جودة البن الإثيوبي، بحبوب مختارة بعناية، تحمص في محمصة LAS لإبراز النكهات الطبيعية في كل كوب. مناسبة لمحبي القهوة المختصة الذين يبحثون عن كوب غني ومتوازن.",
    descriptionEn:
      "A balanced coffee reflecting Ethiopian bean quality, carefully selected and roasted at LAS to highlight natural flavors in every cup.",
    price: 75,
    category: "coffee",
    image: "/products/ethiopian-guji/front.png",
    images: ["/products/ethiopian-guji/front.png", "/products/ethiopian-guji/side.png"],
    specs: [
      "المنشأ: إثيوبيا.",
      "السلالة: هيرلوم.",
      "المعالجة: مغسول.",
      "الإيحاءات: شوكولاتة داكنة، عنب، بلو بيري.",
      "تحميص مختص لإبراز أفضل النكهات.",
      "مناسبة لمختلف طرق التحضير (إسبريسo ☕، V60).",
      "الوزن: 250 جم.",
    ],
    featured: true,
    badge: "الأكثر طلباً",
  },
];

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
