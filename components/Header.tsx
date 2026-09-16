"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { CATEGORIES } from "@/lib/config";
import { getCategoryLabel, getStoreTagline } from "@/lib/i18n";
import { getProductsByCategory } from "@/lib/products";
import { CartLink } from "./CartLink";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLocale } from "./LocaleProvider";

export function Header() {
  const { locale, t } = useLocale();

  const categoryLinks = CATEGORIES.filter(
    (cat) => getProductsByCategory(cat.id).length > 0,
  );

  return (
    <header className="sticky top-0 z-50 border-b border-las-border bg-las-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 flex-col">
          <BrandMark />
          <p className="mt-1 text-[11px] leading-snug text-las-muted sm:text-xs">
            {getStoreTagline(locale)}
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSwitch />
          <CartLink />
        </div>
      </div>

      <nav
        aria-label={t("home")}
        className="border-t border-las-border/60"
      >
        <ul className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5 text-sm sm:gap-x-7 sm:px-6 lg:px-8">
          <li>
            <Link
              href="/"
              className="font-medium text-las-primary transition-colors hover:text-las-accent"
            >
              {t("home")}
            </Link>
          </li>
          {categoryLinks.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/?category=${cat.id}`}
                className="text-las-muted transition-colors hover:text-las-primary"
              >
                {getCategoryLabel(cat.id, locale, "pill")}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/wholesale"
              className="text-las-muted transition-colors hover:text-las-accent"
            >
              {t("wholesale")}
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
