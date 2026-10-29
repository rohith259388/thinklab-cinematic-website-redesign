import CmsPage from '@/components/cms/Page';
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { entries, previewDocument } from "@/lib/cms/public";
import DetailPage from "@/components/content/DetailPage";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = (await entries("projects")).find((e) => e.slug === slug);
  return entry
    ? {
        title: ("seoTitle" in entry && entry.seoTitle) || entry.title,
        description:
          ("seoDescription" in entry && entry.seoDescription) ||
          entry.summary.slice(0, 160),
        alternates: { canonical: entry.canonical || `/projects/${slug}` },
      }
    : { title: "Page not found" };
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const entry = (await entries("projects")).find((e) => e.slug === slug);
  if (!entry) notFound();
  if (entry.archive && !(await previewDocument())) redirect(entry.source);
  return <CmsPage>{(
    <DetailPage
      entry={entry}
      page="projects"
      back="/projects"
      label="Projects"
    />
  )}</CmsPage>;
}
