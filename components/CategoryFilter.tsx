"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, type CategoryId } from "@/lib/config";

export function CategoryFilter() {
  const searchParams = useSearchParams();
  const active = (searchParams.get("category") as CategoryId | null) ?? "all";

  return (
    <div className="flex flex-wrap gap-2 border-b border-las-border pb-6">
      <FilterChip href="/products" active={active === "all"} label="الكل" />
      {CATEGORIES.map((cat) => (
        <FilterChip
          key={cat.id}
          href={`/products?category=${cat.id}`}
          active={active === cat.id}
          label={cat.label}
        />
      ))}
    </div>
  );
}

function FilterChip({
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
      className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-las-primary text-white"
          : "bg-las-cream text-las-muted hover:bg-las-primary/10 hover:text-las-primary"
      }`}
    >
      {label}
    </Link>
  );
}
