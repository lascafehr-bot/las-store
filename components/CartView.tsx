"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/config";

export function CartView() {
  const { items, total, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-las-primary">سلتك فارغة</p>
        <p className="mt-2 text-sm text-las-muted">أضف منتجات من المتجر للمتابعة.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-sm bg-las-primary px-6 py-3 text-sm font-semibold text-white hover:bg-las-primary-hover"
        >
          تصفّح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.lineId}
            className="flex gap-4 border border-las-border bg-white p-4 sm:gap-6 sm:p-5"
          >
            <div className="relative h-24 w-24 shrink-0 bg-las-cream sm:h-28 sm:w-28">
              <Image src={item.image} alt={item.name} fill className="object-contain p-2" sizes="112px" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/products/${item.slug}`} className="font-semibold text-las-primary hover:text-las-accent">
                    {item.name}
                  </Link>
                  {item.color && <p className="mt-1 text-xs text-las-muted">اللون: {item.color}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.lineId)}
                  className="text-xs text-las-muted hover:text-red-600"
                >
                  حذف
                </button>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center border border-las-border text-las-primary hover:bg-las-cream"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center border border-las-border text-las-primary hover:bg-las-cream"
                  >
                    +
                  </button>
                </div>
                <p className="font-bold text-las-primary">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit border border-las-border bg-las-cream/50 p-6">
        <h2 className="mb-4 text-lg font-bold text-las-primary">ملخص الطلب</h2>
        <div className="flex justify-between border-b border-las-border pb-4 text-sm">
          <span className="text-las-muted">المجموع</span>
          <span className="font-bold text-las-primary">{formatPrice(total)}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-las-muted">
          يتم الطلب والدفع عبر الموقع. واتساب للمتابعة بعد تأكيد الطلب.
        </p>
        <Link
          href="/checkout"
          className="mt-6 flex w-full items-center justify-center rounded-sm bg-las-primary py-3.5 text-sm font-semibold text-white hover:bg-las-primary-hover"
        >
          إتمام الطلب
        </Link>
      </aside>
    </div>
  );
}
