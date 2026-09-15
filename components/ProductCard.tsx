"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/AddToCartButton";
import { useLocale } from "@/components/LocaleProvider";
import { Price } from "@/components/Price";
import { getProductDescription, getProductName } from "@/lib/i18n";
import {
  getCatalogPrice,
  getCatalogWeight,
  hasKilogramOption,
  type Product,
} from "@/lib/products";

type ProductCardProps = {
  product: Product;
  variant?: "compact" | "default";
};

export function ProductCard({ product, variant = "default" }: ProductCardProps) {
  const { locale, t } = useLocale();
  const name = getProductName(product, locale);
  const description = getProductDescription(product, locale);
  const catalogPrice = getCatalogPrice(product);
  const catalogWeight = getCatalogWeight(product);
  const weightHint = locale === "en" ? catalogWeight?.labelEn : catalogWeight?.label;
  const colors = product.colors ?? [];
  const showColorBox = colors.length > 1;
  const comingSoon = Boolean(product.comingSoon);

  return (
    <article className="group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-sm bg-las-bg"
      >
        {comingSoon ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <span className="font-brand text-3xl font-semibold tracking-wide text-las-primary">
              {locale === "en" ? product.nameEn : product.name}
            </span>
          </div>
        ) : product.cardImage ? (
          <Image
            src={product.cardImage}
            alt={name}
            fill
            className="object-cover object-left"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : showColorBox ? (
          <div className="flex h-full items-end justify-center gap-0 px-1 pb-3 pt-5">
            {colors.map((color) => (
              <div key={color.id} className="relative h-full flex-1 mix-blend-multiply">
                <Image
                  src={color.images[0] ?? product.image}
                  alt={`${name} — ${locale === "en" ? color.labelEn : color.label}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 25vw, 12vw"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 mix-blend-multiply">
            <Image
              src={product.image}
              alt={name}
              fill
              className="object-contain p-4"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
        )}
        {(product.badge || comingSoon) && (
          <span className="absolute right-3 top-3 bg-las-accent px-2 py-0.5 text-[10px] font-medium tracking-wide text-white">
            {comingSoon ? t("soon") : product.badge}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 pt-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium leading-snug text-las-primary transition-colors group-hover:text-las-accent sm:text-base">
            {name}
          </h3>
        </Link>

        {variant === "default" && description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-las-muted sm:text-sm">
            {description}
          </p>
        )}

        {comingSoon ? (
          <p className="mt-auto pt-3 text-xs text-las-muted">{t("soon")}</p>
        ) : catalogPrice > 0 ? (
          <div className="mt-auto pt-3">
            <Price amount={catalogPrice} hint={weightHint} />
            {hasKilogramOption(product) && (
              <p className="mt-1 text-xs leading-relaxed text-las-muted">{t("availableKg")}</p>
            )}
            <CatalogAddToCart product={product} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CatalogAddToCart({ product }: { product: Product }) {
  const { locale } = useLocale();
  const name = getProductName(product, locale);
  const catalogPrice = getCatalogPrice(product);
  const defaultColor = product.colors?.[0];
  const weight = getCatalogWeight(product);
  const colorLabel =
    locale === "en" ? defaultColor?.labelEn ?? defaultColor?.label : defaultColor?.label;
  const weightText = locale === "en" ? weight?.labelEn : weight?.label;

  return (
    <AddToCartButton
      slug={product.slug}
      name={name}
      price={catalogPrice}
      image={defaultColor?.images[0] ?? product.image}
      color={colorLabel}
      weight={weightText}
      className="mt-2 rounded-sm border border-las-primary px-3 py-2 text-xs font-semibold text-las-primary hover:bg-las-primary/5 hover:text-las-primary sm:text-xs"
    />
  );
}
