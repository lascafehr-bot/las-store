"use client";

import Link from "next/link";

export default function LascoreUnauthorizedPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-las-primary">غير مصرح</h1>
      <p className="mt-3 text-sm text-las-muted">لا تملك صلاحية عرض هذه الصفحة.</p>
      <Link href="/lascore" className="mt-6 inline-block text-sm text-las-accent hover:text-las-accent-hover">
        العودة للوحة التحكم
      </Link>
    </div>
  );
}
