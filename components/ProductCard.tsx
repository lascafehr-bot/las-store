"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/AddToCartButton";
import { formatPrice } from "@/lib/config";
import type { Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
  variant?: "compact" | "default";
};

export function ProductCard({ product, variant = "default" }: ProductCardProps) {
  return (
    <article className="group flex flex-col bg-white">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-las-cream"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.badge && (
          <span className="absolute right-3 top-3 bg-las-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 pt-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold leading-snug text-las-primary transition-colors group-hover:text-las-accent sm:text-base">
            {product.name}
          </h3>
        </Link>

        {variant === "default" && (
          <p className="line-clamp-2 text-xs leading-relaxed text-las-muted sm:text-sm">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-2">
          <p className="mb-3 text-base font-bold text-las-primary">{formatPrice(product.price)}</p>
          {product.colors && product.colors.length > 0 ? (
            <Link
              href={`/products/${product.slug}`}
              className="flex w-full items-center justify-center rounded-sm border border-las-primary py-2.5 text-xs font-semibold text-las-primary transition-colors hover:bg-las-primary hover:text-white sm:text-sm"
            >
              اختر اللون
            </Link>
          ) : (
            <AddToCartButton
              slug={product.slug}
              name={product.name}
              price={product.price}
              image={product.image}
            />
          )}
        </div>
      </div>
    </article>
  );
}
