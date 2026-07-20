import { BRAND_STORY } from "@/lib/content";
import { SectionHeading } from "./SectionHeading";

export function BrandStory() {
  return (
    <section className="bg-las-cream py-16 sm:py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div
          className="aspect-[4/3] rounded-sm bg-cover bg-center shadow-las lg:aspect-square"
          style={{ backgroundImage: "url(/products/las-barista-station.png)" }}
          role="img"
          aria-label="محطة الباريستا في لاس"
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-las-accent">
            {BRAND_STORY.subtitle}
          </p>
          <SectionHeading title={BRAND_STORY.title} align="start" />
          <p className="-mt-6 text-base leading-[1.9] text-las-muted">{BRAND_STORY.body}</p>
        </div>
      </div>
    </section>
  );
}
