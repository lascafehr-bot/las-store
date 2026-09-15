"use client";

import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";
import { STORE_CONFIG } from "@/lib/config";
import { LEARN_MORE_IMAGES } from "@/lib/content";

export function LearnMore() {
  const { locale, t } = useLocale();

  return (
    <section className="pb-4">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:mb-10 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-semibold tracking-tight text-las-primary sm:text-3xl">
          {t("learnMore")}
        </h2>
        <a
          href={STORE_CONFIG.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm bg-las-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-las-primary-hover"
        >
          {t("learnMoreCta")}
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {LEARN_MORE_IMAGES.map((image) => (
          <div key={image.src} className="relative aspect-[4/5] overflow-hidden bg-las-bg">
            <Image
              src={image.src}
              alt={locale === "en" ? image.altEn : image.altAr}
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
