import type { Metadata } from "next";
import { WholesalePageContent } from "@/components/WholesalePageContent";

export const metadata: Metadata = {
  title: "لبيع الجملة — B2B",
};

export default function WholesalePage() {
  return <WholesalePageContent />;
}
