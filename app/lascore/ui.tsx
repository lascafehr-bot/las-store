"use client";

import type { ReactNode } from "react";
import type { Scope } from "@/lib/lascore/orders";

export function ScopeSelect({ value, onChange }: { value: Scope; onChange: (scope: Scope) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-las-muted">
      <span>نوع الطلبات</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Scope)}
        className="rounded-sm border border-las-border bg-white px-2 py-1.5 text-sm text-las-primary"
      >
        <option value="live">حقيقية</option>
        <option value="test">تجريبية (Sandbox)</option>
        <option value="all">الكل</option>
      </select>
    </label>
  );
}

export function TestBadge() {
  return (
    <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">تجريبي</span>
  );
}

export function Notice({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  const style =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-las-border bg-white text-las-muted";
  return <p className={`rounded-sm border px-3 py-2 text-sm ${style}`}>{children}</p>;
}

export function EmptyHint({ scope }: { scope: Scope }) {
  return (
    <Notice tone="info">
      لا توجد طلبات هنا.
      {scope === "live" ? " الطلبات التجريبية (Sandbox) تظهر عند اختيار «تجريبية»." : ""}
    </Notice>
  );
}
