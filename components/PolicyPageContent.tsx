"use client";

import { useLocale } from "@/components/LocaleProvider";
import { getPolicyTitle } from "@/lib/i18n";
import { getPolicyItems } from "@/lib/policies";

type PolicyPageContentProps = {
  slug: string;
};

export function PolicyPageContent({ slug }: PolicyPageContentProps) {
  const { locale } = useLocale();
  const items = getPolicyItems(slug, locale);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-las-primary">{getPolicyTitle(slug, locale)}</h1>
      {items.length > 0 && (
        <ul className="mt-8 space-y-4 text-base leading-[1.9] text-las-muted">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-las-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
