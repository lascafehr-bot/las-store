"use client";

import { useLocale } from "@/components/LocaleProvider";
import { WHY_LAS_CAFE } from "@/lib/about";

export function AboutPageContent() {
  const { locale, t } = useLocale();
  const whyItems = WHY_LAS_CAFE[locale];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-las-primary sm:text-4xl">{t("about")}</h1>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-las-primary">{t("aboutBrandStory")}</h2>
        <p className="mt-3 text-base leading-[1.9] text-las-muted">{t("comingSoon")}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-las-primary">{t("aboutVision")}</h2>
        <p className="mt-3 text-base leading-[1.9] text-las-muted">{t("comingSoon")}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-las-primary">{t("aboutWhy")}</h2>
        <ul className="mt-5 space-y-4 text-base leading-[1.9] text-las-muted">
          {whyItems.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-las-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
