"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/config";
import { buildFollowUpWhatsAppUrl, readLastOrder, type Order } from "@/lib/orders";

export function OrderConfirmation() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const saved = readLastOrder();
    if (saved && (!orderId || saved.id === orderId)) {
      setOrder(saved);
    }
  }, [orderId]);

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-las-muted">لم يتم العثور على الطلب.</p>
        <Link href="/products" className="mt-4 inline-block text-las-accent hover:underline">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  const whatsappUrl = buildFollowUpWhatsAppUrl(order);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-las-primary sm:text-3xl">تم تأكيد طلبك</h1>
        <p className="mt-2 text-sm text-las-muted">
          رقم الطلب: <span className="font-bold text-las-primary">{order.id}</span>
        </p>
      </div>

      <div className="space-y-4 border border-las-border bg-white p-6">
        <h2 className="font-bold text-las-primary">تفاصيل الطلب</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.lineId} className="flex justify-between gap-2">
              <span className="text-las-muted">
                {item.name}
                {item.color ? ` (${item.color})` : ""} × {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-las-border pt-3 font-bold">
          <span>الإجمالي</span>
          <span>{formatPrice(order.total)}</span>
        </div>

        <div className="border-t border-las-border pt-4 text-sm text-las-muted">
          <p><strong className="text-las-primary">العميل:</strong> {order.customer.name} — {order.customer.phone}</p>
          <p className="mt-1">
            <strong className="text-las-primary">
              {order.fulfillment.type === "pickup" ? "الاستلام:" : "التوصيل:"}
            </strong>{" "}
            {order.fulfillment.type === "pickup"
              ? order.fulfillment.branch
              : `${order.fulfillment.city} — ${order.fulfillment.address}`}
          </p>
        </div>
      </div>

      <div className="mt-8 border border-las-border bg-las-cream/50 p-6">
        <h2 className="mb-2 font-bold text-las-primary">متابعة عبر واتساب</h2>
        <p className="mb-4 text-sm leading-relaxed text-las-muted">
          واتساب للمتابعة فقط — لتأكيد محتوى الطلب، مدة التوصيل أو الاستلام، وأي ملاحظات.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#25D366] py-3.5 text-sm font-semibold text-white hover:bg-[#1fb855] sm:w-auto sm:px-8"
        >
          متابعة الطلب عبر واتساب
        </a>
      </div>

      <div className="mt-6 text-center">
        <Link href="/products" className="text-sm font-medium text-las-accent hover:text-las-accent-hover">
          متابعة التسوّق
        </Link>
      </div>
    </div>
  );
}
