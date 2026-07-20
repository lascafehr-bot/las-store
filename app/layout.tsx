import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PromoBanner } from "@/components/PromoBanner";
import { STORE_CONFIG } from "@/lib/config";
import "./globals.css";

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: {
    default: `${STORE_CONFIG.name} — ${STORE_CONFIG.companyName}`,
    template: `%s — ${STORE_CONFIG.name}`,
  },
  description: STORE_CONFIG.tagline,
  icons: {
    icon: "/favicon.ico",
    apple: "/media/apple-touch-icon.png",
  },
  openGraph: {
    title: `${STORE_CONFIG.name} — ${STORE_CONFIG.companyName}`,
    description: STORE_CONFIG.tagline,
    locale: "ar_SA",
    siteName: STORE_CONFIG.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${notoArabic.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-las-bg font-sans text-las-primary antialiased">
        <PromoBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
