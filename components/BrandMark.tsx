import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  size?: "sm" | "md";
};

export function BrandMark({ href = "/", size = "md" }: BrandMarkProps) {
  const dimensions =
    size === "sm"
      ? { width: 56, height: 39, className: "h-7 w-auto" }
      : { width: 72, height: 50, className: "h-8 w-auto sm:h-9" };

  return (
    <Link href={href} className="shrink-0" aria-label="LAS CAFE">
      <Image
        src="/media/las-logo-navy.png"
        alt="LAS CAFE"
        width={dimensions.width}
        height={dimensions.height}
        className={`${dimensions.className} object-contain`}
        priority
      />
    </Link>
  );
}
