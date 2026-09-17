"use client";

import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { CartLink } from "./CartLink";
import { HeaderMenu } from "./HeaderMenu";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLocale } from "./LocaleProvider";

export function Header() {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-las-border bg-las-bg/95">
      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-4 sm:gap-6">
          <BrandMark />
          <Link
            href="/wholesale"
            className="hidden text-xs text-las-muted transition-colors hover:text-las-accent sm:inline"
          >
            {t("wholesale")}
          </Link>
        </div>

        <p
          lang="en"
          dir="ltr"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[min(36rem,calc(100%-22rem))] -translate-x-1/2 -translate-y-1/2 text-center font-brand text-sm font-medium leading-snug tracking-[0.04em] text-las-primary md:block lg:text-base"
        >
          {t("headerDescription")}
        </p>

        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSwitch />
          <CartLink />
          <HeaderMenu />
        </div>
      </div>

      <p
        lang="en"
        dir="ltr"
        className="px-4 pb-3 text-center font-brand text-[12px] font-medium leading-snug tracking-[0.04em] text-las-primary md:hidden"
      >
        {t("headerDescription")}
      </p>
    </header>
  );
}
