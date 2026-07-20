import Image from "next/image";
import Link from "next/link";
import { STORE_CONFIG } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-las-border bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center gap-3">
            <Image src="/media/las-logo.png" alt="" width={40} height={40} className="rounded-full" />
            <span className="font-bold text-las-primary">{STORE_CONFIG.name}</span>
          </div>
          <p className="text-sm leading-relaxed text-las-muted">{STORE_CONFIG.tagline}</p>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-las-primary">روابط</h4>
          <ul className="space-y-2 text-sm text-las-muted">
            <li>
              <Link href="/" className="hover:text-las-accent">
                الرئيسية
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-las-accent">
                جميع المنتجات
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-las-primary">فروعنا</h4>
          <ul className="space-y-2 text-sm text-las-muted">
            {STORE_CONFIG.branches.map((branch) => (
              <li key={branch.name}>{branch.name}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-las-primary">تواصل</h4>
          <ul className="space-y-2 text-sm text-las-muted">
            <li>
              <a href={`tel:${STORE_CONFIG.phone}`} className="hover:text-las-accent">
                {STORE_CONFIG.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${STORE_CONFIG.email}`} className="hover:text-las-accent">
                {STORE_CONFIG.email}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-las-accent"
              >
                واتساب
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-las-border py-5 text-center text-xs text-las-muted">
        © {new Date().getFullYear()} {STORE_CONFIG.companyName}. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
