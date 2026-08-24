"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { CATEGORIES, type CategoryId } from "@/lib/config";
import { getCategoryLabel } from "@/lib/i18n";

const PREVIEW_COUNT = 4;

export function CategoryPills() {
  const searchParams = useSearchParams();
  const active = (searchParams.get("category") as CategoryId | null) ?? "all";
  const { locale, t } = useLocale();

  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2 pb-10" aria-label="Categories">
      <FilterLink href="/" active={active === "all"} label={t("all")} />
      {CATEGORIES.map((cat) => (
        <FilterLink
          key={cat.id}
          href={`/?category=${cat.id}`}
          active={active === cat.id}
          label={getCategoryLabel(cat.id, locale, "pill")}
        />
      ))}
    </nav>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        active
          ? "font-semibold text-las-primary underline decoration-las-accent decoration-2 underline-offset-[6px]"
          : "text-las-muted hover:text-las-primary"
      }`}
    >
      {label}
    </Link>
  );
}

export { PREVIEW_COUNT };
