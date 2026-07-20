import Link from "next/link";
import { BrandStory } from "@/components/BrandStory";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { OrderSteps, StoreLocations } from "@/components/StoreLocations";
import { Testimonials } from "@/components/Testimonials";
import { getFeaturedProducts } from "@/lib/products";

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <>
      <Hero />
      <OrderSteps />

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-4">
            <SectionHeading
              title="الأكثر مبيعاً"
              subtitle="منتجات لاس الأكثر طلباً"
              align="start"
            />
            <Link
              href="/products"
              className="shrink-0 text-sm font-semibold text-las-accent hover:text-las-accent-hover"
            >
              عرض الكل
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:max-w-2xl lg:gap-x-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      <CategoryShowcase />
      <BrandStory />
      <Testimonials />
      <StoreLocations />
    </>
  );
}
