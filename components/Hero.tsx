import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-las-bg">
      <Link
        href="/?category=merch"
        className="group relative block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-las-primary"
        aria-label="اطلب الآن — منتجات لاس"
      >
        <Image
          src="/media/hero-las-mug.jpg"
          alt="LAS MUG — صمم ليكون رفيق لحظاتكم اليومية"
          width={1600}
          height={581}
          priority
          className="h-auto w-full scale-[1.01] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes="100vw"
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </Link>
    </section>
  );
}
