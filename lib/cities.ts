// Cities offered at checkout. `aramex` is the spelling sent to Aramex (the first four are the ones Aramex's own samples
// use; the others are the usual spellings and are checked against Aramex's city list on the first real shipment, where
// the admin can correct a city that Aramex does not know).
export const SAUDI_CITIES: { ar: string; en: string; aramex: string }[] = [
  { ar: "الرياض", en: "Riyadh", aramex: "Riyadh" },
  { ar: "جدة", en: "Jeddah", aramex: "Jeddah" },
  { ar: "الدمام", en: "Dammam", aramex: "Dammam" },
  { ar: "مكة المكرمة", en: "Makkah", aramex: "Makkah" },
  { ar: "المدينة المنورة", en: "Madinah", aramex: "Madinah" },
  { ar: "الخبر", en: "Khobar", aramex: "Khobar" },
  { ar: "الظهران", en: "Dhahran", aramex: "Dhahran" },
  { ar: "القطيف", en: "Qatif", aramex: "Qatif" },
  { ar: "الجبيل", en: "Jubail", aramex: "Jubail" },
  { ar: "الأحساء", en: "Al Ahsa", aramex: "Al Ahsa" },
  { ar: "الطائف", en: "Taif", aramex: "Taif" },
  { ar: "بريدة", en: "Buraydah", aramex: "Buraydah" },
  { ar: "عنيزة", en: "Unaizah", aramex: "Unaizah" },
  { ar: "حائل", en: "Hail", aramex: "Hail" },
  { ar: "تبوك", en: "Tabuk", aramex: "Tabuk" },
  { ar: "أبها", en: "Abha", aramex: "Abha" },
  { ar: "خميس مشيط", en: "Khamis Mushait", aramex: "Khamis Mushait" },
  { ar: "جازان", en: "Jazan", aramex: "Jazan" },
  { ar: "نجران", en: "Najran", aramex: "Najran" },
  { ar: "ينبع", en: "Yanbu", aramex: "Yanbu" },
  { ar: "الخرج", en: "Al Kharj", aramex: "Al Kharj" },
  { ar: "الباحة", en: "Al Baha", aramex: "Al Baha" },
  { ar: "سكاكا", en: "Sakaka", aramex: "Sakaka" },
  { ar: "عرعر", en: "Arar", aramex: "Arar" },
];

/** Spellings people also type (without the hamza, or with a final ه), mapped to the list's Arabic name. */
export const CITY_ALIASES: Record<string, string> = {
  جده: "جدة",
  مكه: "مكة المكرمة",
  مكة: "مكة المكرمة",
  "مكه المكرمه": "مكة المكرمة",
  المدينة: "المدينة المنورة",
  الاحساء: "الأحساء",
  ابها: "أبها",
  الهفوف: "الأحساء",
};
