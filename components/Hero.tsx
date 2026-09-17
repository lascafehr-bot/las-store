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
        className="mx-auto block h-auto w-full max-w-none object-contain"
      />
    </section>
  );
}
