import type { Metadata } from "next";
import { AboutPageContent } from "@/components/AboutPageContent";

export const metadata: Metadata = {
  title: "من نحن",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
