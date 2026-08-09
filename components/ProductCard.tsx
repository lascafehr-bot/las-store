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
    <article className="group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-sm bg-white shadow-las"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.badge && (
          <span className="absolute right-3 top-3 bg-las-primary/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 pt-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium leading-snug text-las-primary transition-colors group-hover:text-las-accent sm:text-base">
            {product.name}
          </h3>
        </Link>

        {variant === "default" && (
          <p className="line-clamp-2 text-xs leading-relaxed text-las-muted sm:text-sm">
            {product.description}
          </p>
        )}

        {variant === "compact" ? (
          <p className="pt-1 text-sm font-medium text-las-accent">{formatPrice(product.price)}</p>
        ) : (
          <div className="mt-auto pt-3">
            <p className="mb-3 text-base font-medium text-las-accent">{formatPrice(product.price)}</p>
            {product.colors && product.colors.length > 0 ? (
              <Link
                href={`/products/${product.slug}`}
                className="flex w-full items-center justify-center py-2.5 text-xs font-medium text-las-muted transition-colors hover:text-las-accent sm:text-sm"
              >
                اختر اللون ←
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
        )}
      </div>
    </article>
  );
}
