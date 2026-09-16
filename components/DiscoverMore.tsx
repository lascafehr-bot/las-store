"use client";

import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";
import { STORE_CONFIG } from "@/lib/config";

const GALLERY = [
  { src: "/products/las-barista-station.png", alt: "LAS barista station" },
  { src: "/products/las-cafe-night.png", alt: "LAS CAFE" },
  { src: "/products/las-iced-tea.png", alt: "LAS iced tea" },
];

export function DiscoverMore() {
  const { t } = useLocale();

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="mb-6 flex justify-center">
        <a
          href={STORE_CONFIG.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-sm bg-las-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-las-primary-hover"
        >
          {t("learnMore")}
          <span aria-hidden="true">←</span>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {GALLERY.map((item) => (
          <div
            key={item.src}
            className="relative aspect-[4/3] overflow-hidden rounded-sm bg-las-bg shadow-las"
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
