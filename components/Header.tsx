import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, STORE_CONFIG } from "@/lib/config";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "جميع المنتجات" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-las-border bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/media/las-logo.png"
            alt={STORE_CONFIG.companyName}
            width={44}
            height={44}
            className="rounded-full"
          />
          <span className="hidden text-lg font-bold text-las-primary sm:inline">{STORE_CONFIG.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-las-primary transition-colors hover:text-las-accent"
            >
              {link.label}
            </Link>
          ))}
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="px-4 py-2 text-sm font-medium text-las-muted transition-colors hover:text-las-primary"
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="rounded-sm border border-las-border px-4 py-2 text-sm font-medium text-las-primary transition-colors hover:border-las-primary md:hidden"
          >
            المنتجات
          </Link>
          <a
            href={STORE_CONFIG.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-sm border border-las-border px-4 py-2 text-sm font-medium text-las-primary transition-colors hover:border-las-accent hover:text-las-accent sm:inline-flex"
          >
            lascafe.sa
          </a>
          <a
            href={`https://wa.me/${STORE_CONFIG.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm bg-las-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-las-primary-hover"
          >
            واتساب
          </a>
        </div>
      </div>
    </header>
  );
}
