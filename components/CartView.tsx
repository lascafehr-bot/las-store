"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { formatPrice } from "@/lib/i18n";
import { cartItemOptions } from "@/lib/cart";

export function CartView() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const { locale, t } = useLocale();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-las-primary">{t("cartEmpty")}</p>
        <p className="mt-2 text-sm text-las-muted">{t("cartEmptyDesc")}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-sm bg-las-primary px-6 py-3 text-sm font-semibold text-white hover:bg-las-primary-hover"
        >
          {t("browseProducts")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.lineId}
            className="flex gap-4 border border-las-border bg-white p-4 sm:gap-6 sm:p-5"
          >
            <div className="relative h-24 w-24 shrink-0 bg-las-cream sm:h-28 sm:w-28">
              <Image src={item.image} alt={item.name} fill className="object-contain p-2" sizes="112px" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/products/${item.slug}`} className="font-semibold text-las-primary hover:text-las-accent">
                    {item.name}
                  </Link>
                  {cartItemOptions(item) && (
                    <p className="mt-1 text-xs text-las-muted">{cartItemOptions(item)}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.lineId)}
                  className="text-xs text-las-muted hover:text-red-600"
                >
                  {t("remove")}
                </button>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center border border-las-border text-las-primary hover:bg-las-cream"
                  >
                    −
                  </button>
                  <span lang="en" dir="ltr" className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center border border-las-border text-las-primary hover:bg-las-cream"
                  >
                    +
                  </button>
                </div>
                <p className="font-bold text-las-primary">{formatPrice(item.price * item.quantity, locale)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit border border-las-border bg-las-cream/50 p-6">
        <h2 className="mb-4 text-lg font-bold text-las-primary">{t("orderSummary")}</h2>
        <div className="flex justify-between border-b border-las-border pb-4 text-sm">
          <span className="text-las-muted">{t("total")}</span>
          <span className="font-bold text-las-primary">{formatPrice(total, locale)}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-las-muted">{t("checkoutNote")}</p>
        <Link
          href="/checkout"
          className="mt-6 flex w-full items-center justify-center rounded-sm bg-las-primary py-3.5 text-sm font-semibold text-white hover:bg-las-primary-hover"
        >
          {t("checkout")}
        </Link>
      </aside>
    </div>
  );
}

export function CartPageContent() {
  const { t } = useLocale();

  return (
    <div className="bg-las-bg">
      <div className="border-b border-las-border bg-las-cream py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-las-primary">{t("cartTitle")}</h1>
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CartView />
      </div>
    </div>
  );
}
