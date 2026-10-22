"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useLascoreAuth } from "@/lib/lascore/auth-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PAYMENT_LABELS,
  SHIPPING_STEPS,
  amountOf,
  customerOf,
  fetchOrders,
  formatDateTime,
  formatSar,
  isTestGateway,
  reviewReason,
  saveShipping,
  setPaymentStatus,
  shippingLabel,
  whatsappLink,
  type LascoreOrder,
  type PaymentStatus,
  type Scope,
  type ShippingStatus,
} from "@/lib/lascore/orders";
import { EmptyHint, Notice, ScopeSelect, TestBadge } from "@/app/lascore/ui";

type Mode = "orders" | "shipping";
type TabId = "paid" | "review" | "refunded";

const TABS: { id: TabId; label: string; statuses: PaymentStatus[] }[] = [
  { id: "paid", label: "مدفوعة", statuses: ["paid"] },
  { id: "review", label: "تحتاج مراجعة", statuses: ["review"] },
  { id: "refunded", label: "مستردة", statuses: ["refunded"] },
];

export function OrdersView({ mode }: { mode: Mode }) {
  const { role } = useLascoreAuth();
  const [tab, setTab] = useState<TabId>("paid");
  const [scope, setScope] = useState<Scope>("live");
  const [reloadKey, setReloadKey] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [result, setResult] = useState<{ key: string; rows: LascoreOrder[]; error: string } | null>(null);
  const [review, setReview] = useState<{ key: string; count: number } | null>(null);

  const activeTab: TabId = mode === "shipping" ? "paid" : tab;
  const key = `${mode}|${activeTab}|${scope}|${reloadKey}`;
  const reviewKey = `${scope}|${reloadKey}`;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    void (async () => {
      const spec = TABS.find((t) => t.id === activeTab) ?? TABS[0];
      const res =
        mode === "shipping"
          ? await fetchOrders(supabase, { statuses: ["paid"], scope, excludeDelivered: true, sortBy: "paid_at", ascending: true })
          : await fetchOrders(supabase, {
              statuses: spec.statuses,
              scope,
              sortBy: activeTab === "review" ? "created_at" : "paid_at",
            });
      if (!cancelled) setResult({ key, ...res });
    })();
    return () => {
      cancelled = true;
    };
  }, [key, mode, activeTab, scope]);

  // The number on the "needs review" tab, so those orders are never missed.
  useEffect(() => {
    if (mode !== "orders") return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    void (async () => {
      const res = await fetchOrders(supabase, { statuses: ["review"], scope, sortBy: "created_at" });
      if (!cancelled) setReview({ key: reviewKey, count: res.rows.length });
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, scope, reviewKey]);

  const configured = Boolean(getSupabaseBrowserClient());
  const loading = result?.key !== key;
  const rows = !loading && result ? result.rows : [];
  const reviewCount = review?.key === reviewKey ? review.count : 0;
  const title = mode === "shipping" ? "الشحن" : "الطلبات";
  const subtitle =
    mode === "shipping"
      ? "الطلبات المدفوعة التي لم تُسلَّم بعد، الأقدم أولاً."
      : "تظهر هنا الطلبات المدفوعة فقط. محاولات الدفع غير المكتملة لا تُعرض.";

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-las-primary">{title}</h1>
          <p className="mt-1 text-sm text-las-muted">{subtitle}</p>
        </div>
        <ScopeSelect value={scope} onChange={setScope} />
      </div>

      {mode === "orders" && (
        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => {
            const active = t.id === activeTab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(t.id);
                  setOpenId(null);
                }}
                className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-las-primary bg-las-primary text-white"
                    : "border-las-border bg-white text-las-primary hover:bg-las-primary/5"
                }`}
              >
                {t.label}
                {t.id === "review" && reviewCount > 0 && (
                  <span className="ms-2 rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">{reviewCount}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!configured && <Notice tone="error">لم يتم ضبط الاتصال بقاعدة البيانات.</Notice>}
      {configured && result?.key === key && result.error && <Notice tone="error">{result.error}</Notice>}
      {configured && loading && <Notice tone="info">جاري التحميل...</Notice>}
      {configured && !loading && !result?.error && rows.length === 0 && <EmptyHint scope={scope} />}

      <ul className="space-y-3">
        {rows.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isAdmin={role === "admin"}
            open={openId === order.id}
            onToggle={() => setOpenId(openId === order.id ? null : order.id)}
            onChanged={() => setReloadKey((n) => n + 1)}
          />
        ))}
      </ul>
    </div>
  );
}

function OrderCard({
  order,
  isAdmin,
  open,
  onToggle,
  onChanged,
}: {
  order: LascoreOrder;
  isAdmin: boolean;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const customer = customerOf(order);
  const [shipping, setShipping] = useState<ShippingStatus>((order.shipping_status as ShippingStatus) || "unfulfilled");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const dirty = shipping !== order.shipping_status || tracking.trim() !== (order.tracking_number ?? "");
  const whatsapp = customer ? whatsappLink(customer.phone) : null;
  const reason = reviewReason(order.payment_response_code);
  const isReview = order.payment_status === "review";
  const isPaid = order.payment_status === "paid";

  async function run(action: (supabase: SupabaseClient) => Promise<{ ok: boolean; message: string }>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const res = await action(supabase);
    setBusy(false);
    if (res.ok) onChanged();
    else setMessage(res.message);
  }

  return (
    <li className="rounded-sm border border-las-border bg-white">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-start">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span dir="ltr" className="font-semibold text-las-primary">{order.order_number}</span>
            {isTestGateway(order.payment_gateway) && <TestBadge />}
            {isReview && <span className="rounded-sm bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">{PAYMENT_LABELS.review}</span>}
          </p>
          <p className="mt-1 text-sm text-las-muted">
            <bdi>{customer?.full_name ?? "—"}</bdi>
            {customer?.city ? <> · <bdi>{customer.city}</bdi></> : ""} · <bdi dir="ltr">{formatDateTime(order.paid_at ?? order.created_at)}</bdi>
          </p>
        </div>
        <div className="text-end">
          <p className="font-semibold text-las-primary">{formatSar(amountOf(order))}</p>
          <p className="mt-1 text-xs text-las-muted">{isPaid ? shippingLabel(order.shipping_status) : PAYMENT_LABELS[order.payment_status] ?? order.payment_status}</p>
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-las-border p-4 text-sm">
          {isReview && (
            <Notice tone="error">{reason ?? "يحتاج هذا الطلب إلى مراجعة يدوية قبل التجهيز."} لا تجهّز الطلب قبل التأكد من الدفع في لوحة AlinmaPay.</Notice>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <section>
              <h2 className="mb-1 font-semibold text-las-primary">المنتجات</h2>
              <ul className="space-y-1 text-las-muted">
                {(order.order_items ?? []).map((item, i) => (
                  <li key={`${item.product_name}-${i}`} className="flex justify-between gap-3">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span>{formatSar(Number(item.subtotal) || 0)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between border-t border-las-border pt-2 font-semibold text-las-primary">
                <span>الإجمالي</span>
                <span>{formatSar(amountOf(order))}</span>
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-las-primary">العميل والتوصيل</h2>
              <p className="text-las-muted"><bdi>{customer?.full_name ?? "—"}</bdi></p>
              {customer?.phone && (
                <p className="text-las-muted">
                  <a dir="ltr" href={`tel:${customer.phone}`} className="text-las-accent hover:underline">{customer.phone}</a>
                  {whatsapp && (
                    <>
                      {" · "}
                      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-las-accent hover:underline">واتساب</a>
                    </>
                  )}
                </p>
              )}
              <p className="text-las-muted"><bdi>{[customer?.city, customer?.address].filter(Boolean).join(" — ") || "—"}</bdi></p>
              {order.customer_notes && <p className="mt-2 rounded-sm bg-las-bg p-2 text-las-muted">ملاحظات العميل: {order.customer_notes}</p>}
            </section>
          </div>

          <section>
            <h2 className="mb-1 font-semibold text-las-primary">الدفع</h2>
            <dl className="grid gap-x-6 gap-y-1 text-las-muted sm:grid-cols-2">
              <div className="flex justify-between gap-3"><dt>الحالة</dt><dd>{PAYMENT_LABELS[order.payment_status] ?? order.payment_status}</dd></div>
              <div className="flex justify-between gap-3"><dt>وقت الدفع</dt><dd dir="ltr">{formatDateTime(order.paid_at)}</dd></div>
              <div className="flex justify-between gap-3"><dt>رقم العملية</dt><dd dir="ltr">{order.payment_reference || "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt>البوابة</dt><dd dir="ltr">{order.payment_gateway || "—"}</dd></div>
            </dl>
          </section>

          {(isPaid || isReview) && (
            <section>
              <h2 className="mb-2 font-semibold text-las-primary">الشحن</h2>
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-las-muted">
                  <span className="mb-1 block text-xs">حالة الشحن</span>
                  <select value={shipping} onChange={(e) => setShipping(e.target.value as ShippingStatus)} className="rounded-sm border border-las-border bg-white px-2 py-1.5 text-las-primary">
                    {SHIPPING_STEPS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-las-muted">
                  <span className="mb-1 block text-xs">رقم التتبع</span>
                  <input dir="ltr" value={tracking} onChange={(e) => setTracking(e.target.value)} maxLength={80} className="w-52 rounded-sm border border-las-border px-2 py-1.5 text-las-primary" />
                </label>
                <button
                  type="button"
                  disabled={busy || !dirty}
                  onClick={() => void run((db) => saveShipping(db, order.id, shipping, tracking))}
                  className="rounded-sm bg-las-primary px-4 py-2 text-white disabled:opacity-50"
                >
                  حفظ
                </button>
              </div>
            </section>
          )}

          {isAdmin && (isReview || isPaid) && (
            <section className="flex flex-wrap items-center gap-3 border-t border-las-border pt-3">
              {isReview && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run((db) => setPaymentStatus(db, order.id, "paid"), "هل تأكدت من استلام المبلغ في لوحة AlinmaPay؟ سيُعتمد الطلب كمدفوع.")}
                  className="rounded-sm border border-green-700 px-3 py-1.5 text-green-800 disabled:opacity-50"
                >
                  اعتماد الدفع بعد التحقق
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => void run((db) => setPaymentStatus(db, order.id, "refunded"), "هل تم استرداد المبلغ فعلاً من لوحة AlinmaPay؟ هذا يسجّل الاسترداد فقط ولا يرد المال.")}
                className="rounded-sm border border-las-border px-3 py-1.5 text-las-primary disabled:opacity-50"
              >
                تسجيل استرداد
              </button>
              <span className="text-xs text-las-muted">الاسترداد الفعلي يتم من لوحة AlinmaPay؛ هنا يُسجَّل فقط.</span>
            </section>
          )}

          {message && <Notice tone="error">{message}</Notice>}
        </div>
      )}
    </li>
  );
}
