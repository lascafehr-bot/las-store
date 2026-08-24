"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { formatPrice } from "@/lib/i18n";
import { cartItemOptions } from "@/lib/cart";
import { buildFollowUpWhatsAppUrl, readLastOrder, type Order } from "@/lib/orders";

export function OrderConfirmation() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<Order | null>(null);
  const { locale, t } = useLocale();

  useEffect(() => {
    const saved = readLastOrder();
    if (saved && (!orderId || saved.id === orderId)) {
      setOrder(saved);
    }
  }, [orderId]);

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-las-muted">{t("orderNotFound")}</p>
        <Link href="/" className="mt-4 inline-block text-las-accent hover:underline">
          {t("backToStore")}
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
        <h1 className="text-2xl font-bold text-las-primary sm:text-3xl">{t("orderConfirmed")}</h1>
        <p className="mt-2 text-sm text-las-muted">
          {t("orderNumber")}{" "}
          <span className="font-bold text-las-primary">{order.id}</span>
        </p>
      </div>

      <div className="space-y-4 border border-las-border bg-white p-6">
        <h2 className="font-bold text-las-primary">{t("orderDetails")}</h2>
        <ul className="space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.lineId} className="flex justify-between gap-2">
              <span className="text-las-muted">
                {item.name}
                {cartItemOptions(item) ? ` (${cartItemOptions(item)})` : ""} × {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity, locale)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-las-border pt-3 font-bold">
          <span>{t("total")}</span>
          <span>{formatPrice(order.total, locale)}</span>
        </div>

        <div className="border-t border-las-border pt-4 text-sm text-las-muted">
          <p>
            <strong className="text-las-primary">{t("customer")}</strong> {order.customer.name} —{" "}
            {order.customer.phone}
          </p>
          <p className="mt-1">
            <strong className="text-las-primary">{t("deliveryLabel")}</strong>{" "}
            {order.fulfillment.type === "pickup"
              ? order.fulfillment.branch
              : `${order.fulfillment.city} — ${order.fulfillment.address}`}
          </p>
        </div>
      </div>

      <div className="mt-8 border border-las-border bg-las-cream/50 p-6">
        <h2 className="mb-2 font-bold text-las-primary">{t("whatsappFollowUp")}</h2>
        <p className="mb-4 text-sm leading-relaxed text-las-muted">{t("whatsappFollowUpDesc")}</p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#25D366] py-3.5 text-sm font-semibold text-white hover:bg-[#1fb855] sm:w-auto sm:px-8"
        >
          {t("whatsappFollowUpBtn")}
        </a>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm font-medium text-las-accent hover:text-las-accent-hover">
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  );
}
