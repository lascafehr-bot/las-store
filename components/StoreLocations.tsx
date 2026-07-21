import Link from "next/link";
import { STORE_CONFIG } from "@/lib/config";
import { SectionHeading } from "./SectionHeading";

export function StoreLocations() {
  return (
    <section className="bg-las-dark py-16 text-white sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="فروعنا"
          subtitle="زُرنا أو اطلب للاستلام من أقرب فرع"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {STORE_CONFIG.branches.map((branch) => (
            <div
              key={branch.name}
              className="rounded-sm border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <h3 className="font-bold text-white">{branch.name}</h3>
              <p className="mt-1 text-sm text-white/50">{branch.nameEn}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-sm bg-las-accent px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-las-accent-hover"
          >
            تسوّق من المتجر
          </Link>
        </div>
      </div>
    </section>
  );
}

export function OrderSteps() {
  return (
    <section className="border-y border-las-border bg-las-cream py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { step: "01", title: "تصفّح وأضف للسلة", desc: "اختر المنتجات واللون المناسب" },
            { step: "02", title: "أكمل الطلب والدفع", desc: "عبر الموقع — بياناتك وطريقة الاستلام" },
            { step: "03", title: "متابعة عبر واتساب", desc: "تأكيد المحتوى، التوصيل، والملاحظات" },
          ].map((item) => (
            <div key={item.step} className="text-center sm:text-right">
              <span className="text-3xl font-bold text-las-accent/40">{item.step}</span>
              <h3 className="mt-2 text-lg font-bold text-las-primary">{item.title}</h3>
              <p className="mt-1 text-sm text-las-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
