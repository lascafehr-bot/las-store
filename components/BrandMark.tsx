import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  size?: "sm" | "md";
};

export function BrandMark({ href = "/", size = "md" }: BrandMarkProps) {
  // Keep enough height for the stacked wordmark so CAFE is not clipped.
  const dimensions =
    size === "sm"
      ? { width: 70, height: 50, className: "h-10 w-auto" }
      : { width: 96, height: 69, className: "h-[2.75rem] w-auto sm:h-12" };

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center overflow-visible py-0.5"
      aria-label="LAS CAFE"
    >
      <Image
        src="/media/las-logo-full.png"
        alt="LAS CAFE"
        width={dimensions.width}
        height={dimensions.height}
        className={`${dimensions.className} max-w-none object-contain object-center`}
        sizes="96px"
        priority
      />
    </Link>
  );
}
