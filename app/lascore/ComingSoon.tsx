export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-las-primary">{title}</h1>
      <p className="mt-3 text-sm text-las-muted">قريبًا</p>
    </div>
  );
}
