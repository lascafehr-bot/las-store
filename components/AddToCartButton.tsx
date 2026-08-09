"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";

type AddToCartButtonProps = {
  slug: string;
  name: string;
  price: number;
  image: string;
  color?: string;
  className?: string;
  label?: string;
};

export function AddToCartButton({
  slug,
  name,
  price,
  image,
  color,
  className = "",
  label = "أضف إلى السلة",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({ slug, name, price, image, color });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-center justify-center py-2.5 text-xs font-medium transition-colors sm:text-sm ${
        added ? "text-las-accent" : "text-las-muted hover:text-las-accent"
      } ${className}`}
    >
      {added ? "✓ تمت الإضافة" : label}
    </button>
  );
}
