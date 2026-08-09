import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POLICIES } from "@/lib/config";
import { POLICY_CONTENT } from "@/lib/content";

type PolicyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.values(POLICIES).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICY_CONTENT[slug];
  if (!policy) return { title: "السياسة" };
  return { title: policy.title, description: policy.sections[0]?.body.slice(0, 150) };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policy = POLICY_CONTENT[slug];

  if (!policy) {
    notFound();
  }

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <Link href="/" className="mb-8 inline-block text-sm text-las-accent hover:underline">
          ← المتجر
        </Link>
        <h1 className="mb-8 text-3xl font-bold text-las-primary">{policy.title}</h1>
        <div className="space-y-6 text-sm leading-relaxed text-las-muted">
          {policy.sections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <h2 className="mb-2 font-semibold text-las-primary">{section.heading}</h2>
              )}
              <p>{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
