import type { Metadata } from "next";
import { LascoreApp } from "@/app/lascore/LascoreApp";

export const metadata: Metadata = {
  title: "LASCORE",
  robots: { index: false, follow: false },
};

export default function LascoreLayout({ children }: { children: React.ReactNode }) {
  return <LascoreApp>{children}</LascoreApp>;
}
