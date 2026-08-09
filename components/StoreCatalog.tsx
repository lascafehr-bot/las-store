"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CategoryPills, PREVIEW_COUNT } from "@/components/CategoryPills";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, type CategoryId } from "@/lib/config";
import { PRODUCTS } from "@/lib/products";

export function StoreCatalog() {
  const searchParams = useSearchParams();
  const active = (searchParams.get("category") as CategoryId | null) ?? "all";

  if (active === "all") {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <CategoryPills basePath="/" />
        <div className="space-y-16 sm:space-y-20">
          {CATEGORIES.map((cat) => {
            const products = PRODUCTS.filter((p) => p.category === cat.id);
            if (products.length === 0) return null;

            const preview = products.slice(0, PREVIEW_COUNT);

            return (
              <section key={cat.id}>
                <div className="mb-8 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold tracking-tight text-las-primary sm:text-3xl">{cat.label}</h2>
                  <Link
                    href={`/?category=${cat.id}`}
                    className="shrink-0 text-sm text-las-muted transition-colors hover:text-las-accent"
                  >
                    عرض الكل
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
                  {preview.map((product) => (
                    <ProductCard key={product.id} product={product} variant="compact" />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  const products = PRODUCTS.filter((p) => p.category === active);
  const categoryLabel = CATEGORIES.find((c) => c.id === active)?.label;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <CategoryPills basePath="/" />

      {products.length === 0 ? (
        <p className="py-20 text-center text-las-muted">لا توجد منتجات في هذا التصنيف حالياً.</p>
      ) : (
        <>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-las-primary sm:text-3xl">{categoryLabel}</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} variant="compact" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
