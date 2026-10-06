"use client";

import { useLascoreAuth } from "@/lib/lascore/auth-context";

export default function LascoreHomePage() {
  const { role, profile } = useLascoreAuth();
  const name = profile?.full_name || profile?.email || "";

  if (role === "user") {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-las-primary">مرحباً {name}</h1>
        <p className="mt-2 text-sm text-las-muted">
          يمكنك إدارة الطلبات والشحن من القائمة. بقية الأدوات غير متاحة لهذا الحساب.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-las-primary">لوحة التحكم</h1>
      <p className="mt-2 text-sm text-las-muted">
        مرحباً {name}. الوحدات التشغيلية ستُضاف على مراحل. استخدم القائمة للتنقل.
      </p>
    </div>
  );
}
