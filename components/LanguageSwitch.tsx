"use client";

import { LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {LOCALES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setLocale(item.id as Locale)}
          className={`rounded-sm px-2 py-1 transition-colors ${
            locale === item.id
              ? "bg-las-primary text-white"
              : "text-las-muted hover:text-las-primary"
          }`}
          aria-pressed={locale === item.id}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
