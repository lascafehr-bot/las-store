import { Suspense } from "react";
import { StoreCatalog } from "@/components/StoreCatalog";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] animate-pulse bg-las-cream/30" />}>
      <StoreCatalog />
    </Suspense>
  );
}
