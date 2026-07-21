export type CartItem = {
  lineId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  image: string;
};

export const CART_STORAGE_KEY = "las-store-cart";

export function getLineId(slug: string, color?: string): string {
  return color ? `${slug}:${color}` : slug;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCartToStorage(items: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}
