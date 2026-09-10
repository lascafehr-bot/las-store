import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  size?: "sm" | "md";
};

export function BrandMark({ href = "/", size = "md" }: BrandMarkProps) {
  const dimensions =
    size === "sm"
      ? { width: 72, height: 50, className: "h-10 w-auto" }
      : { width: 96, height: 67, className: "h-12 w-auto sm:h-14" };

  return (
    <Link href={href} className="shrink-0" aria-label="LAS CAFE">
      <Image
        src="/media/las-logo.png"
        alt="LAS CAFE"
        width={dimensions.width}
        height={dimensions.height}
        className={`${dimensions.className} object-contain`}
        priority
      />
    </Link>
  );
}
