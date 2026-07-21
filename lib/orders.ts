import type { CartItem } from "./cart";
import { formatPrice, buildWhatsAppUrl } from "./config";

export type FulfillmentType = "pickup" | "delivery";

export type Order = {
  id: string;
  items: CartItem[];
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  fulfillment: {
    type: FulfillmentType;
    branch?: string;
    address?: string;
    city?: string;
  };
  notes?: string;
  total: number;
  createdAt: string;
  status: "confirmed";
};

export const LAST_ORDER_KEY = "las-store-last-order";

export function generateOrderId(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LAS-${y}${m}${d}-${rand}`;
}

export function saveLastOrder(order: Order): void {
  sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
}

export function readLastOrder(): Order | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

export function buildFollowUpWhatsAppMessage(order: Order): string {
  const itemsList = order.items
    .map((item) => {
      const color = item.color ? ` (${item.color})` : "";
      return `• ${item.name}${color} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`;
    })
    .join("\n");

  const fulfillment =
    order.fulfillment.type === "pickup"
      ? `استلام من الفرع: ${order.fulfillment.branch ?? "—"}`
      : `توصيل: ${order.fulfillment.city ?? ""} — ${order.fulfillment.address ?? ""}`;

  return `السلام عليكم، أتابع طلبي من متجر لاس:

🔖 رقم الطلب: ${order.id}
👤 ${order.customer.name}
📱 ${order.customer.phone}

📦 محتوى الطلب:
${itemsList}

💰 الإجمالي: ${formatPrice(order.total)}
🚚 ${fulfillment}
${order.notes ? `\n📝 ملاحظات: ${order.notes}` : ""}

أود متابعة: تأكيد الطلب / مدة التوصيل / ملاحظات`;
}

export function buildFollowUpWhatsAppUrl(order: Order): string {
  return buildWhatsAppUrl(buildFollowUpWhatsAppMessage(order));
}
