"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLascoreAuth } from "@/lib/lascore/auth-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchDashboardStats, formatSar, type DashboardStats, type Scope } from "@/lib/lascore/orders";
import { Notice, ScopeSelect } from "@/app/lascore/ui";

function Stat({ label, value, hint, href, alert }: { label: string; value: string; hint?: string; href?: string; alert?: boolean }) {
  const body = (
    <div className={`h-full rounded-sm border bg-white p-4 ${alert ? "border-red-300" : "border-las-border"}`}>
      <p className="text-sm text-las-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${alert ? "text-red-700" : "text-las-primary"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-las-muted">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body;
}

export function Dashboard() {
  const { role, profile } = useLascoreAuth();
  const [scope, setScope] = useState<Scope>("live");
  const [result, setResult] = useState<{ scope: Scope; stats: DashboardStats | null; error: string } | null>(null);
  const name = profile?.full_name || profile?.email || "";
  const isAdmin = role === "admin";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    void (async () => {
      const res = await fetchDashboardStats(supabase, scope);
      if (!cancelled) setResult({ scope, ...res });
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const ready = result?.scope === scope;
  const stats = ready ? result.stats : null;
  const dash = (n: number | undefined, money = false) => (stats && n !== undefined ? (money ? formatSar(n) : String(n)) : "—");

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-las-primary">{isAdmin ? "لوحة التحكم" : `مرحباً ${name}`}</h1>
          <p className="mt-1 text-sm text-las-muted">
            {isAdmin ? `مرحباً ${name}. الأرقام تشمل الطلبات المدفوعة فقط.` : "الطلبات المدفوعة الجاهزة للتجهيز والشحن."}
          </p>
        </div>
        <ScopeSelect value={scope} onChange={setScope} />
      </div>

      {ready && result.error && <Notice tone="error">{result.error}</Notice>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="بانتظار الشحن" value={dash(stats?.waitingToShip)} hint="مدفوعة ولم تُشحن بعد" href="/lascore/shipping" />
        {isAdmin && (
          <>
            <Stat label="طلبات اليوم" value={dash(stats?.paidToday)} hint={stats ? formatSar(stats.revenueToday) : undefined} href="/lascore/orders" />
            <Stat label="آخر 7 أيام" value={dash(stats?.paidLast7Days)} hint={stats ? formatSar(stats.revenueLast7Days) : undefined} href="/lascore/payments" />
            <Stat
              label="تحتاج مراجعة"
              value={dash(stats?.needsReview)}
              hint={stats && stats.needsReview > 0 ? "قد يكون المبلغ قد خُصم — راجعها الآن" : "لا شيء يحتاج مراجعة"}
              href="/lascore/orders"
              alert={Boolean(stats && stats.needsReview > 0)}
            />
          </>
        )}
      </div>

      {!isAdmin && stats && stats.needsReview > 0 && (
        <Notice tone="error">يوجد {stats.needsReview} طلب يحتاج مراجعة من المسؤول. لا تجهّزه قبل اعتماده.</Notice>
      )}
    </div>
  );
}
