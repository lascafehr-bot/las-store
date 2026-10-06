export function Hero() {
  return (
    <section className="w-full bg-las-bg">
      <img
        src="/media/hero-story.jpg?v=6"
        alt="لاس كافيه"
        width={5333}
        height={1937}
        decoding="async"
        fetchPriority="high"
        className="mx-auto block h-auto w-full max-w-none object-contain"
      />
    </section>
  );
}
