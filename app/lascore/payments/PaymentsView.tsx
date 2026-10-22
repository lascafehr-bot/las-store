"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PAYMENT_LABELS,
  amountOf,
  customerOf,
  fetchOrders,
  formatDateTime,
  formatSar,
  isTestGateway,
  paymentsCsv,
  type LascoreOrder,
  type PaymentStatus,
  type Scope,
} from "@/lib/lascore/orders";
import { EmptyHint, Notice, ScopeSelect, TestBadge } from "@/app/lascore/ui";

type Filter = "all" | "paid" | "review" | "refunded";
const FILTERS: { id: Filter; label: string; statuses: PaymentStatus[] }[] = [
  { id: "all", label: "الكل", statuses: ["paid", "review", "refunded"] },
  { id: "paid", label: "مدفوعة", statuses: ["paid"] },
  { id: "review", label: "تحتاج مراجعة", statuses: ["review"] },
  { id: "refunded", label: "مستردة", statuses: ["refunded"] },
];

export function PaymentsView() {
  const [scope, setScope] = useState<Scope>("live");
  const [filter, setFilter] = useState<Filter>("all");
  const [result, setResult] = useState<{ key: string; rows: LascoreOrder[]; error: string } | null>(null);
  const key = `${scope}|${filter}`;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    void (async () => {
      const spec = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
      const res = await fetchOrders(supabase, { statuses: spec.statuses, scope, sortBy: "created_at", limit: 500 });
      if (!cancelled) setResult({ key, ...res });
    })();
    return () => {
      cancelled = true;
    };
  }, [key, scope, filter]);

  const loading = result?.key !== key;
  const rows = !loading && result ? result.rows : [];
  const total = (status: string) => rows.filter((o) => o.payment_status === status).reduce((s, o) => s + amountOf(o), 0);

  function download() {
    const blob = new Blob([paymentsCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `las-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-las-primary">المدفوعات</h1>
          <p className="mt-1 text-sm text-las-muted">سجل العمليات التي أكدها البنك، لمطابقتها مع كشف AlinmaPay.</p>
        </div>
        <ScopeSelect value={scope} onChange={setScope} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={f.id === filter}
              onClick={() => setFilter(f.id)}
              className={`rounded-sm border px-3 py-1.5 text-sm ${f.id === filter ? "border-las-primary bg-las-primary text-white" : "border-las-border bg-white text-las-primary hover:bg-las-primary/5"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" disabled={rows.length === 0} onClick={download} className="rounded-sm border border-las-border bg-white px-3 py-1.5 text-sm text-las-primary disabled:opacity-50">
          تصدير CSV
        </button>
      </div>

      {!getSupabaseBrowserClient() && <Notice tone="error">لم يتم ضبط الاتصال بقاعدة البيانات.</Notice>}
      {result?.key === key && result.error && <Notice tone="error">{result.error}</Notice>}
      {loading && <Notice tone="info">جاري التحميل...</Notice>}

      {!loading && rows.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-sm border border-las-border bg-white p-3"><p className="text-xs text-las-muted">إجمالي المدفوع</p><p className="font-bold text-las-primary">{formatSar(total("paid"))}</p></div>
            <div className="rounded-sm border border-las-border bg-white p-3"><p className="text-xs text-las-muted">إجمالي المسترد</p><p className="font-bold text-las-primary">{formatSar(total("refunded"))}</p></div>
            <div className="rounded-sm border border-las-border bg-white p-3"><p className="text-xs text-las-muted">تحتاج مراجعة</p><p className="font-bold text-las-primary">{formatSar(total("review"))}</p></div>
          </div>

          <div className="overflow-x-auto rounded-sm border border-las-border bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-las-border text-start text-xs text-las-muted">
                <tr>
                  <th className="p-3 text-start font-medium">الطلب</th>
                  <th className="p-3 text-start font-medium">الوقت</th>
                  <th className="p-3 text-start font-medium">العميل</th>
                  <th className="p-3 text-start font-medium">المبلغ</th>
                  <th className="p-3 text-start font-medium">الحالة</th>
                  <th className="p-3 text-start font-medium">رقم العملية</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b border-las-border last:border-0">
                    <td className="p-3" dir="ltr"><span className="me-2 font-medium text-las-primary">{o.order_number}</span>{isTestGateway(o.payment_gateway) && <TestBadge />}</td>
                    <td className="p-3 text-las-muted"><bdi dir="ltr">{formatDateTime(o.paid_at ?? o.created_at)}</bdi></td>
                    <td className="p-3 text-las-muted"><bdi>{customerOf(o)?.full_name ?? "—"}</bdi></td>
                    <td className="p-3 font-medium text-las-primary">{formatSar(amountOf(o))}</td>
                    <td className="p-3 text-las-muted">{PAYMENT_LABELS[o.payment_status] ?? o.payment_status}</td>
                    <td className="p-3 text-las-muted" dir="ltr">{o.payment_reference || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {!loading && !result?.error && rows.length === 0 && <EmptyHint scope={scope} />}
      {rows.length >= 500 && <Notice tone="info">يعرض أحدث 500 عملية فقط. استخدم التصدير للفترات الأقدم.</Notice>}
    </div>
  );
}
