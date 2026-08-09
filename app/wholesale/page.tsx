import type { Metadata } from "next";
import Link from "next/link";
import { buildB2BWhatsAppUrl, STORE_CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  title: "للمتاجر والشركاء — B2B",
  description: "أسعار الجملة وكتalog لاس للمتاجر والشركاء. تواصل مع فريق المبيعات.",
};

export default function WholesalePage() {
  const b2b = STORE_CONFIG.b2b;

  return (
    <div className="bg-white">
      <div className="border-b border-las-border bg-las-cream py-12">
        <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-bold text-las-primary">للمتاجر والشركاء</h1>
          <p className="mt-3 text-sm leading-relaxed text-las-muted">
            أسعار الجملة — تواصل مباشرة مع فريق المبيعات. لا يوجد شراء عبر السلة لهذا القسم.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12 sm:px-6">
        <section className="rounded-sm border border-las-border p-6">
          <h2 className="mb-2 font-bold text-las-primary">كتalog الجملة PDF</h2>
          <p className="mb-4 text-sm text-las-muted">حمّل قائمة الأسعار والمنتجات المتاحة للجملة.</p>
          <a
            href={b2b.catalogPdf}
            download
            className="inline-flex rounded-sm bg-las-primary px-6 py-3 text-sm font-semibold text-white hover:bg-las-primary-hover"
          >
            تحميل الكتalog (PDF)
          </a>
          <p className="mt-2 text-xs text-las-muted">سيتم رفع الملف من فريق لاس.</p>
        </section>

        <section className="rounded-sm border border-las-border p-6">
          <h2 className="mb-4 font-bold text-las-primary">تواصل المبيعات B2B</h2>
          <ul className="space-y-2 text-sm text-las-muted">
            <li>
              <span className="text-las-primary">جوال:</span>{" "}
              <a href={`tel:${b2b.phone}`} className="hover:text-las-accent" dir="ltr">
                {b2b.phone}
              </a>
            </li>
            <li>
              <span className="text-las-primary">بريد:</span>{" "}
              <a href={`mailto:${b2b.email}`} className="hover:text-las-accent">
                {b2b.email}
              </a>
            </li>
          </ul>
          <a
            href={buildB2BWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-sm border border-las-primary px-6 py-3 text-sm font-semibold text-las-primary hover:bg-las-primary hover:text-white"
          >
            واتساب — استفسار جملة
          </a>
        </section>

        <p className="text-center text-sm">
          <Link href="/products" className="text-las-accent hover:underline">
            ← التسوّق للأفراد
          </Link>
        </p>
      </div>
    </div>
  );
}
