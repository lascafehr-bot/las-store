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
      className={`flex items-center justify-center rounded-sm border border-las-primary py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
        added
          ? "bg-las-primary text-white"
          : "text-las-primary hover:bg-las-primary hover:text-white"
      } ${className}`}
    >
      {added ? "✓ تمت الإضافة" : label}
    </button>
  );
}
