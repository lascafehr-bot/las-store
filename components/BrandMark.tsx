import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  size?: "sm" | "md";
};

export function BrandMark({ href = "/", size = "md" }: BrandMarkProps) {
  const lasClass = size === "sm" ? "text-base" : "text-xl";
  const cafeClass = size === "sm" ? "text-[9px]" : "text-[11px]";

  return (
    <Link href={href} className="shrink-0">
      <span className={`font-brand leading-none text-las-primary ${lasClass}`}>
        <span className="block font-semibold tracking-[0.12em]">LAS</span>
        <span className={`block font-normal tracking-[0.28em] text-las-accent ${cafeClass}`}>CAFE</span>
      </span>
    </Link>
  );
}
