"use client";

import { BrandMark } from "@/components/BrandMark";
import { CartLink } from "./CartLink";
import { HeaderMenu } from "./HeaderMenu";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLocale } from "./LocaleProvider";

export function Header() {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-50 rounded-b-3xl bg-las-bar shadow-[5px_10px_30px_rgba(43,45,52,0.05)]">
      <div className="px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center">
          <div className="justify-self-start">
            <HeaderMenu />
          </div>

          <div className="flex min-w-0 items-center justify-self-center gap-1.5 sm:gap-3" dir="ltr">
            <BrandMark />
            <p
              lang="en"
              className="min-w-0 max-w-[7rem] font-brand text-[10px] font-medium leading-snug tracking-[0.03em] text-black sm:max-w-none sm:whitespace-nowrap sm:text-xs md:text-sm"
            >
              {t("headerDescription")}
            </p>
          </div>

          <div className="flex items-center justify-self-end gap-1">
            <div className="hidden sm:block">
              <LanguageSwitch />
            </div>
            <CartLink iconOnly />
          </div>
        </div>
      </div>
    </header>
  );
}
