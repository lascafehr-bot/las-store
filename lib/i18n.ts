import type { CategoryId } from "./config";
import { CATEGORIES, POLICIES, STORE_CONFIG } from "./config";
import type { Product } from "./products";

export type Locale = "ar" | "en";

export const LOCALES: { id: Locale; label: string }[] = [
  { id: "ar", label: "عربي" },
  { id: "en", label: "EN" },
];

const messages = {
  ar: {
    cart: "السلة",
    wholesale: "للمتاجر والشركاء",
    wholesaleWaiting: "بانتظار باقي التفاصيل من قبلكم",
    headerDescription: "تسوّق أفضل أنواع البن والمحاصيل المختارة بعناية من لاس كافي",
    all: "الكل",
    viewAll: "عرض الكل",
    noProductsInCategory: "لا توجد منتجات في هذا التصنيف حالياً.",
    addToCart: "أضف إلى السلة",
    addedToCart: "✓ تمت الإضافة",
    chooseColor: "اختر اللون ←",
    backToProducts: "← العودة للمنتجات",
    specs: "المواصفات",
    orderViaSite: "الطلب عبر الموقع",
    orderViaSiteDesc: "أضف للسلة وأكمل الطلب والدفع هنا. واتساب متاح بعد التأكيد للمتابعة فقط.",
    color: "اللون",
    footerStore: "المتجر",
    footerProducts: "منتجات لاس",
    footerWholesale: "للمتاجر والشركاء",
    footerAbout: "من نحن",
    about: "من نحن",
    aboutBrandStory: "قصة العلامة",
    aboutVision: "الرؤية والرسالة",
    aboutWhy: "لماذا لاس كافي",
    footerPolicies: "السياسات",
    footerContact: "تواصل بنا",
    comingSoon: "يحدد لاحقا",
    cartTitle: "سلة التسوق",
    cartEmpty: "سلتك فارغة",
    cartEmptyDesc: "أضف منتجات من المتجر للمتابعة.",
    browseProducts: "تصفّح المنتجات",
    remove: "حذف",
    orderSummary: "ملخص الطلب",
    total: "المجموع",
    checkoutNote: "يتم الطلب والدفع عبر الموقع. واتساب للمتابعة بعد تأكيد الطلب.",
    checkout: "إتمام الطلب",
    checkoutTitle: "إتمام الطلب",
    checkoutSubtitle: "أدخل بياناتك وأكمل الطلب عبر الموقع",
    customerDetails: "بيانات العميل",
    fullName: "الاسم الكامل *",
    phone: "رقم الجوال *",
    email: "البريد الإلكتروني",
    delivery: "التوصيل",
    city: "المدينة *",
    address: "عنوان التوصيل *",
    notes: "ملاحظات",
    notesPlaceholder: "أي ملاحظات على الطلب (اختياري)",
    payment: "الدفع",
    paymentDemo: "نسخة تجريبية",
    paymentDemoDesc:
      " سيتم ربط بوابة الدفع الإلكتروني (Moyasar / Tap) في المرحلة القادمة. حالياً يتم تأكيد الطلب عبر الموقع للعرض على الفريق.",
    paymentSimulated: "✓ الدفع عبر الموقع — محاكاة للعرض التجريبي",
    confirmOrder: "تأكيد الطلب والدفع",
    confirming: "جاري التأكيد...",
    checkoutFooter: "بعد الطلب يمكنك متابعة التفاصيل عبر واتساب: تأكيد المحتوى، مدة التوصيل، والملاحظات.",
    emptyCartCheckout: "لا توجد منتجات في السلة.",
    errorNamePhone: "يرجى إدخال الاسم ورقم الجوال.",
    errorDelivery: "يرجى إدخال المدينة وعنوان التوصيل.",
    orderConfirmed: "تم تأكيد طلبك",
    orderNumber: "رقم الطلب:",
    orderDetails: "تفاصيل الطلب",
    customer: "العميل:",
    deliveryLabel: "التوصيل:",
    whatsappFollowUp: "متابعة عبر واتساب",
    whatsappFollowUpDesc: "واتساب للمتابعة فقط — لتأكيد محتوى الطلب، مدة التوصيل، وأي ملاحظات.",
    whatsappFollowUpBtn: "متابعة الطلب عبر واتساب",
    continueShopping: "متابعة التسوّق",
    orderNotFound: "لم يتم العثور على الطلب.",
    backToStore: "العودة للمتجر",
    notFound: "الصفحة غير موجودة",
    backHome: "العودة للمتجر",
    priceByWeight: "يُحدَّد حسب الوزن",
    fullDescription: "الوصف الكامل",
    options: "الخيارات",
    weight: "الوزن",
    buyNow: "اشترِ الآن",
    origin: "المنشأ",
    altitude: "الارتفاع",
    process: "طريقة المعالجة",
    roastNotes: "ملاحظات التحميص",
    flavors: "النكهات المتوقعة",
    aboutProcess: "عن المعالجة",
    variety: "السلالة",
    availableKg: "يتوفر 1كغم",
  },
  en: {
    cart: "Cart",
    wholesale: "Wholesale & Partners",
    wholesaleWaiting: "Waiting for the remaining details from you",
    headerDescription: "Shop the finest coffee and carefully selected origins from LAS CAFE",
    all: "All",
    viewAll: "View all",
    noProductsInCategory: "No products in this category yet.",
    addToCart: "Add to cart",
    addedToCart: "✓ Added",
    chooseColor: "Choose color →",
    backToProducts: "← Back to products",
    specs: "Specifications",
    orderViaSite: "Order online",
    orderViaSiteDesc:
      "Add to cart and complete checkout here. WhatsApp is available after confirmation for follow-up only.",
    color: "Color",
    footerStore: "Store",
    footerProducts: "LAS Products",
    footerWholesale: "Wholesale & Partners",
    footerAbout: "About us",
    about: "About us",
    aboutBrandStory: "Brand story",
    aboutVision: "Vision and mission",
    aboutWhy: "Why LAS CAFE",
    footerPolicies: "Policies",
    footerContact: "Contact us",
    comingSoon: "To be determined",
    cartTitle: "Shopping cart",
    cartEmpty: "Your cart is empty",
    cartEmptyDesc: "Add products from the store to continue.",
    browseProducts: "Browse products",
    remove: "Remove",
    orderSummary: "Order summary",
    total: "Total",
    checkoutNote: "Order and pay on the website. WhatsApp for follow-up after confirmation.",
    checkout: "Checkout",
    checkoutTitle: "Checkout",
    checkoutSubtitle: "Enter your details and complete your order",
    customerDetails: "Customer details",
    fullName: "Full name *",
    phone: "Mobile number *",
    email: "Email",
    delivery: "Delivery",
    city: "City *",
    address: "Delivery address *",
    notes: "Notes",
    notesPlaceholder: "Any notes for your order (optional)",
    payment: "Payment",
    paymentDemo: "Demo",
    paymentDemoDesc:
      " Online payment gateway (Moyasar / Tap) will be connected in the next phase. Orders are confirmed on the site for team review.",
    paymentSimulated: "✓ Pay on site — demo simulation",
    confirmOrder: "Confirm order & pay",
    confirming: "Confirming...",
    checkoutFooter: "After ordering you can follow up on WhatsApp: order confirmation, delivery time, and notes.",
    emptyCartCheckout: "No items in cart.",
    errorNamePhone: "Please enter your name and mobile number.",
    errorDelivery: "Please enter city and delivery address.",
    orderConfirmed: "Order confirmed",
    orderNumber: "Order number:",
    orderDetails: "Order details",
    customer: "Customer:",
    deliveryLabel: "Delivery:",
    whatsappFollowUp: "Follow up on WhatsApp",
    whatsappFollowUpDesc:
      "WhatsApp for follow-up only — to confirm order contents, delivery time, and any notes.",
    whatsappFollowUpBtn: "Follow up on WhatsApp",
    continueShopping: "Continue shopping",
    orderNotFound: "Order not found.",
    backToStore: "Back to store",
    notFound: "Page not found",
    backHome: "Back to store",
    priceByWeight: "Determined by weight",
    fullDescription: "Full description",
    options: "Options",
    weight: "Weight",
    buyNow: "Buy now",
    origin: "Origin",
    altitude: "Altitude",
    process: "Process",
    roastNotes: "Roast notes",
    flavors: "Expected flavors",
    aboutProcess: "About processing",
    variety: "Variety",
    availableKg: "1kg also available",
  },
} as const;

export type MessageKey = keyof typeof messages.ar;

export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatPrice(sar: number, locale: Locale): string {
  if (sar <= 0) return "";
  const amount = formatNumber(sar);
  return locale === "en" ? `SAR ${amount}` : `${amount} ر.س`;
}

export function getProductName(product: Product, locale: Locale): string {
  return locale === "en" ? product.nameEn : product.name;
}

export function getProductDescription(product: Product, locale: Locale): string {
  if (locale === "en") return product.descriptionEn || product.description;
  return product.description;
}

export function getCategoryLabel(
  categoryId: CategoryId,
  locale: Locale,
  variant: "section" | "pill" = "section",
): string {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return categoryId;
  if (locale === "en") return variant === "pill" ? cat.pillLabelEn : cat.labelEn;
  return variant === "pill" ? cat.pillLabel : cat.label;
}

export function getPolicyTitle(slug: string, locale: Locale): string {
  const policy = Object.values(POLICIES).find((p) => p.slug === slug);
  if (!policy) return slug;
  return locale === "en" ? policy.titleEn : policy.title;
}

export function getStoreTagline(locale: Locale): string {
  return locale === "en" ? STORE_CONFIG.taglineEn : STORE_CONFIG.tagline;
}

export function localeDir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
