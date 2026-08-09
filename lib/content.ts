export const PROMO_BANNER = "شحن سريع · دفع آمن · shop.lascafe.sa";

export const CATEGORY_IMAGES: Record<string, string> = {
  coffee: "/products/ethiopian-guji/front.png",
  merch: "/products/las-mug/grey-front.png",
  bundles: "/products/las-mug/grey-front.png",
};

export const POLICY_CONTENT: Record<
  string,
  { title: string; sections: { heading?: string; body: string }[] }
> = {
  shipping: {
    title: "سياسة الشحن",
    sections: [
      {
        body: "يتم شحن الطلبات داخل المملكة العربية السعودية. مدة التوصيل ورسوم الشحن تُؤكَّد بعد إتمام الطلب حسب المدينة.",
      },
      {
        heading: "الاستلام من الفرع",
        body: "يمكنك اختيار الاستلام من أقرب فرع لاس عند إتمام الطلب.",
      },
    ],
  },
  returns: {
    title: "سياسة الاستبدال والارجاع",
    sections: [
      {
        body: "نحرص على جودة منتجاتنا. في حال وجود مشكلة في الطلب، تواصل معنا خلال 48 ساعة من الاستلام.",
      },
      {
        heading: "المنتجات القابلة للاستبدال",
        body: "المنتجات غير المفتوحة وبحالتها الأصلية — حسب سياسة لاس المعتمدة.",
      },
    ],
  },
  privacy: {
    title: "سياسة الخصوصية",
    sections: [
      {
        body: "نستخدم بياناتك (الاسم، الجوال، العنوان) لإتمام الطلب والتواصل معك فقط. لا نشارك بياناتك مع أطراف خارجية لأغراض ت marketing.",
      },
    ],
  },
};
