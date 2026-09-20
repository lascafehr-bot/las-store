type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: "center" | "start";
};

export function SectionHeading({ title, subtitle, align = "center" }: SectionHeadingProps) {
  return (
    <div className={`mb-10 ${align === "center" ? "text-center" : "text-right"}`}>
      <h2 className="text-base font-bold text-las-primary sm:text-lg">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-sm leading-relaxed text-las-muted sm:text-base">{subtitle}</p>
      )}
    </div>
  );
}
