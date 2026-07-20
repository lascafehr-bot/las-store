import Image from "next/image";
import Link from "next/link";
import { STORE_CONFIG } from "@/lib/config";

export function Hero() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-las-dark">
      <Image
        src="/products/las-cafe-night.png"
        alt=""
        fill
        priority
        className="object-cover opacity-50"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-las-dark/95 via-las-dark/70 to-las-dark/40" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-las-accent">
            {STORE_CONFIG.companyName}
          </p>
          <h1 className="mb-5 text-4xl font-bold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
            {STORE_CONFIG.name}
          </h1>
          <p className="mb-8 text-base leading-relaxed text-white/80 sm:text-lg">
            {STORE_CONFIG.tagline}
            <br />
            <span className="text-white/60">قهوة مختصة · هدايا · أكواب · حلويات</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-sm bg-white px-8 py-3.5 text-sm font-semibold text-las-primary transition-colors hover:bg-las-cream"
            >
              تسوّق الآن
            </Link>
            <a
              href={`https://wa.me/${STORE_CONFIG.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-sm border border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              تواصل واتساب
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
