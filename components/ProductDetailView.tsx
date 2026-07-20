"use client";

import Image from "next/image";
import { useState } from "react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { formatPrice } from "@/lib/config";
import type { Product } from "@/lib/products";

type ProductDetailViewProps = {
  product: Product;
};

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const defaultColor = product.colors?.[0];
  const [selectedColorId, setSelectedColorId] = useState(defaultColor?.id ?? "");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const selectedColor =
    product.colors?.find((c) => c.id === selectedColorId) ?? defaultColor;

  const galleryImages =
    selectedColor?.images ?? product.images ?? [product.image];

  const activeImage = galleryImages[activeImageIndex] ?? product.image;

  function selectColor(colorId: string) {
    setSelectedColorId(colorId);
    setActiveImageIndex(0);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden bg-las-cream">
          <Image
            key={activeImage}
            src={activeImage}
            alt={product.name}
            fill
            className="object-contain p-6"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {product.badge && (
            <span className="absolute right-4 top-4 bg-las-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
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
        <h1 className="text-3xl font-bold text-las-primary sm:text-4xl">{product.name}</h1>
        <p className="text-sm text-las-muted">{product.nameEn}</p>
        <p className="text-2xl font-bold text-las-primary">{formatPrice(product.price)}</p>
        <p className="text-base leading-[1.9] text-las-muted">{product.description}</p>

        {product.colors && product.colors.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-semibold text-las-primary">
              اللون: {selectedColor?.label}
            </p>
            <div className="flex gap-3">
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
                  {color.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <WhatsAppButton
          productName={product.name}
          price={product.price}
          color={selectedColor?.label}
          className="w-full rounded-sm sm:w-fit"
          label="اطلب عبر واتساب"
        />

        {product.specs && product.specs.length > 0 && (
          <div className="border border-las-border bg-las-cream/50 p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-las-primary">
              المواصفات
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

        <div className="border border-las-border bg-las-cream/50 p-5 text-sm text-las-muted">
          <p className="font-semibold text-las-primary">الطلب عبر واتساب</p>
          <p className="mt-1 leading-relaxed">
            فريق لاس يرد عليك لتأكيد التوفر والاستلام من أقرب فرع أو التوصيل.
          </p>
        </div>
      </div>
    </div>
  );
}
