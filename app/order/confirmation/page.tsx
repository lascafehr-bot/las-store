import { Suspense } from "react";
import { OrderConfirmation } from "@/components/OrderConfirmation";

export const metadata = {
  title: "تأكيد الطلب",
};

export default function OrderConfirmationPage() {
  return (
    <div className="bg-las-bg py-12 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<p className="text-center text-las-muted">جاري التحميل...</p>}>
          <OrderConfirmation />
        </Suspense>
      </div>
    </div>
  );
}
