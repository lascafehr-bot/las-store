import { PROMO_BANNER } from "@/lib/content";

export function PromoBanner() {
  return (
    <div className="bg-las-primary py-2.5 text-center text-xs font-semibold text-white sm:text-sm">
      <p>{PROMO_BANNER}</p>
    </div>
  );
}
