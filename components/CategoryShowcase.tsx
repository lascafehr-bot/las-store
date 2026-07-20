import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { CATEGORY_IMAGES } from "@/lib/content";
import { SectionHeading } from "./SectionHeading";

export function CategoryShowcase() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="تسوّق حسب التصنيف" subtitle="اكتشف مجموعات لاس المختارة" />

        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-sm sm:aspect-[3/2]"
            >
              <Image
                src={CATEGORY_IMAGES[cat.id]}
                alt={cat.label}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-las-dark/80 via-las-dark/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <h3 className="text-xl font-bold text-white">{cat.label}</h3>
                <p className="mt-1 text-sm text-white/75">{cat.description}</p>
                <span className="mt-3 inline-block text-xs font-semibold uppercase tracking-wider text-las-accent opacity-0 transition-opacity group-hover:opacity-100">
                  تصفّح ←
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
