"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CoffeeProfileSheet } from "@/components/CoffeeProfileSheet";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { Price } from "@/components/Price";
import { type CategoryId } from "@/lib/config";
import {
  getCategoryLabel,
  getProductDescription,
  getProductName,
} from "@/lib/i18n";
import {
  getBeanWeights,
  isBeanProduct,
  type Product,
} from "@/lib/products";

type ProductDetailViewProps = {
  product: Product;
};

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { locale, t } = useLocale();
  const isBean = isBeanProduct(product);
  const beanWeights = getBeanWeights(product);
  const defaultColor = product.colors?.[0];
  const [selectedColorId, setSelectedColorId] = useState(defaultColor?.id ?? "");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [weightId, setWeightId] = useState(
    beanWeights.find((w) => (w.price ?? 0) > 0)?.id ?? beanWeights[0]?.id ?? "250g",
  );
  const [added, setAdded] = useState(false);

  const name = getProductName(product, locale);
  const altName = locale === "en" ? product.name : product.nameEn;
  const fullDescription = getProductDescription(product, locale);

  const selectedColor =
    product.colors?.find((c) => c.id === selectedColorId) ?? defaultColor;

  const galleryImages =
    selectedColor?.images ?? product.images ?? [product.image];

  const activeImage = galleryImages[activeImageIndex] ?? product.image;
  const colorLabel =
    locale === "en" ? selectedColor?.labelEn ?? selectedColor?.label : selectedColor?.label;
  const weightLabel = beanWeights.find((w) => w.id === weightId);
  const weightText = locale === "en" ? weightLabel?.labelEn : weightLabel?.label;
  const selectedPrice = isBean ? (weightLabel?.price ?? 0) : product.price;

  function selectColor(colorId: string) {
    setSelectedColorId(colorId);
    setActiveImageIndex(0);
  }

  function addToCart() {
    addItem({
      slug: product.slug,
      name,
      price: selectedPrice,
      image: activeImage,
      color: colorLabel,
      weight: isBean ? weightText : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function buyNow() {
    addToCart();
    router.push("/checkout");
  }

  const canPurchase = selectedPrice > 0;

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="space-y-4">
        <div className="relative aspect-square w-full overflow-hidden bg-las-cream">
          <Image
            key={activeImage}
            src={activeImage}
            alt={name}
            fill
            className="object-contain p-6"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {product.badge && (
            <span className="absolute right-4 top-4 bg-las-accent px-3 py-1 text-xs font-medium tracking-wide text-white">
              {product.badge}
            </span>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="flex gap-2">
            {galleryImages.map((img, index) => (
              <button
                key={img}
                type="button"
                onClick={() => setActiveImageIndex(index)}
                className={`relative h-20 w-20 overflow-hidden border-2 bg-las-cream transition-colors ${
                  activeImageIndex === index
                    ? "border-las-primary"
                    : "border-transparent hover:border-las-border"
                }`}
              >
                <Image src={img} alt="" fill className="object-contain p-1" sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 lg:py-6">
        <h1 className="text-3xl font-bold text-las-primary sm:text-4xl">{name}</h1>
        {altName && altName !== name && (
          <p className="text-sm text-las-muted">{altName}</p>
        )}

        {selectedPrice > 0 ? (
          <Price amount={selectedPrice} size="detail" hint={isBean ? weightText : undefined} />
        ) : isBean ? (
          <p className="text-xl font-semibold text-las-primary">{t("priceByWeight")}</p>
        ) : null}

        {isBean && product.coffeeProfile ? (
          <CoffeeProfileSheet
            name={name}
            description={fullDescription}
            profile={product.coffeeProfile}
          />
        ) : (
          fullDescription && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-las-primary">{t("fullDescription")}</h2>
              <p className="text-sm leading-[1.9] text-las-muted">{fullDescription}</p>
            </div>
          )
        )}

        {product.colors && product.colors.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-semibold text-las-primary">
              {t("color")}: {colorLabel}
            </p>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => selectColor(color.id)}
                  className={`flex items-center gap-2 rounded-sm border px-4 py-2 text-sm transition-colors ${
                    selectedColorId === color.id
                      ? "border-las-primary bg-las-primary/5 text-las-primary"
                      : "border-las-border text-las-muted hover:border-las-primary/40"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-las-border"
                    style={{ backgroundColor: color.swatch }}
                  />
                  {locale === "en" ? color.labelEn : color.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isBean && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-las-primary">{t("options")}</h2>
            <p className="mb-2 text-xs text-las-muted">{t("weight")}</p>
            <div className="flex flex-wrap gap-2">
              {beanWeights.map((weight) => (
                <button
                  key={weight.id}
                  type="button"
                  onClick={() => setWeightId(weight.id)}
                  className={`rounded-sm border px-4 py-2 text-sm transition-colors ${
                    weightId === weight.id
                      ? "border-las-primary bg-las-primary/5 text-las-primary"
                      : "border-las-border text-las-muted hover:border-las-primary/40"
                  }`}
                >
                  {locale === "en" ? weight.labelEn : weight.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.specs && product.specs.length > 0 && !isBean && (
          <div className="border border-las-border bg-las-cream/50 p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-las-primary">
              {t("specs")}
            </h2>
            <ul className="space-y-2.5 text-sm leading-relaxed text-las-muted">
              {product.specs.map((spec) => (
                <li key={spec} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-las-accent" />
                  {spec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {canPurchase && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={addToCart}
              className="flex-1 rounded-sm border border-las-primary px-8 py-3.5 text-sm font-semibold text-las-primary transition-colors hover:bg-las-primary/5"
            >
              {added ? t("addedToCart") : t("addToCart")}
            </button>
            <button
              type="button"
              onClick={buyNow}
              className="flex-1 rounded-sm bg-las-primary px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-las-primary-hover"
            >
              {t("buyNow")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type ProductPageShellProps = {
  product: Product;
};

export function ProductPageShell({ product }: ProductPageShellProps) {
  const { locale, t } = useLocale();

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex text-sm font-medium text-las-muted hover:text-las-primary"
        >
          {t("backToProducts")}
        </Link>

        <Link
          href={`/?category=${product.category}`}
          className="mb-6 inline-flex text-xs font-semibold uppercase tracking-wider text-las-accent hover:text-las-accent-hover"
        >
          {getCategoryLabel(product.category as CategoryId, locale, "section")}
        </Link>

        <ProductDetailView product={product} />
      </div>
    </div>
  );
}
