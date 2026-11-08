"use client";

import { useLocale } from "@/components/LocaleProvider";
import { STORE_CONFIG } from "@/lib/config";

const PHOTOS = [
  "/media/lifestyle-1.jpg?v=4",
  "/media/lifestyle-2.jpg?v=4",
  "/media/lifestyle-3.jpg?v=4",
  "/media/lifestyle-4.jpg?v=4",
  "/media/lifestyle-5.jpg?v=5",
  "/media/lifestyle-6.jpg?v=5",
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
      <div className="las-marquee-wrap overflow-hidden" dir="ltr">
        <div className="las-marquee flex w-max">
          {loop.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt=""
              // The second copy only exists to make the slow scroll loop; it is hidden when the strip is swiped by hand.
              data-dup={index >= PHOTOS.length ? "" : undefined}
              aria-hidden={index >= PHOTOS.length ? true : undefined}
              className="h-64 w-56 shrink-0 object-cover sm:h-80 sm:w-72 lg:h-[22rem] lg:w-80"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
