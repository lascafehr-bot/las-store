"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cityTotals, dailyCsv, salesByDay, topProducts } from "@/lib/lascore/insights";
import { amountOf, fetchOrders, formatSar, type LascoreOrder, type Scope } from "@/lib/lascore/orders";
import { EmptyHint, Notice, ScopeSelect } from "@/app/lascore/ui";

const RANGES = [7, 30, 90] as const;

export function ReportsView() {
  const [scope, setScope] = useState<Scope>("live");
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [result, setResult] = useState<{ key: string; rows: LascoreOrder[]; error: string; at: number } | null>(null);
  const key = `${scope}|${days}`;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    void (async () => {
      const res = await fetchOrders(supabase, { statuses: ["paid"], scope, sortBy: "paid_at", limit: 2000 });
      if (!cancelled) setResult({ key, ...res, at: Date.now() });
    })();
    return () => {
      cancelled = true;
    };
  }, [key, scope]);

  const loading = result?.key !== key;
  const rows = useMemo(() => {
    if (loading || !result) return [];
    const since = result.at - days * 86400000;
    return result.rows.filter((o) => new Date(o.paid_at ?? o.created_at).getTime() >= since);
  }, [loading, result, days]);
  const daily = useMemo(() => salesByDay(rows, days, new Date(result?.at ?? 0)), [rows, days, result]);
  const products = useMemo(() => topProducts(rows), [rows]);
  const cities = useMemo(() => cityTotals(rows), [rows]);
  const revenue = rows.reduce((s, o) => s + amountOf(o), 0);
  const maxDay = Math.max(1, ...daily.map((d) => d.revenue));

  function download() {
    const blob = new Blob([dailyCsv(daily)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `las-sales-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-las-primary">التقارير</h1>
          <p className="mt-1 text-sm text-las-muted">المبيعات المدفوعة فعلاً فقط (بدون المستردة).</p>
        </div>
        <ScopeSelect value={scope} onChange={setScope} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="tablist">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={r === days}
              onClick={() => setDays(r)}
              className={`rounded-sm border px-3 py-1.5 text-sm ${r === days ? "border-las-primary bg-las-primary text-white" : "border-las-border bg-white text-las-primary hover:bg-las-primary/5"}`}
            >
              آخر {r} يوم
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
            <div className="rounded-sm border border-las-border bg-white p-3"><p className="text-xs text-las-muted">المبيعات</p><p className="font-bold text-las-primary">{formatSar(revenue)}</p></div>
            <div className="rounded-sm border border-las-border bg-white p-3"><p className="text-xs text-las-muted">عدد الطلبات</p><p className="font-bold text-las-primary">{rows.length}</p></div>
            <div className="rounded-sm border border-las-border bg-white p-3"><p className="text-xs text-las-muted">متوسط الطلب</p><p className="font-bold text-las-primary">{formatSar(revenue / rows.length)}</p></div>
          </div>

          <section className="rounded-sm border border-las-border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-las-primary">المبيعات اليومية</h2>
            <div className="flex h-32 items-end gap-px" dir="ltr" role="img" aria-label="المبيعات اليومية">
              {daily.map((d) => (
                <div key={d.day} title={`${d.day}: ${formatSar(d.revenue)} (${d.orders})`} className="flex-1 rounded-t-sm bg-las-primary/70" style={{ height: `${Math.max(2, (d.revenue / maxDay) * 100)}%` }} />
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-sm border border-las-border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-las-primary">الأكثر مبيعاً</h2>
              <table className="w-full text-sm"><tbody>
                {products.map((p) => (
                  <tr key={p.name} className="border-b border-las-border last:border-0">
                    <td className="py-2"><bdi>{p.name}</bdi></td>
                    <td className="py-2 text-las-muted">× {p.quantity}</td>
                    <td className="py-2 text-end font-medium text-las-primary">{formatSar(p.revenue)}</td>
                  </tr>
                ))}
              </tbody></table>
            </section>
            <section className="rounded-sm border border-las-border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-las-primary">حسب المدينة</h2>
              <table className="w-full text-sm"><tbody>
                {cities.map((c) => (
                  <tr key={c.city} className="border-b border-las-border last:border-0">
                    <td className="py-2"><bdi>{c.city}</bdi></td>
                    <td className="py-2 text-las-muted">{c.orders} طلب</td>
                    <td className="py-2 text-end font-medium text-las-primary">{formatSar(c.revenue)}</td>
                  </tr>
                ))}
              </tbody></table>
            </section>
          </div>
        </>
      )}
      {!loading && !result?.error && rows.length === 0 && <EmptyHint scope={scope} />}
    </div>
  );
}
