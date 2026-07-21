"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type CartItem,
  cartCount,
  cartTotal,
  getLineId,
  readCartFromStorage,
  writeCartToStorage,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "lineId" | "quantity"> & { quantity?: number }) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCartFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      writeCartToStorage(items);
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "lineId" | "quantity"> & { quantity?: number }) => {
      const lineId = getLineId(item.slug, item.color);
      const qty = item.quantity ?? 1;

      setItems((current) => {
        const existing = current.find((c) => c.lineId === lineId);
        if (existing) {
          return current.map((c) =>
            c.lineId === lineId ? { ...c, quantity: c.quantity + qty } : c,
          );
        }
        return [
          ...current,
          {
            lineId,
            slug: item.slug,
            name: item.name,
            price: item.price,
            quantity: qty,
            color: item.color,
            image: item.image,
          },
        ];
      });
    },
    [],
  );

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity < 1) {
      setItems((current) => current.filter((c) => c.lineId !== lineId));
      return;
    }
    setItems((current) =>
      current.map((c) => (c.lineId === lineId ? { ...c, quantity } : c)),
    );
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((current) => current.filter((c) => c.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      itemCount: cartCount(items),
      total: cartTotal(items),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
