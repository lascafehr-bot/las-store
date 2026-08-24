"use client";

import { useLocale } from "@/components/LocaleProvider";

type PriceSize = "card" | "detail" | "inline";

type PriceProps = {
  amount: number;
  size?: PriceSize;
  hint?: string;
};

export function Price({ amount, size = "card", hint }: PriceProps) {
  const { locale } = useLocale();
  if (amount <= 0) return null;

  const number = amount.toLocaleString("en-US");
  const currency = locale === "en" ? "SAR" : "ر.س";

  const numberClass =
    size === "detail"
      ? "text-2xl font-bold"
      : size === "inline"
        ? "text-sm font-semibold"
        : "text-sm font-semibold";

  const currencyClass =
    size === "detail"
      ? "text-sm font-semibold text-las-accent"
      : "text-sm font-medium text-las-accent";

  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-las-primary">
      <span lang="en" dir="ltr" className={`tabular-nums ${numberClass}`}>
        {number}
      </span>
      <span className={currencyClass}>{currency}</span>
      {hint ? (
        <span className="text-xs font-medium text-las-muted">/ {hint}</span>
      ) : null}
    </p>
  );
}
