"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { formatPrice } from "@/lib/i18n";
import { cartItemOptions } from "@/lib/cart";
import { SAUDI_CITIES } from "@/lib/cities";
import { normalizeShortCode, type GeoPoint } from "@/lib/delivery";
import { saudiMobile } from "@/lib/phone";
import { saveLastOrder, type Order } from "@/lib/orders";

const OTHER_CITY = "__other";
const FIELD = "w-full border border-las-border bg-white px-3 py-2.5 text-sm outline-none focus:border-las-primary";

export function CheckoutForm() {
  const router = useRouter();
  const { items, total } = useCart();
  const { locale, t } = useLocale();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [citySel, setCitySel] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [locError, setLocError] = useState(false);
  const city = citySel === OTHER_CITY ? cityOther : citySel;
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-las-muted">{t("emptyCartCheckout")}</p>
      </div>
    );
  }

  function useMyLocation() {
    setLocError(false);
    if (!navigator.geolocation) return setLocError(true);
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocBusy(false);
      },
      () => {
        setLocError(true);
        setLocBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError(t("errorNamePhone"));
      return;
    }

    if (!saudiMobile(phone)) {
      setError(t("errorPhone"));
      return;
    }

    if (!city.trim() || !address.trim()) {
      setError(t("errorDelivery"));
      return;
    }

    if (shortCode.trim() && !normalizeShortCode(shortCode)) {
      setError(t("errorShortCode"));
      return;
    }

    setSubmitting(true);

    try {
      // The server re-prices the cart, saves the order and starts the AlinmaPay payment.
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ slug, color, weight, quantity }) => ({ slug, color, weight, quantity })),
          customer: { name: name.trim(), phone: phone.trim(), email: email.trim() },
          city: city.trim(),
          address: address.trim(),
          notes: notes.trim(),
          shortCode: shortCode.trim(),
          location: point ?? undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 409 && data?.error === "already_paid" && data.orderNumber) {
        // This cart was already paid (e.g. the customer closed the tab after paying): show that order.
        router.push(`/order/confirmation?id=${encodeURIComponent(data.orderNumber)}`);
        return;
      }
      if (!res.ok || !data?.redirect?.url) {
        setError(
          data?.error === "invalid_cart"
            ? t("errorCartInvalid")
            : data?.error === "invalid_phone"
              ? t("errorPhone")
              : data?.error === "invalid_short_code"
                ? t("errorShortCode")
                : t("errorPayment"),
        );
        setSubmitting(false);
        return;
      }

      // Keep the cart until the payment is confirmed; the confirmation page clears it.
      const order: Order = {
        id: data.orderNumber,
        items: [...items],
        customer: { name: name.trim(), phone: phone.trim(), email: email.trim() },
        fulfillment: { type: "delivery", city: city.trim(), address: address.trim() },
        notes: notes.trim() || undefined,
        total: data.total,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      saveLastOrder(order);

      // Hand the customer over to AlinmaPay's hosted payment page.
      const form = document.createElement("form");
      form.method = data.redirect.method === "GET" ? "GET" : "POST";
      form.action = data.redirect.url;
      document.body.appendChild(form);
      form.submit();
    } catch {
      setError(t("errorPayment"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="border border-las-border bg-las-bg p-6">
          <h2 className="mb-4 text-lg font-bold text-las-primary">{t("customerDetails")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">{t("fullName")}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t("phone")}</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="05xxxxxxxx"
                className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
                dir="ltr"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t("email")}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
                dir="ltr"
              />
            </label>
          </div>
        </section>

        <section className="border border-las-border bg-las-bg p-6">
          <h2 className="mb-4 text-lg font-bold text-las-primary">{t("delivery")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t("city")}</span>
              <select value={citySel} onChange={(e) => setCitySel(e.target.value)} required className={FIELD}>
                <option value="" disabled>
                  {t("selectCity")}
                </option>
                {SAUDI_CITIES.map((c) => (
                  <option key={c.ar} value={c.ar}>
                    {locale === "en" ? c.en : c.ar}
                  </option>
                ))}
                <option value={OTHER_CITY}>{t("otherCity")}</option>
              </select>
            </label>
            {citySel === OTHER_CITY && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium">{t("otherCityLabel")}</span>
                <input type="text" value={cityOther} onChange={(e) => setCityOther(e.target.value)} required maxLength={30} className={FIELD} />
              </label>
            )}
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">{t("address")}</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                required
                maxLength={150}
                placeholder={t("addressHint")}
                className={FIELD}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locBusy}
                className="rounded-sm border border-las-primary px-4 py-2 text-sm font-medium text-las-primary hover:bg-las-primary/5 disabled:opacity-60"
              >
                {locBusy ? t("locating") : point ? t("updateLocation") : t("useLocation")}
              </button>
              {point && (
                <span className="text-sm text-green-800">
                  ✓ {t("locationSaved")}{" "}
                  <button type="button" onClick={() => setPoint(null)} className="underline">
                    {t("removeLocation")}
                  </button>
                </span>
              )}
              {locError && <span className="text-sm text-red-600">{t("locationFailed")}</span>}
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">{t("shortCodeLabel")}</span>
              <input
                type="text"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                maxLength={9}
                placeholder="RAAA1234"
                dir="ltr"
                className={FIELD}
              />
              <span className="mt-1 block text-xs text-las-muted">{t("shortCodeHint")}</span>
            </label>
          </div>
        </section>

        <section className="border border-las-border bg-las-bg p-6">
          <h2 className="mb-4 text-lg font-bold text-las-primary">{t("notes")}</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t("notesPlaceholder")}
            className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
          />
        </section>

        <section className="border border-las-accent/30 bg-las-bg/80 p-6">
          <h2 className="mb-2 text-lg font-bold text-las-primary">{t("payment")}</h2>
          <p className="mb-3 text-sm leading-relaxed text-las-muted">
            <span className="rounded-sm bg-las-accent/15 px-2 py-0.5 text-xs font-semibold text-las-accent">
              {t("paymentDemo")}
            </span>
            {t("paymentDemoDesc")}
          </p>
          <div className="rounded-sm border border-las-border bg-las-bg px-4 py-3 text-sm text-las-primary">
            {t("paymentSimulated")}
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4">
        <div className="border border-las-border bg-las-bg/50 p-6">
          <h2 className="mb-4 text-lg font-bold text-las-primary">{t("orderSummary")}</h2>
          <ul className="mb-4 space-y-2 border-b border-las-border pb-4 text-sm">
            {items.map((item) => (
              <li key={item.lineId} className="flex justify-between gap-2">
                <span className="text-las-muted">
                  {item.name}
                  {cartItemOptions(item) ? ` (${cartItemOptions(item)})` : ""} × {item.quantity}
                </span>
                <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity, locale)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold">
            <span>{t("total")}</span>
            <span>{formatPrice(total, locale)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-sm bg-las-primary py-3.5 text-sm font-semibold text-white hover:bg-las-primary-hover disabled:opacity-60"
        >
          {submitting ? t("confirming") : t("confirmOrder")}
        </button>

        <p className="text-xs leading-relaxed text-las-muted">{t("checkoutFooter")}</p>
      </aside>
    </form>
  );
}

export function CheckoutPageContent() {
  const { t } = useLocale();

  return (
    <div className="bg-las-bg">
      <div className="border-b border-las-border bg-las-bg py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-las-primary">{t("checkoutTitle")}</h1>
          <p className="mt-2 text-sm text-las-muted">{t("checkoutSubtitle")}</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
