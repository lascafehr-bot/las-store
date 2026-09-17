"use client";

import { useLocale } from "@/components/LocaleProvider";
import { STORE_CONFIG } from "@/lib/config";

const PHOTOS = [
  "/media/lifestyle-1.jpg",
  "/media/lifestyle-2.jpg",
  "/media/lifestyle-3.jpg",
  "/media/lifestyle-4.jpg",
];

export function LifestyleStrip() {
  const { t } = useLocale();
  const loop = [...PHOTOS, ...PHOTOS];

  return (
    <section>
      <div className="mx-auto w-full max-w-7xl px-4 pb-6 text-center sm:px-6 lg:px-8">
        <p className="text-lg font-semibold text-las-primary sm:text-xl">{t("learnMore")}</p>
        <a
          href={STORE_CONFIG.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-las-muted transition-colors hover:text-las-accent sm:text-base"
        >
          {t("ourWebsite")}
        </a>
      </div>
      <div className="overflow-hidden" dir="ltr">
        <div className="las-marquee flex w-max">
          {loop.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt=""
              className="h-64 w-56 shrink-0 object-cover sm:h-80 sm:w-72 lg:h-[22rem] lg:w-80"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
