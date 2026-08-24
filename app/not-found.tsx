"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-las-primary">{t("notFound")}</h1>
      <Link
        href="/"
        className="mt-6 rounded-sm bg-las-primary px-6 py-3 text-sm font-semibold text-white hover:bg-las-primary-hover"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
