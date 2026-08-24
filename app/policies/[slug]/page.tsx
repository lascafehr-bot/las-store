import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyPageContent } from "@/components/PolicyPageContent";
import { POLICIES } from "@/lib/config";

type PolicyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.values(POLICIES).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = Object.values(POLICIES).find((p) => p.slug === slug);
  return { title: policy?.title ?? "السياسات" };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policy = Object.values(POLICIES).find((p) => p.slug === slug);

  if (!policy) {
    notFound();
  }

  return <PolicyPageContent slug={slug} />;
}
