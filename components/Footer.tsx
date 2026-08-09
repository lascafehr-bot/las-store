import Image from "next/image";
import Link from "next/link";
import { POLICIES, STORE_CONFIG } from "@/lib/config";

export function Footer() {
  const { compliance } = STORE_CONFIG;

  return (
    <footer className="mt-auto border-t border-las-border/60">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <Image src="/media/las-logo.png" alt="" width={36} height={36} className="rounded-sm object-contain" />
            <span className="font-bold text-las-primary">{STORE_CONFIG.name}</span>
          </div>
          <p className="text-xs leading-relaxed text-las-muted">{STORE_CONFIG.tagline}</p>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-bold text-las-primary">المتجر</h4>
          <ul className="space-y-2 text-sm text-las-muted">
            <li><Link href="/products" className="hover:text-las-accent">المنتجات</Link></li>
            <li><Link href="/wholesale" className="hover:text-las-accent">للمتاجر والشركاء</Link></li>
            <li><Link href="/cart" className="hover:text-las-accent">السلة</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-bold text-las-primary">السياسات</h4>
          <ul className="space-y-2 text-sm text-las-muted">
            {Object.values(POLICIES).map((p) => (
              <li key={p.slug}>
                <Link href={`/policies/${p.slug}`} className="hover:text-las-accent">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-bold text-las-primary">تواصل</h4>
          <ul className="space-y-2 text-sm text-las-muted">
            <li><a href={`tel:${STORE_CONFIG.phone}`} className="hover:text-las-accent">{STORE_CONFIG.phone}</a></li>
            <li><a href={`mailto:${STORE_CONFIG.email}`} className="hover:text-las-accent">{STORE_CONFIG.email}</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-las-border/60 px-4 py-5 text-center text-xs text-las-muted">
        <p>
          س.ت: {compliance.commercialRegister} · الرقم الضريبي: {compliance.vatNumber}
        </p>
        <p className="mt-1">© {new Date().getFullYear()} {STORE_CONFIG.companyName}</p>
      </div>
    </footer>
  );
}
