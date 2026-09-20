export function Hero() {
  return (
    <section className="w-full bg-las-bg">
      <img
        src="/media/hero-story.png?v=4"
        alt="لاس كافيه"
        width={1024}
        height={373}
        decoding="async"
        fetchPriority="high"
        className="mx-auto block h-[240px] w-full max-w-none object-cover object-center sm:h-auto sm:object-contain"
      />
    </section>
  );
}
