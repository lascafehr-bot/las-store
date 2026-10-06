"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLascoreAuth } from "@/lib/lascore/auth-context";
import { canAccessPath, navForRole } from "@/lib/lascore/nav";

const PUBLIC_PATHS = new Set([
  "/lascore/login",
  "/lascore/forgot-password",
  "/lascore/reset-password",
]);

export function LascoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, profile, role, signOut } = useLascoreAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isPublic = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (isPublic) return;
    if (status === "loading") return;
    if (status !== "authenticated" || !role || !profile) {
      router.replace("/lascore/login");
      return;
    }
    if (!canAccessPath(pathname, role)) {
      router.replace("/lascore/unauthorized");
    }
  }, [isPublic, pathname, profile, role, router, status]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-las-muted">جاري التحقق...</p>
      </div>
    );
  }

  if (status !== "authenticated" || !role || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-las-muted">جاري التحويل لتسجيل الدخول...</p>
      </div>
    );
  }

  if (!canAccessPath(pathname, role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-las-muted">لا تملك صلاحية الوصول.</p>
      </div>
    );
  }

  const items = navForRole(role);
  const roleLabel = role === "admin" ? "مسؤول" : "مستخدم";

  async function handleLogout() {
    await signOut();
    router.replace("/lascore/login");
  }

  return (
    <div className="flex min-h-screen bg-las-bg">
      <aside
        className={`fixed inset-y-0 start-0 z-40 w-64 border-e border-las-border bg-white transition-transform lg:static lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-las-border px-5">
          <img src="/brand/las-cafe-logo.png?v=8" alt="" className="h-9 w-auto" />
          <div>
            <p className="font-brand text-sm font-semibold tracking-wide text-las-primary">LASCORE</p>
            <p className="text-[11px] text-las-muted">نظام الإدارة الداخلي</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-sm px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-las-primary text-white"
                    : "text-las-primary hover:bg-las-primary/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-4 rounded-sm px-3 py-2 text-start text-sm text-las-muted hover:bg-las-primary/5 hover:text-las-primary"
          >
            تسجيل الخروج
          </button>
        </nav>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-las-primary/20 lg:hidden"
          aria-label="إغلاق القائمة"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-las-border bg-white px-4 sm:px-6">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-las-border text-las-primary lg:hidden"
            aria-label="القائمة"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">القائمة</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.5]">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-las-primary">LAS CAFE</p>
          <div className="text-end">
            <p className="text-sm font-medium text-las-primary">
              {profile.full_name || profile.email}
            </p>
            <p className="text-[11px] text-las-muted">{roleLabel}</p>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
