"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";

export function CartLink({ iconOnly = false }: { iconOnly?: boolean }) {
  const { itemCount } = useCart();
  const { t } = useLocale();

  return (
    <Link
      href="/cart"
      aria-label={t("cart")}
      className={`relative inline-flex items-center text-las-primary transition-colors hover:text-las-accent ${
        iconOnly
          ? "h-9 w-9 justify-center rounded-xl"
          : "gap-1.5 text-sm"
      }`}
    >
      <CartIcon />
      {iconOnly ? null : <span className="hidden sm:inline">{t("cart")}</span>}
      {itemCount > 0 && (
        <span lang="en" dir="ltr" className={`flex items-center justify-center rounded-full bg-las-accent font-bold text-white ${
          iconOnly
            ? "absolute end-1 top-1 h-4 min-w-4 px-1 text-[10px]"
            : "h-5 min-w-5 px-1 text-[10px]"
        }`}>
          {itemCount}
        </span>
      )}
    </Link>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
