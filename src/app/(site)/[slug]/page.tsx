import CmsPage from '@/components/cms/Page';
import { notFound } from "next/navigation";
import { siteContent } from "@/lib/cms/public";
import StageSetter from "@/components/experience/StageSetter";

// Pages created in the Studio. Their content is entirely the sections chosen there.
export default async function CustomPage() {
  const { page } = await siteContent();
  if (!page) notFound();
  return (
    <div className="cms-custom-page">
      <StageSetter page="about" />
      <CmsPage>{null}</CmsPage>
    </div>
  );
}
export async function generateMetadata() {
  const { page } = await siteContent();
  return {
    title: page?.seoTitle || page?.title,
    description: page?.seoDescription || page?.summary,
    alternates: { canonical: page?.canonical || undefined },
  };
}
