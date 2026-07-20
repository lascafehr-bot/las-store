import { Suspense } from "react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, type CategoryId } from "@/lib/config";
import { PRODUCTS } from "@/lib/products";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = params.category as CategoryId | undefined;
  const filtered = category
    ? PRODUCTS.filter((p) => p.category === category)
    : PRODUCTS;

  const categoryLabel = category
    ? CATEGORIES.find((c) => c.id === category)?.label
    : null;

  return (
    <div className="bg-white">
      <div className="border-b border-las-border bg-las-cream py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-las-primary sm:text-4xl">
            {categoryLabel ?? "جميع المنتجات"}
          </h1>
          <p className="mt-2 text-sm text-las-muted">
            {filtered.length} منتج — اطلب عبر واتساب
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="mb-8 h-10 animate-pulse bg-las-cream" />}>
          <div className="mb-10">
            <CategoryFilter />
          </div>
        </Suspense>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-las-muted">
            لا توجد منتجات في هذا التصنيف حالياً.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
