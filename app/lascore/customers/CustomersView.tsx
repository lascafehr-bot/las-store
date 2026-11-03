"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { customersCsv, groupCustomers } from "@/lib/lascore/insights";
import { fetchOrders, formatDateTime, formatSar, whatsappLink, type LascoreOrder, type Scope } from "@/lib/lascore/orders";
import { EmptyHint, Notice, ScopeSelect } from "@/app/lascore/ui";

export function CustomersView() {
  const [scope, setScope] = useState<Scope>("live");
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<{ scope: Scope; rows: LascoreOrder[]; error: string } | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    void (async () => {
      const res = await fetchOrders(supabase, { statuses: ["paid"], scope, sortBy: "paid_at", limit: 1000 });
      if (!cancelled) setResult({ scope, ...res });
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const loading = result?.scope !== scope;
  const customers = useMemo(() => (loading || !result ? [] : groupCustomers(result.rows)), [loading, result]);
  const q = search.trim().toLowerCase();
  const shown = q ? customers.filter((c) => `${c.name} ${c.phone} ${c.email} ${c.city}`.toLowerCase().includes(q)) : customers;

  function download() {
    const blob = new Blob([customersCsv(shown)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `las-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-las-primary">العملاء</h1>
          <p className="mt-1 text-sm text-las-muted">العملاء الذين أتموا الدفع فعلاً فقط، مجمّعون برقم الجوال.</p>
        </div>
        <ScopeSelect value={scope} onChange={setScope} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الجوال أو المدينة"
          className="w-full max-w-sm rounded-sm border border-las-border bg-white px-3 py-2 text-sm"
        />
        <button type="button" disabled={shown.length === 0} onClick={download} className="rounded-sm border border-las-border bg-white px-3 py-1.5 text-sm text-las-primary disabled:opacity-50">
          تصدير CSV
        </button>
      </div>

      {!getSupabaseBrowserClient() && <Notice tone="error">لم يتم ضبط الاتصال بقاعدة البيانات.</Notice>}
      {result?.scope === scope && result.error && <Notice tone="error">{result.error}</Notice>}
      {loading && <Notice tone="info">جاري التحميل...</Notice>}

      {!loading && shown.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-las-border bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-las-border text-xs text-las-muted">
              <tr>
                <th className="p-3 text-start font-medium">العميل</th>
                <th className="p-3 text-start font-medium">الجوال</th>
                <th className="p-3 text-start font-medium">المدينة</th>
                <th className="p-3 text-start font-medium">الطلبات</th>
                <th className="p-3 text-start font-medium">الإجمالي</th>
                <th className="p-3 text-start font-medium">آخر طلب</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => {
                const wa = whatsappLink(c.phone);
                return (
                  <tr key={c.key} className="border-b border-las-border last:border-0">
                    <td className="p-3 font-medium text-las-primary"><bdi>{c.name || "—"}</bdi></td>
                    <td className="p-3 text-las-muted" dir="ltr">
                      {wa ? <a href={wa} target="_blank" rel="noreferrer" className="underline">{c.phone}</a> : c.phone || "—"}
                    </td>
                    <td className="p-3 text-las-muted"><bdi>{c.city || "—"}</bdi></td>
                    <td className="p-3 text-las-muted">{c.orders}{c.orders > 1 && <span className="ms-1 rounded-sm bg-las-primary/10 px-1.5 text-xs text-las-primary">عميل متكرر</span>}</td>
                    <td className="p-3 font-medium text-las-primary">{formatSar(c.total)}</td>
                    <td className="p-3 text-las-muted"><bdi dir="ltr">{formatDateTime(c.lastAt)}</bdi></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !result?.error && customers.length === 0 && <EmptyHint scope={scope} />}
      {!loading && customers.length > 0 && shown.length === 0 && <Notice tone="info">لا توجد نتائج مطابقة للبحث.</Notice>}
      {result && result.rows.length >= 1000 && <Notice tone="info">الأرقام مبنية على أحدث 1000 طلب مدفوع.</Notice>}
    </div>
  );
}
