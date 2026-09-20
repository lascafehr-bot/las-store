"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { CATEGORIES, POLICIES, STORE_CONFIG } from "@/lib/config";
import { getCategoryLabel, getPolicyTitle } from "@/lib/i18n";

export function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const { locale, t } = useLocale();
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-las-primary transition-colors hover:text-las-accent"
        aria-label={t("menu")}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-las-primary/20"
            aria-label={t("menuClose")}
            onClick={close}
          />
          <nav
            id={panelId}
            className="absolute inset-y-0 end-0 flex w-[min(20.5rem,88vw)] flex-col border-s border-las-border bg-las-bg px-6 py-8 shadow-las"
            aria-label={t("menu")}
          >
            <div className="mb-8 sm:hidden">
              <LanguageSwitch />
            </div>
            <div className="flex flex-col gap-3 text-sm text-las-primary">
              <a
                href={STORE_CONFIG.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-las-accent"
                onClick={close}
              >
                {t("menuWebsite")}
              </a>
              {CATEGORIES.map((category) => (
                <Link
                  key={category.id}
                  href={`/?category=${category.id}`}
                  className="transition-colors hover:text-las-accent"
                  onClick={close}
                >
                  {getCategoryLabel(category.id, locale, "pill")}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-las-border pt-8 text-sm text-las-primary">
              <Link href="/wholesale" className="transition-colors hover:text-las-accent" onClick={close}>
                {t("wholesale")}
              </Link>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-las-border pt-8 text-sm text-las-muted">
              {Object.values(POLICIES).map((policy) => (
                <Link
                  key={policy.slug}
                  href={`/policies/${policy.slug}`}
                  className="transition-colors hover:text-las-accent"
                  onClick={close}
                >
                  {getPolicyTitle(policy.slug, locale)}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
