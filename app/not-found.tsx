import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-las-primary">404</h1>
      <p className="mt-3 text-las-muted">المنتج أو الصفحة غير موجودة.</p>
      <Link
        href="/"
        className="mt-6 rounded-sm bg-las-primary px-6 py-3 text-sm font-semibold text-white hover:bg-las-primary-hover"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
