import type { Metadata } from "next";
import { WholesalePageContent } from "@/components/WholesalePageContent";

export const metadata: Metadata = {
  title: "للمتاجر والشركاء — B2B",
};

export default function WholesalePage() {
  return <WholesalePageContent />;
}
