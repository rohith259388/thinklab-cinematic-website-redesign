import CmsPage from '@/components/cms/Page';
import { notFound } from "next/navigation";
import { siteContent } from "@/lib/cms/public";
export default async function CustomPage() {
  const { page } = await siteContent();
  if (!page) notFound();
  return <CmsPage>{<div style={{ paddingTop: 120 }} />}</CmsPage>;
}
export async function generateMetadata() {
  const { page } = await siteContent();
  return {
    title: page?.seoTitle || page?.title,
    description: page?.seoDescription || page?.summary,
    alternates: { canonical: page?.canonical || undefined },
  };
}
