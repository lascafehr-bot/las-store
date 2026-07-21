import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata = {
  title: "إتمام الطلب",
};

export default function CheckoutPage() {
  return (
    <div className="bg-las-bg">
      <div className="border-b border-las-border bg-las-cream py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-las-primary">إتمام الطلب</h1>
          <p className="mt-2 text-sm text-las-muted">أدخل بياناتك وأكمل الطلب عبر الموقع</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
