"use client";

import Image from "next/image";
import Link from "next/link";
import { STORE_CONFIG } from "@/lib/config";
import { CartLink } from "./CartLink";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-las-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/media/las-logo.png"
              alt={STORE_CONFIG.companyName}
              width={36}
              height={36}
              className="rounded-sm object-contain"
            />
            <span className="text-base font-semibold tracking-tight text-las-primary">{STORE_CONFIG.name}</span>
          </Link>
          <Link
            href="/wholesale"
            className="hidden text-xs text-las-muted transition-colors hover:text-las-accent sm:inline"
          >
            للمتاجر والشركاء
          </Link>
        </div>

        <CartLink />
      </div>
    </header>
  );
}
