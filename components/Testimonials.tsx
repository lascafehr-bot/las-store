import { TESTIMONIALS } from "@/lib/content";
import { SectionHeading } from "./SectionHeading";

export function Testimonials() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title="آراء العملاء" subtitle="تجارب حقيقية من محبّي لاس" />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((item) => (
            <blockquote
              key={item.id}
              className="flex flex-col rounded-sm border border-las-border bg-las-cream/50 p-6"
            >
              <span className="mb-3 text-3xl leading-none text-las-accent/60" aria-hidden="true">
                "
              </span>
              <p className="flex-1 text-sm leading-relaxed text-las-primary">{item.text}</p>
              <footer className="mt-5 border-t border-las-border pt-4 text-sm font-semibold text-las-primary">
                {item.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
