"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, type CategoryId } from "@/lib/config";

const PREVIEW_COUNT = 4;

type CategoryPillsProps = {
  basePath: "/" | "/products";
};

export function CategoryPills({ basePath }: CategoryPillsProps) {
  const searchParams = useSearchParams();
  const active = (searchParams.get("category") as CategoryId | null) ?? "all";

  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2 pb-10" aria-label="تصنيفات المنتجات">
      <FilterLink href={basePath} active={active === "all"} label="الكل" />
      {CATEGORIES.map((cat) => (
        <FilterLink
          key={cat.id}
          href={`${basePath}?category=${cat.id}`}
          active={active === cat.id}
          label={cat.pillLabel}
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
          : "text-las-muted hover:text-las-accent"
      }`}
    >
      {label}
    </Link>
  );
}

export { PREVIEW_COUNT };
