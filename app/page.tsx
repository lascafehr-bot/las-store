import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { StoreCatalog } from "@/components/StoreCatalog";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<div className="min-h-[40vh] animate-pulse bg-las-cream/30" />}>
        <StoreCatalog />
      </Suspense>
    </>
  );
}
