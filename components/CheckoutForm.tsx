"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatPrice, STORE_CONFIG } from "@/lib/config";
import { generateOrderId, saveLastOrder, type FulfillmentType, type Order } from "@/lib/orders";

export function CheckoutForm() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("pickup");
  const [branch, setBranch] = useState<string>(STORE_CONFIG.branches[0]?.name ?? "");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-las-muted">لا توجد منتجات في السلة.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("يرجى إدخال الاسم ورقم الجوال.");
      return;
    }

    if (fulfillmentType === "pickup" && !branch) {
      setError("يرجى اختيار فرع الاستلام.");
      return;
    }

    if (fulfillmentType === "delivery" && (!city.trim() || !address.trim())) {
      setError("يرجى إدخال المدينة وعنوان التوصيل.");
      return;
    }

    setSubmitting(true);

    const order: Order = {
      id: generateOrderId(),
      items: [...items],
      customer: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      fulfillment: {
        type: fulfillmentType,
        branch: fulfillmentType === "pickup" ? branch : undefined,
        city: fulfillmentType === "delivery" ? city.trim() : undefined,
        address: fulfillmentType === "delivery" ? address.trim() : undefined,
      },
      notes: notes.trim() || undefined,
      total,
      createdAt: new Date().toISOString(),
      status: "confirmed",
    };

    saveLastOrder(order);
    clearCart();
    router.push(`/order/confirmation?id=${order.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="border border-las-border bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-las-primary">بيانات العميل</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">الاسم الكامل *</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">رقم الجوال *</span>
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
              <span className="mb-1 block text-sm font-medium">البريد الإلكتروني</span>
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

        <section className="border border-las-border bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-las-primary">الاستلام أو التوصيل</h2>
          <div className="mb-4 flex flex-wrap gap-3">
            {[
              { id: "pickup" as const, label: "استلام من الفرع" },
              { id: "delivery" as const, label: "توصيل" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFulfillmentType(opt.id)}
                className={`rounded-sm border px-4 py-2 text-sm font-medium transition-colors ${
                  fulfillmentType === opt.id
                    ? "border-las-primary bg-las-primary/5 text-las-primary"
                    : "border-las-border text-las-muted hover:border-las-primary/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {fulfillmentType === "pickup" ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium">الفرع *</span>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
              >
                {STORE_CONFIG.branches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">المدينة *</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">عنوان التوصيل *</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
                />
              </label>
            </div>
          )}
        </section>

        <section className="border border-las-border bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-las-primary">ملاحظات</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="أي ملاحظات على الطلب (اختياري)"
            className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
          />
        </section>

        <section className="border border-las-accent/30 bg-las-cream/80 p-6">
          <h2 className="mb-2 text-lg font-bold text-las-primary">الدفع</h2>
          <p className="mb-3 text-sm leading-relaxed text-las-muted">
            <span className="rounded-sm bg-las-accent/15 px-2 py-0.5 text-xs font-semibold text-las-accent">
              نسخة تجريبية
            </span>
            {" "}سيتم ربط بوابة الدفع الإلكتروني (Moyasar / Tap) في المرحلة القادمة. حالياً يتم تأكيد الطلب عبر الموقع للعرض على الفريق.
          </p>
          <div className="rounded-sm border border-las-border bg-white px-4 py-3 text-sm text-las-primary">
            ✓ الدفع عبر الموقع — محاكاة للعرض التجريبي
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4">
        <div className="border border-las-border bg-las-cream/50 p-6">
          <h2 className="mb-4 text-lg font-bold text-las-primary">ملخص الطلب</h2>
          <ul className="mb-4 space-y-2 border-b border-las-border pb-4 text-sm">
            {items.map((item) => (
              <li key={item.lineId} className="flex justify-between gap-2">
                <span className="text-las-muted">
                  {item.name}
                  {item.color ? ` (${item.color})` : ""} × {item.quantity}
                </span>
                <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold">
            <span>الإجمالي</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-sm bg-las-primary py-3.5 text-sm font-semibold text-white hover:bg-las-primary-hover disabled:opacity-60"
        >
          {submitting ? "جاري التأكيد..." : "تأكيد الطلب والدفع"}
        </button>

        <p className="text-xs leading-relaxed text-las-muted">
          بعد الطلب يمكنك متابعة التفاصيل عبر واتساب: تأكيد المحتوى، مدة التوصيل، والملاحظات.
        </p>
      </aside>
    </form>
  );
}
