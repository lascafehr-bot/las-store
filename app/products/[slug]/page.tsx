import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/ProductDetailView";
import { CATEGORIES } from "@/lib/config";
import { getAllProductSlugs, getProductBySlug } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "المنتج غير موجود" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const category = CATEGORIES.find((c) => c.id === product.category);

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <Link
          href="/products"
          className="mb-8 inline-flex text-sm font-medium text-las-muted hover:text-las-primary"
        >
          ← العودة للمنتجات
        </Link>

        {category && (
          <Link
            href={`/products?category=${category.id}`}
            className="mb-6 inline-flex text-xs font-semibold uppercase tracking-wider text-las-accent hover:text-las-accent-hover"
          >
            {category.label}
          </Link>
        )}

        <ProductDetailView product={product} />
      </div>
    </div>
  );
}
