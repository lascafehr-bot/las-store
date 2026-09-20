import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  size?: "sm" | "md";
};

export function BrandMark({ href = "/", size = "md" }: BrandMarkProps) {
  return (
    <Link
      href={href}
      aria-label="LAS CAFE"
      className="inline-flex shrink-0"
    >
      <img
        src="/brand/las-cafe-logo.png?v=8"
        alt="LAS CAFE"
        width={201}
        height={150}
        className={size === "sm" ? "las-header-logo las-header-logo-sm" : "las-header-logo"}
      />
    </Link>
  );
}
