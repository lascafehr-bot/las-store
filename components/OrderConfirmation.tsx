"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { formatPrice } from "@/lib/i18n";
import { cartItemOptions } from "@/lib/cart";
import { buildFollowUpWhatsAppUrl, readLastOrder, type Order } from "@/lib/orders";

type PaymentStatus = "checking" | "pending" | "paid" | "failed" | "cancelled" | "review" | "missing";

export function OrderConfirmation() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<Order | null>(null);
  const [checked, setStatus] = useState<PaymentStatus>("checking");
  const status: PaymentStatus = orderId ? checked : "missing";
  const [paidTotal, setPaidTotal] = useState<number | null>(null);
  const { clearCart } = useCart();
  const { locale, t } = useLocale();

  useEffect(() => {
    const saved = readLastOrder();
    if (saved && (!orderId || saved.id === orderId)) {
      setOrder(saved);
    }
  }, [orderId]);

  // The payment result always comes from the server (verified with AlinmaPay), never from the URL.
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      try {
        const res = await fetch(`/api/payments/status?order=${encodeURIComponent(orderId as string)}`, { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("missing");
          return;
        }
        const data = res.ok ? await res.json() : null;
        if (data?.status && data.status !== "pending") {
          setStatus(data.status);
          setPaidTotal(typeof data.total === "number" ? data.total : null);
          if (data.status === "paid") clearCart();
          return;
        }
      } catch {
        // network hiccup: fall through and retry
      }
      if (cancelled) return;
      attempts += 1;
      if (attempts >= 15) {
        setStatus("pending");
        return;
      }
      timer = setTimeout(check, 4000);
    }

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (status === "checking") {
    return (
      <div className="py-16 text-center">
        <p className="text-las-muted">{t("paymentChecking")}</p>
      </div>
    );
  }

  if (status === "pending" || status === "failed" || status === "cancelled" || status === "review") {
    const title =
      status === "pending"
        ? t("paymentPendingTitle")
        : status === "cancelled"
          ? t("paymentCancelledTitle")
          : status === "review"
            ? t("paymentReviewTitle")
            : t("paymentFailedTitle");
    const desc =
      status === "pending"
        ? t("paymentPendingDesc")
        : status === "review"
          ? t("paymentReviewDesc")
          : t("paymentFailedDesc");
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <h1 className="text-2xl font-bold text-las-primary sm:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-las-muted">{desc}</p>
        {orderId && (
          <p className="mt-3 text-sm text-las-muted">
            {t("orderNumber")} <span className="font-bold text-las-primary">{orderId}</span>
          </p>
        )}
        {(status === "failed" || status === "cancelled") && (
          <Link
            href="/checkout"
            className="mt-6 inline-block rounded-sm bg-las-primary px-8 py-3 text-sm font-semibold text-white hover:bg-las-primary-hover"
          >
            {t("tryAgain")}
          </Link>
        )}
        <div className="mt-6">
          <Link href="/" className="text-sm font-medium text-las-accent hover:text-las-accent-hover">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  if (status === "paid" && !order) {
    // Paid, but this browser no longer holds the order details (e.g. a different device).
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-las-primary sm:text-3xl">{t("orderConfirmed")}</h1>
        <p className="mt-2 text-sm text-las-muted">
          {t("orderNumber")} <span className="font-bold text-las-primary">{orderId}</span>
        </p>
        {paidTotal != null && <p className="mt-1 text-sm font-bold">{formatPrice(paidTotal, locale)}</p>}
        <div className="mt-6">
          <Link href="/" className="text-sm font-medium text-las-accent hover:text-las-accent-hover">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  if (status !== "paid" || !order) {
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

      <div className="space-y-4 border border-las-border bg-las-bg p-6">
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

      <div className="mt-8 border border-las-border bg-las-bg p-6">
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
