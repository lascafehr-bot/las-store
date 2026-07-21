import { CartView } from "@/components/CartView";

export const metadata = {
  title: "السلة",
};

export default function CartPage() {
  return (
    <div className="bg-white">
      <div className="border-b border-las-border bg-las-cream py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-las-primary">سلة التسوق</h1>
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CartView />
      </div>
    </div>
  );
}
