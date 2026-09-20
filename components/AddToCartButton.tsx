"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";

type AddToCartButtonProps = {
  slug: string;
  name: string;
  price: number;
  image: string;
  color?: string;
  weight?: string;
  className?: string;
  label?: string;
  showIcon?: boolean;
};

export function AddToCartButton({
  slug,
  name,
  price,
  image,
  color,
  weight,
  className = "",
  label,
  showIcon = false,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { t } = useLocale();
  const [added, setAdded] = useState(false);
  const buttonLabel = label ?? t("addToCart");

  function handleClick() {
    addItem({ slug, name, price, image, color, weight });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-center justify-center gap-2 transition-colors ${className}`}
    >
      {added ? (
        t("addedToCart")
      ) : (
        <>
          <span>{buttonLabel}</span>
          {showIcon ? <CartBagIcon /> : null}
        </>
      )}
    </button>
  );
}

function CartBagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
