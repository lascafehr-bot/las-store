import Script from "next/script";
import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StoreTagline } from "@/components/StoreTagline";
import { STORE_CONFIG } from "@/lib/config";
import "./globals.css";

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  metadataBase: new URL(STORE_CONFIG.storeUrl),
  title: {
    default: `${STORE_CONFIG.name} — ${STORE_CONFIG.companyName}`,
    template: `%s — ${STORE_CONFIG.name}`,
  },
  description: "متجر لاس — محاصيل، منتجات، وبوكسات عروض. تسوّق ببساطة.",
  icons: {
    icon: "/favicon.ico",
    apple: "/media/apple-touch-icon.png",
  },
  openGraph: {
    title: `${STORE_CONFIG.name} — ${STORE_CONFIG.companyName}`,
    description: STORE_CONFIG.tagline,
    locale: "ar_SA",
    siteName: STORE_CONFIG.name,
    url: STORE_CONFIG.storeUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gaId = STORE_CONFIG.analyticsId;

  return (
    <html lang="ar" dir="rtl" className={`${notoArabic.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-las-bg font-sans text-las-primary antialiased">
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        <CartProvider>
          <Header />
          <StoreTagline />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
