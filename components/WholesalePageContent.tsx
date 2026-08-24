"use client";

import { useLocale } from "@/components/LocaleProvider";

export function WholesalePageContent() {
  const { t } = useLocale();

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <h1 className="text-3xl font-bold text-las-primary sm:text-4xl">{t("wholesale")}</h1>
      <p className="mt-6 text-base leading-relaxed text-las-muted sm:text-lg">
        {t("wholesaleWaiting")}
      </p>
    </div>
  );
}
