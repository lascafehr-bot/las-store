"use client";

import { LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center text-[11px] font-bold">
      {LOCALES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setLocale(item.id as Locale)}
          className={`rounded-full px-2 py-1 transition-colors ${
            locale === item.id
              ? "bg-las-primary text-white"
              : "text-las-primary/70 hover:text-las-primary"
          }`}
          aria-pressed={locale === item.id}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
