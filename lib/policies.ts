import type { Locale } from "./i18n";

export const POLICY_CONTENT: Record<
  string,
  { ar: string[]; en: string[] }
> = {
  returns: {
    ar: [
      "يحق للعميل طلب استبدال أو استرجاع خلال 3 أيام من الاستلام، بشرط أن يكون المنتج بحالته الأصلية وغير مفتوح",
      "لا يُقبل استرجاع المنتجات المفتوحة إلا في حال عيب مصنعي أو خطأ من المتجر",
      "في حال العيب أو الخطأ: يتحمل المتجر تكلفة الشحن والاستبدال بالكامل",
      "معالجة الطلبات خلال 3-5 أيام عمل، واسترداد المبلغ بنفس وسيلة الدفع خلال 14 يوم عمل",
    ],
    en: [
      "The customer may request an exchange or return within 3 days of receipt, provided the product is in its original, unopened condition.",
      "Opened products cannot be returned except in the case of a manufacturing defect or a store error.",
      "In case of a defect or error, the store covers shipping and replacement costs in full.",
      "Requests are processed within 3–5 business days, and refunds are issued via the same payment method within 14 business days.",
    ],
  },
  shipping: {
    ar: [
      "مدة التوصيل: 2-4 أيام عمل داخل المدن الرئيسية، 3-7 أيام خارجها",
      "خيار الاستلام من الفروع الثلاثة (Click & Collect) دون رسوم",
      "تكلفة الشحن تُحتسب تلقائيًا حسب الوجهة والوزن",
      "شحن مجاني عند تجاوز حد أدنى للطلب [يُحدَّد لاحقًا]",
    ],
    en: [
      "Delivery time: 2–4 business days in major cities, 3–7 days elsewhere.",
      "Click & Collect from the three branches at no charge.",
      "Shipping cost is calculated automatically by destination and weight.",
      "Free shipping above a minimum order [to be determined later].",
    ],
  },
  privacy: {
    ar: [
      "جمع البيانات الأساسية فقط (الاسم، الجوال، البريد، عنوان الشحن) لإتمام الطلبات",
      "عدم مشاركة بيانات العملاء مع طرف ثالث لأغراض تسويقية دون موافقة صريحة",
    ],
    en: [
      "Only essential data is collected (name, mobile, email, shipping address) to fulfill orders.",
      "Customer data is not shared with third parties for marketing without explicit consent.",
    ],
  },
};

export function getPolicyItems(slug: string, locale: Locale): string[] {
  const content = POLICY_CONTENT[slug];
  if (!content) return [];
  return locale === "en" ? content.en : content.ar;
}
