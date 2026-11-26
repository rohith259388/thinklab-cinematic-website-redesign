import dynamic from 'next/dynamic';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import CmsPage from '@/components/cms/Page';
import { siteContent } from '@/lib/cms/public';
import type { Metadata } from 'next';
import StageSetter from '@/components/experience/StageSetter';
import PageHero from '@/components/ui/PageHero';
import GrowCtaCard from '@/components/ui/GrowCtaCard';
import { entries } from '@/lib/cms/public';

const ArticleLibrary = dynamic(() => import('@/components/content/ArticleLibrary'), {
  loading: () => <CardGridSkeleton count={3} minHeight={400} />,
});
const defaultMetadata: Metadata = { title: 'Insights', description: 'Ideas from Thinklab on marketing, websites, brand strategy, CRM, automation and business growth.', alternates: { canonical: '/blog' } };
export async function generateMetadata():Promise<Metadata>{const {page}=await siteContent();return {...defaultMetadata,...(page?.seoTitle?{title:page.seoTitle}:{}),...(page?.seoDescription?{description:page.seoDescription}:{}),...(page?.canonical?{alternates:{canonical:page.canonical}}:{})};}
export default async function BlogPage() {
  const articles = await entries('blog');
  return (
    <CmsPage>
      <StageSetter page="blog" />
      <div className="ink-surface">
        <PageHero
          page="blog"
          kicker="The Thinklab journal"
          title="A little insight."
          accent="A new perspective."
          body="50 ideas, guides and perspectives from the intersection of strategy, design and technology. Find the next move for your business."
          aside={<GrowCtaCard />}
        />
        <ArticleLibrary articles={articles.map(({ slug, title, image, category, date }) => ({ slug, title, image, category, date }))} />
      </div>
    </CmsPage>
  );
}
