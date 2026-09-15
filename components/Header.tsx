"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { CartLink } from "./CartLink";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLocale } from "./LocaleProvider";
import { CATEGORIES, type CategoryId } from "@/lib/config";
import { getCategoryLabel, getStoreTagline } from "@/lib/i18n";
import { PRODUCTS } from "@/lib/products";

export function Header() {
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const activeCategory = searchParams.get("category") as CategoryId | null;

  const links = [
    {
      href: "/",
      label: t("home"),
      active: pathname === "/" && !activeCategory,
    },
    ...CATEGORIES.filter((cat) => PRODUCTS.some((product) => product.category === cat.id)).map((cat) => ({
      href: `/?category=${cat.id}`,
      label: getCategoryLabel(cat.id, locale, "section"),
      active: pathname === "/" && activeCategory === cat.id,
    })),
    {
      href: "/wholesale",
      label: t("wholesale"),
      active: pathname === "/wholesale",
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-las-border bg-las-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="min-w-0">
          <BrandMark />
          <p className="mt-1 max-w-[13rem] text-[10px] leading-snug text-las-muted sm:max-w-[16rem] sm:text-[11px]">
            {getStoreTagline(locale)}
          </p>
        </div>

        <nav className="hidden items-center gap-5 lg:flex" aria-label={t("menu")}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                link.active
                  ? "font-semibold text-las-primary"
                  : "text-las-muted hover:text-las-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center text-las-primary lg:hidden"
            aria-expanded={open}
            aria-label={t("menu")}
            onClick={() => setOpen((value) => !value)}
          >
            <MenuIcon open={open} />
          </button>
          <LanguageSwitch />
          <CartLink />
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-las-border px-4 py-3 lg:hidden sm:px-6"
          aria-label={t("menu")}
        >
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block px-1 py-2 text-sm ${
                    link.active
                      ? "font-semibold text-las-primary"
                      : "text-las-muted hover:text-las-primary"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current" fill="none" strokeWidth="1.6" aria-hidden="true">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      ) : (
        <>
          <path d="M4 7h16" strokeLinecap="round" />
          <path d="M4 12h16" strokeLinecap="round" />
          <path d="M4 17h16" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
