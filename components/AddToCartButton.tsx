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
      className={`flex w-full items-center justify-center transition-colors ${className}`}
    >
      {added ? t("addedToCart") : buttonLabel}
    </button>
  );
}
